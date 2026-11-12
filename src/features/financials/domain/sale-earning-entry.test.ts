import { describe, expect, it } from "vitest";

import {
  buildSaleEarningEntry,
  saleEarningEntryId,
} from "@/features/financials/domain/sale-earning-entry";
import type { VendorOrder } from "@/features/orders/domain/types";

function order(overrides: Partial<VendorOrder> = {}): VendorOrder {
  return {
    vendorOrderId: "vo_1",
    orderId: "abcdefgh1234",
    vendorId: "vendor_a",
    buyerUid: "buyer_1",
    buyerDisplayName: null,
    buyerPhone: null,
    status: "delivered",
    holdState: null,
    heldReason: null,
    statusHistory: [],
    lineItems: [],
    itemCount: 1,
    subtotalPiastres: 10000,
    deliveryFeePiastres: 2000,
    discountPiastres: 500,
    totalPiastres: 11500,
    commissionRatePercent: 10,
    commissionPiastres: 0,
    netPiastres: 0,
    currency: "EGP",
    placedAt: new Date(0),
    updatedAt: new Date(0),
    vendorStoreName: null,
    store: null,
    fulfillmentOwner: "vendor",
    adminEditable: false,
    deliveryAddress: null,
    paymentMethod: null,
    paymentStatus: null,
    ...overrides,
  };
}

describe("buildSaleEarningEntry", () => {
  it("uses the shared deterministic entry id", () => {
    expect(saleEarningEntryId("vo_1")).toBe("sale_vo_1");
  });

  it("keeps the legacy BFF fields and no DL-1 fields for a legacy order", () => {
    const entry = buildSaleEarningEntry(order(), "actor_1");
    expect(entry).toEqual({
      vendorId: "vendor_a",
      type: "sale",
      amountPiastres: 11500,
      commissionPiastres: 1150,
      netPiastres: 10350,
      vendorOrderId: "vo_1",
      orderId: "abcdefgh1234",
      description: "Order ABCDEFGH",
      currency: "EGP",
      createdBy: "actor_1",
    });
    expect(entry).not.toHaveProperty("platformFeePiastres");
  });

  it("adds the DL-1 fields from an items_only order", () => {
    const entry = buildSaleEarningEntry(
      order({
        feeModel: "items_only",
        commissionPiastres: 1000,
        netPiastres: 11000,
        platformFeePiastres: 1000,
        vendorNetPiastres: 11000,
        couponFunding: "platform",
        dealType: "percentage",
      }),
      "actor_1",
    );
    expect(entry).toMatchObject({
      amountPiastres: 11500,
      commissionPiastres: 1000,
      netPiastres: 11000,
      feeModel: "items_only",
      platformFeePiastres: 1000,
      vendorNetPiastres: 11000,
      itemsPiastres: 10000,
      deliveryFeePiastres: 2000,
      discountPiastres: 500,
      couponFunding: "platform",
      dealType: "percentage",
    });
    for (const value of [
      entry.amountPiastres,
      entry.commissionPiastres,
      entry.netPiastres,
      entry.platformFeePiastres,
      entry.vendorNetPiastres,
    ]) {
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it("stores null for DL-1 values the items_only order lacks", () => {
    const entry = buildSaleEarningEntry(
      order({ feeModel: "items_only", platformFeePiastres: null, couponFunding: null }),
      "",
    );
    expect(entry.platformFeePiastres).toBeNull();
    expect(entry.vendorNetPiastres).toBeNull();
    expect(entry.couponFunding).toBeNull();
    expect(entry.dealType).toBeNull();
    expect(entry.createdBy).toBe("system");
  });
});
