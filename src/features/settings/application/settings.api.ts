import { APP_CURRENCY } from "@/features/products/domain/currency";
import type { VendorSettingsSnapshot } from "@/features/settings/domain/types";
import { vendorApiGet } from "@/lib/auth-client";
import { invokeCallable } from "@/lib/callable";
import { getSettingsDataSource } from "@/lib/vendor-data-source";

const CALLABLE_SUMMARY = "vendor_settings-getMyVendorSettingsSummary";

function toInt(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

/** Maps the settings summary callable response to the same shape the BFF returns. */
export function mapSettingsSummary(raw: unknown): VendorSettingsSnapshot {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const rate = Number(data.commissionRatePercent);
  return {
    commissionRatePercent: Number.isFinite(rate) ? rate : 0,
    productCount: Math.max(0, toInt(data.productCount)),
    openOrders: Math.max(0, toInt(data.openOrders)),
    netEarningsPiastres: toInt(data.netEarningsPiastres),
    currency: APP_CURRENCY,
  };
}

export async function fetchVendorSettingsFromApi(): Promise<VendorSettingsSnapshot> {
  if (getSettingsDataSource() === "callable") {
    const result = await invokeCallable(CALLABLE_SUMMARY, {});
    return mapSettingsSummary(result);
  }
  return vendorApiGet<VendorSettingsSnapshot>("/api/vendor/settings");
}
