import { toOrderHistoryRole } from "@/features/orders/domain/history-role";
import type {
  VendorOrderStatus,
  VendorOrderStatusEvent,
} from "@/features/orders/domain/types";

export type StoredStatusHistoryEntry = {
  status: VendorOrderStatus;
  at?: unknown;
  by?: unknown;
  note?: string | null;
};

function toHistoryDate(at: unknown): Date {
  if (at instanceof Date) return at;
  if (
    at &&
    typeof at === "object" &&
    "toDate" in at &&
    typeof (at as { toDate: unknown }).toDate === "function"
  ) {
    return (at as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}

/** Maps stored history entries to the portal shape: the actor uid becomes a role. */
export function toVendorOrderStatusHistory(
  stored: StoredStatusHistoryEntry[] | null | undefined,
  vendorId: string,
): VendorOrderStatusEvent[] {
  if (!Array.isArray(stored)) return [];
  return stored.map((event) => ({
    status: event.status,
    at: toHistoryDate(event.at),
    byRole: toOrderHistoryRole(event.by, vendorId),
    note: event.note ?? null,
  }));
}
