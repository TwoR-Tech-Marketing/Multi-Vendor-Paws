"use client";

import { SkeletonButton, SkeletonText } from "@/components/ui/skeleton";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./coupons.module.css";

function CouponRowSkeleton() {
  return (
    <div className={styles.skeletonRow}>
      <SkeletonText size="md" width="14%" />
      <SkeletonText size="sm" width="16%" />
      <SkeletonText size="sm" width={64} />
      <SkeletonText size="sm" width="10%" />
      <SkeletonText size="sm" width="12%" />
      <SkeletonButton width={72} />
      <SkeletonButton width={72} />
    </div>
  );
}

export function CouponsSkeleton() {
  const strings = useStrings();
  return (
    <div className={styles.stack} role="status" aria-busy="true" aria-label={strings.common.loading}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <SkeletonText size="lg" width={140} />
          <SkeletonButton width={140} />
        </div>
        <div className={styles.tabs}>
          <SkeletonButton width={64} />
          <SkeletonButton width={72} />
          <SkeletonButton width={72} />
          <SkeletonButton width={72} />
          <SkeletonButton width={80} />
        </div>
        <CouponRowSkeleton />
        <CouponRowSkeleton />
        <CouponRowSkeleton />
        <CouponRowSkeleton />
      </div>
    </div>
  );
}
