"use client";

import { usePreferences } from "@/shared/preferences/PreferencesContext";
import type { AppLocale, ThemeMode } from "@/shared/preferences/domain/types";

import portalStyles from "@/features/vendor/presentation/portal.module.css";
import styles from "./settings.module.css";

export function SettingsSection() {
  const { theme, locale, setTheme, setLocale, strings } = usePreferences();
  const t = strings.settings;

  function onThemeChange(next: ThemeMode) {
    setTheme(next);
  }

  function onLocaleChange(next: AppLocale) {
    setLocale(next);
  }

  return (
    <div className={styles.settingsGrid}>
      <article className={portalStyles.panel} aria-labelledby="settings-appearance-title">
        <h2 id="settings-appearance-title" className={styles.panelTitle}>
          {t.appearanceTitle}
        </h2>

        <label className={styles.fieldLabel} htmlFor="theme-mode">
          {t.themeLabel}
        </label>
        <div
          id="theme-mode"
          className={styles.segmentedControl}
          role="group"
          aria-label={t.themeLabel}
        >
          <button
            type="button"
            className={`${styles.segmentButton} ${theme === "light" ? styles.segmentButtonActive : ""}`}
            onClick={() => onThemeChange("light")}
            aria-pressed={theme === "light"}
          >
            {t.themeLight}
          </button>
          <button
            type="button"
            className={`${styles.segmentButton} ${theme === "dark" ? styles.segmentButtonActive : ""}`}
            onClick={() => onThemeChange("dark")}
            aria-pressed={theme === "dark"}
          >
            {t.themeDark}
          </button>
        </div>
      </article>

      <article className={portalStyles.panel} aria-labelledby="settings-language-title">
        <h2 id="settings-language-title" className={styles.panelTitle}>
          {t.languageTitle}
        </h2>

        <label className={styles.fieldLabel} htmlFor="display-language">
          {t.languageLabel}
        </label>
        <select
          id="display-language"
          className={styles.languageSelect}
          value={locale}
          onChange={(event) => onLocaleChange(event.target.value as AppLocale)}
        >
          <option value="en">{t.languageEnglish}</option>
          <option value="ar">{t.languageArabic}</option>
        </select>

        <p className={styles.hint}>{t.savedHint}</p>
      </article>
    </div>
  );
}
