import type { VendorProfileChangeHistoryItem } from "@/features/vendor/domain/types";
import { ProfileHistoryList } from "@/features/vendor/presentation/ProfileHistoryList";
import { ProfileHistorySkeleton } from "@/features/vendor/presentation/ProfileHistorySkeleton";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import styles from "./profile.module.css";

/** `first`: the first page failed. `more`: a later page failed. */
export type ProfileHistoryLoadError = "first" | "more" | null;

type ProfileHistoryContentProps = {
  strings: AppStrings;
  locale: AppLocale;
  items: VendorProfileChangeHistoryItem[];
  isLoading: boolean;
  loadError: ProfileHistoryLoadError;
  hasMore: boolean;
  isLoadingMore: boolean;
  onRetry: () => void;
  onLoadMore: () => void;
};

function ErrorAlert({ strings, onRetry }: { strings: AppStrings; onRetry: () => void }) {
  return (
    <div className={`${styles.alert} ${styles.alertError}`} role="alert">
      {strings.profile.historyLoadError}{" "}
      <button type="button" className={styles.btnSecondary} onClick={onRetry}>
        {strings.common.retry}
      </button>
    </div>
  );
}

/**
 * Exactly one state: skeleton, first page error, or the list (or its empty
 * state). A failed later page keeps the loaded rows and adds the alert.
 */
export function ProfileHistoryContent({
  strings,
  locale,
  items,
  isLoading,
  loadError,
  hasMore,
  isLoadingMore,
  onRetry,
  onLoadMore,
}: ProfileHistoryContentProps) {
  if (isLoading) return <ProfileHistorySkeleton strings={strings} />;
  if (loadError === "first") return <ErrorAlert strings={strings} onRetry={onRetry} />;

  return (
    <>
      <ProfileHistoryList
        strings={strings}
        locale={locale}
        items={items}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={onLoadMore}
      />
      {loadError === "more" ? <ErrorAlert strings={strings} onRetry={onLoadMore} /> : null}
    </>
  );
}
