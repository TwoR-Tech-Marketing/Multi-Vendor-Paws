/**
 * Portal data-source flags (S1.4 / S1.5). Default BFF so portal can ship
 * before or after shared Cloud Functions.
 *
 * VENDOR_PRODUCTS_DATA_SOURCE=bff|callable
 * VENDOR_ORDERS_DATA_SOURCE=bff|callable
 * VENDOR_NOTIFICATIONS_DATA_SOURCE=bff|callable (PC-3)
 * VENDOR_SETTINGS_DATA_SOURCE=bff|callable (PC-3)
 */

export type VendorDataSource = "bff" | "callable";

function readSource(envName: string): VendorDataSource {
  return parseVendorDataSource(process.env[envName]);
}

export function parseVendorDataSource(raw: string | undefined): VendorDataSource {
  return (raw || "bff").trim().toLowerCase() === "callable" ? "callable" : "bff";
}

export function getProductsDataSource(): VendorDataSource {
  return readSource("NEXT_PUBLIC_VENDOR_PRODUCTS_DATA_SOURCE");
}

export function getOrdersDataSource(): VendorDataSource {
  return readSource("NEXT_PUBLIC_VENDOR_ORDERS_DATA_SOURCE");
}

/**
 * PC-3 flags read with literal `process.env.NEXT_PUBLIC_*` access so Next.js
 * inlines them in the browser bundle.
 */
export function getNotificationsDataSource(): VendorDataSource {
  return parseVendorDataSource(process.env.NEXT_PUBLIC_VENDOR_NOTIFICATIONS_DATA_SOURCE);
}

export function getSettingsDataSource(): VendorDataSource {
  return parseVendorDataSource(process.env.NEXT_PUBLIC_VENDOR_SETTINGS_DATA_SOURCE);
}
