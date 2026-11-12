import "server-only";

import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase-admin/firestore";

import { APP_CURRENCY } from "@/features/products/domain/currency";
import {
  buildSaleEarningEntry,
  saleEarningEntryId,
} from "@/features/financials/domain/sale-earning-entry";
import type {
  VendorEarningsEntry,
  VendorEarningsPage,
  VendorEarningsSummary,
} from "@/features/financials/domain/types";
import type { VendorOrder } from "@/features/orders/domain/types";
import { getAdminFirestore } from "@/lib/firebase-admin";

const ENTRIES_SUBCOLLECTION = "entries";
const SUMMARY_COLLECTION = "vendorEarningsSummary";
const MAX_ENTRIES = 50;

type EarningsEntryDoc = {
  vendorId: string;
  type: VendorEarningsEntry["type"];
  amountPiastres: number;
  commissionPiastres: number;
  netPiastres: number;
  vendorOrderId?: string | null;
  orderId?: string | null;
  description?: string | null;
  currency: string;
  createdAt?: Timestamp;
  createdBy?: string;
};

type EarningsSummaryDoc = {
  vendorId: string;
  totalSalesPiastres: number;
  totalCommissionPiastres: number;
  netEarningsPiastres: number;
  pendingPayoutPiastres?: number;
  currency: string;
  updatedAt?: Timestamp;
};

function earningsEntriesCollection(vendorId: string) {
  return getAdminFirestore()
    .collection("vendorEarnings")
    .doc(vendorId)
    .collection(ENTRIES_SUBCOLLECTION);
}

function toEarningsEntry(snap: DocumentSnapshot<DocumentData>): VendorEarningsEntry {
  const data = snap.data() as EarningsEntryDoc;
  return {
    entryId: snap.id,
    vendorId: data.vendorId,
    type: data.type,
    amountPiastres: data.amountPiastres,
    commissionPiastres: data.commissionPiastres,
    netPiastres: data.netPiastres,
    vendorOrderId: data.vendorOrderId ?? null,
    orderId: data.orderId ?? null,
    description: data.description ?? null,
    currency: APP_CURRENCY,
    createdAt: data.createdAt?.toDate() ?? new Date(0),
  };
}

function emptySummary(vendorId: string): VendorEarningsSummary {
  return {
    vendorId,
    totalSalesPiastres: 0,
    totalCommissionPiastres: 0,
    netEarningsPiastres: 0,
    pendingPayoutPiastres: 0,
    currency: APP_CURRENCY,
    updatedAt: new Date(0),
  };
}

function toSummary(vendorId: string, snap: DocumentSnapshot<DocumentData>): VendorEarningsSummary {
  if (!snap.exists) return emptySummary(vendorId);
  const data = snap.data() as EarningsSummaryDoc;
  return {
    vendorId,
    totalSalesPiastres: data.totalSalesPiastres ?? 0,
    totalCommissionPiastres: data.totalCommissionPiastres ?? 0,
    netEarningsPiastres: data.netEarningsPiastres ?? 0,
    pendingPayoutPiastres: data.pendingPayoutPiastres ?? 0,
    currency: APP_CURRENCY,
    updatedAt: data.updatedAt?.toDate() ?? new Date(0),
  };
}

export async function getVendorEarningsPage(vendorId: string): Promise<VendorEarningsPage> {
  const db = getAdminFirestore();
  const [summarySnap, entriesSnap] = await Promise.all([
    db.collection(SUMMARY_COLLECTION).doc(vendorId).get(),
    earningsEntriesCollection(vendorId).get(),
  ]);

  const summary = toSummary(vendorId, summarySnap);
  const entries = entriesSnap.docs
    .map(toEarningsEntry)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, MAX_ENTRIES);

  return { summary, entries };
}

/** A failed or missing vendor read counts as a normal vendor. */
async function isTestVendor(vendorId: string): Promise<boolean> {
  try {
    const snap = await getAdminFirestore().collection("vendors").doc(vendorId).get();
    return snap.exists && snap.data()?.isTest === true;
  } catch {
    return false;
  }
}

/**
 * Records the sale for a delivered vendor order once per vendorOrderId.
 * Rows written by the shared functions writer count, and both writers use
 * the entry id `sale_{vendorOrderId}`, so neither path double credits.
 */
export async function recordSaleEarningForDeliveredOrder(
  vendorOrder: VendorOrder,
  actorUid: string,
): Promise<boolean> {
  // A test order only reaches the ledger of a test vendor. Test rows carry
  // the flag, and the summary is flagged only for a test vendor.
  const vendorIsTest = await isTestVendor(vendorOrder.vendorId);
  if (vendorOrder.isTest === true && !vendorIsTest) {
    return false;
  }

  const db = getAdminFirestore();
  const entriesRef = earningsEntriesCollection(vendorOrder.vendorId);
  const summaryRef = db.collection(SUMMARY_COLLECTION).doc(vendorOrder.vendorId);
  const entryRef = entriesRef.doc(saleEarningEntryId(vendorOrder.vendorOrderId));
  const existingQuery = entriesRef
    .where("vendorOrderId", "==", vendorOrder.vendorOrderId)
    .where("type", "==", "sale")
    .limit(1);

  const entry = buildSaleEarningEntry(vendorOrder, actorUid, vendorIsTest);

  return db.runTransaction(async (tx) => {
    const [existing, ownRow, summarySnap] = await Promise.all([
      tx.get(existingQuery),
      tx.get(entryRef),
      tx.get(summaryRef),
    ]);
    if (!existing.empty || ownRow.exists) return false;

    tx.create(entryRef, { ...entry, createdAt: FieldValue.serverTimestamp() });

    const current = summarySnap.exists
      ? (summarySnap.data() as EarningsSummaryDoc)
      : {
          vendorId: vendorOrder.vendorId,
          totalSalesPiastres: 0,
          totalCommissionPiastres: 0,
          netEarningsPiastres: 0,
          pendingPayoutPiastres: 0,
        };

    tx.set(
      summaryRef,
      {
        vendorId: vendorOrder.vendorId,
        totalSalesPiastres: (current.totalSalesPiastres ?? 0) + entry.amountPiastres,
        totalCommissionPiastres:
          (current.totalCommissionPiastres ?? 0) + entry.commissionPiastres,
        netEarningsPiastres: (current.netEarningsPiastres ?? 0) + entry.netPiastres,
        pendingPayoutPiastres:
          (current.pendingPayoutPiastres ?? 0) + entry.netPiastres,
        currency: APP_CURRENCY,
        updatedAt: FieldValue.serverTimestamp(),
        ...(vendorIsTest ? { isTest: true } : {}),
      },
      { merge: true },
    );
    return true;
  });
}

export async function getVendorEarningsSummary(
  vendorId: string,
): Promise<VendorEarningsSummary> {
  const snap = await getAdminFirestore().collection(SUMMARY_COLLECTION).doc(vendorId).get();
  return toSummary(vendorId, snap);
}
