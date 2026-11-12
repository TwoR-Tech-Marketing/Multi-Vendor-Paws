import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const callableImpl = vi.fn();
const httpsCallable = vi.fn<(functions: unknown, name: string) => typeof callableImpl>(
  () => callableImpl,
);
const vendorApiGet = vi.fn();

vi.mock("firebase/functions", () => ({
  httpsCallable: (functions: unknown, name: string) => httpsCallable(functions, name),
}));
vi.mock("@/lib/firebase", () => ({ firebaseFunctions: {} }));
vi.mock("@/lib/auth-client", () => ({ vendorApiGet: (path: string) => vendorApiGet(path) }));

import {
  fetchVendorSettingsFromApi,
  mapSettingsSummary,
} from "@/features/settings/application/settings.api";
import type { VendorSettingsSnapshot } from "@/features/settings/domain/types";

const bffSnapshot: VendorSettingsSnapshot = {
  commissionRatePercent: 12.5,
  productCount: 9,
  openOrders: 3,
  netEarningsPiastres: 150000,
  currency: "EGP",
};

beforeEach(() => {
  callableImpl.mockReset();
  httpsCallable.mockClear();
  vendorApiGet.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("settings adapter", () => {
  it("uses the BFF route by default", async () => {
    vendorApiGet.mockResolvedValue(bffSnapshot);
    await expect(fetchVendorSettingsFromApi()).resolves.toEqual(bffSnapshot);
    expect(vendorApiGet).toHaveBeenCalledWith("/api/vendor/settings");
    expect(httpsCallable).not.toHaveBeenCalled();
  });

  it("returns the same shape as the BFF from the summary callable", async () => {
    vi.stubEnv("NEXT_PUBLIC_VENDOR_SETTINGS_DATA_SOURCE", "callable");
    callableImpl.mockResolvedValue({ data: { ok: true, ...bffSnapshot } });
    const snapshot = await fetchVendorSettingsFromApi();
    expect(httpsCallable).toHaveBeenCalledWith({}, "vendor_settings-getMyVendorSettingsSummary");
    expect(snapshot).toEqual(bffSnapshot);
    expect(Object.keys(snapshot).sort()).toEqual(Object.keys(bffSnapshot).sort());
    expect(vendorApiGet).not.toHaveBeenCalled();
  });

  it("propagates callable errors so the section shows its load error", async () => {
    vi.stubEnv("NEXT_PUBLIC_VENDOR_SETTINGS_DATA_SOURCE", "callable");
    callableImpl.mockRejectedValue({ code: "functions/permission-denied" });
    await expect(fetchVendorSettingsFromApi()).rejects.toBeTruthy();
  });

  it("keeps integer piastres and safe defaults for missing fields", () => {
    expect(mapSettingsSummary({ netEarningsPiastres: 1050.9 })).toEqual({
      commissionRatePercent: 0,
      productCount: 0,
      openOrders: 0,
      netEarningsPiastres: 1050,
      currency: "EGP",
    });
  });
});
