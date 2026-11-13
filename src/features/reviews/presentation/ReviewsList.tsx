import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import type { VendorReview } from "@/features/reviews/domain/types";
import { ReviewCard } from "@/features/reviews/presentation/ReviewCard";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./reviews.module.css";

type ReviewsListProps = {
  items: VendorReview[];
  strings: AppStrings;
  locale: AppLocale;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onReply: (review: VendorReview) => void;
};

/** Review rows with load more paging. Pure. */
export function ReviewsList({
  items,
  strings,
  locale,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onReply,
}: ReviewsListProps) {
  const t = strings.reviews;
  if (items.length === 0) {
    return (
      <EmptyState headingLevel={2} live title={t.emptyTitle} description={t.emptyDescription} />
    );
  }
  return (
    <>
      <ul className={styles.list}>
        {items.map((review) => (
          <li key={review.appointmentId}>
            <ReviewCard review={review} strings={strings} locale={locale} onReply={onReply} />
          </li>
        ))}
      </ul>
      {hasMore ? (
        <div className={branchStyles.actions}>
          <button
            type="button"
            className={branchStyles.secondaryButton}
            disabled={isLoadingMore}
            onClick={onLoadMore}
          >
            {isLoadingMore ? t.loadingMore : t.loadMore}
          </button>
        </div>
      ) : null}
    </>
  );
}
