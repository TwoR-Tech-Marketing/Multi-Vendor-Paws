"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Routes } from "@/constants/routes";
import { fetchDashboardStatsFromApi } from "@/features/financials/application/earnings.api";
import { formatEgp } from "@/features/products/domain/currency";
import { DashboardSkeleton } from "@/features/vendor/presentation/DashboardSkeleton";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./dashboard.module.css";

export function DashboardSection() {
  const strings = useStrings();
  const [openOrders, setOpenOrders] = useState(0);
  const [netEarnings, setNetEarnings] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const stats = await fetchDashboardStatsFromApi();
      setOpenOrders(stats.openOrders);
      setNetEarnings(stats.netEarnings);
      setTotalSales(stats.totalSales);
    } catch {
      setError(strings.dashboard.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [strings.dashboard.loadError]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <section className={styles.sectionStack}>
      {error ? <div className={styles.alertError}>{error}</div> : null}

      <div className={styles.statsGrid}>
        <Link href={Routes.vendor.orders} className={styles.statCard}>
          <span className={styles.statLabel}>{strings.dashboard.openOrders}</span>
          <p className={styles.statValue}>{openOrders}</p>
        </Link>
        <Link href={Routes.vendor.earnings} className={`${styles.statCard} ${styles.statHighlight}`}>
          <span className={styles.statLabel}>{strings.dashboard.netEarnings}</span>
          <p className={styles.statValue}>{formatEgp(netEarnings)}</p>
        </Link>
        <Link href={Routes.vendor.earnings} className={styles.statCard}>
          <span className={styles.statLabel}>{strings.dashboard.totalSales}</span>
          <p className={styles.statValue}>{formatEgp(totalSales)}</p>
        </Link>
      </div>
    </section>
  );
}
