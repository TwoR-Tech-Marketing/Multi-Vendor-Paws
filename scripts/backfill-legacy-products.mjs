/**
 * One-shot copy: legacy store catalog → top-level `products/` collection.
 *
 * Reads from: store/items/categories/{categoryId}/products/{productId}
 * Writes to:  products/{productId}
 * Does NOT modify any legacy documents.
 *
 * Usage:
 *   node scripts/backfill-legacy-products.mjs           # dry-run
 *   node scripts/backfill-legacy-products.mjs --execute # write to Firestore
 */

import { readFileSync } from "node:fs";

import { initializeApp, cert } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";

const PLATFORM_VENDOR_ID = "platformVendor";
const PLATFORM_VENDOR_STORE_NAME = "Tender Paws";
const PLACEHOLDER_IMAGE_PATH = "/product-image-placeholder.svg";
const BATCH_SIZE = 400;

const execute = process.argv.includes("--execute");

const sa = JSON.parse(
  readFileSync(new URL("../firebase-service-account.json", import.meta.url), "utf8"),
);

initializeApp({ credential: cert(sa) });
const db = getFirestore();

function toTimestamp(value) {
  if (!value) return FieldValue.serverTimestamp();
  if (value instanceof Timestamp) return value;
  if (value instanceof Date) return Timestamp.fromDate(value);
  if (typeof value?.toDate === "function") return value;
  if (typeof value?._seconds === "number") {
    return new Timestamp(value._seconds, value._nanoseconds ?? 0);
  }
  return FieldValue.serverTimestamp();
}

function egpToPiastres(egp) {
  if (!Number.isFinite(egp) || egp < 0) return 0;
  return Math.round(egp * 100);
}

function resolveStatus(legacy) {
  const stock = Number.isInteger(legacy.quantity) ? legacy.quantity : Number(legacy.quantity ?? 0);
  if (legacy.isActive === false) return "inactive";
  if (stock <= 0) return "out_of_stock";
  return "active";
}

function resolveCategoryIds(legacy, fallbackCategoryId) {
  if (Array.isArray(legacy.categories) && legacy.categories.length > 0) {
    return legacy.categories.filter((id) => typeof id === "string" && id.trim());
  }
  if (typeof fallbackCategoryId === "string" && fallbackCategoryId.trim()) {
    return [fallbackCategoryId];
  }
  return [];
}

function resolveCategoryNames(legacy, categoryNameById, categoryIds) {
  if (Array.isArray(legacy.categoryNames) && legacy.categoryNames.length > 0) {
    return legacy.categoryNames;
  }
  return categoryIds
    .map((id) => categoryNameById.get(id))
    .filter((name) => typeof name === "string" && name.trim());
}

function placeholderImageUrl() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://pets-acd3f.web.app";
  return new URL(PLACEHOLDER_IMAGE_PATH, base).href;
}

function legacyToPhase3Product(legacy, productId, categoryNameById, fallbackCategoryId) {
  const categoryIds = resolveCategoryIds(legacy, fallbackCategoryId);
  if (categoryIds.length === 0) {
    throw new Error("missing categoryIds");
  }

  const primaryCategoryId =
    (typeof legacy.primaryCategoryId === "string" && legacy.primaryCategoryId) ||
    categoryIds[0];
  const categoryNames = resolveCategoryNames(legacy, categoryNameById, categoryIds);

  const imageUrl =
    (typeof legacy.imageUrl === "string" && legacy.imageUrl.trim()) ||
    (Array.isArray(legacy.images) && typeof legacy.images[0] === "string"
      ? legacy.images[0]
      : "") ||
    placeholderImageUrl();

  const name = typeof legacy.name === "string" ? legacy.name.trim() : "";
  if (name.length < 2) {
    throw new Error("name too short");
  }

  const price =
    typeof legacy.price === "number"
      ? legacy.price
      : Number(legacy.price ?? NaN);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("invalid price");
  }

  const stock = Number.isInteger(legacy.quantity)
    ? legacy.quantity
    : Math.max(0, Math.floor(Number(legacy.quantity ?? 0)));

  const salePrice =
    legacy.priceAfterDiscount == null
      ? null
      : typeof legacy.priceAfterDiscount === "number"
        ? legacy.priceAfterDiscount
        : Number(legacy.priceAfterDiscount);

  const pricePiastres = egpToPiastres(price);
  let priceAfterDiscountPiastres = null;
  if (salePrice != null && Number.isFinite(salePrice) && salePrice >= 0) {
    priceAfterDiscountPiastres = egpToPiastres(salePrice);
    if (priceAfterDiscountPiastres >= pricePiastres) {
      priceAfterDiscountPiastres = null;
    }
  }

  return {
    productId,
    vendorId: PLATFORM_VENDOR_ID,
    vendorStoreName: PLATFORM_VENDOR_STORE_NAME,
    name,
    nameAr: null,
    description:
      typeof legacy.description === "string" && legacy.description.trim()
        ? legacy.description.trim()
        : null,
    descriptionAr: null,
    slug: null,
    imageUrls: [imageUrl],
    primaryImageUrl: imageUrl,
    categoryIds,
    primaryCategoryId,
    categoryNames: categoryNames.length > 0 ? categoryNames : [primaryCategoryId],
    pricePiastres,
    priceAfterDiscountPiastres,
    currency: "EGP",
    stock,
    lowStockThreshold: null,
    sku: typeof legacy.sku === "string" && legacy.sku.trim() ? legacy.sku.trim() : null,
    status: resolveStatus({ ...legacy, quantity: stock }),
    isHalo: false,
    tags: [],
    createdBy: PLATFORM_VENDOR_ID,
    updatedBy: PLATFORM_VENDOR_ID,
    createdAt: toTimestamp(legacy.createdAt),
    updatedAt: toTimestamp(legacy.updatedAt ?? legacy.createdAt),
  };
}

