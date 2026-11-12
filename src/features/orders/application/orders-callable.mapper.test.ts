import { describe, expect, it } from "vitest";

import {
  buildListCallableRequest,
  normalizeCallableOrder,
} from "@/features/orders/application/orders-callable.mapper";

const PLACED_MS = Date.UTC(2026, 10, 10, 21, 59, 0);
const UPDATED_MS = Date.UTC(2026, 10, 11, 8, 30, 0);

function baseOrder(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    vendorOrderId: "vo-1",
    orderId: "o-1",
    vendorId: "vendor-1",
    status: "confirmed",
    holdState: null,
    heldReason: null,
    totalPiastres: 12500,
    ...overrides,
  };
}

describe("normalizeCallableOrder", () => {
  it("prefers placedAtMs and updatedAtMs over the raw Timestamp JSON", () => {
    const order = normalizeCallableOrder(
      baseOrder({
        placedAt: { _seconds: 1, _nanoseconds: 0 },
        updatedAt: { _seconds: 2, _nanoseconds: 0 },
        placedAtMs: PLACED_MS,
        updatedAtMs: UPDATED_MS,
      }),
    );
    expect(order.placedAt).toBe(new Date(PLACED_MS).toISOString());
    expect(order.updatedAt).toBe(new Date(UPDATED_MS).toISOString());
    expect(order.totalPiastres).toBe(12500);
  });

  it("falls back to the Timestamp JSON form when millis are missing or null", () => {
    const order = normalizeCallableOrder(
      baseOrder({
        placedAt: { _seconds: PLACED_MS / 1000, _nanoseconds: 0 },
        placedAtMs: null,
        updatedAt: "2026-11-11T08:30:00.000Z",
      }),
    );
    expect(order.placedAt).toBe(new Date(PLACED_MS).toISOString());
    expect(order.updatedAt).toBe("2026-11-11T08:30:00.000Z");
  });

  it("uses history atMs and maps byRole into by", () => {
    const order = normalizeCallableOrder(
      baseOrder({
        statusHistory: [
          { status: "pending", at: "ignored", atMs: PLACED_MS, byRole: "system", note: null },
          { status: "confirmed", at: "ignored", atMs: UPDATED_MS, byRole: "vendor", note: "Ready" },
          { status: "shipped", at: "ignored", atMs: UPDATED_MS + 1000, byRole: "admin" },
        ],
      }),
    );
    expect(order.statusHistory).toEqual([
      { status: "pending", at: new Date(PLACED_MS).toISOString(), by: "system", note: null },
      { status: "confirmed", at: new Date(UPDATED_MS).toISOString(), by: "vendor", note: "Ready" },
      {
        status: "shipped",
        at: new Date(UPDATED_MS + 1000).toISOString(),
        by: "admin",
        note: null,
      },
    ]);
  });

  it("keeps an older by value and ISO at when byRole and atMs are absent", () => {
    const order = normalizeCallableOrder(
      baseOrder({
        statusHistory: [
          { status: "pending", at: "2026-11-10T21:59:00.000Z", by: "system", note: null },
        ],
      }),
    );
    expect(order.statusHistory).toEqual([
      { status: "pending", at: "2026-11-10T21:59:00.000Z", by: "system", note: null },
    ]);
  });

  it("returns an empty history when the field is missing or not an array", () => {
    expect(normalizeCallableOrder(baseOrder()).statusHistory).toEqual([]);
    expect(normalizeCallableOrder(baseOrder({ statusHistory: null })).statusHistory).toEqual([]);
  });

  it("normalizes hold fields", () => {
    const held = normalizeCallableOrder(baseOrder({ holdState: "held", heldReason: "Review" }));
    expect(held.holdState).toBe("held");
    expect(held.heldReason).toBe("Review");
    const other = normalizeCallableOrder(baseOrder({ holdState: "x", heldReason: undefined }));
    expect(other.holdState).toBeNull();
    expect(other.heldReason).toBeNull();
  });
});

describe("buildListCallableRequest", () => {
  it("sends the same payload as before when no date filter is set", () => {
    expect(buildListCallableRequest({ status: "pending", pageSize: 20, cursor: "c1" })).toEqual({
      status: "pending",
      pageSize: 20,
      cursor: "c1",
    });
    expect(buildListCallableRequest({ datePreset: "any" })).not.toHaveProperty("datePreset");
  });

  it("forwards a date preset without custom dates", () => {
    const request = buildListCallableRequest({
      datePreset: "last7",
      dateFrom: "2026-11-01",
      dateTo: "2026-11-05",
    });
    expect(request.datePreset).toBe("last7");
    expect(request).not.toHaveProperty("dateFrom");
    expect(request).not.toHaveProperty("dateTo");
  });

  it("forwards dateFrom and dateTo for a custom range", () => {
    expect(
      buildListCallableRequest({
        datePreset: "custom",
        dateFrom: "2026-11-01",
        dateTo: "2026-11-05",
      }),
    ).toMatchObject({ datePreset: "custom", dateFrom: "2026-11-01", dateTo: "2026-11-05" });
  });

  it("forwards a single-sided custom range", () => {
    const request = buildListCallableRequest({ datePreset: "custom", dateFrom: "2026-11-01" });
    expect(request).toMatchObject({ datePreset: "custom", dateFrom: "2026-11-01" });
    expect(request).not.toHaveProperty("dateTo");
  });

  it("does not forward the search query", () => {
    expect(buildListCallableRequest({ query: "abc" })).not.toHaveProperty("query");
  });
});
