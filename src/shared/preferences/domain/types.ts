export type ThemeMode = "light" | "dark";

export type AppLocale = "en" | "ar";

export const PREFERENCE_STORAGE_KEYS = {
  theme: "tp-vendor-theme",
  locale: "tp-vendor-locale",
} as const;
