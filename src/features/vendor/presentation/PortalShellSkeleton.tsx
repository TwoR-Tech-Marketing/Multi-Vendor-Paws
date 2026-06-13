import { skeletonClassName } from "@/components/ui/skeleton";
import { Strings } from "@/constants/strings";

import styles from "./portal.module.css";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={skeletonClassName(styles.skeletonBlock, className)} />;
}

export function PortalShellSkeleton() {
  return (
    <div className={styles.skeletonShell} role="status" aria-label={Strings.common.loading}>
      <aside className={styles.skeletonSidebar}>
        <SkeletonBlock className={styles.skeletonBrand} />
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className={styles.skeletonNavItem} />
        ))}
      </aside>
      <div className={styles.skeletonMain}>
        <SkeletonBlock className={styles.skeletonTopbar} />
        <SkeletonBlock className={styles.skeletonPanel} />
      </div>
    </div>
  );
}
