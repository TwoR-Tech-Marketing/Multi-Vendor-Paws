"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchVendorProfileHistoryFromApi } from "@/features/vendor/application/vendor-profile.api";
import type { VendorProfileChangeHistoryItem } from "@/features/vendor/domain/types";
import { ProfileHistoryList } from "@/features/vendor/presentation/ProfileHistoryList";
import { ProfileHistorySkeleton } from "@/features/vendor/presentation/ProfileHistorySkeleton";
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
  const [hasError, setHasError] = useState(false);

  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const page = await fetchVendorProfileHistoryFromApi(null);
      setItems(page.items);
      setNextCursor(page.nextCursor);
    } catch {
      setHasError(true);
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
    try {
      const page = await fetchVendorProfileHistoryFromApi(nextCursor);
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch {
      setHasError(true);
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <section className={portalStyles.panel}>
      <h3 className={styles.panelTitle}>{strings.profile.historyTitle}</h3>
      {hasError ? (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          {strings.profile.historyLoadError}{" "}
          <button type="button" className={styles.btnSecondary} onClick={() => void loadFirstPage()}>
            {strings.common.retry}
          </button>
        </div>
      ) : null}
      {isLoading ? (
        <ProfileHistorySkeleton strings={strings} />
      ) : (
        <ProfileHistoryList
          strings={strings}
          locale={locale}
          items={items}
          hasMore={nextCursor !== null}
          isLoadingMore={isLoadingMore}
          onLoadMore={() => void loadMore()}
        />
      )}
    </section>
  );
}
