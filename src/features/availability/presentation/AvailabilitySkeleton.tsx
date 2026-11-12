"use client";

import { SkeletonButton, SkeletonField, SkeletonText } from "@/components/ui/skeleton";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./availability.module.css";

function DayRowSkeleton() {
  return (
    <div className={styles.skeletonDayRow}>
      <SkeletonText size="md" width={96} />
      <SkeletonField className={styles.timeSelect} />
      <SkeletonField className={styles.timeSelect} />
      <SkeletonButton width={88} />
    </div>
  );
}

export function AvailabilitySkeleton() {
  const strings = useStrings();
  return (
    <div className={branchStyles.stack} role="status" aria-busy="true" aria-label={strings.common.loading}>
      <div className={branchStyles.panel}>
        <SkeletonText size="xl" width="35%" />
        <div className={styles.tabs}>
          <SkeletonButton width={110} />
          <SkeletonButton width={110} />
          <SkeletonButton width={160} />
          <SkeletonButton width={90} />
        </div>
      </div>
      <div className={branchStyles.panel}>
        <SkeletonText size="lg" width={160} />
        {Array.from({ length: 7 }, (_, i) => (
          <DayRowSkeleton key={i} />
        ))}
      </div>
      <div className={branchStyles.panel}>
        <div className={styles.capacityRow}>
          <SkeletonText size="md" width={200} />
          <SkeletonButton width={140} />
        </div>
        <div className={styles.saveBar}>
          <SkeletonText size="sm" width={160} />
          <SkeletonButton width={130} />
        </div>
      </div>
    </div>
  );
}
