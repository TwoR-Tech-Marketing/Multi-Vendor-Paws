import { skeletonClassName } from "@/components/ui/skeleton";
import { Strings } from "@/constants/strings";

import styles from "./portal.module.css";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={skeletonClassName(styles.skeletonBlock, className)} />;
}

export function PortalContentSkeleton() {
  return (
    <div
      className={styles.contentSkeleton}
      role="status"
      aria-label={Strings.common.loading}
    >
      <SkeletonBlock className={styles.contentSkeletonTitle} />
      <SkeletonBlock className={styles.contentSkeletonPanel} />
    </div>
  );
}
