"use client";

import { useCallback, useEffect, useState } from "react";

import { toLoadErrorView, type LoadErrorView } from "@/components/ui/error-state/load-error";

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
  const [error, setError] = useState<LoadErrorView | null>(null);
  const [requests] = useState(createRequestTracker);
  const loadError = strings.statement.loadError;

  const loadStatement = useCallback(async () => {
    const requestId = requests.next();
    setError(null);
    setIsLoading(true);
    try {
      const next = await fetchVendorStatement();
      if (requests.isLatest(requestId)) setStatement(next);
    } catch (cause) {
      if (requests.isLatest(requestId)) setError(toLoadErrorView(cause, strings, loadError));
    } finally {
      if (requests.isLatest(requestId)) setIsLoading(false);
    }
  }, [requests, strings, loadError]);

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
