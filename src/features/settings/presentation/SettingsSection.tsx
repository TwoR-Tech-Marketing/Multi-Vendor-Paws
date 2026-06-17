"use client";

import { useCallback, useEffect, useState } from "react";

import { PortalSelect } from "@/components/ui/select/PortalSelect";
import { fetchVendorSettingsFromApi } from "@/features/settings/application/settings.api";
import type { VendorSettingsSnapshot } from "@/features/settings/domain/types";
import { SettingsAccountOverviewPanel } from "@/features/settings/presentation/SettingsAccountOverviewPanel";
import { SettingsCommissionPanel } from "@/features/settings/presentation/SettingsCommissionPanel";
import { SettingsHelpLegalPanel } from "@/features/settings/presentation/SettingsHelpLegalPanel";
import { SettingsShortcutsPanel } from "@/features/settings/presentation/SettingsShortcutsPanel";
import { SettingsSkeleton } from "@/features/settings/presentation/SettingsSkeleton";
import { SettingsStoreSnapshotPanel } from "@/features/settings/presentation/SettingsStoreSnapshotPanel";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { usePreferences } from "@/shared/preferences/PreferencesContext";
import type { AppLocale, ThemeMode } from "@/shared/preferences/domain/types";

import portalStyles from "@/features/vendor/presentation/portal.module.css";
import styles from "./settings.module.css";

export function SettingsSection() {
  const { profile, sessionKind, isActiveVendor } = usePortalSession();
  const { theme, locale, setTheme, setLocale, strings } = usePreferences();
  const t = strings.settings;

  const [snapshot, setSnapshot] = useState<VendorSettingsSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await fetchVendorSettingsFromApi();
      setSnapshot(data);
    } catch {
      setError(t.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  function onThemeChange(next: ThemeMode) {
    setTheme(next);
  }

  function onLocaleChange(next: AppLocale) {
    setLocale(next);
  }

  if (isLoading) return <SettingsSkeleton />;

  return (
    <div className={styles.sectionStack}>
      {error ? (
        <div className={styles.alertError}>
          <p>{error}</p>
          <button type="button" className={styles.retryButton} onClick={() => void loadSettings()}>
            {strings.common.retry}
          </button>
        </div>
      ) : null}

      <div className={styles.settingsGrid}>
        <SettingsAccountOverviewPanel
          strings={strings}
          storeName={profile.storeName}
          email={profile.email}
          sessionKind={sessionKind}
          status={profile.status}
        />
        {snapshot ? (
          <SettingsCommissionPanel
            strings={strings}
            commissionRatePercent={snapshot.commissionRatePercent}
          />
        ) : null}
      </div>

      {snapshot ? (
        <SettingsStoreSnapshotPanel
          strings={strings}
          productCount={snapshot.productCount}
          openOrders={snapshot.openOrders}
          netEarningsPiastres={snapshot.netEarningsPiastres}
          isActiveVendor={isActiveVendor}
        />
      ) : null}

      <SettingsShortcutsPanel strings={strings} />

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
          <PortalSelect
            id="display-language"
            value={locale}
            ariaLabel={t.languageLabel}
            options={[
              { value: "en", label: t.languageEnglish },
              { value: "ar", label: t.languageArabic },
            ]}
            onChange={(next) => onLocaleChange(next as AppLocale)}
          />

          <p className={styles.hint}>{t.savedHint}</p>
        </article>
      </div>

      <SettingsHelpLegalPanel strings={strings} />
    </div>
  );
}
