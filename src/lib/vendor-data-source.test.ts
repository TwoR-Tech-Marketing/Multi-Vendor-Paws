import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getNotificationsDataSource,
  getSettingsDataSource,
  parseVendorDataSource,
} from "@/lib/vendor-data-source";

describe("PC-3 data-source flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("default to bff when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_VENDOR_NOTIFICATIONS_DATA_SOURCE", "");
    vi.stubEnv("NEXT_PUBLIC_VENDOR_SETTINGS_DATA_SOURCE", "");
    expect(getNotificationsDataSource()).toBe("bff");
    expect(getSettingsDataSource()).toBe("bff");
  });

  it("switch to callable only on the exact value", () => {
    vi.stubEnv("NEXT_PUBLIC_VENDOR_NOTIFICATIONS_DATA_SOURCE", " Callable ");
    vi.stubEnv("NEXT_PUBLIC_VENDOR_SETTINGS_DATA_SOURCE", "callable");
    expect(getNotificationsDataSource()).toBe("callable");
    expect(getSettingsDataSource()).toBe("callable");
  });

  it("fall back to bff for unknown values", () => {
    expect(parseVendorDataSource("firestore")).toBe("bff");
    expect(parseVendorDataSource(undefined)).toBe("bff");
  });
});
