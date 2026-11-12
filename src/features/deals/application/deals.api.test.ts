import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  callableFn: vi.fn(),
  httpsCallable: vi.fn(),
}));

vi.mock("firebase/functions", () => ({ httpsCallable: mocks.httpsCallable }));
vi.mock("@/lib/firebase", () => ({ firebaseFunctions: {} }));

import {
  FALLBACK_DEFAULT_PERCENT,
  fetchVendorDeal,
  mapVendorDealView,
} from "@/features/deals/application/deals.api";

const EFFECTIVE_FROM = Date.UTC(2026, 11, 1, 22);

const RAW = {
  ok: true,
  vendorType: "clinic",
  defaultPercent: 10,
  feeModel: "items_only",
  itemsOnlyFromMs: Date.UTC(2026, 10, 1),
  vendorDeal: { type: "both", fixedFeePerOrderPiastres: 1500, percentage: 8 },
  effectiveFromMs: Date.UTC(2026, 10, 2),
  dealActive: true,
  applyToAllBranches: false,
  current: {
    source: "vendor",
    type: "both",
    fixedFeePerOrderPiastres: 1500,
    percentage: 8,
    feeBase: "items",
  },
  branches: [
    {
      branchId: "b1",
      name: "Maadi",
      status: "active",
      deal: { source: "branch", type: "fixed", fixedFeePerOrderPiastres: 2000, percentage: 0 },
    },
    {
      branchId: "b2",
      name: "Zamalek",
      status: "archived",
      deal: { source: "vendor", type: "both", fixedFeePerOrderPiastres: 1500, percentage: 8 },
    },
  ],
};

beforeEach(() => {
  mocks.callableFn.mockReset();
  mocks.httpsCallable.mockReset();
  mocks.httpsCallable.mockReturnValue(mocks.callableFn);
});

describe("mapVendorDealView", () => {
  it("maps an active vendor deal with branch rows", () => {
    const view = mapVendorDealView(RAW);
    expect(view).toMatchObject({
      vendorType: "clinic",
      defaultPercent: 10,
      feeModel: "items_only",
      dealActive: true,
      applyToAllBranches: false,
      vendorDeal: { type: "both", fixedFeePerOrderPiastres: 1500, percentage: 8 },
      current: { source: "vendor", type: "both", feeBase: "items" },
    });
    expect(view.branches).toEqual([
      {
        branchId: "b1",
        name: "Maadi",
        status: "active",
        deal: { source: "branch", type: "fixed", fixedFeePerOrderPiastres: 2000, percentage: 0 },
      },
      {
        branchId: "b2",
        name: "Zamalek",
        status: "archived",
        deal: { source: "vendor", type: "both", fixedFeePerOrderPiastres: 1500, percentage: 8 },
      },
    ]);
  });

  it("keeps a future deal as upcoming with its start time", () => {
    const view = mapVendorDealView({
      ...RAW,
      vendorType: "store",
      dealActive: false,
      effectiveFromMs: EFFECTIVE_FROM,
      current: {
        source: "default",
        type: "percentage",
        fixedFeePerOrderPiastres: 0,
        percentage: 10,
        feeBase: "items",
      },
      branches: [],
    });
    expect(view.dealActive).toBe(false);
    expect(view.effectiveFromMs).toBe(EFFECTIVE_FROM);
    expect(view.current.source).toBe("default");
  });

  it("maps the legacy fee model on the order total", () => {
    const view = mapVendorDealView({
      ok: true,
      vendorType: "store",
      defaultPercent: 10,
      feeModel: "legacy",
      itemsOnlyFromMs: null,
      vendorDeal: null,
      effectiveFromMs: null,
      dealActive: false,
      applyToAllBranches: null,
      current: {
        source: "legacy",
        type: "percentage",
        fixedFeePerOrderPiastres: 0,
        percentage: 7,
        feeBase: "order_total",
      },
      branches: [],
    });
    expect(view.feeModel).toBe("legacy");
    expect(view.current).toEqual({
      source: "legacy",
      type: "percentage",
      fixedFeePerOrderPiastres: 0,
      percentage: 7,
      feeBase: "order_total",
    });
    expect(view.vendorDeal).toBeNull();
    expect(view.applyToAllBranches).toBeNull();
  });

  it("falls back to the standard rate for an empty response", () => {
    const view = mapVendorDealView(null);
    expect(view.defaultPercent).toBe(FALLBACK_DEFAULT_PERCENT);
    expect(view.vendorType).toBe("store");
    expect(view.feeModel).toBe("legacy");
    expect(view.dealActive).toBe(false);
    expect(view.current).toEqual({
      source: "legacy",
      type: "percentage",
      fixedFeePerOrderPiastres: 0,
      percentage: FALLBACK_DEFAULT_PERCENT,
      feeBase: "order_total",
    });
    expect(view.branches).toEqual([]);
  });

  it("coerces bad values and drops branch rows without an id", () => {
    const view = mapVendorDealView({
      ...RAW,
      defaultPercent: "nope",
      vendorDeal: { type: "weird", fixedFeePerOrderPiastres: "1500.9", percentage: 250 },
      current: {
        source: "admin",
        type: "fixed",
        fixedFeePerOrderPiastres: -5,
        percentage: 0,
        feeBase: "x",
      },
      branches: [
        null,
        { name: "No id" },
        { branchId: "b3", name: 4, status: "deleted" },
        {
          branchId: "b4",
          name: "Dokki",
          deal: { source: "other", type: "percentage", percentage: 12.5 },
        },
      ],
    });
    expect(view.defaultPercent).toBe(FALLBACK_DEFAULT_PERCENT);
    expect(view.vendorDeal).toEqual({
      type: "percentage",
      fixedFeePerOrderPiastres: 1500,
      percentage: 100,
    });
    expect(view.current).toMatchObject({
      source: "default",
      fixedFeePerOrderPiastres: 0,
      feeBase: "items",
    });
    expect(view.branches.map((branch) => branch.branchId)).toEqual(["b3", "b4"]);
    expect(view.branches[0]).toMatchObject({
      name: "",
      status: "active",
      deal: { source: "default", type: "fixed" },
    });
    expect(view.branches[1].deal).toEqual({
      source: "default",
      type: "percentage",
      fixedFeePerOrderPiastres: 0,
      percentage: 12.5,
    });
  });
});

describe("fetchVendorDeal", () => {
  it("calls the deal callable with an empty request", async () => {
    mocks.callableFn.mockResolvedValue({ data: RAW });
    const view = await fetchVendorDeal();
    expect(mocks.httpsCallable).toHaveBeenCalledWith({}, "vendor_deals-getMyVendorDeal");
    expect(mocks.callableFn).toHaveBeenCalledWith({});
    expect(view.current.source).toBe("vendor");
  });

  it("propagates callable errors", async () => {
    mocks.callableFn.mockRejectedValue(new Error("permission-denied"));
    await expect(fetchVendorDeal()).rejects.toThrow();
  });
});
