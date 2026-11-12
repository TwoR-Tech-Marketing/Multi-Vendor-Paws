import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  callableFn: vi.fn(),
  httpsCallable: vi.fn(),
  vendorApiGet: vi.fn(),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: mocks.httpsCallable,
}));

vi.mock("@/lib/firebase", () => ({
  firebaseFunctions: {},
}));

vi.mock("@/lib/auth-client", () => ({
  vendorApiGet: mocks.vendorApiGet,
  vendorApiPost: vi.fn(),
  vendorApiPatch: vi.fn(),
  vendorApiDelete: vi.fn(),
}));

import {
  fetchProductCategoriesFromApi,
  fetchVendorProductsFromApi,
} from "@/features/products/application/products.api";

const FLAG = "NEXT_PUBLIC_VENDOR_PRODUCTS_DATA_SOURCE";

beforeEach(() => {
  mocks.callableFn.mockReset();
  mocks.httpsCallable.mockReset();
  mocks.vendorApiGet.mockReset();
  mocks.httpsCallable.mockReturnValue(mocks.callableFn);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("fetchVendorProductsFromApi", () => {
  it("callable mode forwards categoryId to listVendorProducts", async () => {
    vi.stubEnv(FLAG, "callable");
    mocks.callableFn.mockResolvedValue({
      data: {
        items: [{ productId: "p1", name: "Food", categoryIds: ["cat-1"] }],
        nextCursor: null,
      },
    });

    const result = await fetchVendorProductsFromApi({
      status: "active",
      categoryId: "cat-1",
      pageSize: 20,
    });

    expect(mocks.httpsCallable).toHaveBeenCalledWith(
      {},
      "vendor_products-listVendorProducts",
    );
    expect(mocks.callableFn).toHaveBeenCalledWith({
      status: "active",
      pageSize: 20,
      categoryId: "cat-1",
    });
    expect(result.items.map((item) => item.productId)).toEqual(["p1"]);
    expect(mocks.vendorApiGet).not.toHaveBeenCalled();
  });

  it("callable mode omits categoryId when the filter has none", async () => {
    vi.stubEnv(FLAG, "callable");
    mocks.callableFn.mockResolvedValue({ data: { items: [], nextCursor: null } });

    await fetchVendorProductsFromApi({ status: "any" });

    const payload = mocks.callableFn.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.categoryId).toBeUndefined();
  });

  it("default bff mode keeps the BFF query and never calls the callable", async () => {
    vi.stubEnv(FLAG, "");
    mocks.vendorApiGet.mockResolvedValue({ items: [], nextCursor: null, total: 0 });

    await fetchVendorProductsFromApi({ status: "active", categoryId: "cat-1" });

    expect(mocks.vendorApiGet).toHaveBeenCalledWith(
      "/api/vendor/products?status=active&categoryId=cat-1",
    );
    expect(mocks.httpsCallable).not.toHaveBeenCalled();
  });
});

describe("fetchProductCategoriesFromApi", () => {
  it("callable mode maps listVendorProductCategories items", async () => {
    vi.stubEnv(FLAG, "callable");
    mocks.callableFn.mockResolvedValue({
      data: {
        ok: true,
        items: [
          { categoryId: "cat-1", name: "Food", nameAr: "طعام", order: 1 },
          { categoryId: "cat-2", name: "", nameAr: null },
        ],
      },
    });

    const items = await fetchProductCategoriesFromApi();

    expect(mocks.httpsCallable).toHaveBeenCalledWith(
      {},
      "vendor_products-listVendorProductCategories",
    );
    expect(mocks.callableFn).toHaveBeenCalledWith({});
    expect(items).toEqual([
      { categoryId: "cat-1", name: "Food", nameAr: "طعام", order: 1, isActive: true },
      { categoryId: "cat-2", name: "cat-2", nameAr: null, order: 0, isActive: true },
    ]);
    expect(mocks.vendorApiGet).not.toHaveBeenCalled();
  });

  it("callable mode keeps includeInactive on the BFF", async () => {
    vi.stubEnv(FLAG, "callable");
    mocks.vendorApiGet.mockResolvedValue({ items: [] });

    await fetchProductCategoriesFromApi({ includeInactive: true });

    expect(mocks.vendorApiGet).toHaveBeenCalledWith(
      "/api/vendor/categories?includeInactive=true",
    );
    expect(mocks.httpsCallable).not.toHaveBeenCalled();
  });

  it("default bff mode loads categories from the BFF", async () => {
    vi.stubEnv(FLAG, "");
    const bffItems = [{ categoryId: "cat-1", name: "Food", isActive: true }];
    mocks.vendorApiGet.mockResolvedValue({ items: bffItems });

    const items = await fetchProductCategoriesFromApi();

    expect(mocks.vendorApiGet).toHaveBeenCalledWith("/api/vendor/categories");
    expect(items).toEqual(bffItems);
    expect(mocks.httpsCallable).not.toHaveBeenCalled();
  });
});
