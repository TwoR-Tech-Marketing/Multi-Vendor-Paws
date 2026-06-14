import "server-only";

import { Timestamp } from "firebase-admin/firestore";

import { egpToPiastres } from "@/features/products/domain/currency";
import { getProductById } from "@/features/products/infrastructure/products.admin.repository";
import {
  computeCommissionPiastres,
  ensureDefaultCommissionConfig,
  resolveCommissionRatePercent,
} from "@/features/financials/infrastructure/commission.admin.repository";
import type {
  VendorOrderLineItem,
  VendorOrderStatus,
} from "@/features/orders/domain/types";
import { getAdminFirestore } from "@/lib/firebase-admin";

type RawLineItem = {
  productId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPricePiastres: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function readNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function toPiastresFromPrice(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  if (Number.isInteger(value) && value >= 100) return value;
  return egpToPiastres(value);
}

function extractLineItems(orderData: Record<string, unknown>): RawLineItem[] {
  const candidates = [
    orderData.items,
    orderData.products,
    orderData.lineItems,
    orderData.cartItems,
    orderData.orderItems,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;

    const parsed: RawLineItem[] = [];
    for (const entry of candidate) {
      const row = asRecord(entry);
      if (!row) continue;

      const productId =
        readString(row, ["productId", "id", "product_id"]) ??
        readString(asRecord(row.product) ?? {}, ["id", "productId"]);
      if (!productId) continue;

      const quantity = Math.max(1, Math.floor(readNumber(row, ["quantity", "qty", "count"]) ?? 1));
      const unitRaw =
        readNumber(row, ["unitPricePiastres", "pricePiastres", "price", "unitPrice"]) ?? 0;
      const unitPricePiastres = toPiastresFromPrice(unitRaw);
      const name =
        readString(row, ["name", "productName", "title"]) ??
        readString(asRecord(row.product) ?? {}, ["name", "title"]) ??
        "Product";

      parsed.push({
        productId,
        name,
        imageUrl: readString(row, ["imageUrl", "image", "primaryImageUrl"]),
        quantity,
        unitPricePiastres,
      });
    }

    if (parsed.length > 0) return parsed;
  }

  return [];
}

function vendorOrderDocId(orderId: string, vendorId: string): string {
  return `${orderId}_${vendorId}`;
}

export async function splitParentOrderIfNeeded(orderId: string): Promise<number> {
  await ensureDefaultCommissionConfig();

  const db = getAdminFirestore();
  const orderSnap = await db.collection("orders").doc(orderId).get();
  if (!orderSnap.exists) return 0;

  const orderData = orderSnap.data() as Record<string, unknown>;
  const rawItems = extractLineItems(orderData);
  if (rawItems.length === 0) return 0;

  const buyerUid =
    readString(orderData, ["buyerUid", "userId", "buyerId", "uid"]) ?? "unknown";
  const buyerDisplayName = readString(orderData, ["buyerName", "userName", "customerName"]);
  const buyerPhone = readString(orderData, ["buyerPhone", "phone", "userPhone"]);
  const placedAt =
    (orderData.placedAt as Timestamp | undefined)?.toDate() ??
    (orderData.createdAt as Timestamp | undefined)?.toDate() ??
    (orderData.orderDate as Timestamp | undefined)?.toDate() ??
    new Date();

  const legacyVendorId = readString(orderData, ["vendorId"]);
  const grouped = new Map<string, VendorOrderLineItem[]>();

  for (const raw of rawItems) {
    const product = await getProductById(raw.productId);
    const vendorId = product?.vendorId ?? legacyVendorId;
    if (!vendorId) continue;

    const lineTotalPiastres = raw.unitPricePiastres * raw.quantity;
    const lineItem: VendorOrderLineItem = {
      productId: raw.productId,
      name: product?.name ?? raw.name,
      imageUrl: product?.primaryImageUrl ?? raw.imageUrl,
      quantity: raw.quantity,
      unitPricePiastres: raw.unitPricePiastres,
      lineTotalPiastres,
    };

    const bucket = grouped.get(vendorId) ?? [];
    bucket.push(lineItem);
    grouped.set(vendorId, bucket);
  }

  if (grouped.size === 0 && legacyVendorId && rawItems.length > 0) {
    const lineItems = rawItems.map((raw) => ({
      productId: raw.productId,
      name: raw.name,
      imageUrl: raw.imageUrl,
      quantity: raw.quantity,
      unitPricePiastres: raw.unitPricePiastres,
      lineTotalPiastres: raw.unitPricePiastres * raw.quantity,
    }));
    grouped.set(legacyVendorId, lineItems);
  }

  let created = 0;
  const parentStatus = (readString(orderData, ["status"]) ?? "pending") as VendorOrderStatus;

  for (const [vendorId, lineItems] of grouped.entries()) {
    const docId = vendorOrderDocId(orderId, vendorId);
    const existing = await db.collection("vendorOrders").doc(docId).get();
    if (existing.exists) continue;

    const subtotalPiastres = lineItems.reduce((sum, item) => sum + item.lineTotalPiastres, 0);
    const deliveryFeePiastres = toPiastresFromPrice(
      readNumber(orderData, ["deliveryFee", "deliveryFeePiastres", "shippingFee"]) ?? 0,
    );
    const discountPiastres = toPiastresFromPrice(
      readNumber(orderData, ["discount", "discountPiastres"]) ?? 0,
    );
    const totalPiastres = Math.max(0, subtotalPiastres + deliveryFeePiastres - discountPiastres);
    const commissionRatePercent = await resolveCommissionRatePercent(vendorId);
    const commissionPiastres = computeCommissionPiastres(totalPiastres, commissionRatePercent);
    const netPiastres = totalPiastres - commissionPiastres;

    const firstProduct =
      lineItems.length > 0 ? await getProductById(lineItems[0].productId) : null;
    const vendorStoreName = firstProduct?.vendorStoreName ?? null;

    await db.collection("vendorOrders").doc(docId).set({
      vendorOrderId: docId,
      orderId,
      vendorId,
      buyerUid,
      buyerDisplayName,
      buyerPhone,
      status: parentStatus,
      statusHistory: [
        {
          status: parentStatus,
          at: Timestamp.fromDate(placedAt),
          by: "system",
          note: null,
        },
      ],
      lineItems,
      itemCount: lineItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotalPiastres,
      deliveryFeePiastres,
      discountPiastres,
      totalPiastres,
      commissionRatePercent,
      commissionPiastres,
      netPiastres,
      currency: "EGP",
      placedAt: Timestamp.fromDate(placedAt),
      updatedAt: Timestamp.now(),
      vendorStoreName,
      deliveryAddress: readString(orderData, ["address", "deliveryAddress"]),
      paymentMethod: readString(orderData, ["paymentMethod", "paymentType"]),
    });

    created += 1;
  }

  return created;
}

export async function syncVendorOrdersForVendor(vendorId: string): Promise<number> {
  const db = getAdminFirestore();
  let created = 0;

  const [byVendorIdSnap, byVendorIdsSnap] = await Promise.all([
    db.collection("orders").where("vendorId", "==", vendorId).limit(50).get(),
    db
      .collection("orders")
      .where("vendorIds", "array-contains", vendorId)
      .limit(50)
      .get()
      .catch(() => null),
  ]);

  const orderIds = new Set<string>();
  for (const doc of byVendorIdSnap.docs) orderIds.add(doc.id);
  if (byVendorIdsSnap) {
    for (const doc of byVendorIdsSnap.docs) orderIds.add(doc.id);
  }

  for (const orderId of orderIds) {
    created += await splitParentOrderIfNeeded(orderId);
  }

  return created;
}
