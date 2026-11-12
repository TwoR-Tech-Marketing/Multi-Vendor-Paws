"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchVendorStatement } from "@/features/financials/application/statement.api";
import type { VendorStatement } from "@/features/financials/domain/statement-types";
import { StatementView } from "@/features/financials/presentation/StatementView";
import { createRequestTracker } from "@/features/notifications/domain/notification-state";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

export function StatementSection() {
  const strings = useStrings();
  const { locale } = usePreferences();
  const [statement, setStatement] = useState<VendorStatement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests] = useState(createRequestTracker);
  const loadError = strings.statement.loadError;

  const loadStatement = useCallback(async () => {
    const requestId = requests.next();
    setError(null);
    setIsLoading(true);
    try {
      const next = await fetchVendorStatement();
      if (requests.isLatest(requestId)) setStatement(next);
    } catch {
      if (requests.isLatest(requestId)) setError(loadError);
    } finally {
      if (requests.isLatest(requestId)) setIsLoading(false);
    }
  }, [requests, loadError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStatement();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStatement]);

  return (
    <StatementView
      strings={strings}
      locale={locale}
      statement={statement}
      isLoading={isLoading}
      error={error}
      onRetry={() => void loadStatement()}
    />
  );
}
