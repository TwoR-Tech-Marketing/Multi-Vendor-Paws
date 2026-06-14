import { SkeletonBox, SkeletonText } from "@/components/ui/skeleton";
import { Strings } from "@/constants/strings";

import styles from "./ordersSkeleton.module.css";

export function OrdersSkeleton() {
  return (
    <section
      className={styles.sectionStack}
      role="status"
      aria-label={Strings.common.loading}
      aria-busy="true"
    >
      <SkeletonBox className={styles.filterSkeleton} />
      <article className={styles.panel}>
        <div className={styles.tableHeader}>
          <SkeletonText width="12%" />
          <SkeletonText width="14%" />
          <SkeletonText width="8%" />
          <SkeletonText width="10%" />
          <SkeletonText width="12%" />
          <SkeletonText width="16%" />
          <SkeletonText width="10%" />
        </div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={styles.row}>
            <SkeletonText width="70%" />
            <SkeletonText width="60%" />
            <SkeletonText width="40%" />
            <SkeletonText width="50%" />
            <SkeletonText width="56%" />
            <SkeletonText width="72%" />
            <SkeletonBox className={styles.actionSkeleton} />
          </div>
        ))}
      </article>
    </section>
  );
}
