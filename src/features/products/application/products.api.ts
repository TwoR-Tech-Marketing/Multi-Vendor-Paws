import type { Product, ProductListFilter, ProductStatus } from "@/features/products/domain/types";
import type { CreateProductPayload, UpdateProductPayload } from "@/features/products/domain/schemas";
import {
  vendorApiDelete,
  vendorApiGet,
  vendorApiPatch,
  vendorApiPost,
} from "@/lib/auth-client";
import { invokeCallable } from "@/lib/callable";
import { getProductsDataSource } from "@/lib/vendor-data-source";

export type ProductCategoryOption = {
  categoryId: string;
  name: string;
  nameAr?: string | null;
  order?: number;
  isActive: boolean;
};

type SerializedProduct = Omit<Product, "createdAt" | "updatedAt" | "analytics"> & {
  createdAt: string;
  updatedAt: string;
  analytics?: {
    viewCount: number;
    soldCount: number;
    lastSoldAt: string | null;
  };
};

type ProductListResponse = {
  items: SerializedProduct[];
  nextCursor: string | null;
  total: number;
};

type ProductResponse = {
  product: SerializedProduct;
};

type CategoriesResponse = {
  items: ProductCategoryOption[];
};

function parseDate(value: string): Date {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function deserializeProduct(product: SerializedProduct): Product {
  return {
    ...product,
    createdAt: parseDate(product.createdAt),
    updatedAt: parseDate(product.updatedAt),
    analytics: product.analytics
      ? {
          viewCount: product.analytics.viewCount,
          soldCount: product.analytics.soldCount,
          lastSoldAt: product.analytics.lastSoldAt
            ? parseDate(product.analytics.lastSoldAt)
            : null,
        }
      : undefined,
  };
}

function buildListQuery(filter: ProductListFilter): string {
  const params = new URLSearchParams();
  if (filter.status && filter.status !== "any") {
    params.set("status", filter.status);
  }
  if (filter.categoryId) {
    params.set("categoryId", filter.categoryId);
  }
  if (filter.query?.trim()) {
    params.set("q", filter.query.trim());
  }
  if (filter.cursor) {
    params.set("cursor", filter.cursor);
  }
  if (filter.pageSize) {
    params.set("pageSize", String(filter.pageSize));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function callableCategoryToOption(raw: Record<string, unknown>): ProductCategoryOption {
  const categoryId = String(raw.categoryId || "");
  const order = Number(raw.order);
  return {
    categoryId,
    name: String(raw.name || categoryId),
    nameAr: typeof raw.nameAr === "string" && raw.nameAr ? raw.nameAr : null,
    order: Number.isFinite(order) ? order : 0,
    isActive: true,
  };
}

export async function fetchProductCategoriesFromApi(options?: {
  includeInactive?: boolean;
}): Promise<ProductCategoryOption[]> {
  // The callable returns active categories only; the category admin screen
  // (includeInactive) stays on the BFF.
  if (getProductsDataSource() === "callable" && !options?.includeInactive) {
    const result = await invokeCallable("vendor_products-listVendorProductCategories", {});
    const data = result as { items?: Record<string, unknown>[] };
    return (data.items ?? []).map(callableCategoryToOption);
  }

  const params = new URLSearchParams();
  if (options?.includeInactive) {
    params.set("includeInactive", "true");
  }
  const query = params.toString();
  const data = await vendorApiGet<CategoriesResponse>(
    `/api/vendor/categories${query ? `?${query}` : ""}`,
  );
  return data.items;
}

function callableProductToSerialized(raw: Record<string, unknown>): SerializedProduct {
  const now = new Date().toISOString();
  const imageUrls = Array.isArray(raw.imageUrls) ? (raw.imageUrls as string[]) : [];
  return {
    productId: String(raw.productId || ""),
    vendorId: String(raw.vendorId || ""),
    vendorStoreName: String(raw.vendorStoreName || ""),
    name: String(raw.name || ""),
    nameAr: (raw.nameAr as string | null) ?? null,
    description: (raw.description as string | null) ?? null,
    descriptionAr: (raw.descriptionAr as string | null) ?? null,
    slug: null,
    imageUrls,
    primaryImageUrl: (raw.primaryImageUrl as string) || imageUrls[0] || "",
    categoryIds: Array.isArray(raw.categoryIds) ? (raw.categoryIds as string[]) : [],
    primaryCategoryId: String(raw.primaryCategoryId || ""),
    categoryNames: [],
    pricePiastres: Number(raw.pricePiastres) || 0,
    priceAfterDiscountPiastres:
      raw.priceAfterDiscountPiastres == null
        ? null
        : Number(raw.priceAfterDiscountPiastres),
    currency: "EGP",
    stock: Number(raw.stock) || 0,
    lowStockThreshold: null,
    sku: (raw.sku as string | null) ?? null,
    status: (raw.status as ProductStatus) || "inactive",
    isHalo: raw.isHalo === true,
    tags: [],
    createdBy: "",
    updatedBy: "",
    createdAt: now,
    updatedAt: now,
  };
}

export async function fetchVendorProductsFromApi(
  filter: ProductListFilter = {},
): Promise<{ items: Product[]; nextCursor: string | null; total: number }> {
  if (getProductsDataSource() === "callable") {
    const result = await invokeCallable("vendor_products-listVendorProducts", {
      status: filter.status,
      pageSize: filter.pageSize,
      categoryId: filter.categoryId || undefined,
    });
    const data = result as {
      items: Record<string, unknown>[];
      nextCursor: string | null;
    };
    const items = data.items.map((item) =>
      deserializeProduct(callableProductToSerialized(item)),
    );
    return { items, nextCursor: data.nextCursor, total: items.length };
  }

  const data = await vendorApiGet<ProductListResponse>(
    `/api/vendor/products${buildListQuery(filter)}`,
  );

  return {
    items: data.items.map(deserializeProduct),
    nextCursor: data.nextCursor,
    total: data.total,
  };
}

export async function fetchVendorProductFromApi(productId: string): Promise<Product> {
  if (getProductsDataSource() === "callable") {
    const result = await invokeCallable("vendor_products-getVendorProduct", { productId });
    const data = result as { product: Record<string, unknown> };
    return deserializeProduct(callableProductToSerialized(data.product));
  }

  const data = await vendorApiGet<ProductResponse>(`/api/vendor/products/${productId}`);
  return deserializeProduct(data.product);
}

export async function createVendorProductFromApi(
  payload: CreateProductPayload,
): Promise<Product> {
  if (getProductsDataSource() === "callable") {
    const result = await invokeCallable("vendor_products-createVendorProduct", payload);
    const data = result as { product: Record<string, unknown> };
    return deserializeProduct(callableProductToSerialized(data.product));
  }

  const data = await vendorApiPost<ProductResponse>("/api/vendor/products", payload);
  return deserializeProduct(data.product);
}

export async function updateVendorProductFromApi(
  productId: string,
  payload: UpdateProductPayload,
): Promise<Product> {
  if (getProductsDataSource() === "callable") {
    const result = await invokeCallable("vendor_products-updateVendorProduct", {
      productId,
      ...payload,
    });
    const data = result as { product: Record<string, unknown> };
    return deserializeProduct(callableProductToSerialized(data.product));
  }

  const data = await vendorApiPatch<ProductResponse>(
    `/api/vendor/products/${productId}`,
    payload,
  );
  return deserializeProduct(data.product);
}

export async function archiveVendorProductFromApi(productId: string): Promise<void> {
  if (getProductsDataSource() === "callable") {
    await invokeCallable("vendor_products-archiveVendorProduct", { productId });
    return;
  }

  await vendorApiDelete<{ success: true }>(`/api/vendor/products/${productId}`);
}

export type ImportProductsResult = {
  createdCount: number;
  failedCount: number;
};

export async function importVendorProductsFromApi(
  products: CreateProductPayload[],
): Promise<ImportProductsResult> {
  const data = await vendorApiPost<ImportProductsResult>("/api/vendor/products/import", {
    products,
  });
  return {
    createdCount: data.createdCount,
    failedCount: data.failedCount,
  };
}

export async function updateProductCategoryStatusFromApi(
  categoryId: string,
  isActive: boolean,
): Promise<ProductCategoryOption> {
  const data = await vendorApiPatch<{ category: ProductCategoryOption }>(
    `/api/vendor/categories/${categoryId}`,
    { isActive },
  );
  return data.category;
}

export type VendorProductStatusFilter = ProductStatus | "any";
