import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getNotificationsDataSource,
  getOrdersDataSource,
  getProductsDataSource,
  getProfileDataSource,
  getSettingsDataSource,
  parseVendorDataSource,
  type VendorDataSource,
} from "@/lib/vendor-data-source";

const FLAGS: Array<[string, () => VendorDataSource]> = [
  ["NEXT_PUBLIC_VENDOR_PRODUCTS_DATA_SOURCE", getProductsDataSource],
  ["NEXT_PUBLIC_VENDOR_ORDERS_DATA_SOURCE", getOrdersDataSource],
  ["NEXT_PUBLIC_VENDOR_NOTIFICATIONS_DATA_SOURCE", getNotificationsDataSource],
  ["NEXT_PUBLIC_VENDOR_SETTINGS_DATA_SOURCE", getSettingsDataSource],
  ["NEXT_PUBLIC_VENDOR_PROFILE_DATA_SOURCE", getProfileDataSource],
];

describe("portal data-source flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe.each(FLAGS)("%s", (name, read) => {
    it("defaults to bff when unset or empty", () => {
      vi.stubEnv(name, undefined);
      expect(read()).toBe("bff");
      vi.stubEnv(name, "");
      expect(read()).toBe("bff");
    });

    it("switches to callable on the callable value, ignoring case and spaces", () => {
      vi.stubEnv(name, " Callable ");
      expect(read()).toBe("callable");
    });

    it("stays bff for any other value", () => {
      vi.stubEnv(name, "firestore");
      expect(read()).toBe("bff");
    });

    it("reads only its own variable", () => {
      for (const [other] of FLAGS) vi.stubEnv(other, other === name ? "bff" : "callable");
      expect(read()).toBe("bff");
    });
  });

  it("parses unknown values to bff", () => {
    expect(parseVendorDataSource("firestore")).toBe("bff");
    expect(parseVendorDataSource(undefined)).toBe("bff");
  });
});
