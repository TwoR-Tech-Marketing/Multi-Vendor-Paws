import Link from "next/link";

import { Routes } from "@/constants/routes";
import { formatEgp } from "@/features/products/domain/currency";
import { isScreenVisible } from "@/features/vendor/domain/vendor-type-config";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./dashboard.module.css";

type DashboardStatsGridProps = {
  strings: AppStrings;
  vendorType?: string;
  openOrders: number;
  netEarnings: number;
  totalSales: number;
  /** Portal language for money formatting. Defaults to English. */
  locale?: string;
};

/**
 * Dashboard stat cards, net earnings first as the hero. The open orders card
 * exists only for types with orders.
 */
export function DashboardStatsGrid({
  strings,
  vendorType,
  openOrders,
  netEarnings,
  totalSales,
  locale = "en",
}: DashboardStatsGridProps) {
  return (
    <div className={styles.statsGrid}>
      <Link href={Routes.vendor.earnings} className={`${styles.statCard} ${styles.statHighlight}`}>
        <span className={styles.statLabel}>{strings.dashboard.netEarnings}</span>
        <p className={styles.statValue}>{formatEgp(netEarnings, locale)}</p>
      </Link>
      {isScreenVisible(vendorType, "orders") ? (
        <Link href={Routes.vendor.orders} className={styles.statCard}>
          <span className={styles.statLabel}>{strings.dashboard.openOrders}</span>
          <p className={styles.statValue}>{openOrders.toLocaleString("en-EG")}</p>
        </Link>
      ) : null}
      <Link href={Routes.vendor.earnings} className={styles.statCard}>
        <span className={styles.statLabel}>{strings.dashboard.totalSales}</span>
        <p className={styles.statValue}>{formatEgp(totalSales, locale)}</p>
      </Link>
    </div>
  );
}
