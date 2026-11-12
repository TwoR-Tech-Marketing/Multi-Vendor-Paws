"use client";

import { SkeletonBox, SkeletonButton, SkeletonText } from "@/components/ui/skeleton";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./branches.module.css";

function ServiceRowSkeleton() {
  return (
    <div className={styles.skeletonRow}>
      <SkeletonBox width={48} height={48} borderRadius="var(--radius-sm)" />
      <SkeletonText size="md" width="30%" />
      <SkeletonText size="sm" width="15%" />
      <SkeletonText size="sm" width="12%" />
      <SkeletonText size="sm" width={56} />
    </div>
  );
}

export function BranchDetailSkeleton() {
  const strings = useStrings();
  return (
    <div className={styles.stack} role="status" aria-busy="true" aria-label={strings.common.loading}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <SkeletonText size="xl" width="40%" />
          <SkeletonText size="sm" width={56} />
        </div>
        <SkeletonText size="sm" width="70%" />
        <SkeletonText size="sm" width="30%" />
        <div className={styles.actions}>
          <SkeletonButton width={120} />
          <SkeletonButton width={120} />
        </div>
      </div>
      <div className={styles.panel}>
        <SkeletonText size="lg" width={120} />
        <SkeletonText size="md" width="40%" />
        <SkeletonText size="sm" width="60%" />
      </div>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <SkeletonText size="lg" width={120} />
          <SkeletonButton width={120} />
        </div>
        <ServiceRowSkeleton />
        <ServiceRowSkeleton />
        <ServiceRowSkeleton />
      </div>
    </div>
  );
}
