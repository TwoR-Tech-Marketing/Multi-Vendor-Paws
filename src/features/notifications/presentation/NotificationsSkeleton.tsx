import { Strings } from "@/constants/strings";
import { SkeletonBox, SkeletonText } from "@/components/ui/skeleton";

import styles from "./notifications.module.css";
import skeletonStyles from "./notificationsSkeleton.module.css";

export function NotificationsSkeleton() {
  return (
    <section
      className={styles.section}
      role="status"
      aria-label={Strings.common.loading}
      aria-busy="true"
    >
      <div className={skeletonStyles.header}>
        <SkeletonText width={220} />
        <SkeletonBox width={160} height={48} borderRadius="7px" />
      </div>

      <div className={skeletonStyles.tabs}>
        <SkeletonBox width={80} height={48} borderRadius="var(--radius-sm)" />
        <SkeletonBox width={96} height={48} borderRadius="var(--radius-sm)" />
      </div>

      <div className={skeletonStyles.list}>
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBox key={index} className={skeletonStyles.card} height={120} />
        ))}
      </div>
    </section>
  );
}
