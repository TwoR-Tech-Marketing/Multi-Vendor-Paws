import { Strings } from "@/constants/strings";
import { SkeletonBox, SkeletonText } from "@/components/ui/skeleton";

import styles from "./auth.module.css";
import skeletonStyles from "./authSkeleton.module.css";

export function AuthPageSkeleton() {
  return (
    <main className={styles.page} role="status" aria-label={Strings.common.loading}>
      <section className={`${styles.card} ${skeletonStyles.card}`}>
        <div className={skeletonStyles.brand}>
          <SkeletonBox width={56} height={56} borderRadius="var(--radius)" />
          <SkeletonText size="lg" width="60%" className={skeletonStyles.title} />
          <SkeletonText size="sm" width="85%" className={skeletonStyles.subtitle} />
        </div>
        <SkeletonBox className={skeletonStyles.field} height={48} />
        <SkeletonBox className={skeletonStyles.field} height={48} />
        <SkeletonBox className={skeletonStyles.submit} height={48} />
        <SkeletonText size="sm" width="70%" className={skeletonStyles.footer} />
      </section>
    </main>
  );
}
