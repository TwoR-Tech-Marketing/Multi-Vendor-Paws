import { SkeletonButton, SkeletonText } from "@/components/ui/skeleton";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./providerDashboard.module.css";

function BarRowSkeleton() {
  return (
    <div className={styles.shareRow}>
      <div className={styles.shareLegend}>
        <SkeletonText size="sm" width={120} />
        <SkeletonText size="sm" width={32} />
      </div>
      <SkeletonText size="sm" width="100%" />
    </div>
  );
}

/** One shimmer per shape: preset buttons, two stat cards, bars, rating lines. */
export function ProviderDashboardSkeleton({ strings }: { strings: AppStrings }) {
  return (
    <div className={styles.stack} role="status" aria-busy="true" aria-label={strings.common.loading}>
      <div className={styles.chips}>
        <SkeletonButton width={80} />
        <SkeletonButton width={88} />
        <SkeletonButton width={88} />
      </div>
      <div className={styles.statsGrid}>
        {[0, 1].map((i) => (
          <div key={i} className={styles.card}>
            <SkeletonText size="sm" width={96} />
            <SkeletonText size="xl" width={64} />
          </div>
        ))}
      </div>
      <div className={styles.twoColumns}>
        <div className={styles.card}>
          <SkeletonText size="lg" width={140} />
          <BarRowSkeleton />
          <BarRowSkeleton />
          <BarRowSkeleton />
        </div>
        <div className={styles.card}>
          <SkeletonText size="lg" width={96} />
          <SkeletonText size="md" width={160} />
          <BarRowSkeleton />
          <BarRowSkeleton />
          <BarRowSkeleton />
        </div>
      </div>
    </div>
  );
}
