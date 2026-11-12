"use client";

import {
  SkeletonAvatar,
  SkeletonBox,
  SkeletonButton,
  SkeletonField,
  SkeletonText,
} from "@/components/ui/skeleton";
import { TELEHEALTH_PHOTO_THUMB_PX } from "@/features/telehealth/domain/types";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./telehealth.module.css";

function ConsultationRowSkeleton() {
  return (
    <div className={styles.skeletonRow}>
      <div className={styles.skeletonLines}>
        <SkeletonText size="md" width="30%" />
        <SkeletonText size="sm" width="70%" />
        <SkeletonText size="sm" width="40%" />
      </div>
      <SkeletonButton width={96} />
    </div>
  );
}

/** Rows only, for a tab that is reloading inside a loaded inbox. */
export function TelehealthListSkeleton() {
  return (
    <div aria-hidden>
      <ConsultationRowSkeleton />
      <ConsultationRowSkeleton />
      <ConsultationRowSkeleton />
    </div>
  );
}

export function TelehealthInboxSkeleton() {
  const strings = useStrings();
  return (
    <div className={styles.stack} role="status" aria-busy="true" aria-label={strings.common.loading}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <SkeletonText size="lg" width={160} />
          <SkeletonText size="sm" width={96} />
        </div>
        <div className={styles.tabs}>
          <SkeletonButton width={80} />
          <SkeletonButton width={72} />
          <SkeletonButton width={72} />
        </div>
        <TelehealthListSkeleton />
      </div>
    </div>
  );
}

function BubbleSkeleton({ own }: { own?: boolean }) {
  return (
    <div className={`${styles.bubbleRow} ${own ? styles.bubbleRowOwn : ""}`}>
      <div className={styles.skeletonLines} style={{ maxWidth: "50%" }}>
        <SkeletonText size="md" width="100%" />
        <SkeletonText size="sm" width={48} />
      </div>
    </div>
  );
}

export function TelehealthChatSkeleton() {
  const strings = useStrings();
  return (
    <div className={styles.stack} role="status" aria-busy="true" aria-label={strings.common.loading}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.skeletonRow}>
            <SkeletonAvatar size={40} />
            <div className={styles.skeletonLines}>
              <SkeletonText size="lg" width={180} />
              <SkeletonText size="sm" width={120} />
            </div>
          </div>
          <SkeletonButton width={160} />
        </div>
        <div className={styles.intake}>
          <SkeletonText size="sm" width={140} />
          <SkeletonText size="md" width="80%" />
        </div>
        <div className={styles.messages}>
          <BubbleSkeleton />
          <BubbleSkeleton own />
          <BubbleSkeleton />
          <div className={styles.bubbleRow}>
            <SkeletonBox width={TELEHEALTH_PHOTO_THUMB_PX} height={TELEHEALTH_PHOTO_THUMB_PX} />
          </div>
        </div>
        <div className={styles.composer}>
          <SkeletonButton width={120} />
          <SkeletonField />
          <SkeletonButton width={80} />
        </div>
      </div>
    </div>
  );
}
