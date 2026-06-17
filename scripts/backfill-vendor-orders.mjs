#!/usr/bin/env node
/**
 * Backfill `vendorOrders` slices from existing `orders/{id}` parent documents.
 *
 * Usage:
 *   node scripts/backfill-vendor-orders.mjs                    # dry-run (new slices only)
 *   node scripts/backfill-vendor-orders.mjs --execute          # create missing slices
 *   node scripts/backfill-vendor-orders.mjs --repair --execute # fix amounts on existing slices
 */
import process from "node:process";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const execute = process.argv.includes("--execute");
const repair = process.argv.includes("--repair");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 200;

const PLATFORM_VENDOR_ID = "platformVendor";

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

function asRecord(value) {
  return value && typeof value === "object" ? value : null;
}

function readString(record, keys) {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function readNumber(record, keys) {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function computeCommissionPiastres(totalPiastres, commissionRatePercent) {
  return Math.round((totalPiastres * commissionRatePercent) / 100);
}

async function resolveCommissionRatePercent(vendorId) {
  const snap = await db.collection("commissionConfig").doc("main").get();
  if (!snap.exists) return 10;
  const data = snap.data() || {};
  const override = data.vendorOverrides?.[vendorId];
  if (typeof override === "number" && override >= 0 && override <= 100) {
    return override;
  }
  const defaultRate = data.defaultCommissionPercent;
  if (typeof defaultRate === "number" && defaultRate >= 0 && defaultRate <= 100) {
    return defaultRate;
  }
  return 10;
}

function egpToPiastres(egp) {
  if (!Number.isFinite(egp) || egp < 0) return 0;
  return Math.round(egp * 100);
}

/** Piastres keys first; EGP keys × 100. Mobile line items use `price` in EGP. */
function readPiastresAmount(record, piastresKeys, egpKeys) {
  const fromPiastres = readNumber(record, piastresKeys);
  if (fromPiastres !== null) {
    return Math.max(0, Math.round(fromPiastres));
  }
  const fromEgp = readNumber(record, egpKeys);
  if (fromEgp !== null) {
    return egpToPiastres(fromEgp);
  }
  return 0;
}

function readLineItemUnitPricePiastres(row) {
  return readPiastresAmount(row, ["unitPricePiastres", "pricePiastres"], ["price", "unitPrice"]);
}

function readOrderDeliveryFeePiastres(orderData) {
  return readPiastresAmount(orderData, ["deliveryFeePiastres"], ["deliveryFee", "shippingFee"]);
}

function readOrderDiscountPiastres(orderData) {
  return readPiastresAmount(orderData, ["discountPiastres"], ["discount"]);
}

function mapStatus(status) {
  const normalized = (status || "pending").toLowerCase();
  if (normalized === "inprogress") return "pending";
  if (["pending", "confirmed", "shipped", "delivered", "cancelled"].includes(normalized)) {
    return normalized;
  }
  if (normalized === "completed") return "delivered";
  return "pending";
}

function extractLineItems(orderData) {
  const candidates = [orderData.items, orderData.products, orderData.lineItems];
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const parsed = [];
    for (const entry of candidate) {
      const row = asRecord(entry);
      if (!row) continue;
      const productId = readString(row, ["productId", "id", "product_id"]);
      if (!productId) continue;
      const quantity = Math.max(1, Math.floor(readNumber(row, ["quantity", "qty"]) || 1));
      const unitPricePiastres = readLineItemUnitPricePiastres(row);
      parsed.push({
        productId,
        name: readString(row, ["name", "productName", "title"]) || "Product",
        imageUrl: readString(row, ["imageUrl", "image", "primaryImageUrl"]),
        quantity,
        unitPricePiastres: unitPricePiastres,
        vendorId: readString(row, ["vendorId", "vendor_id"]),
        vendorStoreName: readString(row, ["vendorStoreName", "storeName"]),
      });
    }
    if (parsed.length > 0) return parsed;
  }
  return [];
}

async function getProduct(productId) {
  const snap = await db.collection("products").doc(productId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

async function resolveStore(vendorId, orderData, fallbackName) {
  const stores = Array.isArray(orderData.stores) ? orderData.stores : [];
  const fromOrder = stores.find((entry) => asRecord(entry)?.vendorId === vendorId);
  if (fromOrder) {
    const store = asRecord(fromOrder);
    return {
      vendorId,
      storeName: readString(store, ["storeName", "name"]) || fallbackName,
      logoUrl: readString(store, ["logoUrl"]) || null,
      contactPhone: readString(store, ["contactPhone", "phone"]) || null,
      contactEmail: readString(store, ["contactEmail", "email"]) || null,
      contactAddress: readString(store, ["contactAddress", "address"]) || null,
    };
  }

  const vendorSnap = await db.collection("vendors").doc(vendorId).get();
  if (!vendorSnap.exists) {
    return {
      vendorId,
      storeName:
        fallbackName || (vendorId === PLATFORM_VENDOR_ID ? "Tender Paws" : vendorId),
      logoUrl: null,
      contactPhone: null,
      contactEmail: null,
      contactAddress: null,
    };
  }
  const data = vendorSnap.data() || {};
  return {
    vendorId,
    storeName: readString(data, ["storeName"]) || fallbackName,
    logoUrl: readString(data, ["logoUrl"]) || null,
    contactPhone: readString(data, ["contactPhone", "phone"]) || null,
    contactEmail: readString(data, ["contactEmail", "email"]) || null,
    contactAddress: readString(data, ["contactAddress"]) || null,
  };
}

async function splitOrder(orderId, orderData) {
  const rawItems = extractLineItems(orderData);
  if (rawItems.length === 0) return 0;

  const legacyVendorId = readString(orderData, ["vendorId"]);
  const grouped = new Map();

  for (const raw of rawItems) {
    const product = await getProduct(raw.productId);
    const vendorId = raw.vendorId || product?.vendorId || legacyVendorId;
    if (!vendorId) continue;
    const lineItem = {
      productId: raw.productId,
      name: product?.name || raw.name,
      imageUrl: product?.primaryImageUrl || raw.imageUrl || null,
      quantity: raw.quantity,
      unitPricePiastres: raw.unitPricePiastres,
      lineTotalPiastres: raw.unitPricePiastres * raw.quantity,
      vendorId,
      vendorStoreName: raw.vendorStoreName || product?.vendorStoreName || null,
    };
    const bucket = grouped.get(vendorId) || [];
    bucket.push(lineItem);
    grouped.set(vendorId, bucket);
  }

  if (grouped.size === 0) return 0;

  const buyerUid = readString(orderData, ["buyerUid", "userId"]) || "unknown";
  const placedAt =
    orderData.placedAt?.toDate?.() ||
    orderData.createdAt?.toDate?.() ||
    new Date();
  const parentStatus = mapStatus(readString(orderData, ["status"]));
  const deliveryLocation = asRecord(orderData.deliveryLocation);
  const vendorCount = grouped.size;
  let created = 0;

  for (const [vendorId, lineItems] of grouped.entries()) {
    const docId = `${orderId}_${vendorId}`;
    const existing = await db.collection("vendorOrders").doc(docId).get();
    if (existing.exists && !repair) continue;

    const subtotalPiastres = lineItems.reduce((sum, item) => sum + item.lineTotalPiastres, 0);
    const deliveryFeePiastres = readOrderDeliveryFeePiastres(orderData);
    const discountPiastres = readOrderDiscountPiastres(orderData);
    const perVendorDelivery = Math.round(deliveryFeePiastres / vendorCount);
    const perVendorDiscount = Math.round(discountPiastres / vendorCount);
    const totalPiastres = Math.max(0, subtotalPiastres + perVendorDelivery - perVendorDiscount);
    const commissionRatePercent = await resolveCommissionRatePercent(vendorId);
    const commissionPiastres = computeCommissionPiastres(totalPiastres, commissionRatePercent);
    const netPiastres = totalPiastres - commissionPiastres;
    const store = await resolveStore(
      vendorId,
      orderData,
      lineItems[0]?.vendorStoreName,
    );
    const adminEditable = vendorId === PLATFORM_VENDOR_ID;

    const existingData = existing.exists ? existing.data() : null;

    const payload = {
      vendorOrderId: docId,
      orderId,
      vendorId,
      buyerUid,
      buyerDisplayName: readString(orderData, ["buyerName", "userName"]),
      buyerPhone: readString(orderData, ["buyerPhone", "phone"]),
      status: existingData?.status || parentStatus,
      statusHistory: Array.isArray(existingData?.statusHistory)
        ? existingData.statusHistory
        : [
            {
              status: parentStatus,
              at: Timestamp.fromDate(placedAt),
              by: repair ? "repair" : "backfill",
              note: null,
            },
          ],
      lineItems,
      itemCount: lineItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotalPiastres,
      deliveryFeePiastres: perVendorDelivery,
      discountPiastres: perVendorDiscount,
      totalPiastres,
      commissionRatePercent,
      commissionPiastres,
      netPiastres,
      currency: "EGP",
      placedAt: Timestamp.fromDate(placedAt),
      updatedAt: FieldValue.serverTimestamp(),
      vendorStoreName: store.storeName,
      store,
      fulfillmentOwner: adminEditable ? "admin" : "vendor",
      adminEditable,
      deliveryAddress: readString(orderData, ["address", "deliveryAddress"]),
      deliveryLocation: deliveryLocation || null,
      paymentMethod: readString(orderData, ["paymentMethod"]),
      paymentStatus: readString(orderData, ["paymentStatus"]),
    };

    if (execute) {
      await db.collection("vendorOrders").doc(docId).set(payload);
      console.log(
        repair && existing.exists
          ? `[repair] Updated vendorOrders/${docId}`
          : `[write] Created vendorOrders/${docId}`,
      );
    } else {
      console.log(
        repair && existing.exists
          ? `[dry-run] Would repair vendorOrders/${docId}`
          : `[dry-run] Would create vendorOrders/${docId}`,
      );
    }
    created += 1;
  }

  return created;
}

async function main() {
  const snap = await db.collection("orders").orderBy("createdAt", "desc").limit(limit).get();
  let slices = 0;
  for (const doc of snap.docs) {
    slices += await splitOrder(doc.id, doc.data());
  }
  console.log(
    `${execute ? (repair ? "Repaired" : "Created") : "Would process"} ${slices} vendor order slice(s) from ${snap.size} parent order(s).`,
  );
  if (repair && !execute) {
    console.log("Re-run with --repair --execute to rewrite existing vendorOrders amounts.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
