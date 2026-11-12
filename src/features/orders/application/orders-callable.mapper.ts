import { toOrderHistoryRole } from "@/features/orders/domain/history-role";
import {
  ORDER_HISTORY_ROLES,
  type OrderHistoryRole,
  type VendorOrder,
  type VendorOrderListFilter,
  type VendorOrderStatus,
} from "@/features/orders/domain/types";

/** Wire shape shared by the BFF and the callable path before dates become `Date`. */
export type VendorOrderStatusEventResponse = {
  status: VendorOrderStatus;
  at: string;
  byRole: OrderHistoryRole;
  note: string | null;
};

export type VendorOrderResponse = Omit<VendorOrder, "placedAt" | "updatedAt" | "statusHistory"> & {
  placedAt: string;
  updatedAt: string;
  statusHistory: VendorOrderStatusEventResponse[];
};

export type VendorOrderListCallableRequest = {
  status?: VendorOrderListFilter["status"];
  pageSize?: number;
  cursor?: string;
  datePreset?: VendorOrderListFilter["datePreset"];
  dateFrom?: string;
  dateTo?: string;
};

function millisToIso(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return new Date(value).toISOString();
}

/** Accepts ISO strings, Firestore Timestamps and their onCall JSON form. */
function toIso(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    if ("toDate" in value && typeof (value as { toDate: unknown }).toDate === "function") {
      return (value as { toDate: () => Date }).toDate().toISOString();
    }
    const seconds = (value as { _seconds?: unknown })._seconds;
    if (typeof seconds === "number" && Number.isFinite(seconds)) {
      const nanos = (value as { _nanoseconds?: unknown })._nanoseconds;
      const nanosMs = typeof nanos === "number" ? Math.floor(nanos / 1e6) : 0;
      return new Date(seconds * 1000 + nanosMs).toISOString();
    }
  }
  return new Date(0).toISOString();
}

function preferMillis(millis: unknown, fallback: unknown): string {
  return millisToIso(millis) ?? toIso(fallback);
}

/** Uses `byRole`; an older response with a raw `by` is mapped to a role, never kept. */
function historyRole(event: Record<string, unknown>, vendorId: string): OrderHistoryRole {
  const role = event.byRole;
  if (typeof role === "string" && (ORDER_HISTORY_ROLES as readonly string[]).includes(role)) {
    return role as OrderHistoryRole;
  }
  return toOrderHistoryRole(event.by, vendorId);
}

function normalizeStatusHistory(
  raw: unknown,
  vendorId: string,
): VendorOrderStatusEventResponse[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((event): event is Record<string, unknown> => !!event && typeof event === "object")
    .map((event) => ({
      status: event.status as VendorOrderStatus,
      at: preferMillis(event.atMs, event.at),
      byRole: historyRole(event, vendorId),
      note: typeof event.note === "string" ? event.note : null,
    }));
}

/**
 * Maps a `vendor_orders` callable order into the wire shape the BFF returns.
 * Prefers `placedAtMs`, `updatedAtMs` and history `atMs`; keeps `byRole` only.
 */
export function normalizeCallableOrder(raw: Record<string, unknown>): VendorOrderResponse {
  return {
    ...(raw as unknown as VendorOrderResponse),
    holdState: raw.holdState === "held" ? "held" : null,
    heldReason: typeof raw.heldReason === "string" ? raw.heldReason : null,
    placedAt: preferMillis(raw.placedAtMs, raw.placedAt),
    updatedAt: preferMillis(raw.updatedAtMs, raw.updatedAt),
    statusHistory: normalizeStatusHistory(
      raw.statusHistory,
      typeof raw.vendorId === "string" ? raw.vendorId : "",
    ),
  };
}

/**
 * Request body for `vendor_orders-listVendorOrders`. Date params are sent only
 * when set, so a filter without them produces the same payload as before.
 * Search (`query`) is BFF only and is not forwarded.
 */
export function buildListCallableRequest(
  filter: VendorOrderListFilter,
): VendorOrderListCallableRequest {
  const request: VendorOrderListCallableRequest = {
    status: filter.status,
    pageSize: filter.pageSize,
    cursor: filter.cursor,
  };
  if (filter.datePreset && filter.datePreset !== "any") {
    request.datePreset = filter.datePreset;
    if (filter.datePreset === "custom") {
      if (filter.dateFrom) request.dateFrom = filter.dateFrom;
      if (filter.dateTo) request.dateTo = filter.dateTo;
    }
  }
  return request;
}
