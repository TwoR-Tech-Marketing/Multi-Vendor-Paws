import { DASHBOARD_PRESETS, type DashboardPreset } from "@/features/provider-dashboard/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./providerDashboard.module.css";

type PresetTabsProps = {
  value: DashboardPreset;
  strings: AppStrings;
  onChange: (preset: DashboardPreset) => void;
};

/** 7, 30 and 90 day range buttons. */
export function PresetTabs({ value, strings, onChange }: PresetTabsProps) {
  const t = strings.dashboard.provider;
  return (
    <div className={styles.chips} role="group" aria-label={t.presetLabel}>
      {DASHBOARD_PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          aria-pressed={value === preset}
          className={`${styles.chip} ${value === preset ? styles.chipActive : ""}`}
          onClick={() => onChange(preset)}
        >
          {t.presets[`d${preset}`]}
        </button>
      ))}
    </div>
  );
}
