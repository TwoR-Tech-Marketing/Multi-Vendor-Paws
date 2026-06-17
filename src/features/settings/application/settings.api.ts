import type { VendorSettingsSnapshot } from "@/features/settings/domain/types";
import { vendorApiGet } from "@/lib/auth-client";

export async function fetchVendorSettingsFromApi(): Promise<VendorSettingsSnapshot> {
  return vendorApiGet<VendorSettingsSnapshot>("/api/vendor/settings");
}
