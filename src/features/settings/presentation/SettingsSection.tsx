"use client";

import { useCallback, useEffect, useState } from "react";

import { Toast } from "@/components/ui/toast/Toast";
import { fetchVendorSettingsFromApi } from "@/features/settings/application/settings.api";
import {
  changeAppearancePreference,
  saveVendorPreferences,
  type VendorPreferencesPatch,
} from "@/features/settings/application/vendor-preferences.api";
import type { VendorSettingsSnapshot } from "@/features/settings/domain/types";
import { SettingsAppearancePanel } from "@/features/settings/presentation/SettingsAppearancePanel";
import { SettingsAccountOverviewPanel } from "@/features/settings/presentation/SettingsAccountOverviewPanel";
import { SettingsCommissionPanel } from "@/features/settings/presentation/SettingsCommissionPanel";
import { SettingsHelpLegalPanel } from "@/features/settings/presentation/SettingsHelpLegalPanel";
import { SettingsShortcutsPanel } from "@/features/settings/presentation/SettingsShortcutsPanel";
import { SettingsSkeleton } from "@/features/settings/presentation/SettingsSkeleton";
import { SettingsStoreSnapshotPanel } from "@/features/settings/presentation/SettingsStoreSnapshotPanel";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { usePreferences } from "@/shared/preferences/PreferencesContext";

import styles from "./settings.module.css";

const TOAST_DURATION_MS = 6000;

export function SettingsSection() {
  const { profile, sessionKind, isActiveVendor, preferencesScope } = usePortalSession();
  const { theme, mode, resolvedMode, locale, setTheme, setMode, setLocale, strings } =
    usePreferences();
  const t = strings.settings;

  const [snapshot, setSnapshot] = useState<VendorSettingsSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);

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
    const timer = window.setTimeout(() => {
      void loadSettings();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSettings]);

  useEffect(() => {
    if (!saveError) return;
    const timer = window.setTimeout(() => setSaveError(false), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [saveError]);

  function onPreferenceChange(patch: VendorPreferencesPatch) {
    void changeAppearancePreference(patch, {
      apply: (next) => {
        if (next.theme) setTheme(next.theme);
        if (next.mode) setMode(next.mode);
        if (next.language) setLocale(next.language);
      },
      save: saveVendorPreferences,
      scope: preferencesScope,
    }).then((result) => {
      // Only a failure shows the toast; a later success never hides it.
      if (result === "failed") setSaveError(true);
    });
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
          vendorType={profile.vendorType}
        />
      ) : null}

      <SettingsShortcutsPanel
        strings={strings}
        isActiveVendor={isActiveVendor}
        vendorType={profile.vendorType}
      />

      <SettingsAppearancePanel
        strings={strings}
        theme={theme}
        mode={mode}
        resolvedMode={resolvedMode}
        locale={locale}
        scope={preferencesScope}
        onThemeChange={(next) => onPreferenceChange({ theme: next })}
        onModeChange={(next) => onPreferenceChange({ mode: next })}
        onLocaleChange={(next) => onPreferenceChange({ language: next })}
      />

      <SettingsHelpLegalPanel strings={strings} />

      <Toast
        open={saveError}
        message={t.preferencesSaveError}
        dismissLabel={t.dismiss}
        onDismiss={() => setSaveError(false)}
      />
    </div>
  );
}
