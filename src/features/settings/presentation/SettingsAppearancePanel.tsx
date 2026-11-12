import { PortalSelect } from "@/components/ui/select/PortalSelect";
import type { AppStrings } from "@/shared/i18n/types";
import {
  DEFAULT_VENDOR_PREFERENCES,
  MODE_PREFERENCES,
  VENDOR_THEMES,
  type AppLocale,
  type ModePreference,
  type PreferencesScope,
  type ThemeMode,
  type VendorThemeId,
} from "@/shared/preferences/domain/types";
import { TP_COLOR_VALUES } from "@/shared/theme/tokens.generated";

import portalStyles from "@/features/vendor/presentation/portal.module.css";
import styles from "./settings.module.css";

type SettingsAppearancePanelProps = {
  strings: AppStrings;
  theme: VendorThemeId;
  mode: ModePreference;
  resolvedMode: ThemeMode;
  locale: AppLocale;
  scope: PreferencesScope;
  onThemeChange: (theme: VendorThemeId) => void;
  onModeChange: (mode: ModePreference) => void;
  onLocaleChange: (locale: AppLocale) => void;
};

function modeLabel(strings: AppStrings, mode: ModePreference): string {
  const t = strings.settings;
  if (mode === "light") return t.modeLight;
  if (mode === "dark") return t.modeDark;
  return t.modeSystem;
}

/** Theme, mode and language controls, in that order. */
export function SettingsAppearancePanel({
  strings,
  theme,
  mode,
  resolvedMode,
  locale,
  scope,
  onThemeChange,
  onModeChange,
  onLocaleChange,
}: SettingsAppearancePanelProps) {
  const t = strings.settings;

  return (
    <article className={portalStyles.panel} aria-labelledby="settings-appearance-title">
      <h2 id="settings-appearance-title" className={styles.panelTitle}>
        {t.appearanceTitle}
      </h2>

      <div className={styles.appearanceStack}>
        <div>
          <span id="settings-theme-label" className={styles.fieldLabel}>
            {t.themeLabel}
          </span>
          <div className={styles.themeGrid} role="radiogroup" aria-labelledby="settings-theme-label">
            {VENDOR_THEMES.map((id) => {
              const selected = id === theme;
              const swatch = TP_COLOR_VALUES[id][resolvedMode];
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-theme-id={id}
                  className={`${styles.themeOption} ${selected ? styles.themeOptionSelected : ""}`}
                  onClick={() => onThemeChange(id)}
                >
                  <span className={styles.themeSwatch} aria-hidden="true">
                    <span style={{ background: swatch.actionPrimary }} />
                    <span style={{ background: swatch.selectedBg }} />
                    <span style={{ background: swatch.surfaceRaised }} />
                  </span>
                  <span className={styles.themeName}>{t.themeNames[id]}</span>
                  {id === DEFAULT_VENDOR_PREFERENCES.theme ? (
                    <span className={styles.themeDefault}>{t.themeDefault}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span id="settings-mode-label" className={styles.fieldLabel}>
            {t.modeLabel}
          </span>
          <div
            className={styles.segmentedControl}
            role="group"
            aria-labelledby="settings-mode-label"
          >
            {MODE_PREFERENCES.map((option) => (
              <button
                key={option}
                type="button"
                data-mode={option}
                className={`${styles.segmentButton} ${mode === option ? styles.segmentButtonActive : ""}`}
                onClick={() => onModeChange(option)}
                aria-pressed={mode === option}
              >
                {modeLabel(strings, option)}
              </button>
            ))}
          </div>
        </div>

        <div>
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
            onChange={(next) => onLocaleChange(next === "ar" ? "ar" : "en")}
          />
        </div>
      </div>

      <p className={styles.hint}>{scope === "account" ? t.savedHintAccount : t.savedHint}</p>
    </article>
  );
}
