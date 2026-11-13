"use client";

import { useCallback, useEffect, useState } from "react";

import { toLoadErrorView, type LoadErrorView } from "@/components/ui/error-state/load-error";
import { ProviderDashboardSection } from "@/features/provider-dashboard/presentation/ProviderDashboardSection";
import { MissingCoverageBanner } from "@/features/coverage/presentation/MissingCoverageBanner";
import { fetchDashboardStatsFromApi } from "@/features/financials/application/earnings.api";
import { DashboardSkeleton } from "@/features/vendor/presentation/DashboardSkeleton";
import { DashboardStats } from "@/features/vendor/presentation/DashboardStatsGrid";
import { getProviderConfig } from "@/features/vendor/domain/vendor-type-config";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./dashboard.module.css";

export function DashboardSection() {
  const strings = useStrings();
  const { locale } = usePreferences();
  const { profile } = usePortalSession();
  const [openOrders, setOpenOrders] = useState(0);
  const [netEarnings, setNetEarnings] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<LoadErrorView | null>(null);

  const loadStats = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const stats = await fetchDashboardStatsFromApi();
      setOpenOrders(stats.openOrders);
      setNetEarnings(stats.netEarnings);
      setTotalSales(stats.totalSales);
    } catch (failure) {
      setError(toLoadErrorView(failure, strings, strings.dashboard.loadError));
    } finally {
      setIsLoading(false);
    }
  }, [strings]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStats();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStats]);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <section className={styles.sectionStack}>
      <MissingCoverageBanner />
      <DashboardStats
        error={error}
        onRetry={() => void loadStats()}
        strings={strings}
        vendorType={profile.vendorType}
        openOrders={openOrders}
        netEarnings={netEarnings}
        totalSales={totalSales}
        locale={locale}
      />
      {getProviderConfig(profile.vendorType).reviewCategorySet ? <ProviderDashboardSection /> : null}
    </section>
  );
}
