import "server-only";

import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase-admin/firestore";

import { recordSaleEarningForDeliveredOrder } from "@/features/financials/infrastructure/vendor-earnings.admin.repository";
import type {
  UpdateVendorOrderStatusInput,
  VendorOrder,
  VendorOrderListFilter,
  VendorOrderListPage,
  VendorOrderStatus,
} from "@/features/orders/domain/types";
import {
  orderMatchesDateFilter,
  orderMatchesSearchQuery,
} from "@/features/orders/lib/orderListFilters";
import { syncVendorOrdersForVendor } from "@/features/orders/infrastructure/orders-split.admin.service";
import { getAdminFirestore } from "@/lib/firebase-admin";

const VENDOR_ORDERS_COLLECTION = "vendorOrders";
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const ALLOWED_STATUS_TRANSITIONS: Record<VendorOrderStatus, VendorOrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

type VendorOrderDoc = {
  vendorOrderId?: string;
  orderId: string;
  vendorId: string;
  buyerUid: string;
  buyerDisplayName?: string | null;
  buyerPhone?: string | null;
  status: VendorOrderStatus;
  statusHistory?: Array<{
    status: VendorOrderStatus;
    at: Timestamp;
    by: string;
    note?: string | null;
  }>;
  lineItems: VendorOrder["lineItems"];
  itemCount: number;
  subtotalPiastres: number;
  deliveryFeePiastres?: number;
  discountPiastres?: number;
  totalPiastres: number;
  commissionRatePercent: number;
  commissionPiastres?: number;
  netPiastres?: number;
  currency: string;
  placedAt?: Timestamp;
  updatedAt?: Timestamp;
  vendorStoreName?: string | null;
  store?: VendorOrder["store"];
  fulfillmentOwner?: "admin" | "vendor";
  adminEditable?: boolean;
  deliveryAddress?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
};

function vendorOrdersCollection() {
  return getAdminFirestore().collection(VENDOR_ORDERS_COLLECTION);
}

function clampPageSize(pageSize?: number): number {
  if (!pageSize || pageSize < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(pageSize, MAX_PAGE_SIZE);
}

function toVendorOrder(snap: DocumentSnapshot<DocumentData>): VendorOrder {
  const data = snap.data() as VendorOrderDoc;
  return {
    vendorOrderId: snap.id,
    orderId: data.orderId,
    vendorId: data.vendorId,
    buyerUid: data.buyerUid,
    buyerDisplayName: data.buyerDisplayName ?? null,
    buyerPhone: data.buyerPhone ?? null,
    status: data.status,
    statusHistory: (data.statusHistory ?? []).map((event) => ({
      status: event.status,
      at: event.at.toDate(),
      by: event.by,
      note: event.note ?? null,
    })),
    lineItems: data.lineItems ?? [],
    itemCount: data.itemCount ?? 0,
    subtotalPiastres: data.subtotalPiastres ?? 0,
    deliveryFeePiastres: data.deliveryFeePiastres ?? 0,
    discountPiastres: data.discountPiastres ?? 0,
    totalPiastres: data.totalPiastres ?? 0,
    commissionRatePercent: data.commissionRatePercent ?? 0,
    commissionPiastres: data.commissionPiastres ?? 0,
    netPiastres: data.netPiastres ?? 0,
    currency: "EGP",
    placedAt: data.placedAt?.toDate() ?? new Date(0),
    updatedAt: data.updatedAt?.toDate() ?? new Date(0),
    vendorStoreName: data.vendorStoreName ?? null,
    store: data.store ?? null,
    fulfillmentOwner: data.fulfillmentOwner ?? "vendor",
    adminEditable: data.adminEditable ?? data.vendorId === "platformVendor",
    deliveryAddress: data.deliveryAddress ?? null,
    paymentMethod: data.paymentMethod ?? null,
    paymentStatus: data.paymentStatus ?? null,
  };
}

export async function listVendorOrders(
  vendorId: string,
  filter: VendorOrderListFilter,
): Promise<VendorOrderListPage> {
  await syncVendorOrdersForVendor(vendorId);

  const pageSize = clampPageSize(filter.pageSize);
  const snap = await vendorOrdersCollection().where("vendorId", "==", vendorId).get();

  let items = snap.docs.map(toVendorOrder);

  if (filter.status && filter.status !== "any") {
    items = items.filter((order) => order.status === filter.status);
  }

  if (filter.query?.trim()) {
    items = items.filter((order) => orderMatchesSearchQuery(order, filter.query!));
  }

  if (filter.datePreset && filter.datePreset !== "any") {
    items = items.filter((order) =>
      orderMatchesDateFilter(order.placedAt, {
        datePreset: filter.datePreset!,
        dateFrom: filter.dateFrom ?? "",
        dateTo: filter.dateTo ?? "",
      }),
    );
  }

  items.sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime());

  const total = items.length;

  if (filter.cursor) {
    const cursorIndex = items.findIndex((order) => order.vendorOrderId === filter.cursor);
    if (cursorIndex >= 0) items = items.slice(cursorIndex + 1);
  }

  const hasMore = items.length > pageSize;
  const pageItems = items.slice(0, pageSize);
  const nextCursor = hasMore
    ? (pageItems[pageItems.length - 1]?.vendorOrderId ?? null)
    : null;

  return { items: pageItems, nextCursor, total };
}

export async function getVendorOrder(
  vendorId: string,
  vendorOrderId: string,
): Promise<VendorOrder | null> {
  const snap = await vendorOrdersCollection().doc(vendorOrderId).get();
  if (!snap.exists) return null;
  const order = toVendorOrder(snap);
  if (order.vendorId !== vendorId) return null;
  return order;
}

export async function countOpenVendorOrders(vendorId: string): Promise<number> {
  await syncVendorOrdersForVendor(vendorId);
  const snap = await vendorOrdersCollection().where("vendorId", "==", vendorId).get();
  return snap.docs
    .map(toVendorOrder)
    .filter((order) => !["delivered", "cancelled"].includes(order.status)).length;
}

export async function updateVendorOrderStatus(
  vendorId: string,
  vendorOrderId: string,
  actorUid: string,
  input: UpdateVendorOrderStatusInput,
): Promise<VendorOrder | null> {
  const docRef = vendorOrdersCollection().doc(vendorOrderId);

  const updated = await getAdminFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists) return null;

    const current = toVendorOrder(snap);
    if (current.vendorId !== vendorId) return null;

    const allowed = ALLOWED_STATUS_TRANSITIONS[current.status];
    if (!allowed.includes(input.status) || input.status === current.status) {
      return null;
    }

    const now = Timestamp.now();
    const statusHistory = [
      ...current.statusHistory,
      {
        status: input.status,
        at: now,
        by: actorUid,
        note: input.note ?? null,
      },
    ];

    tx.update(docRef, {
      status: input.status,
      statusHistory,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      ...current,
      status: input.status,
      statusHistory: statusHistory.map((event) => ({
        status: event.status,
        at: event.at instanceof Timestamp ? event.at.toDate() : event.at,
        by: event.by,
        note: event.note ?? null,
      })),
      updatedAt: new Date(),
    } satisfies VendorOrder;
  });

  if (!updated) return null;

  if (input.status === "delivered") {
    await recordSaleEarningForDeliveredOrder(updated, actorUid);
  }

  const fresh = await docRef.get();
  return fresh.exists ? toVendorOrder(fresh) : updated;
}

export function isValidStatusTransition(
  from: VendorOrderStatus,
  to: VendorOrderStatus,
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from].includes(to);
}
