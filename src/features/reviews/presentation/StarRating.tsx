import { filledStars, formatTenths } from "@/features/reviews/domain/rating";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./reviews.module.css";

type StarRatingProps = {
  tenths: number | null;
  strings: AppStrings;
};

/** Five stars filled half up plus the one decimal value. The label carries the meaning. */
export function StarRating({ tenths, strings }: StarRatingProps) {
  const value = formatTenths(tenths);
  const filled = filledStars(tenths);
  return (
    <span className={styles.stars} role="img" aria-label={strings.reviews.stars.replace("{rating}", value)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden className={n <= filled ? styles.starFilled : styles.star} />
      ))}
      <span aria-hidden className={styles.starValue}>
        {value}
      </span>
    </span>
  );
}
