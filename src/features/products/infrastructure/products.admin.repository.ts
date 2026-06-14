import "server-only";

import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase-admin/firestore";

import { APP_CURRENCY } from "@/features/products/domain/currency";
import type {
  CreateProductInput,
  Product,
  ProductListFilter,
  ProductListPage,
  ProductStatus,
  UpdateProductInput,
} from "@/features/products/domain/types";
import { getAdminFirestore } from "@/lib/firebase-admin";

const PRODUCTS_COLLECTION = "products";
const INVENTORY_LOG_SUBCOLLECTION = "inventoryLog";
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

type ProductDoc = {
  productId?: string;
  vendorId: string;
  vendorStoreName: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  slug?: string | null;
  imageUrls: string[];
  primaryImageUrl: string;
  categoryIds: string[];
  primaryCategoryId: string;
  categoryNames: string[];
  pricePiastres: number;
  priceAfterDiscountPiastres?: number | null;
  currency: string;
  stock: number;
  lowStockThreshold?: number | null;
  sku?: string | null;
  status: ProductStatus;
  isHalo: boolean;
  tags?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy: string;
  updatedBy: string;
  analytics?: {
    viewCount?: number;
    soldCount?: number;
    lastSoldAt?: Timestamp | null;
  };
};

function productsCollection() {
  return getAdminFirestore().collection(PRODUCTS_COLLECTION);
}

function toProduct(snap: DocumentSnapshot<DocumentData>): Product {
  const data = snap.data() as ProductDoc;
  return {
    productId: snap.id,
    vendorId: data.vendorId,
    vendorStoreName: data.vendorStoreName,
    name: data.name,
    nameAr: data.nameAr ?? null,
    description: data.description ?? null,
    descriptionAr: data.descriptionAr ?? null,
    slug: data.slug ?? null,
    imageUrls: data.imageUrls ?? [],
    primaryImageUrl: data.primaryImageUrl,
    categoryIds: data.categoryIds ?? [],
    primaryCategoryId: data.primaryCategoryId,
    categoryNames: data.categoryNames ?? [],
    pricePiastres: data.pricePiastres,
    priceAfterDiscountPiastres: data.priceAfterDiscountPiastres ?? null,
    currency: APP_CURRENCY,
    stock: data.stock,
    lowStockThreshold: data.lowStockThreshold ?? null,
    sku: data.sku ?? null,
    status: data.status,
    isHalo: data.isHalo === true,
    tags: data.tags ?? [],
    createdAt: data.createdAt?.toDate() ?? new Date(0),
    updatedAt: data.updatedAt?.toDate() ?? new Date(0),
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
    analytics: data.analytics
      ? {
          viewCount: data.analytics.viewCount ?? 0,
          soldCount: data.analytics.soldCount ?? 0,
          lastSoldAt: data.analytics.lastSoldAt?.toDate() ?? null,
        }
      : undefined,
  };
}

