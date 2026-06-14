import { SkeletonBox, SkeletonText } from "@/components/ui/skeleton";
import { Strings } from "@/constants/strings";

import styles from "./productsSkeleton.module.css";

export function CategoriesSkeleton() {
  return (
    <section
      className={styles.sectionStack}
      role="status"
      aria-label={Strings.common.loading}
      aria-busy="true"
    >
      <SkeletonText width="72%" />

      <article className={styles.panel}>
        <div className={styles.tableHeader}>
          <SkeletonText width="28%" />
          <SkeletonText width="18%" />
          <SkeletonText width="22%" />
        </div>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={styles.categoryRow}>
            <SkeletonText width="40%" />
            <SkeletonText width="24%" />
            <SkeletonBox className={styles.categoryActionSkeleton} />
          </div>
        ))}
      </article>
    </section>
  );
}
