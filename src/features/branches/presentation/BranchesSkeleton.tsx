"use client";

import { SkeletonButton, SkeletonText } from "@/components/ui/skeleton";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./branches.module.css";

function BranchCardSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitleRow}>
        <SkeletonText size="lg" width="60%" />
        <SkeletonText size="sm" width={56} />
      </div>
      <SkeletonText size="sm" width="90%" />
      <div className={styles.badgeRow}>
        <SkeletonText size="sm" width={80} />
        <SkeletonText size="sm" width={80} />
      </div>
      <SkeletonText size="sm" width="70%" />
      <div className={styles.actions}>
        <SkeletonButton width={120} />
        <SkeletonButton width={120} />
      </div>
    </div>
  );
}

export function BranchesSkeleton() {
  const strings = useStrings();
  return (
    <div className={styles.stack} role="status" aria-busy="true" aria-label={strings.common.loading}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <SkeletonText size="lg" width={160} />
          <SkeletonButton width={120} />
        </div>
        <div className={styles.grid}>
          <BranchCardSkeleton />
          <BranchCardSkeleton />
          <BranchCardSkeleton />
        </div>
      </div>
    </div>
  );
}
