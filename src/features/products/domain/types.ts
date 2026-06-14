import type { AppCurrency } from "./currency";

/** Lifecycle state of a product as seen by buyers and vendors. */
export type ProductStatus =
  | "active"
  | "inactive"
  | "out_of_stock"
  | "archived";

/**
 * Source of truth for a Phase 3 product. Lives at top-level `products/{productId}`.
 *
 * Vendor isolation: every doc carries `vendorId` and is owned by the matching
 * Firebase Auth uid. Reads are public to signed-in users (marketplace browse).
 * Writes are restricted to the owning vendor via Firestore rules + BFF checks.
 */
export type Product = {
  productId: string;

  /** Owning vendor (auth uid). Never mutate after creation. */
  vendorId: string;
  /** Denormalized vendor store name for buyer-side card rendering. */
  vendorStoreName: string;

  name: string;
  nameAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  slug?: string | null;

  imageUrls: string[];
  primaryImageUrl: string;

  /** References to `store/items/categories/{categoryId}` documents. */
  categoryIds: string[];
  primaryCategoryId: string;
  /** Denormalized category names for filter chips without an extra read. */
  categoryNames: string[];

  /** Price in piastres (1 EGP = 100). Integer >= 0. */
  pricePiastres: number;
  /** Optional sale price in piastres. When set, must be < pricePiastres. */
  priceAfterDiscountPiastres?: number | null;
  currency: AppCurrency;

  stock: number;
  lowStockThreshold?: number | null;
  sku?: string | null;

  status: ProductStatus;
  /** Admin-granted trust mark. Defaults to false. */
  isHalo: boolean;

  tags?: string[];

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;

  analytics?: ProductAnalytics;
};

export type ProductAnalytics = {
  viewCount: number;
  soldCount: number;
  lastSoldAt: Date | null;
};

/** Payload for vendor-initiated product creation. Server stamps the rest. */
export type CreateProductInput = {
  name: string;
  nameAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  imageUrls: string[];
  primaryImageUrl: string;
  categoryIds: string[];
  primaryCategoryId: string;
  pricePiastres: number;
  priceAfterDiscountPiastres?: number | null;
  stock: number;
  lowStockThreshold?: number | null;
  sku?: string | null;
  status: ProductStatus;
  tags?: string[];
};

/** Partial update. Vendor cannot change `vendorId`, `vendorStoreName`, `isHalo`. */
export type UpdateProductInput = Partial<
  Omit<CreateProductInput, "imageUrls" | "primaryImageUrl">
> & {
  imageUrls?: string[];
  primaryImageUrl?: string;
};

/** Vendor-facing list filters for the products screen. */
export type ProductListFilter = {
  status?: ProductStatus | "any";
  query?: string;
  categoryId?: string;
  cursor?: string;
  pageSize?: number;
};

export type ProductListPage = {
  items: Product[];
  nextCursor: string | null;
};
