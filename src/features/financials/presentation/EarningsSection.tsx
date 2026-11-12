"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchVendorEarningsEntries,
  fetchVendorEarningsOverview,
  isEarningsLedgerPaged,
} from "@/features/financials/application/earnings.api";
import type {
  EarningsEntryFilter,
  VendorEarningsEntry,
  VendorEarningsSummary,
} from "@/features/financials/domain/types";
import { EarningsView } from "@/features/financials/presentation/EarningsView";
import { createRequestTracker } from "@/features/notifications/domain/notification-state";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { useStrings } from "@/shared/preferences/PreferencesContext";

function appendEntries(
  current: VendorEarningsEntry[],
  next: VendorEarningsEntry[],
): VendorEarningsEntry[] {
  const seen = new Set(current.map((entry) => entry.entryId));
  return [...current, ...next.filter((entry) => !seen.has(entry.entryId))];
}

export function EarningsSection() {
  const strings = useStrings();
  const { profile } = usePortalSession();
  const [paged] = useState(isEarningsLedgerPaged);
  const [summary, setSummary] = useState<VendorEarningsSummary | null>(null);
  const [entries, setEntries] = useState<VendorEarningsEntry[]>([]);
  const [tab, setTab] = useState<EarningsEntryFilter>("all");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests] = useState(createRequestTracker);
  const loadError = strings.earnings.loadError;

  const loadEarnings = useCallback(async () => {
    const requestId = requests.next();
    setError(null);
    setIsLoading(true);
    setTab("all");
    try {
      const page = await fetchVendorEarningsOverview("all");
      if (!requests.isLatest(requestId)) return;
      setSummary(page.summary);
      setEntries(page.entries);
      setNextCursor(page.nextCursor);
    } catch {
      if (requests.isLatest(requestId)) setError(loadError);
    } finally {
      if (requests.isLatest(requestId)) setIsLoading(false);
    }
  }, [requests, loadError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEarnings();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadEarnings]);

  async function onTabChange(next: EarningsEntryFilter) {
    if (next === tab) return;
    const requestId = requests.next();
    setTab(next);
    setError(null);
    setEntries([]);
    setNextCursor(null);
    setIsLoadingMore(false);
    setIsLoadingEntries(true);
    try {
      const page = await fetchVendorEarningsEntries(next);
      if (!requests.isLatest(requestId)) return;
      setEntries(page.entries);
      setNextCursor(page.nextCursor);
    } catch {
      if (requests.isLatest(requestId)) setError(loadError);
    } finally {
      if (requests.isLatest(requestId)) setIsLoadingEntries(false);
    }
  }

  async function onLoadMore() {
    if (!nextCursor || isLoadingMore) return;
    const requestId = requests.next();
    setIsLoadingMore(true);
    setError(null);
    try {
      const page = await fetchVendorEarningsEntries(tab, nextCursor);
      if (!requests.isLatest(requestId)) return;
      setEntries((current) => appendEntries(current, page.entries));
      setNextCursor(page.nextCursor);
    } catch {
      if (requests.isLatest(requestId)) setError(loadError);
    } finally {
      if (requests.isLatest(requestId)) setIsLoadingMore(false);
    }
  }

  return (
    <EarningsView
      strings={strings}
      vendorType={profile.vendorType}
      summary={summary}
      entries={entries}
      isLoading={isLoading}
      error={error}
      paged={paged}
      tab={tab}
      isLoadingEntries={isLoadingEntries}
      hasMore={nextCursor !== null}
      isLoadingMore={isLoadingMore}
      onTabChange={(next) => void onTabChange(next)}
      onLoadMore={() => void onLoadMore()}
      onRetry={() => void loadEarnings()}
    />
  );
}
