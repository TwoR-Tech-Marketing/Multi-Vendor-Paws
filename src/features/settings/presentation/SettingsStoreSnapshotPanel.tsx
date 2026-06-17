import { SETTINGS_PREVIEW } from "@/features/settings/presentation/settings-preview";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";

import portalStyles from "@/features/vendor/presentation/portal.module.css";
import styles from "./settings.module.css";

type SettingsStoreSnapshotPanelProps = {
  strings: AppStrings;
};

export function SettingsStoreSnapshotPanel({ strings }: SettingsStoreSnapshotPanelProps) {
  const t = strings.settings;

  return (
    <article className={portalStyles.panel} aria-labelledby="settings-snapshot-title">
      <h2 id="settings-snapshot-title" className={styles.panelTitle}>
        {t.snapshotTitle}
      </h2>

      <div className={styles.snapshotGrid}>
        <div className={styles.snapshotCard}>
          <span className={styles.snapshotLabel}>{t.snapshotProducts}</span>
          <p className={styles.snapshotValue}>{SETTINGS_PREVIEW.productCount}</p>
        </div>
        <div className={styles.snapshotCard}>
          <span className={styles.snapshotLabel}>{t.snapshotOpenOrders}</span>
          <p className={styles.snapshotValue}>{SETTINGS_PREVIEW.openOrders}</p>
        </div>
        <div className={`${styles.snapshotCard} ${styles.snapshotCardHighlight}`}>
          <span className={styles.snapshotLabel}>{t.snapshotNetEarnings}</span>
          <p className={styles.snapshotValue}>
            {formatEgp(SETTINGS_PREVIEW.netEarningsPiastres)}
          </p>
        </div>
      </div>
    </article>
  );
}
