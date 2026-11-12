"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchVendorProfileHistoryFromApi } from "@/features/vendor/application/vendor-profile.api";
import type { VendorProfileChangeHistoryItem } from "@/features/vendor/domain/types";
import {
  ProfileHistoryContent,
  type ProfileHistoryLoadError,
} from "@/features/vendor/presentation/ProfileHistoryContent";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import portalStyles from "@/features/vendor/presentation/portal.module.css";
import styles from "./profile.module.css";

type ProfileHistorySectionProps = {
  /** Changes when a request is submitted or reviewed, to reload the list. */
  reloadKey: string;
};

export function ProfileHistorySection({ reloadKey }: ProfileHistorySectionProps) {
  const strings = useStrings();
  const { locale } = usePreferences();
  const [items, setItems] = useState<VendorProfileChangeHistoryItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<ProfileHistoryLoadError>(null);

  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const page = await fetchVendorProfileHistoryFromApi(null);
      setItems(page.items);
      setNextCursor(page.nextCursor);
    } catch {
      setItems([]);
      setNextCursor(null);
      setLoadError("first");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFirstPage();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadFirstPage, reloadKey]);

  async function loadMore() {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    setLoadError(null);
    try {
      const page = await fetchVendorProfileHistoryFromApi(nextCursor);
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch {
      setLoadError("more");
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <section className={portalStyles.panel}>
      <h3 className={styles.panelTitle}>{strings.profile.historyTitle}</h3>
      <ProfileHistoryContent
        strings={strings}
        locale={locale}
        items={items}
        isLoading={isLoading}
        loadError={loadError}
        hasMore={nextCursor !== null}
        isLoadingMore={isLoadingMore}
        onRetry={() => void loadFirstPage()}
        onLoadMore={() => void loadMore()}
      />
    </section>
  );
}
