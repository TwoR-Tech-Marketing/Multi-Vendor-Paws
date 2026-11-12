import { SkeletonBox, SkeletonText } from "@/components/ui/skeleton";

import styles from "./deals.module.css";

const TERM_ROWS = 3;
const BRANCH_ROWS = 3;
const BRANCH_COLUMNS = 4;

function CardHeaderSkeleton() {
  return (
    <div className={styles.cardHeader}>
      <SkeletonText size="lg" width="35%" />
      <SkeletonBox className={styles.badgeSkeleton} />
    </div>
  );
}

/** One shimmer per visible shape of the deal page. */
export function DealSkeleton({ label, withBranches = false }: { label?: string; withBranches?: boolean }) {
  return (
    <section className={styles.sectionStack} role="status" aria-label={label} aria-busy="true">
      <div className={styles.linkRow}>
        <SkeletonText size="sm" width="20%" />
        <SkeletonText size="sm" width="20%" />
      </div>
      <article className={styles.card}>
        <CardHeaderSkeleton />
        <div className={styles.terms}>
          {Array.from({ length: TERM_ROWS }).map((_, index) => (
            <div key={index} className={styles.termRow}>
              <SkeletonText size="sm" width="40%" />
              <SkeletonText size="sm" width="25%" />
            </div>
          ))}
        </div>
        <div className={styles.notes}>
          <SkeletonText size="sm" width="70%" />
          <SkeletonText size="sm" width="55%" />
        </div>
      </article>
      {withBranches ? (
        <article className={styles.card}>
          <CardHeaderSkeleton />
          <div className={styles.skeletonRows}>
            {Array.from({ length: BRANCH_ROWS }).map((_, row) => (
              <div key={row} className={styles.skeletonRow}>
                {Array.from({ length: BRANCH_COLUMNS }).map((__, column) => (
                  <SkeletonText key={column} size="sm" width="70%" />
                ))}
              </div>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  );
}
