import { SkeletonBox, SkeletonText } from "@/components/ui/skeleton";
import { Strings } from "@/constants/strings";

import styles from "./earningsSkeleton.module.css";

export function EarningsSkeleton() {
  return (
    <section
      className={styles.sectionStack}
      role="status"
      aria-label={Strings.common.loading}
      aria-busy="true"
    >
      <div className={styles.statsGrid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBox key={index} className={styles.statSkeleton} />
        ))}
      </div>
      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <SkeletonText width="28%" />
        </div>
        <EarningsRowsSkeleton />
      </article>
    </section>
  );
}

/** Ledger rows only, shown while a type tab loads. */
export function EarningsRowsSkeleton({ label }: { label?: string }) {
  return (
    <div role={label ? "status" : undefined} aria-label={label} aria-busy={label ? true : undefined}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={styles.row}>
          <SkeletonText width="70%" />
          <SkeletonText width="50%" />
          <SkeletonText width="80%" />
          <SkeletonText width="60%" />
          <SkeletonText width="60%" />
          <SkeletonText width="60%" />
        </div>
      ))}
    </div>
  );
}
