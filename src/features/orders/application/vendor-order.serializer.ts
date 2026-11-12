import type { VendorOrderResponse } from "@/features/orders/application/orders-callable.mapper";
import type { VendorOrder } from "@/features/orders/domain/types";

/** JSON shape of an order returned by the vendor orders BFF routes. */
export function serializeVendorOrder(order: VendorOrder): VendorOrderResponse {
  return {
    ...order,
    placedAt: order.placedAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    statusHistory: order.statusHistory.map((event) => ({
      status: event.status,
      at: event.at.toISOString(),
      byRole: event.byRole,
      note: event.note,
    })),
  };
}
