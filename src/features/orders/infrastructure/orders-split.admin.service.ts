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
import { PLATFORM_VENDOR_ID } from "@/features/products/domain/platform-vendor.constants";
import { getAdminFirestore } from "@/lib/firebase-admin";

type RawLineItem = {
  productId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPricePiastres: number;
  vendorId: string | null;
  vendorStoreName: string | null;
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
        vendorId: readString(row, ["vendorId", "vendor_id"]),
        vendorStoreName: readString(row, ["vendorStoreName", "storeName", "vendor_store_name"]),
      });
    }

    if (parsed.length > 0) return parsed;
  }

  return [];
}

function vendorOrderDocId(orderId: string, vendorId: string): string {
  return `${orderId}_${vendorId}`;
}

function mapParentStatus(status: string | null): VendorOrderStatus {
  const normalized = (status ?? "pending").toLowerCase();
  if (normalized === "inprogress") return "pending";
  if (["pending", "confirmed", "shipped", "delivered", "cancelled"].includes(normalized)) {
    return normalized as VendorOrderStatus;
  }
  if (normalized === "completed") return "delivered";
  return "pending";
}

async function resolveVendorStore(
  vendorId: string,
  orderData: Record<string, unknown>,
  fallbackStoreName: string | null,
) {
  const stores = Array.isArray(orderData.stores) ? orderData.stores : [];
  const fromOrder = stores
    .map((entry) => asRecord(entry))
    .find((entry) => entry && readString(entry, ["vendorId"]) === vendorId);

  if (fromOrder) {
    return {
      vendorId,
      storeName:
        readString(fromOrder, ["storeName", "name"]) ??
        fallbackStoreName ??
        (vendorId === PLATFORM_VENDOR_ID ? "Tender Paws" : null),
      logoUrl: readString(fromOrder, ["logoUrl"]),
      contactPhone: readString(fromOrder, ["contactPhone", "phone"]),
      contactEmail: readString(fromOrder, ["contactEmail", "email"]),
      contactAddress: readString(fromOrder, ["contactAddress", "address"]),
    };
  }

  const vendorSnap = await getAdminFirestore().collection("vendors").doc(vendorId).get();
  if (!vendorSnap.exists) {
    return {
      vendorId,
      storeName:
        fallbackStoreName ?? (vendorId === PLATFORM_VENDOR_ID ? "Tender Paws" : null),
      logoUrl: null,
      contactPhone: null,
      contactEmail: null,
      contactAddress: null,
    };
  }

  const vendorData = vendorSnap.data() as Record<string, unknown>;
  return {
    vendorId,
    storeName:
      readString(vendorData, ["storeName"]) ??
      fallbackStoreName ??
      (vendorId === PLATFORM_VENDOR_ID ? "Tender Paws" : null),
    logoUrl: readString(vendorData, ["logoUrl"]),
    contactPhone: readString(vendorData, ["contactPhone", "phone"]),
    contactEmail: readString(vendorData, ["contactEmail", "email"]),
    contactAddress: readString(vendorData, ["contactAddress"]),
  };
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
    const vendorId = raw.vendorId ?? product?.vendorId ?? legacyVendorId;
    if (!vendorId) continue;

    const lineTotalPiastres = raw.unitPricePiastres * raw.quantity;
    const lineItem: VendorOrderLineItem = {
      productId: raw.productId,
      name: product?.name ?? raw.name,
      imageUrl: product?.primaryImageUrl ?? raw.imageUrl,
      quantity: raw.quantity,
      unitPricePiastres: raw.unitPricePiastres,
      lineTotalPiastres,
      vendorId,
      vendorStoreName: raw.vendorStoreName ?? product?.vendorStoreName ?? null,
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
  const parentStatus = mapParentStatus(readString(orderData, ["status"]));
  const deliveryLocation = asRecord(orderData.deliveryLocation);
  const vendorCount = grouped.size;

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
    const perVendorDelivery =
      vendorCount > 0 ? Math.round(deliveryFeePiastres / vendorCount) : deliveryFeePiastres;
    const perVendorDiscount =
      vendorCount > 0 ? Math.round(discountPiastres / vendorCount) : discountPiastres;
    const totalPiastres = Math.max(
      0,
      subtotalPiastres + perVendorDelivery - perVendorDiscount,
    );
    const commissionRatePercent = await resolveCommissionRatePercent(vendorId);
    const commissionPiastres = computeCommissionPiastres(totalPiastres, commissionRatePercent);
    const netPiastres = totalPiastres - commissionPiastres;

    const store = await resolveVendorStore(
      vendorId,
      orderData,
      lineItems[0]?.vendorStoreName ?? null,
    );
    const adminEditable = vendorId === PLATFORM_VENDOR_ID;

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
      deliveryFeePiastres: perVendorDelivery,
      discountPiastres: perVendorDiscount,
      totalPiastres,
      commissionRatePercent,
      commissionPiastres,
      netPiastres,
      currency: "EGP",
      placedAt: Timestamp.fromDate(placedAt),
      updatedAt: Timestamp.now(),
      vendorStoreName: store.storeName,
      store,
      fulfillmentOwner: adminEditable ? "admin" : "vendor",
      adminEditable,
      deliveryAddress: readString(orderData, ["address", "deliveryAddress"]),
      deliveryLocation,
      paymentMethod: readString(orderData, ["paymentMethod", "paymentType"]),
      paymentStatus: readString(orderData, ["paymentStatus"]),
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