function clampPageSize(pageSize: number | undefined): number {
  if (!pageSize || pageSize <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(pageSize, MAX_PAGE_SIZE);
}

export type VendorContext = {
  vendorId: string;
  vendorStoreName: string;
  actorUid: string;
};

export async function listVendorProducts(
  vendorId: string,
  filter: ProductListFilter,
): Promise<ProductListPage> {
  const pageSize = clampPageSize(filter.pageSize);

  // Single-field query only — works without deploying composite indexes.
  // Filter, sort, and paginate in memory (typical vendor catalogs are small).
  const snap = await productsCollection().where("vendorId", "==", vendorId).get();

  let items = snap.docs.map(toProduct);

  if (filter.status && filter.status !== "any") {
    items = items.filter((product) => product.status === filter.status);
  }

  if (filter.categoryId) {
    items = items.filter((product) =>
      product.categoryIds.includes(filter.categoryId!),
    );
  }

  items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  if (filter.cursor) {
    const cursorIndex = items.findIndex(
      (product) => product.productId === filter.cursor,
    );
    if (cursorIndex >= 0) {
      items = items.slice(cursorIndex + 1);
    }
  }

  const hasMore = items.length > pageSize;
  const pageItems = items.slice(0, pageSize);
  const nextCursor = hasMore
    ? (pageItems[pageItems.length - 1]?.productId ?? null)
    : null;

  return { items: pageItems, nextCursor };
}

export async function getVendorProduct(
  vendorId: string,
  productId: string,
): Promise<Product | null> {
  const product = await getProductById(productId);
  if (!product || product.vendorId !== vendorId) return null;
  return product;
}

export async function getProductById(productId: string): Promise<Product | null> {
  const snap = await productsCollection().doc(productId).get();
  if (!snap.exists) return null;
  return toProduct(snap);
}

export async function createVendorProduct(
  vendor: VendorContext,
  input: CreateProductInput,
  categoryNames: string[],
): Promise<Product> {
  const docRef = productsCollection().doc();
  const now = FieldValue.serverTimestamp();

  const payload: Omit<ProductDoc, "createdAt" | "updatedAt"> & {
    createdAt: FieldValue;
    updatedAt: FieldValue;
  } = {
    productId: docRef.id,
    vendorId: vendor.vendorId,
    vendorStoreName: vendor.vendorStoreName,
    name: input.name,
    nameAr: input.nameAr ?? null,
    description: input.description ?? null,
    descriptionAr: input.descriptionAr ?? null,
    slug: null,
    imageUrls: input.imageUrls,
    primaryImageUrl: input.primaryImageUrl,
    categoryIds: input.categoryIds,
    primaryCategoryId: input.primaryCategoryId,
    categoryNames,
    pricePiastres: input.pricePiastres,
    priceAfterDiscountPiastres: input.priceAfterDiscountPiastres ?? null,
    currency: APP_CURRENCY,
    stock: input.stock,
    lowStockThreshold: input.lowStockThreshold ?? null,
    sku: input.sku ?? null,
    status: input.status,
    isHalo: false,
    tags: input.tags ?? [],
    createdBy: vendor.actorUid,
    updatedBy: vendor.actorUid,
    createdAt: now,
    updatedAt: now,
  };

  await docRef.set(payload);
  const written = await docRef.get();
  return toProduct(written);
}

export async function updateVendorProduct(
  vendor: VendorContext,
  productId: string,
  input: UpdateProductInput,
  categoryNames: string[] | undefined,
): Promise<Product | null> {
  const docRef = productsCollection().doc(productId);

  const updatedSnap = await getAdminFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists) return null;
    const current = snap.data() as ProductDoc;
    if (current.vendorId !== vendor.vendorId) return null;

    const update: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: vendor.actorUid,
    };

    if (input.name !== undefined) update.name = input.name;
    if (input.nameAr !== undefined) update.nameAr = input.nameAr;
    if (input.description !== undefined)
      update.description = input.description;
    if (input.descriptionAr !== undefined)
      update.descriptionAr = input.descriptionAr;
    if (input.imageUrls !== undefined) update.imageUrls = input.imageUrls;
    if (input.primaryImageUrl !== undefined)
      update.primaryImageUrl = input.primaryImageUrl;
    if (input.categoryIds !== undefined) update.categoryIds = input.categoryIds;
    if (input.primaryCategoryId !== undefined)
      update.primaryCategoryId = input.primaryCategoryId;
    if (categoryNames !== undefined) update.categoryNames = categoryNames;
    if (input.pricePiastres !== undefined)
      update.pricePiastres = input.pricePiastres;
    if (input.priceAfterDiscountPiastres !== undefined)
      update.priceAfterDiscountPiastres = input.priceAfterDiscountPiastres;
    if (input.stock !== undefined) update.stock = input.stock;
    if (input.lowStockThreshold !== undefined)
      update.lowStockThreshold = input.lowStockThreshold;
    if (input.sku !== undefined) update.sku = input.sku;
    if (input.status !== undefined) update.status = input.status;
    if (input.tags !== undefined) update.tags = input.tags;

    tx.update(docRef, update);
    return docRef;
  });

  if (!updatedSnap) return null;

  const fresh = await docRef.get();
  return toProduct(fresh);
}

export async function archiveVendorProduct(
  vendor: VendorContext,
  productId: string,
): Promise<boolean> {
  const docRef = productsCollection().doc(productId);

  return await getAdminFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists) return false;
    const current = snap.data() as ProductDoc;
    if (current.vendorId !== vendor.vendorId) return false;

    tx.update(docRef, {
      status: "archived" satisfies ProductStatus,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: vendor.actorUid,
    });
    return true;
  });
}

export type InventoryLogReason =
  | "set"
  | "increment"
  | "decrement"
  | "order"
  | "return";

export async function adjustVendorProductStock(
  vendor: VendorContext,
  productId: string,
  newStock: number,
  reason: InventoryLogReason,
  note?: string,
): Promise<Product | null> {
  const docRef = productsCollection().doc(productId);
  const logRef = docRef.collection(INVENTORY_LOG_SUBCOLLECTION).doc();

  const ok = await getAdminFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists) return false;
    const current = snap.data() as ProductDoc;
    if (current.vendorId !== vendor.vendorId) return false;

    const previousStock = current.stock;
    tx.update(docRef, {
      stock: newStock,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: vendor.actorUid,
    });

    tx.set(logRef, {
      type: reason,
      delta: newStock - previousStock,
      previousStock,
      newStock,
      reason: note ?? null,
      actorId: vendor.actorUid,
      actorRole: "vendor",
      at: FieldValue.serverTimestamp(),
    });

    return true;
  });

  if (!ok) return null;
  const fresh = await docRef.get();
  return toProduct(fresh);
}
