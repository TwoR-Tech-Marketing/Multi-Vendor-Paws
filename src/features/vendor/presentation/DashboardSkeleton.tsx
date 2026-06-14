import { SkeletonBox, SkeletonText } from "@/components/ui/skeleton";
import { Strings } from "@/constants/strings";

import styles from "./dashboard.module.css";

export function DashboardSkeleton() {
  return (
    <section
      className={styles.sectionStack}
      role="status"
      aria-label={Strings.common.loading}
      aria-busy="true"
    >
      <div className={styles.statsGrid}>
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBox key={index} className={styles.statSkeleton} />
        ))}
      </div>
      <SkeletonText width="40%" />
    </section>
  );
}
