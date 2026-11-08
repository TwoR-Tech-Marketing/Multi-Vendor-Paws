"use client";

import { SkeletonBox, SkeletonButton, SkeletonText } from "@/components/ui/skeleton";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./coverage.module.css";

export function CoverageSkeleton() {
  const strings = useStrings();
  return (
    <div
      className={styles.sectionStack}
      role="status"
      aria-busy="true"
      aria-label={strings.common.loading}
    >
      <div className={styles.panel}>
        <SkeletonText size="lg" />
        <SkeletonText size="sm" />
        <div className={styles.modeRow}>
          <SkeletonButton />
          <SkeletonButton />
        </div>
        <SkeletonBox height={280} />
        <div className={styles.fieldGrid}>
          <SkeletonBox height={40} />
          <SkeletonBox height={40} />
          <SkeletonBox height={40} />
        </div>
        <SkeletonButton />
      </div>
    </div>
  );
}
