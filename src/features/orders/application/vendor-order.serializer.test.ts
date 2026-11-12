import { describe, expect, it } from "vitest";

import { serializeVendorOrder } from "@/features/orders/application/vendor-order.serializer";
import type { VendorOrder } from "@/features/orders/domain/types";
import { toVendorOrderStatusHistory } from "@/features/orders/infrastructure/vendor-order-history.mapper";

const VENDOR_ID = "vendor-uid-1";
const ADMIN_UID = "admin-uid-42";

function timestamp(iso: string) {
  return { toDate: () => new Date(iso) };
}

function orderWithHistory(history: VendorOrder["statusHistory"]): VendorOrder {
  return {
    vendorOrderId: "vo-1",
    orderId: "o-1",
    vendorId: VENDOR_ID,
    buyerUid: "buyer-1",
    buyerDisplayName: null,
    buyerPhone: null,
    status: "shipped",
    holdState: null,
    heldReason: null,
    statusHistory: history,
    lineItems: [],
    itemCount: 0,
    subtotalPiastres: 0,
    deliveryFeePiastres: 0,
    discountPiastres: 0,
    totalPiastres: 0,
    commissionRatePercent: 0,
    commissionPiastres: 0,
    netPiastres: 0,
    currency: "EGP",
    placedAt: new Date("2026-11-10T22:01:00.000Z"),
    updatedAt: new Date("2026-11-11T08:00:00.000Z"),
    vendorStoreName: null,
    store: null,
    fulfillmentOwner: "vendor",
    adminEditable: false,
    deliveryAddress: null,
    paymentMethod: null,
    paymentStatus: null,
  };
}

describe("BFF order status history", () => {
  const history = toVendorOrderStatusHistory(
    [
      { status: "pending", at: timestamp("2026-11-10T22:01:00.000Z"), by: "system" },
      { status: "confirmed", at: timestamp("2026-11-10T23:00:00.000Z"), by: VENDOR_ID, note: "Ready" },
      { status: "shipped", at: new Date("2026-11-11T08:00:00.000Z"), by: ADMIN_UID, note: null },
    ],
    VENDOR_ID,
  );

  it("maps system, vendor and admin actors to roles", () => {
    expect(history).toEqual([
      { status: "pending", at: new Date("2026-11-10T22:01:00.000Z"), byRole: "system", note: null },
      { status: "confirmed", at: new Date("2026-11-10T23:00:00.000Z"), byRole: "vendor", note: "Ready" },
      { status: "shipped", at: new Date("2026-11-11T08:00:00.000Z"), byRole: "admin", note: null },
    ]);
  });

  it("serializes byRole and never a raw uid", () => {
    const body = serializeVendorOrder(orderWithHistory(history));
    expect(body.statusHistory).toEqual([
      { status: "pending", at: "2026-11-10T22:01:00.000Z", byRole: "system", note: null },
      { status: "confirmed", at: "2026-11-10T23:00:00.000Z", byRole: "vendor", note: "Ready" },
      { status: "shipped", at: "2026-11-11T08:00:00.000Z", byRole: "admin", note: null },
    ]);
    const historyJson = JSON.stringify(body.statusHistory);
    expect(historyJson).not.toContain(ADMIN_UID);
    expect(historyJson).not.toContain(VENDOR_ID);
    for (const event of body.statusHistory) expect(event).not.toHaveProperty("by");
  });

  it("treats a missing actor as admin and a missing history as empty", () => {
    expect(toVendorOrderStatusHistory([{ status: "pending" }], VENDOR_ID)).toEqual([
      { status: "pending", at: new Date(0), byRole: "admin", note: null },
    ]);
    expect(toVendorOrderStatusHistory(undefined, VENDOR_ID)).toEqual([]);
  });
});
