import { describe, expect, it } from "vitest";

import {
  VENDOR_SCREEN_KEYS,
  VENDOR_TYPES,
  getProviderConfig,
  isScreenVisible,
  normalizeVendorType,
  type ScreenState,
  type VendorScreenKey,
} from "@/features/vendor/domain/vendor-type-config";

const ALWAYS: VendorScreenKey[] = [
  "dashboard",
  "profile",
  "documents",
  "settings",
  "notifications",
  "earnings",
];

/** Canonical vendor type table, shared with the vendor app, row by row. */
const CANONICAL = {
  nav: {
    store: ["dashboard", "products", "orders", "earnings", "settings"],
    clinic: ["dashboard", "branches", "appointments", "earnings", "settings"],
    groomer: ["dashboard", "branches", "appointments", "earnings", "settings"],
    doctor: ["dashboard", "telehealth", "earnings", "settings"],
  },
  screens: {
    products: { store: "visible", clinic: "hidden", groomer: "hidden", doctor: "hidden" },
    orders: { store: "visible", clinic: "hidden", groomer: "hidden", doctor: "hidden" },
    coverage: { store: "visible", clinic: "hidden", groomer: "hidden", doctor: "hidden" },
    branches: { store: "hidden", clinic: "visible", groomer: "visible", doctor: "hidden" },
    services: { store: "hidden", clinic: "visible", groomer: "visible", doctor: "hidden" },
    appointments: {
      store: "hidden",
      clinic: "comingSoon",
      groomer: "comingSoon",
      doctor: "hidden",
    },
    availability: { store: "hidden", clinic: "visible", groomer: "visible", doctor: "hidden" },
    reviews: { store: "hidden", clinic: "hidden", groomer: "hidden", doctor: "hidden" },
    telehealth: { store: "hidden", clinic: "hidden", groomer: "hidden", doctor: "visible" },
    coupons: { store: "visible", clinic: "visible", groomer: "visible", doctor: "hidden" },
  } as Record<string, Record<string, ScreenState>>,
  requiresActive: {
    store: ["products", "orders", "earnings", "coupons"],
    clinic: ["appointments", "earnings", "coupons"],
    groomer: ["appointments", "earnings", "coupons"],
    doctor: ["earnings"],
  },
  requiresDeliveryCoverage: { store: true, clinic: false, groomer: false, doctor: false },
  supportsHomeVisit: { store: false, clinic: true, groomer: true, doctor: false },
  reviewCategorySet: { store: null, clinic: "clinic", groomer: "groomer", doctor: null },
  providerFields: {
    store: [],
    clinic: ["education", "experience", "photoUrls"],
    groomer: ["photoUrls"],
    doctor: ["specialty"],
  },
} as const;

describe("vendor type config", () => {
  it.each(VENDOR_TYPES)("matches the canonical table for %s", (type) => {
    const config = getProviderConfig(type);
    expect(config.type).toBe(type);
    expect(config.labelKey).toBe(`vendorTypes.${type}.label`);
    expect(config.nav).toEqual(CANONICAL.nav[type]);
    expect(config.nav.length).toBeLessThanOrEqual(5);
    for (const key of ALWAYS) {
      expect(config.screens[key]).toBe("visible");
    }
    for (const [key, byType] of Object.entries(CANONICAL.screens)) {
      expect(config.screens[key as VendorScreenKey]).toBe(byType[type]);
    }
    expect(Object.keys(config.screens).sort()).toEqual([...VENDOR_SCREEN_KEYS].sort());
    expect(config.requiresActive).toEqual(CANONICAL.requiresActive[type]);
    expect(config.requiresDeliveryCoverage).toBe(CANONICAL.requiresDeliveryCoverage[type]);
    expect(config.supportsHomeVisit).toBe(CANONICAL.supportsHomeVisit[type]);
    expect(config.reviewCategorySet).toBe(CANONICAL.reviewCategorySet[type]);
    expect(config.providerFields).toEqual(CANONICAL.providerFields[type]);
  });

  it("falls back to store for missing type and to the unknown config otherwise", () => {
    expect(getProviderConfig(undefined).type).toBe("store");
    expect(getProviderConfig(null).type).toBe("store");
    expect(getProviderConfig("").type).toBe("store");

    const unknown = getProviderConfig("hotel");
    expect(unknown.type).toBe("unknown");
    expect(unknown.nav).toEqual(["dashboard", "settings"]);
    for (const key of VENDOR_SCREEN_KEYS) {
      expect(unknown.screens[key]).toBe(ALWAYS.includes(key) ? "visible" : "hidden");
    }
    expect(isScreenVisible("hotel", "products")).toBe(false);
  });

  it("normalizes vendor types", () => {
    expect(normalizeVendorType(undefined)).toBe("store");
    expect(normalizeVendorType(null)).toBe("store");
    expect(normalizeVendorType("")).toBe("store");
    for (const type of VENDOR_TYPES) expect(normalizeVendorType(type)).toBe(type);
    expect(normalizeVendorType("hotel")).toBe("hotel");
  });
});
