import { beforeEach, describe, expect, it, vi } from "vitest";

const callableImpl = vi.fn();
const httpsCallable = vi.fn<(functions: unknown, name: string) => typeof callableImpl>(
  () => callableImpl,
);

vi.mock("firebase/functions", () => ({
  httpsCallable: (functions: unknown, name: string) => httpsCallable(functions, name),
}));
vi.mock("@/lib/client-auth", () => ({ ensureClientAuth: async () => undefined }));
vi.mock("@/lib/firebase", () => ({ firebaseFunctions: {} }));

import {
  fetchVendorStatement,
  mapVendorStatement,
  STATEMENT_PERIOD_COUNT,
} from "@/features/financials/application/statement.api";

const period = {
  periodKey: "M2026-10",
  startMs: Date.UTC(2026, 8, 30, 21),
  endMs: Date.UTC(2026, 9, 31, 22) - 1,
  closed: true,
  openingPiastres: 0,
  salesPiastres: 11000,
  feesPiastres: 1000,
  refundsPiastres: -500,
  adjustmentsPiastres: 200,
  payoutsPiastres: -9000,
  closingPiastres: 700,
  payouts: [
    {
      entryId: "payout_M2026-09",
      periodKey: "M2026-09",
      cycle: "monthly",
      periodStartMs: 1,
      periodEndMs: 2,
      amountPiastres: 9000,
      transferReference: "TRX-001",
      paidAtMs: Date.UTC(2026, 9, 3, 10),
      createdAtMs: Date.UTC(2026, 9, 3, 11),
    },
  ],
};

beforeEach(() => {
  callableImpl.mockReset();
  httpsCallable.mockClear();
});

describe("mapVendorStatement", () => {
  it("maps the callable response with signed columns and payouts", () => {
    const statement = mapVendorStatement({
      ok: true,
      cycle: "weekly",
      currentBalancePiastres: -150,
      periods: [period],
    });
    expect(statement.cycle).toBe("weekly");
    expect(statement.currentBalancePiastres).toBe(-150);
    expect(statement.periods).toHaveLength(1);
    expect(statement.periods[0]).toMatchObject({
      periodKey: "M2026-10",
      closed: true,
      refundsPiastres: -500,
      payoutsPiastres: -9000,
      closingPiastres: 700,
    });
    expect(statement.periods[0].payouts[0]).toEqual({
      entryId: "payout_M2026-09",
      periodKey: "M2026-09",
      amountPiastres: 9000,
      transferReference: "TRX-001",
      paidAtMs: Date.UTC(2026, 9, 3, 10),
      createdAtMs: Date.UTC(2026, 9, 3, 11),
    });
  });

  it("defaults to monthly, zero balance and no periods for an empty response", () => {
    expect(
      mapVendorStatement({ ok: true, cycle: "monthly", currentBalancePiastres: 0, periods: [] }),
    ).toEqual({ cycle: "monthly", currentBalancePiastres: 0, periods: [] });
    expect(mapVendorStatement(null)).toEqual({
      cycle: "monthly",
      currentBalancePiastres: 0,
      periods: [],
    });
    expect(mapVendorStatement({ cycle: "daily" }).cycle).toBe("monthly");
  });

  it("drops periods without a key and coerces bad numbers to integers", () => {
    const statement = mapVendorStatement({
      periods: [
        { startMs: 1 },
        { ...period, salesPiastres: "12.7", payouts: [null, { amountPiastres: -40 }] },
      ],
    });
    expect(statement.periods).toHaveLength(1);
    expect(statement.periods[0].salesPiastres).toBe(12);
    expect(statement.periods[0].payouts).toHaveLength(1);
    expect(statement.periods[0].payouts[0].amountPiastres).toBe(40);
    expect(statement.periods[0].payouts[0].paidAtMs).toBeNull();
  });
});

describe("fetchVendorStatement", () => {
  it("calls the statement callable with the default period count", async () => {
    callableImpl.mockResolvedValue({
      data: { ok: true, cycle: "monthly", currentBalancePiastres: 0, periods: [period] },
    });
    const statement = await fetchVendorStatement();
    expect(httpsCallable).toHaveBeenCalledWith({}, "vendor_payouts-getMyVendorStatement");
    expect(callableImpl).toHaveBeenCalledWith({ periodCount: STATEMENT_PERIOD_COUNT });
    expect(statement.periods[0].periodKey).toBe("M2026-10");
  });

  it("propagates callable errors to the caller", async () => {
    callableImpl.mockRejectedValue(new Error("internal"));
    await expect(fetchVendorStatement(3)).rejects.toThrow();
    expect(callableImpl).toHaveBeenCalledWith({ periodCount: 3 });
  });
});
