import Link from "next/link";

import { Routes } from "@/constants/routes";
import { topTags } from "@/features/provider-dashboard/domain/stats";
import type { DashboardRating } from "@/features/provider-dashboard/domain/types";
import { formatTenths, ratingBarPercent } from "@/features/reviews/domain/rating";
import { StarRating } from "@/features/reviews/presentation/StarRating";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./providerDashboard.module.css";

type RatingCardProps = {
  rating: DashboardRating;
  strings: AppStrings;
};

/** All time overall rating, per category bars, top tags and the reviews link. */
export function RatingCard({ rating, strings }: RatingCardProps) {
  const t = strings.dashboard.provider;
  const tags = topTags(rating.tagCounts);
  return (
    <section className={styles.card} aria-labelledby="provider-rating-title">
      <div className={styles.cardHeader}>
        <h2 id="provider-rating-title" className={styles.cardTitle}>
          {t.rating}
        </h2>
        <Link href={Routes.vendor.reviews} className={styles.link}>
          {t.viewReviews}
        </Link>
      </div>
      {rating.count === 0 ? (
        <p className={styles.muted}>{t.ratingEmpty}</p>
      ) : (
        <>
          <div className={styles.overall}>
            <span className={styles.overallLabel}>{strings.reviews.overall}</span>
            <StarRating tenths={rating.overallTenths} strings={strings} />
            <span className={styles.muted}>
              {strings.reviews.count.replace("{count}", String(rating.count))}
            </span>
          </div>
          <ul className={styles.shareList}>
            {rating.categories.map((category) => (
              <li key={category.id} className={styles.shareRow}>
                <div className={styles.shareLegend}>
                  <span className={styles.shareName}>{strings.reviews.categories[category.id]}</span>
                  <span className={styles.sharePercent}>{formatTenths(category.averageTenths)}</span>
                </div>
                <span className={styles.barTrack} aria-hidden>
                  <span
                    className={styles.barFill}
                    style={{ inlineSize: `${ratingBarPercent(category.averageTenths)}%` }}
                  />
                </span>
              </li>
            ))}
          </ul>
          {tags.length > 0 ? (
            <div className={styles.tagBlock}>
              <span className={styles.overallLabel}>{t.topTags}</span>
              <ul className={styles.tags}>
                {tags.map((tag) => (
                  <li key={tag.id} className={styles.tag}>
                    {t.tagCount
                      .replace("{tag}", strings.reviews.tags[tag.id])
                      .replace("{count}", String(tag.count))}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
