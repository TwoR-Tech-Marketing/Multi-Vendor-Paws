/**
 * Portal data-source flags (S1.4 / S1.5). Default BFF so portal can ship
 * before or after shared Cloud Functions.
 *
 * VENDOR_PRODUCTS_DATA_SOURCE=bff|callable
 * VENDOR_ORDERS_DATA_SOURCE=bff|callable
 */

export type VendorDataSource = "bff" | "callable";

function readSource(envName: string): VendorDataSource {
  const raw = (process.env[envName] || "bff").trim().toLowerCase();
  return raw === "callable" ? "callable" : "bff";
}

export function getProductsDataSource(): VendorDataSource {
  return readSource("NEXT_PUBLIC_VENDOR_PRODUCTS_DATA_SOURCE");
}

export function getOrdersDataSource(): VendorDataSource {
  return readSource("NEXT_PUBLIC_VENDOR_ORDERS_DATA_SOURCE");
}
