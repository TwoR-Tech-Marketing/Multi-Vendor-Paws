import { SkeletonText } from "@/components/ui/skeleton";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./profileHistory.module.css";

function HistoryRowSkeleton() {
  return (
    <div className={styles.skeletonRow}>
      <div className={styles.skeletonHeader}>
        <SkeletonText size="md" width="40%" />
        <SkeletonText size="sm" width={96} />
      </div>
      <SkeletonText size="sm" width="30%" />
    </div>
  );
}

export function ProfileHistorySkeleton({ strings }: { strings: AppStrings }) {
  return (
    <div className={styles.list} role="status" aria-busy="true" aria-label={strings.common.loading}>
      <HistoryRowSkeleton />
      <HistoryRowSkeleton />
      <HistoryRowSkeleton />
    </div>
  );
}
