import {
  SkeletonBox,
  SkeletonButton,
  SkeletonField,
  SkeletonFormField,
  SkeletonListRow,
  SkeletonText,
} from "@/components/ui/skeleton";
import { Strings } from "@/constants/strings";

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
        <SkeletonButton width={160} />
      </div>

      <div className={skeletonStyles.tabs}>
        <SkeletonBox width={80} height={48} borderRadius="var(--radius-sm)" />
        <SkeletonBox width={96} height={48} borderRadius="var(--radius-sm)" />
      </div>

      <div className={skeletonStyles.list}>
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={index} className={skeletonStyles.card}>
            <SkeletonListRow
              avatarSize={44}
              titleWidth={index % 2 === 0 ? "68%" : "58%"}
              bodyWidth={index % 2 === 0 ? "44%" : "52%"}
              metaWidth={48}
            />
            <SkeletonField width="100%" />
          </article>
        ))}
      </div>
    </section>
  );
}
