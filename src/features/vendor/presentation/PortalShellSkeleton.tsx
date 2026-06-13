import { Strings } from "@/constants/strings";

import styles from "./portal.module.css";

export function PortalShellSkeleton() {
  return (
    <div className={styles.skeletonShell} role="status" aria-label={Strings.common.loading}>
      <aside className={styles.skeletonSidebar}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonBrand}`} />
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={`${styles.skeletonBlock} ${styles.skeletonNavItem}`} />
        ))}
      </aside>
      <div className={styles.skeletonMain}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonTopbar}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonPanel}`} />
      </div>
    </div>
  );
}
