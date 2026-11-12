import { DEFAULT_THEME, TP_THEMES, type TpThemeId } from "@/shared/theme/tokens.generated";

/** The mode applied to the page after resolving "system". */
export type ThemeMode = "light" | "dark";

/** The mode the vendor chose. "system" follows the device setting. */
export type ModePreference = ThemeMode | "system";

export type AppLocale = "en" | "ar";

export type VendorThemeId = TpThemeId;

export const VENDOR_THEMES: readonly VendorThemeId[] = TP_THEMES;

export const MODE_PREFERENCES: readonly ModePreference[] = ["light", "dark", "system"];

export const APP_LOCALES: readonly AppLocale[] = ["en", "ar"];

/** Appearance and language saved on the vendor account. */
export type VendorPreferences = {
  theme: VendorThemeId;
  mode: ModePreference;
  language: AppLocale;
};

export const DEFAULT_VENDOR_PREFERENCES: VendorPreferences = {
  theme: DEFAULT_THEME,
  mode: "system",
  language: "en",
};

/**
 * "account" when the vendor has an account record that stores preferences,
 * "local" when choices stay on this device only (signup still in progress).
 */
export type PreferencesScope = "account" | "local";

/**
 * Device cache keys. The mode keeps the original theme key so choices made
 * before themes existed still apply.
 */
export const PREFERENCE_STORAGE_KEYS = {
  mode: "tp-vendor-theme",
  theme: "tp-vendor-color-theme",
  locale: "tp-vendor-locale",
} as const;

export function isVendorThemeId(value: unknown): value is VendorThemeId {
  return typeof value === "string" && (VENDOR_THEMES as readonly string[]).includes(value);
}

export function isModePreference(value: unknown): value is ModePreference {
  return typeof value === "string" && (MODE_PREFERENCES as readonly string[]).includes(value);
}

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (APP_LOCALES as readonly string[]).includes(value);
}

/** Fills defaults for absent or unknown values. */
export function normalizeVendorPreferences(raw: unknown): VendorPreferences {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    theme: isVendorThemeId(data.theme) ? data.theme : DEFAULT_VENDOR_PREFERENCES.theme,
    mode: isModePreference(data.mode) ? data.mode : DEFAULT_VENDOR_PREFERENCES.mode,
    language: isAppLocale(data.language) ? data.language : DEFAULT_VENDOR_PREFERENCES.language,
  };
}

export function resolveThemeMode(mode: ModePreference, prefersDark: boolean): ThemeMode {
  if (mode === "system") return prefersDark ? "dark" : "light";
  return mode;
}
