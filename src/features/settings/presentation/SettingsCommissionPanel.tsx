import type { AppStrings } from "@/shared/i18n/types";

import portalStyles from "@/features/vendor/presentation/portal.module.css";
import styles from "./settings.module.css";

type SettingsCommissionPanelProps = {
  strings: AppStrings;
  commissionRatePercent: number;
};

export function SettingsCommissionPanel({
  strings,
  commissionRatePercent,
}: SettingsCommissionPanelProps) {
  const t = strings.settings;

  return (
    <article className={portalStyles.panel} aria-labelledby="settings-commission-title">
      <h2 id="settings-commission-title" className={styles.panelTitle}>
        {t.commissionTitle}
      </h2>

      <div className={styles.commissionHighlight}>
        <span className={styles.commissionLabel}>{t.commissionRateLabel}</span>
        <p className={styles.commissionValue}>{commissionRatePercent}%</p>
      </div>

      <p className={styles.hint}>{t.commissionHint}</p>
    </article>
  );
}
