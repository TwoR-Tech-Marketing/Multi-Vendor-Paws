/**
 * Portal data-source flags. Each defaults to `bff`.
 *
 * NEXT_PUBLIC_VENDOR_PRODUCTS_DATA_SOURCE=bff|callable
 * NEXT_PUBLIC_VENDOR_ORDERS_DATA_SOURCE=bff|callable
 * NEXT_PUBLIC_VENDOR_NOTIFICATIONS_DATA_SOURCE=bff|callable
 * NEXT_PUBLIC_VENDOR_SETTINGS_DATA_SOURCE=bff|callable
 * NEXT_PUBLIC_VENDOR_EARNINGS_DATA_SOURCE=bff|callable
 *
 * Every flag is read with a literal `process.env.NEXT_PUBLIC_*` expression so
 * Next.js inlines it in the browser bundle. A dynamic `process.env[name]` read
 * is never inlined and always resolves to `bff` in the browser.
 */

export type VendorDataSource = "bff" | "callable";

export function parseVendorDataSource(raw: string | undefined): VendorDataSource {
  return (raw || "bff").trim().toLowerCase() === "callable" ? "callable" : "bff";
}

export function getProductsDataSource(): VendorDataSource {
  return parseVendorDataSource(process.env.NEXT_PUBLIC_VENDOR_PRODUCTS_DATA_SOURCE);
}

export function getOrdersDataSource(): VendorDataSource {
  return parseVendorDataSource(process.env.NEXT_PUBLIC_VENDOR_ORDERS_DATA_SOURCE);
}

export function getNotificationsDataSource(): VendorDataSource {
  return parseVendorDataSource(process.env.NEXT_PUBLIC_VENDOR_NOTIFICATIONS_DATA_SOURCE);
}

export function getSettingsDataSource(): VendorDataSource {
  return parseVendorDataSource(process.env.NEXT_PUBLIC_VENDOR_SETTINGS_DATA_SOURCE);
}

export function getEarningsDataSource(): VendorDataSource {
  return parseVendorDataSource(process.env.NEXT_PUBLIC_VENDOR_EARNINGS_DATA_SOURCE);
}
