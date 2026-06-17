#!/usr/bin/env node
/**
 * Backfill vendor earnings ledger entries for delivered vendorOrders
 * that do not yet have a matching sale entry.
 *
 * Usage:
 *   node scripts/backfill-vendor-earnings.mjs                         # dry-run
 *   node scripts/backfill-vendor-earnings.mjs --execute               # write entries
 *   node scripts/backfill-vendor-earnings.mjs --execute --limit=50
 *   node scripts/backfill-vendor-earnings.mjs --execute --vendor-id=abc123
 */
import process from "node:process";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const execute = process.argv.includes("--execute");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const vendorIdArg = process.argv.find((arg) => arg.startsWith("--vendor-id="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 200;
const vendorIdFilter = vendorIdArg ? vendorIdArg.split("=")[1].trim() : null;

const APP_CURRENCY = "EGP";
const SUMMARY_COLLECTION = "vendorEarningsSummary";

function initAdmin() {
  if (getApps().length > 0) return getFirestore();
  const serviceAccountPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    join(__dirname, "../firebase-service-account.json");
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
  initializeApp({ credential: cert(serviceAccount) });
  return getFirestore();
}

const db = initAdmin();

function computeCommissionPiastres(totalPiastres, commissionRatePercent) {
  return Math.round((totalPiastres * commissionRatePercent) / 100);
}

function resolveSaleEarningAmounts(vendorOrder) {
  const amountPiastres = vendorOrder.totalPiastres ?? 0;
  const storedCommission = vendorOrder.commissionPiastres ?? 0;
  const commissionRatePercent = vendorOrder.commissionRatePercent ?? 0;
  const commissionPiastres =
    storedCommission > 0
      ? storedCommission
      : commissionRatePercent > 0
        ? computeCommissionPiastres(amountPiastres, commissionRatePercent)
        : 0;

  const storedNet = vendorOrder.netPiastres ?? 0;
  const netPiastres =
    storedNet > 0 && storedNet <= amountPiastres && storedCommission > 0
      ? storedNet
      : amountPiastres - commissionPiastres;

  return { amountPiastres, commissionPiastres, netPiastres };
}

function toVendorOrder(snap) {
  const data = snap.data() || {};
  return {
    vendorOrderId: snap.id,
    vendorId: data.vendorId,
    orderId: data.orderId,
    status: data.status,
    totalPiastres: data.totalPiastres ?? 0,
    commissionRatePercent: data.commissionRatePercent ?? 0,
    commissionPiastres: data.commissionPiastres ?? 0,
    netPiastres: data.netPiastres ?? 0,
  };
}

async function hasSaleEntry(vendorId, vendorOrderId) {
  const snap = await db
    .collection("vendorEarnings")
    .doc(vendorId)
    .collection("entries")
    .where("vendorOrderId", "==", vendorOrderId)
    .where("type", "==", "sale")
    .limit(1)
    .get();
  return !snap.empty;
}

async function recordSaleEarning(vendorOrder) {
  const entriesRef = db
    .collection("vendorEarnings")
    .doc(vendorOrder.vendorId)
    .collection("entries");
  const summaryRef = db.collection(SUMMARY_COLLECTION).doc(vendorOrder.vendorId);

  if (await hasSaleEntry(vendorOrder.vendorId, vendorOrder.vendorOrderId)) {
    return false;
  }

  const { amountPiastres, commissionPiastres, netPiastres } =
    resolveSaleEarningAmounts(vendorOrder);

  await db.runTransaction(async (tx) => {
    const summarySnap = await tx.get(summaryRef);
    const entryRef = entriesRef.doc();

    tx.set(entryRef, {
      vendorId: vendorOrder.vendorId,
      type: "sale",
      amountPiastres,
      commissionPiastres,
      netPiastres,
      vendorOrderId: vendorOrder.vendorOrderId,
      orderId: vendorOrder.orderId,
      description: `Order ${vendorOrder.orderId.slice(0, 8).toUpperCase()}`,
      currency: APP_CURRENCY,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "backfill",
    });

    const current = summarySnap.exists ? summarySnap.data() : {};
    tx.set(
      summaryRef,
      {
        vendorId: vendorOrder.vendorId,
        totalSalesPiastres: (current.totalSalesPiastres ?? 0) + amountPiastres,
        totalCommissionPiastres:
          (current.totalCommissionPiastres ?? 0) + commissionPiastres,
        netEarningsPiastres: (current.netEarningsPiastres ?? 0) + netPiastres,
        pendingPayoutPiastres: (current.pendingPayoutPiastres ?? 0) + netPiastres,
        currency: APP_CURRENCY,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

  return true;
}

async function main() {
  let query = db.collection("vendorOrders").where("status", "==", "delivered");
  if (vendorIdFilter) {
    query = query.where("vendorId", "==", vendorIdFilter);
  }

  const snap = await query.limit(limit).get();
  let scanned = 0;
  let skipped = 0;
  let created = 0;

  for (const doc of snap.docs) {
    scanned += 1;
    const vendorOrder = toVendorOrder(doc);
    if (!vendorOrder.vendorId || !vendorOrder.orderId) {
      skipped += 1;
      continue;
    }

    if (await hasSaleEntry(vendorOrder.vendorId, vendorOrder.vendorOrderId)) {
      skipped += 1;
      continue;
    }

    const { amountPiastres, commissionPiastres, netPiastres } =
      resolveSaleEarningAmounts(vendorOrder);

    console.log(
      `${execute ? "WRITE" : "DRY"} ${vendorOrder.vendorOrderId}: ` +
        `total=${amountPiastres} commission=${commissionPiastres} net=${netPiastres}`,
    );

    if (execute) {
      const wrote = await recordSaleEarning(vendorOrder);
      if (wrote) created += 1;
    } else {
      created += 1;
    }
  }

  console.log(
    `\nDone. scanned=${scanned} ${execute ? "created" : "would_create"}=${created} skipped=${skipped}`,
  );
  if (!execute) {
    console.log("Re-run with --execute to write entries.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
