"use client";

import { SkeletonButton, SkeletonFormField, SkeletonText } from "@/components/ui/skeleton";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./reviews.module.css";

function ReviewRowSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardWho}>
          <SkeletonText size="md" width={96} />
          <SkeletonText size="sm" width={120} />
        </div>
        <SkeletonText size="sm" width={140} />
      </div>
      <div className={styles.scores}>
        <SkeletonText size="sm" width={110} />
        <SkeletonText size="sm" width={110} />
        <SkeletonText size="sm" width={110} />
      </div>
      <SkeletonText size="sm" width="80%" />
      <SkeletonText size="sm" width="50%" />
    </div>
  );
}

/** Rows only, for a list reloading inside a loaded screen. */
export function ReviewListSkeleton() {
  return (
    <div className={styles.list} aria-hidden>
      <ReviewRowSkeleton />
      <ReviewRowSkeleton />
      <ReviewRowSkeleton />
    </div>
  );
}

export function ReviewsSkeleton() {
  const strings = useStrings();
  return (
    <div className={branchStyles.stack} role="status" aria-busy="true" aria-label={strings.common.loading}>
      <div className={branchStyles.panel}>
        <div className={styles.filters}>
          <div className={styles.chips}>
            <SkeletonButton width={72} />
            <SkeletonButton width={112} />
            <SkeletonButton width={112} />
          </div>
          <div className={styles.branchField}>
            <SkeletonFormField labelWidth={56} />
          </div>
        </div>
        <ReviewListSkeleton />
      </div>
    </div>
  );
}