async function ensurePlatformVendorDoc() {
  const ref = db.collection("vendors").doc(PLATFORM_VENDOR_ID);
  const snap = await ref.get();
  if (snap.exists) return;

  const payload = {
    storeName: PLATFORM_VENDOR_STORE_NAME,
    storeDescription: "Official Tender Paws platform catalog",
    status: "active",
    approvalStatus: "approved",
    ownerUid: PLATFORM_VENDOR_ID,
    email: "store@tenderpaws.com",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (execute) {
    await ref.set(payload, { merge: true });
    console.log("Created vendors/platformVendor");
  } else {
    console.log("[dry-run] Would create vendors/platformVendor");
  }
}

async function loadCategoryNameMap() {
  const snap = await db.collection("store").doc("items").collection("categories").get();
  const map = new Map();
  for (const doc of snap.docs) {
    const name = doc.data().name;
    if (typeof name === "string") map.set(doc.id, name);
  }
  return map;
}

async function collectLegacyProducts(categoryNameById) {
  const categories = await db.collection("store").doc("items").collection("categories").get();
  const seen = new Set();
  const items = [];

  for (const category of categories.docs) {
    const products = await category.ref.collection("products").get();
    for (const productDoc of products.docs) {
      if (seen.has(productDoc.id)) continue;
      seen.add(productDoc.id);
      items.push({
        productId: productDoc.id,
        legacy: productDoc.data(),
        fallbackCategoryId: category.id,
      });
    }
  }

  return items;
}

async function writeBatch(products) {
  let batch = db.batch();
  let ops = 0;
  let written = 0;

  for (const product of products) {
    const ref = db.collection("products").doc(product.productId);
    batch.set(ref, product, { merge: false });
    ops += 1;
    written += 1;

    if (ops >= BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  return written;
}

async function main() {
  console.log(execute ? "=== EXECUTE MODE ===" : "=== DRY RUN (pass --execute to write) ===");

  await ensurePlatformVendorDoc();
  const categoryNameById = await loadCategoryNameMap();
  const legacyItems = await collectLegacyProducts(categoryNameById);

  console.log(`Legacy products found: ${legacyItems.length}`);

  const existingSnap = await db.collection("products").get();
  const existingIds = new Set(existingSnap.docs.map((doc) => doc.id));

  const toWrite = [];
  const skippedExisting = [];
  const failed = [];

  for (const item of legacyItems) {
    if (existingIds.has(item.productId)) {
      skippedExisting.push(item.productId);
      continue;
    }

    try {
      toWrite.push(
        legacyToPhase3Product(
          item.legacy,
          item.productId,
          categoryNameById,
          item.fallbackCategoryId,
        ),
      );
    } catch (error) {
      failed.push({
        productId: item.productId,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(`Already in products/: ${skippedExisting.length}`);
  console.log(`Ready to copy: ${toWrite.length}`);
  console.log(`Failed to map: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nFailed samples (up to 10):");
    for (const entry of failed.slice(0, 10)) {
      console.log(`  ${entry.productId}: ${entry.reason}`);
    }
  }

  if (toWrite.length > 0) {
    console.log("\nSample mapped product:");
    console.log(JSON.stringify(toWrite[0], null, 2));
  }

  if (!execute) {
    console.log("\nNo writes performed. Re-run with --execute to copy to products/.");
    return;
  }

  const written = await writeBatch(toWrite);
  const finalCount = await db.collection("products").count().get();

  console.log(`\nCopied ${written} products to products/.`);
  console.log(`products/ total count now: ${finalCount.data().count}`);
  console.log("Legacy store/ documents were not modified.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
