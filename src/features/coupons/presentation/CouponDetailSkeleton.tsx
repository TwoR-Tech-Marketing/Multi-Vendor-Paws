"use client";

import { SkeletonButton, SkeletonText } from "@/components/ui/skeleton";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./coupons.module.css";

function StatSkeleton() {
  return (
    <div className={styles.stat}>
      <SkeletonText size="sm" width="60%" />
      <SkeletonText size="lg" width="40%" />
    </div>
  );
}

function RedemptionRowSkeleton() {
  return (
    <div className={styles.skeletonRow}>
      <SkeletonText size="sm" width="20%" />
      <SkeletonText size="sm" width="16%" />
      <SkeletonText size="sm" width="14%" />
      <SkeletonText size="sm" width="14%" />
      <SkeletonText size="sm" width={64} />
    </div>
  );
}

export function CouponDetailSkeleton() {
  const strings = useStrings();
  return (
    <div className={styles.stack} role="status" aria-busy="true" aria-label={strings.common.loading}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <SkeletonText size="xl" width={180} />
          <SkeletonText size="sm" width={64} />
        </div>
        <SkeletonText size="md" width="30%" />
        <SkeletonText size="sm" width="45%" />
        <SkeletonText size="sm" width="35%" />
        <div className={styles.actions}>
          <SkeletonButton width={120} />
          <SkeletonButton width={96} />
        </div>
      </div>
      <div className={styles.panel}>
        <SkeletonText size="lg" width={100} />
        <div className={styles.statGrid}>
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      </div>
      <div className={styles.panel}>
        <SkeletonText size="lg" width={140} />
        <RedemptionRowSkeleton />
        <RedemptionRowSkeleton />
        <RedemptionRowSkeleton />
      </div>
    </div>
  );
}
