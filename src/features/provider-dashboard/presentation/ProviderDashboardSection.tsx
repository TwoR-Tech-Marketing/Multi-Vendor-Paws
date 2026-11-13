"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { LoadErrorState } from "@/components/ui/error-state/LoadErrorState";
import { toLoadErrorView } from "@/components/ui/error-state/load-error";
import { getProviderDashboard } from "@/features/provider-dashboard/application/provider-dashboard.api";
import {
  DEFAULT_DASHBOARD_PRESET,
  type DashboardPreset,
  type ProviderDashboard,
} from "@/features/provider-dashboard/domain/types";
import { ProviderDashboardSkeleton } from "@/features/provider-dashboard/presentation/ProviderDashboardSkeleton";
import { ProviderDashboardView } from "@/features/provider-dashboard/presentation/ProviderDashboardView";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

/** Loads and shows the clinic and groomer dashboard for the selected preset. */
export function ProviderDashboardSection() {
  const strings = useStrings();
  const { locale } = usePreferences();
  const [preset, setPreset] = useState<DashboardPreset>(DEFAULT_DASHBOARD_PRESET);
  const [data, setData] = useState<ProviderDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const requestRef = useRef(0);

  const load = useCallback(async (current: DashboardPreset) => {
    const id = ++requestRef.current;
    setIsLoading(true);
    try {
      const next = await getProviderDashboard({ preset: current });
      if (id !== requestRef.current) return;
      setData(next);
      setError(false);
    } catch (failure) {
      if (id === requestRef.current) {
        setFailure(failure);
        setError(true);
      }
    } finally {
      if (id === requestRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(preset), 0);
    return () => window.clearTimeout(timer);
  }, [preset, load]);

  if (isLoading) return <ProviderDashboardSkeleton strings={strings} />;

  if (error || !data) {
    const view = toLoadErrorView(failure, strings, strings.dashboard.provider.loadError);
    return (
      <LoadErrorState
        view={view}
        strings={strings}
        onRetry={() => void load(preset)}
        compact
      />
    );
  }

  return (
    <ProviderDashboardView
      data={data}
      preset={preset}
      strings={strings}
      locale={locale}
      onPresetChange={setPreset}
    />
  );
}
