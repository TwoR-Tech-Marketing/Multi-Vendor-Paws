/**
 * Shared vendor type config. Keys only: display text comes from the
 * locale files (`vendorTypes.<type>.*`, `nav.*`). The vendor app holds the same
 * table in Dart; a test in each repo asserts the canonical values.
 */

export const VENDOR_TYPES = ["store", "clinic", "groomer", "doctor"] as const;

export type VendorType = (typeof VENDOR_TYPES)[number];

export const VENDOR_SCREEN_KEYS = [
  "dashboard",
  "profile",
  "documents",
  "settings",
  "notifications",
  "earnings",
  "products",
  "orders",
  "coverage",
  "branches",
  "services",
  "appointments",
  "availability",
  "reviews",
  "telehealth",
  "coupons",
] as const;

export type VendorScreenKey = (typeof VENDOR_SCREEN_KEYS)[number];

export type ScreenState = "visible" | "comingSoon" | "hidden";

export type ProviderField = "specialty" | "education" | "experience" | "photoUrls";

export type ProviderConfig = {
  type: VendorType | "unknown";
  labelKey: string;
  fieldLabelKeys: {
    storeName: string;
    storeDescription: string;
    logoUrl: string;
  };
  nav: VendorScreenKey[];
  screens: Record<VendorScreenKey, ScreenState>;
  requiresActive: VendorScreenKey[];
  requiresDeliveryCoverage: boolean;
  supportsHomeVisit: boolean;
  reviewCategorySet: "clinic" | "groomer" | null;
  providerFields: ProviderField[];
};

/** Limits for provider fields, the same as the signup callable. */
export const PROVIDER_FIELD_LIMITS = {
  specialtyMin: 2,
  specialtyMax: 80,
  freeTextMax: 1000,
  doctorDescriptionMax: 500,
  photoUrlsMax: 6,
  photoUrlMaxLength: 2048,
} as const;

const ALWAYS_VISIBLE: VendorScreenKey[] = [
  "dashboard",
  "profile",
  "documents",
  "settings",
  "notifications",
  "earnings",
];

function buildScreens(
  overrides: Partial<Record<VendorScreenKey, ScreenState>>,
): Record<VendorScreenKey, ScreenState> {
  const screens = {} as Record<VendorScreenKey, ScreenState>;
  for (const key of VENDOR_SCREEN_KEYS) {
    screens[key] = ALWAYS_VISIBLE.includes(key) ? "visible" : "hidden";
  }
  return { ...screens, ...overrides };
}

function fieldLabelKeys(type: VendorType | "unknown") {
  return {
    storeName: `vendorTypes.${type}.fields.storeName`,
    storeDescription: `vendorTypes.${type}.fields.storeDescription`,
    logoUrl: `vendorTypes.${type}.fields.logoUrl`,
  };
}

const PROVIDER_CONFIGS: Record<VendorType, ProviderConfig> = {
  store: {
    type: "store",
    labelKey: "vendorTypes.store.label",
    fieldLabelKeys: fieldLabelKeys("store"),
    nav: ["dashboard", "products", "orders", "earnings", "settings"],
    screens: buildScreens({
      products: "visible",
      orders: "visible",
      coverage: "visible",
      coupons: "visible",
    }),
    requiresActive: ["products", "orders", "earnings", "coupons"],
    requiresDeliveryCoverage: true,
    supportsHomeVisit: false,
    reviewCategorySet: null,
    providerFields: [],
  },
  clinic: {
    type: "clinic",
    labelKey: "vendorTypes.clinic.label",
    fieldLabelKeys: fieldLabelKeys("clinic"),
    nav: ["dashboard", "branches", "appointments", "earnings", "settings"],
    screens: buildScreens({
      branches: "visible",
      services: "visible",
      appointments: "visible",
      availability: "visible",
      reviews: "visible",
      coupons: "visible",
    }),
    requiresActive: ["appointments", "reviews", "earnings", "coupons"],
    requiresDeliveryCoverage: false,
    supportsHomeVisit: true,
    reviewCategorySet: "clinic",
    providerFields: ["education", "experience", "photoUrls"],
  },
  groomer: {
    type: "groomer",
    labelKey: "vendorTypes.groomer.label",
    fieldLabelKeys: fieldLabelKeys("groomer"),
    nav: ["dashboard", "branches", "appointments", "earnings", "settings"],
    screens: buildScreens({
      branches: "visible",
      services: "visible",
      appointments: "visible",
      availability: "visible",
      reviews: "visible",
      coupons: "visible",
    }),
    requiresActive: ["appointments", "reviews", "earnings", "coupons"],
    requiresDeliveryCoverage: false,
    supportsHomeVisit: true,
    reviewCategorySet: "groomer",
    providerFields: ["photoUrls"],
  },
  doctor: {
    type: "doctor",
    labelKey: "vendorTypes.doctor.label",
    fieldLabelKeys: fieldLabelKeys("doctor"),
    nav: ["dashboard", "telehealth", "earnings", "settings"],
    screens: buildScreens({
      telehealth: "visible",
    }),
    requiresActive: ["earnings"],
    requiresDeliveryCoverage: false,
    supportsHomeVisit: false,
    reviewCategorySet: null,
    providerFields: ["specialty"],
  },
};

const UNKNOWN_CONFIG: ProviderConfig = {
  type: "unknown",
  labelKey: "vendorTypes.unknown.label",
  fieldLabelKeys: fieldLabelKeys("unknown"),
  nav: ["dashboard", "settings"],
  screens: buildScreens({}),
  requiresActive: ["earnings"],
  requiresDeliveryCoverage: false,
  supportsHomeVisit: false,
  reviewCategorySet: null,
  providerFields: [],
};

export function isKnownVendorType(value: unknown): value is VendorType {
  return typeof value === "string" && (VENDOR_TYPES as readonly string[]).includes(value);
}

/** Missing, null or empty means store; any other string is kept as data. */
export function normalizeVendorType(raw: unknown): string {
  if (raw === undefined || raw === null) return "store";
  const value = String(raw).trim();
  return value ? value : "store";
}

/** Unknown types get the fallback config, never store navigation. */
export function getProviderConfig(type: string | null | undefined): ProviderConfig {
  const normalized = normalizeVendorType(type);
  return isKnownVendorType(normalized) ? PROVIDER_CONFIGS[normalized] : UNKNOWN_CONFIG;
}

export function isScreenVisible(
  type: string | null | undefined,
  screen: VendorScreenKey,
): boolean {
  return getProviderConfig(type).screens[screen] === "visible";
}
