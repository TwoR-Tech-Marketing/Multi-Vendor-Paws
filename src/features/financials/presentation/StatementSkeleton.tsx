import { SkeletonBox, SkeletonText } from "@/components/ui/skeleton";

import styles from "./statement.module.css";

const PERIOD_ROWS = 7;

function PeriodCardSkeleton() {
  return (
    <article className={styles.periodCard}>
      <div className={styles.periodHeader}>
        <SkeletonText width="40%" />
        <SkeletonBox className={styles.badgeSkeleton} />
      </div>
      <div className={styles.columns}>
        {Array.from({ length: PERIOD_ROWS }).map((_, index) => (
          <div key={index} className={styles.columnRow}>
            <SkeletonText size="sm" width="45%" />
            <SkeletonText size="sm" width="25%" />
          </div>
        ))}
      </div>
    </article>
  );
}

/** One shimmer per visible shape of the statement page. */
export function StatementSkeleton({ label }: { label?: string }) {
  return (
    <section className={styles.sectionStack} role="status" aria-label={label} aria-busy="true">
      <div className={styles.summaryGrid}>
        {Array.from({ length: 2 }).map((_, index) => (
          <article key={index} className={styles.summaryCard}>
            <SkeletonText size="sm" width="40%" />
            <SkeletonText size="xl" width="60%" />
          </article>
        ))}
      </div>
      <SkeletonText size="lg" width="30%" />
      {Array.from({ length: 3 }).map((_, index) => (
        <PeriodCardSkeleton key={index} />
      ))}
    </section>
  );
}
