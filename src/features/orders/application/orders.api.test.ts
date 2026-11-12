import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  source: "bff" as "bff" | "callable",
  vendorApiGet: vi.fn(),
  callable: vi.fn(),
  httpsCallable: vi.fn(),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: (...args: unknown[]) => {
    mocks.httpsCallable(...args);
    return mocks.callable;
  },
}));
vi.mock("@/lib/firebase", () => ({ firebaseFunctions: {} }));
vi.mock("@/lib/auth-client", () => ({
  vendorApiGet: mocks.vendorApiGet,
  vendorApiPatch: vi.fn(),
}));
vi.mock("@/lib/vendor-data-source", () => ({
  getOrdersDataSource: () => mocks.source,
}));

import { fetchVendorOrdersFromApi } from "@/features/orders/application/orders.api";

const filter = {
  status: "pending" as const,
  query: "abc",
  datePreset: "custom" as const,
  dateFrom: "2026-11-01",
  dateTo: "2026-11-05",
  pageSize: 20,
};

describe("fetchVendorOrdersFromApi", () => {
  beforeEach(() => {
    mocks.vendorApiGet.mockReset();
    mocks.callable.mockReset();
    mocks.httpsCallable.mockReset();
  });

  it("keeps the default bff path and its query string", async () => {
    mocks.source = "bff";
    mocks.vendorApiGet.mockResolvedValue({ items: [], nextCursor: null, total: 0 });

    await fetchVendorOrdersFromApi(filter);

    expect(mocks.callable).not.toHaveBeenCalled();
    expect(mocks.vendorApiGet).toHaveBeenCalledWith(
      "/api/vendor/orders?status=pending&q=abc&datePreset=custom&dateFrom=2026-11-01&dateTo=2026-11-05&pageSize=20",
    );
  });

  it("forwards date params to the callable and normalizes items", async () => {
    mocks.source = "callable";
    const placedAtMs = Date.UTC(2026, 10, 2, 10, 0, 0);
    mocks.callable.mockResolvedValue({
      data: {
        items: [
          {
            vendorOrderId: "vo-1",
            vendorId: "vendor-1",
            status: "pending",
            placedAt: { _seconds: 0, _nanoseconds: 0 },
            placedAtMs,
            updatedAtMs: placedAtMs,
          },
        ],
        nextCursor: null,
        total: 1,
        dateRange: { fromMs: 1, toMs: null },
      },
    });

    const page = await fetchVendorOrdersFromApi(filter);

    expect(mocks.httpsCallable).toHaveBeenCalledWith({}, "vendor_orders-listVendorOrders");
    expect(mocks.callable).toHaveBeenCalledWith({
      status: "pending",
      pageSize: 20,
      cursor: undefined,
      datePreset: "custom",
      dateFrom: "2026-11-01",
      dateTo: "2026-11-05",
    });
    expect(mocks.vendorApiGet).not.toHaveBeenCalled();
    expect(page.total).toBe(1);
    expect(page.items[0].placedAt.getTime()).toBe(placedAtMs);
    expect(page.items[0].statusHistory).toEqual([]);
  });
});
