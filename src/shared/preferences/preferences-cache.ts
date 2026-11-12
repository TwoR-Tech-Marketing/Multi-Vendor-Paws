import {
  PREFERENCE_STORAGE_KEYS,
  normalizeVendorPreferences,
  type ThemeMode,
  type VendorPreferences,
} from "@/shared/preferences/domain/types";
import { PREFERS_DARK_QUERY } from "@/shared/preferences/domain/bootstrap-script";

type StorageLike = Pick<Storage, "getItem" | "setItem">;
type MatchMediaLike = (query: string) => Pick<
  MediaQueryList,
  "matches" | "addEventListener" | "removeEventListener"
>;

function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Reads the device cache; missing or unknown values fall back to defaults. */
export function readCachedPreferences(
  storage: StorageLike | null = browserStorage(),
): VendorPreferences {
  if (!storage) return normalizeVendorPreferences(null);
  try {
    return normalizeVendorPreferences({
      theme: storage.getItem(PREFERENCE_STORAGE_KEYS.theme),
      mode: storage.getItem(PREFERENCE_STORAGE_KEYS.mode),
      language: storage.getItem(PREFERENCE_STORAGE_KEYS.locale),
    });
  } catch {
    return normalizeVendorPreferences(null);
  }
}

export function writeCachedPreferences(
  prefs: Partial<VendorPreferences>,
  storage: StorageLike | null = browserStorage(),
): void {
  if (!storage) return;
  try {
    if (prefs.theme) storage.setItem(PREFERENCE_STORAGE_KEYS.theme, prefs.theme);
    if (prefs.mode) storage.setItem(PREFERENCE_STORAGE_KEYS.mode, prefs.mode);
    if (prefs.language) storage.setItem(PREFERENCE_STORAGE_KEYS.locale, prefs.language);
  } catch {
    /* storage can be blocked; the choice still applies for this visit */
  }
}

function browserMatchMedia(): MatchMediaLike | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return (query) => window.matchMedia(query);
}

/** Current device dark preference; false when unknown. */
export function readPrefersDark(matchMedia: MatchMediaLike | null = browserMatchMedia()): boolean {
  if (!matchMedia) return false;
  try {
    return matchMedia(PREFERS_DARK_QUERY).matches;
  } catch {
    return false;
  }
}

/** Calls onChange whenever the device switches between light and dark. */
export function subscribePrefersDark(
  onChange: () => void,
  matchMedia: MatchMediaLike | null = browserMatchMedia(),
): () => void {
  if (!matchMedia) return () => {};
  const list = matchMedia(PREFERS_DARK_QUERY);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
}

type DocumentRootLike = {
  setAttribute(name: string, value: string): void;
  lang: string;
  dir: string;
};

/** Mirrors the bootstrap script for changes after the first paint. */
export function applyDocumentPreferences(
  root: DocumentRootLike,
  prefs: VendorPreferences,
  resolvedMode: ThemeMode,
): void {
  root.setAttribute("data-tp-theme", prefs.theme);
  root.setAttribute("data-theme", resolvedMode);
  root.lang = prefs.language;
  root.dir = prefs.language === "ar" ? "rtl" : "ltr";
}
