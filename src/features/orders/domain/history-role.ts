import type { OrderHistoryRole } from "@/features/orders/domain/types";

/**
 * Role of the actor behind a stored status history entry. The stored uid is
 * never exposed to the portal, only this role.
 */
export function toOrderHistoryRole(by: unknown, vendorId: string): OrderHistoryRole {
  if (by === "system") return "system";
  if (vendorId && by === vendorId) return "vendor";
  return "admin";
}
