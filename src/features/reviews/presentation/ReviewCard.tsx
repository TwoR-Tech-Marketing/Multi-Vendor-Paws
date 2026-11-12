import type { VendorReview } from "@/features/reviews/domain/types";
import { StarRating } from "@/features/reviews/presentation/StarRating";
import {
  buyerLabel,
  formatReviewDate,
  serviceName,
} from "@/features/reviews/presentation/reviews-copy";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./reviews.module.css";

type ReviewCardProps = {
  review: VendorReview;
  strings: AppStrings;
  locale: string;
  onReply: (review: VendorReview) => void;
};

/** One review: buyer label, stars, category scores, tags, comment, services, reply. Pure. */
export function ReviewCard({ review, strings, locale, onReply }: ReviewCardProps) {
  const t = strings.reviews;
  const services = review.serviceNames.map((n) => serviceName(n, locale)).join(", ");
  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <div className={styles.cardWho}>
          <p className={styles.buyer}>{buyerLabel(review, strings)}</p>
          <StarRating tenths={review.overallTenths} strings={strings} />
        </div>
        <div className={styles.cardMeta}>
          <span>{t.visitOn.replace("{date}", formatReviewDate(review.appointmentStartAtMs, locale))}</span>
          <span>{t.reviewedOn.replace("{date}", formatReviewDate(review.createdAtMs, locale))}</span>
          {review.editedAtMs !== null ? <span className={styles.edited}>{t.edited}</span> : null}
        </div>
      </header>

      <dl className={styles.scores}>
        {review.ratings.map((rating) => (
          <div key={rating.id} className={styles.score}>
            <dt>{t.categories[rating.id]}</dt>
            <dd>{t.score.replace("{value}", String(rating.value))}</dd>
          </div>
        ))}
      </dl>

      {review.tags.length > 0 ? (
        <ul className={styles.tags}>
          {review.tags.map((tag) => (
            <li key={tag} className={styles.tag}>
              {t.tags[tag]}
            </li>
          ))}
        </ul>
      ) : null}

      {review.comment ? <p className={styles.comment}>{review.comment}</p> : null}
      {services ? <p className={branchStyles.muted}>{services}</p> : null}

      {review.reply ? (
        <div className={styles.reply}>
          <p className={styles.replyLabel}>{t.reply.yourReply}</p>
          <p className={styles.comment}>{review.reply.text}</p>
        </div>
      ) : review.canReply ? (
        <div className={branchStyles.actions}>
          <button type="button" className={branchStyles.secondaryButton} onClick={() => onReply(review)}>
            {t.reply.action}
          </button>
        </div>
      ) : null}
    </article>
  );
}
