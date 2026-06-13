import { Strings } from "@/constants/strings";

import styles from "./portal.module.css";

export function PortalContentSkeleton() {
  return (
    <div
      className={styles.contentSkeleton}
      role="status"
      aria-label={Strings.common.loading}
    >
      <div className={`${styles.skeletonBlock} ${styles.contentSkeletonTitle}`} />
      <div className={`${styles.skeletonBlock} ${styles.contentSkeletonPanel}`} />
    </div>
  );
}
