import { describe, expect, it } from "vitest";

import { formatDealPercent } from "@/features/deals/domain/percent";
import { hasBranchDeals, hasUpcomingDeal, type VendorDealView } from "@/features/deals/domain/types";

describe("formatDealPercent", () => {
  it("keeps whole and short decimals without trailing zeros", () => {
    expect(formatDealPercent(10)).toBe("10");
    expect(formatDealPercent(12.5)).toBe("12.5");
    expect(formatDealPercent(7.25)).toBe("7.25");
    expect(formatDealPercent(0)).toBe("0");
  });

  it("rounds half up to two decimals", () => {
    expect(formatDealPercent(2.345)).toBe("2.35");
    expect(formatDealPercent(2.344)).toBe("2.34");
    expect(formatDealPercent(9.995)).toBe("10");
  });

  it("reads bad input as zero and uses Western digits", () => {
    expect(formatDealPercent(Number.NaN)).toBe("0");
    expect(formatDealPercent(Number.POSITIVE_INFINITY)).toBe("0");
    expect(formatDealPercent(15)).toMatch(/^[0-9.]+$/);
  });
});

describe("deal view helpers", () => {
  const base: VendorDealView = {
    vendorType: "store",
    defaultPercent: 10,
    feeModel: "items_only",
    itemsOnlyFromMs: 1,
    vendorDeal: null,
    effectiveFromMs: null,
    dealActive: false,
    applyToAllBranches: null,
    current: {
      source: "default",
      type: "percentage",
      fixedFeePerOrderPiastres: 0,
      percentage: 10,
      feeBase: "items",
    },
    branches: [],
  };

  it("shows branch rows for clinic and groomer only", () => {
    expect(hasBranchDeals("clinic")).toBe(true);
    expect(hasBranchDeals("groomer")).toBe(true);
    expect(hasBranchDeals("store")).toBe(false);
    expect(hasBranchDeals("doctor")).toBe(false);
  });

  it("has an upcoming deal only when a deal exists and is not active", () => {
    const deal = { type: "fixed" as const, fixedFeePerOrderPiastres: 1500, percentage: 0 };
    expect(hasUpcomingDeal(base)).toBe(false);
    expect(hasUpcomingDeal({ ...base, vendorDeal: deal, dealActive: false })).toBe(true);
    expect(hasUpcomingDeal({ ...base, vendorDeal: deal, dealActive: true })).toBe(false);
  });
});
