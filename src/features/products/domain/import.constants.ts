/** Maximum products per Excel import batch. */
export const PRODUCT_IMPORT_MAX_ROWS = 100;

/** Relative path for products imported without image URLs. */
export const PRODUCT_IMPORT_PLACEHOLDER_PATH = "/product-image-placeholder.svg";

export function getProductImportPlaceholderUrl(origin: string): string {
  return new URL(PRODUCT_IMPORT_PLACEHOLDER_PATH, origin).href;
}
