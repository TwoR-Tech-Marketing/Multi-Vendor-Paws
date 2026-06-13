"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getStrings } from "@/shared/i18n/get-strings";
import type { AppStrings } from "@/shared/i18n/types";
import {
  PREFERENCE_STORAGE_KEYS,
  type AppLocale,
  type ThemeMode,
} from "@/shared/preferences/domain/types";

type PreferencesContextValue = {
  theme: ThemeMode;
  locale: AppLocale;
  dir: "ltr" | "rtl";
  strings: AppStrings;
  setTheme: (theme: ThemeMode) => void;
  setLocale: (locale: AppLocale) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const value = localStorage.getItem(PREFERENCE_STORAGE_KEYS.theme);
    return value === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function readStoredLocale(): AppLocale {
  if (typeof window === "undefined") return "en";
  try {
    const value = localStorage.getItem(PREFERENCE_STORAGE_KEYS.locale);
    return value === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

function applyDocumentPreferences(theme: ThemeMode, locale: AppLocale) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.lang = locale;
  root.dir = locale === "ar" ? "rtl" : "ltr";
}

type PreferencesProviderProps = {
  children: ReactNode;
};

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() => readStoredTheme());
  const [locale, setLocaleState] = useState<AppLocale>(() => readStoredLocale());

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    try {
      localStorage.setItem(PREFERENCE_STORAGE_KEYS.theme, next);
    } catch {
      /* ignore */
    }
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(PREFERENCE_STORAGE_KEYS.locale, next);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    applyDocumentPreferences(theme, locale);
  }, [theme, locale]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      theme,
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      strings: getStrings(locale),
      setTheme,
      setLocale,
    }),
    [locale, setLocale, setTheme, theme],
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
