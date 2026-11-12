import type {
  VendorProfileChangeHistoryItem,
  VendorProfileChangeRequestStatus,
} from "@/features/vendor/domain/types";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import profileStyles from "./profile.module.css";
import styles from "./profileHistory.module.css";

type ProfileHistoryListProps = {
  strings: AppStrings;
  locale: AppLocale;
  items: VendorProfileChangeHistoryItem[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
};

const BADGE_CLASS: Record<VendorProfileChangeRequestStatus, string> = {
  pending: styles.badgePending,
  approved: styles.badgeApproved,
  rejected: styles.badgeRejected,
};

/** Cairo date with Western digits in both languages. */
export function formatHistoryDate(date: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    timeZone: "Africa/Cairo",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function ProfileHistoryList({
  strings,
  locale,
  items,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: ProfileHistoryListProps) {
  const t = strings.profile;

  if (items.length === 0) {
    return <p className={styles.empty}>{t.historyEmpty}</p>;
  }

  return (
    <>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.row}>
            <div className={styles.rowHeader}>
              <span className={styles.storeName}>{item.storeName}</span>
              <span className={`${styles.badge} ${BADGE_CLASS[item.status]}`}>
                {t.status[item.status]}
              </span>
            </div>
            {item.createdAt ? (
              <span className={styles.meta}>
                {t.historySubmitted.replace("{date}", formatHistoryDate(item.createdAt, locale))}
              </span>
            ) : null}
            {item.reviewedAt ? (
              <span className={styles.meta}>
                {t.historyReviewed.replace("{date}", formatHistoryDate(item.reviewedAt, locale))}
              </span>
            ) : null}
            {item.reviewNotes ? (
              <span className={styles.notes}>
                {t.historyReviewNotes.replace("{notes}", item.reviewNotes)}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {hasMore ? (
        <div className={styles.actions}>
          <button
            type="button"
            className={profileStyles.btnSecondary}
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? t.historyLoadingMore : t.historyLoadMore}
          </button>
        </div>
      ) : null}
    </>
  );
}
