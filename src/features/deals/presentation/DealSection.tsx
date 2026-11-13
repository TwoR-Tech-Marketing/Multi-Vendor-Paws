"use client";

import { useCallback, useEffect, useState } from "react";

import { toLoadErrorView, type LoadErrorView } from "@/components/ui/error-state/load-error";

import { fetchVendorDeal } from "@/features/deals/application/deals.api";
import type { VendorDealView } from "@/features/deals/domain/types";
import { DealView } from "@/features/deals/presentation/DealView";
import { createRequestTracker } from "@/features/notifications/domain/notification-state";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

export function DealSection() {
  const strings = useStrings();
  const { locale } = usePreferences();
  const { profile } = usePortalSession();
  const [deal, setDeal] = useState<VendorDealView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<LoadErrorView | null>(null);
  const [requests] = useState(createRequestTracker);
  const loadError = strings.deals.loadError;

  const loadDeal = useCallback(async () => {
    const requestId = requests.next();
    setError(null);
    setIsLoading(true);
    try {
      const next = await fetchVendorDeal();
      if (requests.isLatest(requestId)) setDeal(next);
    } catch (cause) {
      if (requests.isLatest(requestId)) setError(toLoadErrorView(cause, strings, loadError));
    } finally {
      if (requests.isLatest(requestId)) setIsLoading(false);
    }
  }, [requests, strings, loadError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDeal();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDeal]);

  return (
    <DealView
      strings={strings}
      locale={locale}
      deal={deal}
      isLoading={isLoading}
      error={error}
      onRetry={() => void loadDeal()}
      vendorType={profile.vendorType}
    />
  );
}
