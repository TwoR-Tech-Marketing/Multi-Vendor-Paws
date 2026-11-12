import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const callableImpl = vi.fn();
const httpsCallable = vi.fn<(functions: unknown, name: string) => typeof callableImpl>(
  () => callableImpl,
);
const vendorApiGet = vi.fn();

vi.mock("firebase/functions", () => ({
  httpsCallable: (functions: unknown, name: string) => httpsCallable(functions, name),
}));
vi.mock("@/lib/firebase", () => ({ firebaseFunctions: {} }));
vi.mock("@/lib/auth-client", () => ({ vendorApiGet: (path: string) => vendorApiGet(path) }));

import {
  fetchVendorEarningsEntries,
  fetchVendorEarningsOverview,
  isEarningsLedgerPaged,
  mapCallableEarningsEntries,
  mapCallableEarningsSummary,
} from "@/features/financials/application/earnings.api";

const SUMMARY = "vendor_earnings-getMyVendorEarningsSummary";
const ENTRIES = "vendor_earnings-listMyVendorEarningsEntries";

const callableEntry = {
  entryId: "sale_vo1",
  type: "sale",
  amountPiastres: 11500,
  commissionPiastres: 1000,
  netPiastres: 10500,
  platformFeePiastres: 1000,
  vendorNetPiastres: 10500,
  itemsPiastres: 10000,
  deliveryFeePiastres: 1500,
  discountPiastres: null,
  couponFunding: null,
  dealType: "percentage",
  vendorOrderId: "vo1",
  orderId: "abcdefgh",
  description: "Order ABCDEFGH",
  currency: "EGP",
  createdAtMs: Date.UTC(2026, 10, 12, 10),
};

function respondByName(byName: Record<string, unknown>) {
  httpsCallable.mockImplementation((_functions, name) => {
    const fn = vi.fn().mockResolvedValue({ data: byName[name] });
    return fn as unknown as typeof callableImpl;
  });
}

beforeEach(() => {
  callableImpl.mockReset();
  httpsCallable.mockReset();
  httpsCallable.mockImplementation(() => callableImpl);
  vendorApiGet.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("earnings adapter, bff source (default)", () => {
  it("keeps the BFF route, no paging and no callable", async () => {
    vendorApiGet.mockResolvedValue({
      summary: {
        totalSales: 500,
        commission: 50,
        netEarnings: 450,
        pendingPayout: 450,
        currency: "EGP",
        updatedAt: "2026-11-12T10:00:00.000Z",
      },
      entries: [
        {
          entryId: "e1",
          vendorId: "vendor_a",
          type: "sale",
          amountPiastres: 500,
          commissionPiastres: 50,
          netPiastres: 450,
          vendorOrderId: "vo1",
          orderId: "o1",
          description: "Order O1",
          currency: "EGP",
          createdAt: "2026-11-12T10:00:00.000Z",
        },
      ],
    });

    expect(isEarningsLedgerPaged()).toBe(false);
    const page = await fetchVendorEarningsOverview("sale");

    expect(vendorApiGet).toHaveBeenCalledWith("/api/vendor/earnings");
    expect(httpsCallable).not.toHaveBeenCalled();
    expect(page.nextCursor).toBeNull();
    expect(page.summary.totalSalesPiastres).toBe(500);
    expect(page.entries[0].createdAt.toISOString()).toBe("2026-11-12T10:00:00.000Z");
  });
});

describe("earnings adapter, callable source", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_VENDOR_EARNINGS_DATA_SOURCE", "callable");
  });

  it("loads the summary and the first page of the chosen type", async () => {
    respondByName({
      [SUMMARY]: {
        ok: true,
        summary: {
          totalSalesPiastres: 11500,
          totalCommissionPiastres: 1000,
          netEarningsPiastres: 10500,
          pendingPayoutPiastres: 10500,
          refundsPiastres: 0,
          adjustmentsPiastres: 0,
          payoutsPiastres: 0,
          currency: "EGP",
          updatedAtMs: Date.UTC(2026, 10, 12),
        },
      },
      [ENTRIES]: { ok: true, items: [callableEntry], nextCursor: "sale_vo1" },
    });

    expect(isEarningsLedgerPaged()).toBe(true);
    const page = await fetchVendorEarningsOverview("all");

    expect(vendorApiGet).not.toHaveBeenCalled();
    expect(httpsCallable.mock.calls.map(([, name]) => name).sort()).toEqual([SUMMARY, ENTRIES].sort());
    expect(page.summary).toEqual({
      vendorId: "",
      totalSalesPiastres: 11500,
      totalCommissionPiastres: 1000,
      netEarningsPiastres: 10500,
      pendingPayoutPiastres: 10500,
      currency: "EGP",
      updatedAt: new Date(Date.UTC(2026, 10, 12)),
    });
    expect(page.entries).toEqual([
      {
        entryId: "sale_vo1",
        vendorId: "",
        type: "sale",
        amountPiastres: 11500,
        commissionPiastres: 1000,
        netPiastres: 10500,
        vendorOrderId: "vo1",
        orderId: "abcdefgh",
        description: "Order ABCDEFGH",
        currency: "EGP",
        createdAt: new Date(Date.UTC(2026, 10, 12, 10)),
      },
    ]);
    expect(page.nextCursor).toBe("sale_vo1");
  });

  it("passes type, page size and cursor for load more", async () => {
    callableImpl.mockResolvedValue({ data: { ok: true, items: [], nextCursor: null } });
    const page = await fetchVendorEarningsEntries("refund", "sale_vo1");

    expect(httpsCallable).toHaveBeenCalledWith({}, ENTRIES);
    expect(callableImpl).toHaveBeenCalledWith({ type: "refund", pageSize: 20, cursor: "sale_vo1" });
    expect(page).toEqual({ entries: [], nextCursor: null });
  });

  it("rejects when a callable fails so the section shows its error", async () => {
    callableImpl.mockRejectedValue({ code: "functions/internal", message: "raw" });
    await expect(fetchVendorEarningsEntries("all")).rejects.toBeDefined();
  });
});

describe("callable mappers", () => {
  it("drops unusable rows and keeps negative integer amounts", () => {
    const page = mapCallableEarningsEntries({
      items: [
        { ...callableEntry, entryId: "p1", type: "payout", amountPiastres: -2500, netPiastres: -2500 },
        { ...callableEntry, entryId: "", type: "sale" },
        { ...callableEntry, entryId: "x", type: "bonus" },
      ],
      nextCursor: "",
    });
    expect(page.nextCursor).toBeNull();
    expect(page.entries).toHaveLength(1);
    expect(page.entries[0]).toMatchObject({ entryId: "p1", type: "payout", amountPiastres: -2500 });
  });

  it("gives zeros and epoch for a missing summary", () => {
    const summary = mapCallableEarningsSummary({ ok: true });
    expect(summary.totalSalesPiastres).toBe(0);
    expect(summary.pendingPayoutPiastres).toBe(0);
    expect(summary.updatedAt.getTime()).toBe(0);
  });
});
