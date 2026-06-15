import type { Product, ProductListFilter, ProductStatus } from "@/features/products/domain/types";
import type { CreateProductPayload, UpdateProductPayload } from "@/features/products/domain/schemas";
import {
  vendorApiDelete,
  vendorApiGet,
  vendorApiPatch,
  vendorApiPost,
} from "@/lib/auth-client";

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

export async function fetchProductCategoriesFromApi(options?: {
  includeInactive?: boolean;
}): Promise<ProductCategoryOption[]> {
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

export async function fetchVendorProductsFromApi(
  filter: ProductListFilter = {},
): Promise<{ items: Product[]; nextCursor: string | null; total: number }> {
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
  const data = await vendorApiGet<ProductResponse>(`/api/vendor/products/${productId}`);
  return deserializeProduct(data.product);
}

export async function createVendorProductFromApi(
  payload: CreateProductPayload,
): Promise<Product> {
  const data = await vendorApiPost<ProductResponse>("/api/vendor/products", payload);
  return deserializeProduct(data.product);
}

export async function updateVendorProductFromApi(
  productId: string,
  payload: UpdateProductPayload,
): Promise<Product> {
  const data = await vendorApiPatch<ProductResponse>(
    `/api/vendor/products/${productId}`,
    payload,
  );
  return deserializeProduct(data.product);
}

export async function archiveVendorProductFromApi(productId: string): Promise<void> {
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
