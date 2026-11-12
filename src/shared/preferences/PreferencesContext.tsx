"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { getStrings } from "@/shared/i18n/get-strings";
import type { AppStrings } from "@/shared/i18n/types";
import {
  resolveThemeMode,
  type AppLocale,
  type ModePreference,
  type ThemeMode,
  type VendorPreferences,
  type VendorThemeId,
} from "@/shared/preferences/domain/types";
import {
  applyDocumentPreferences,
  readCachedPreferences,
  readPrefersDark,
  subscribePrefersDark,
  writeCachedPreferences,
} from "@/shared/preferences/preferences-cache";

type PreferencesContextValue = {
  /** Colour theme id. */
  theme: VendorThemeId;
  /** Mode the vendor chose (light, dark or system). */
  mode: ModePreference;
  /** Mode applied to the page, with "system" resolved. */
  resolvedMode: ThemeMode;
  locale: AppLocale;
  dir: "ltr" | "rtl";
  strings: AppStrings;
  setTheme: (theme: VendorThemeId) => void;
  setMode: (mode: ModePreference) => void;
  setLocale: (locale: AppLocale) => void;
  /** Replaces the device values with the account values and caches them. */
  applyAccountPreferences: (prefs: VendorPreferences) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

type PreferencesProviderProps = {
  children: ReactNode;
};

function getServerPrefersDark(): boolean {
  return false;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const [prefs, setPrefs] = useState<VendorPreferences>(() => readCachedPreferences());
  const prefersDark = useSyncExternalStore(
    subscribePrefersDark,
    readPrefersDark,
    getServerPrefersDark,
  );
  const resolvedMode = resolveThemeMode(prefs.mode, prefersDark);

  const update = useCallback((patch: Partial<VendorPreferences>) => {
    setPrefs((current) => ({ ...current, ...patch }));
    writeCachedPreferences(patch);
  }, []);

  const setTheme = useCallback((theme: VendorThemeId) => update({ theme }), [update]);
  const setMode = useCallback((mode: ModePreference) => update({ mode }), [update]);
  const setLocale = useCallback((language: AppLocale) => update({ language }), [update]);
  const applyAccountPreferences = useCallback(
    (next: VendorPreferences) => update(next),
    [update],
  );

  useEffect(() => {
    applyDocumentPreferences(document.documentElement, prefs, resolvedMode);
  }, [prefs, resolvedMode]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      theme: prefs.theme,
      mode: prefs.mode,
      resolvedMode,
      locale: prefs.language,
      dir: prefs.language === "ar" ? "rtl" : "ltr",
      strings: getStrings(prefs.language),
      setTheme,
      setMode,
      setLocale,
      applyAccountPreferences,
    }),
    [prefs, resolvedMode, setTheme, setMode, setLocale, applyAccountPreferences],
  );

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const value = useContext(PreferencesContext);
  if (!value) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return value;
}

export function useStrings(): AppStrings {
  return usePreferences().strings;
}
