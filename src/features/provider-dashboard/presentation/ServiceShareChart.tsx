import { formatPercent } from "@/features/provider-dashboard/domain/stats";
import { OTHER_SERVICE_ID, type ServiceShare } from "@/features/provider-dashboard/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./providerDashboard.module.css";

type ServiceShareChartProps = {
  services: ServiceShare[];
  strings: AppStrings;
  locale: string;
};

export function serviceLabel(row: ServiceShare, strings: AppStrings, locale: string): string {
  if (row.serviceId === OTHER_SERVICE_ID) return strings.dashboard.provider.other;
  const name = locale === "ar" ? row.nameAr || row.nameEn : row.nameEn || row.nameAr;
  return name ?? strings.dashboard.provider.other;
}

/**
 * Horizontal bars, one per service, with the name in the active language and
 * the percent as the legend. Bars grow from the inline start, so RTL mirrors.
 */
export function ServiceShareChart({ services, strings, locale }: ServiceShareChartProps) {
  const t = strings.dashboard.provider;
  if (services.length === 0) return <p className={styles.muted}>{t.servicesEmpty}</p>;
  return (
    <ol className={styles.shareList}>
      {services.map((row) => {
        const percent = formatPercent(row.sharePercent);
        return (
          <li key={`${row.branchId}:${row.serviceId}`} className={styles.shareRow}>
            <div className={styles.shareLegend}>
              <span className={styles.shareName}>{serviceLabel(row, strings, locale)}</span>
              <span className={styles.sharePercent}>{percent}</span>
            </div>
            <span className={styles.barTrack} aria-hidden>
              <span className={styles.barFill} style={{ inlineSize: percent }} />
            </span>
            <span className={styles.shareCount}>
              {t.serviceVisits.replace("{count}", String(row.count))}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
