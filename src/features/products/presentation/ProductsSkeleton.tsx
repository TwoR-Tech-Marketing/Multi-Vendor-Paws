import {
  SkeletonBox,
  SkeletonButton,
  SkeletonText,
} from "@/components/ui/skeleton";
import { Strings } from "@/constants/strings";

import styles from "./productsSkeleton.module.css";

export function ProductsSkeleton() {
  return (
    <section
      className={styles.sectionStack}
      role="status"
      aria-label={Strings.common.loading}
      aria-busy="true"
    >
      <div className={styles.commandBar}>
        <div className={styles.commandBarFilters}>
          <SkeletonBox className={styles.filterSkeleton} />
          <SkeletonBox className={styles.filterSkeleton} />
        </div>
        <div className={styles.commandBarActions}>
          <SkeletonBox className={styles.searchSkeleton} />
          <SkeletonButton width={140} />
        </div>
      </div>

      <article className={styles.panel}>
        <div className={styles.tableHeader}>
          <SkeletonText width="12%" />
          <SkeletonText width="10%" />
          <SkeletonText width="8%" />
          <SkeletonText width="8%" />
          <SkeletonText width="10%" />
          <SkeletonText width="8%" />
        </div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={styles.row}>
            <div className={styles.productCell}>
              <SkeletonBox className={styles.thumbSkeleton} />
              <div className={styles.productLines}>
                <SkeletonText width="72%" />
                <SkeletonText size="sm" width="48%" />
              </div>
            </div>
            <SkeletonText width="60%" />
            <SkeletonText width="50%" />
            <SkeletonText width="40%" />
            <SkeletonText width="56%" />
            <div className={styles.actions}>
              <SkeletonBox className={styles.actionSkeleton} />
              <SkeletonBox className={styles.actionSkeleton} />
            </div>
          </div>
        ))}
      </article>
    </section>
  );
}
