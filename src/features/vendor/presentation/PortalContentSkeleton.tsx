import {
  SkeletonFormField,
  SkeletonIcon,
  SkeletonText,
} from "@/components/ui/skeleton";
import { Strings } from "@/constants/strings";

import styles from "./portalContentSkeleton.module.css";

function StatCardSkeleton() {
  return (
    <article className={styles.statCard}>
      <div className={styles.statHeader}>
        <SkeletonIcon size={20} />
        <SkeletonText width="52%" />
      </div>
      <SkeletonText size="xl" width="38%" />
      <SkeletonText size="sm" width="64%" />
    </article>
  );
}

function PanelSkeleton({ fieldCount }: { fieldCount: number }) {
  return (
    <article className={styles.panel}>
      <SkeletonText size="lg" width="46%" />
      <div className={styles.divider} aria-hidden />
      <div className={styles.panelFields}>
        {Array.from({ length: fieldCount }).map((_, index) => (
          <SkeletonFormField
            key={index}
            labelWidth={index % 2 === 0 ? "34%" : "42%"}
          />
        ))}
      </div>
    </article>
  );
}

export function PortalContentSkeleton() {
  return (
    <section role="status" aria-label={Strings.common.loading} aria-busy="true">
      <div className={styles.statsRow}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className={styles.panelGrid}>
        <PanelSkeleton fieldCount={4} />
        <PanelSkeleton fieldCount={3} />
      </div>
    </section>
  );
}
