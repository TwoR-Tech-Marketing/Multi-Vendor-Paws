import type { AppStrings } from "@/shared/i18n/types";

import styles from "./providerDashboard.module.css";

type ProviderStatCardsProps = {
  visits: number;
  newPatients: number;
  strings: AppStrings;
};

/** Visits and new patients for the selected range. */
export function ProviderStatCards({ visits, newPatients, strings }: ProviderStatCardsProps) {
  const t = strings.dashboard.provider;
  return (
    <div className={styles.statsGrid}>
      <div className={styles.card}>
        <span className={styles.statLabel}>{t.visits}</span>
        <p className={styles.statValue}>{visits}</p>
      </div>
      <div className={styles.card}>
        <span className={styles.statLabel}>{t.newPatients}</span>
        <p className={styles.statValue}>{newPatients}</p>
        <p className={styles.muted}>{t.newPatientsHint}</p>
      </div>
    </div>
  );
}
