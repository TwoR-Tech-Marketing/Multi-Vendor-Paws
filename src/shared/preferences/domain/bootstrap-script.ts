import {
  DEFAULT_VENDOR_PREFERENCES,
  PREFERENCE_STORAGE_KEYS,
  VENDOR_THEMES,
} from "@/shared/preferences/domain/types";

/** Media query used to resolve the "system" mode. */
export const PREFERS_DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Inline script that runs before hydration. It reads the device cache and
 * sets data-tp-theme, data-theme, lang and dir on <html>, so the first paint
 * already uses the chosen theme, mode and language.
 */
export function buildPreferencesBootstrapScript(): string {
  const keys = JSON.stringify(PREFERENCE_STORAGE_KEYS);
  const themes = JSON.stringify(VENDOR_THEMES);
  const defaults = JSON.stringify(DEFAULT_VENDOR_PREFERENCES);
  const query = JSON.stringify(PREFERS_DARK_QUERY);
  return `(function () {
  var keys = ${keys};
  var themes = ${themes};
  var defaults = ${defaults};
  var theme = null;
  var mode = null;
  var locale = null;
  try {
    theme = localStorage.getItem(keys.theme);
    mode = localStorage.getItem(keys.mode);
    locale = localStorage.getItem(keys.locale);
  } catch (e) {}
  if (themes.indexOf(theme) < 0) theme = defaults.theme;
  if (mode !== "light" && mode !== "dark" && mode !== "system") mode = defaults.mode;
  if (locale !== "en" && locale !== "ar") locale = defaults.language;
  var dark = mode === "dark";
  if (mode === "system") {
    try {
      dark = !!(window.matchMedia && window.matchMedia(${query}).matches);
    } catch (e) {}
  }
  var root = document.documentElement;
  root.setAttribute("data-tp-theme", theme);
  root.setAttribute("data-theme", dark ? "dark" : "light");
  root.lang = locale;
  root.dir = locale === "ar" ? "rtl" : "ltr";
})();`;
}
