"use client";

import { SkeletonButton, SkeletonFormField, SkeletonText } from "@/components/ui/skeleton";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./appointments.module.css";

function RowSkeleton() {
  return (
    <div className={styles.skeletonRow}>
      <div className={styles.skeletonLines}>
        <SkeletonText size="md" width="40%" />
        <SkeletonText size="sm" width="60%" />
        <SkeletonText size="sm" width="30%" />
      </div>
      <div className={styles.skeletonLines}>
        <SkeletonText size="sm" width={72} />
        <SkeletonButton width={88} />
      </div>
    </div>
  );
}

/** Rows only, for a list reloading inside a loaded inbox. */
export function AppointmentListSkeleton() {
  return (
    <div aria-hidden>
      <RowSkeleton />
      <RowSkeleton />
      <RowSkeleton />
      <RowSkeleton />
    </div>
  );
}

export function AppointmentsInboxSkeleton() {
  const strings = useStrings();
  return (
    <div className={branchStyles.stack} role="status" aria-busy="true" aria-label={strings.common.loading}>
      <div className={branchStyles.panel}>
        <div className={styles.chips}>
          <SkeletonButton width={96} />
          <SkeletonButton width={104} />
          <SkeletonButton width={96} />
          <SkeletonButton width={88} />
          <SkeletonButton width={88} />
          <SkeletonButton width={64} />
        </div>
        <div className={styles.filterGrid}>
          <SkeletonFormField labelWidth={64} />
          <SkeletonFormField labelWidth={48} />
        </div>
        <AppointmentListSkeleton />
      </div>
    </div>
  );
}

export function AppointmentDetailSkeleton() {
  const strings = useStrings();
  return (
    <div className={branchStyles.stack} role="status" aria-busy="true" aria-label={strings.common.loading}>
      <div className={branchStyles.panel}>
        <div className={branchStyles.panelHeader}>
          <SkeletonText size="lg" width={160} />
          <SkeletonText size="sm" width={96} />
        </div>
        <SkeletonText size="sm" width="50%" />
        <div className={styles.details}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.detailItem}>
              <SkeletonText size="sm" width={64} />
              <SkeletonText size="md" width="70%" />
            </div>
          ))}
        </div>
      </div>
      <div className={branchStyles.panel}>
        <SkeletonText size="lg" width={120} />
        <SkeletonText size="md" width="80%" />
        <SkeletonText size="md" width="60%" />
        <SkeletonText size="md" width="40%" />
      </div>
      <div className={branchStyles.panel}>
        <SkeletonText size="lg" width={100} />
        <div className={styles.chips}>
          <SkeletonButton width={152} />
          <SkeletonButton width={128} />
          <SkeletonButton width={112} />
        </div>
      </div>
    </div>
  );
}
