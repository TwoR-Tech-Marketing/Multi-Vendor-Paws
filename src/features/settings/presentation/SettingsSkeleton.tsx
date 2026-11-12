import {
  SkeletonBox,
  SkeletonButton,
  SkeletonField,
  SkeletonText,
} from "@/components/ui/skeleton";
import { Strings } from "@/constants/strings";

import styles from "./settingsSkeleton.module.css";

export function SettingsSkeleton() {
  return (
    <section
      className={styles.sectionStack}
      role="status"
      aria-label={Strings.common.loading}
      aria-busy="true"
    >
      <div className={styles.settingsGrid}>
        <article className={styles.panel}>
          <SkeletonText width="35%" size="md" />
          <div className={styles.metaRows}>
            <SkeletonText width="100%" size="sm" />
            <SkeletonText width="100%" size="sm" />
            <SkeletonText width="100%" size="sm" />
          </div>
          <SkeletonButton width="120px" />
        </article>
        <article className={styles.panel}>
          <SkeletonText width="45%" size="md" />
          <SkeletonBox className={styles.commissionSkeleton} />
          <SkeletonText width="90%" size="sm" />
        </article>
      </div>

      <article className={styles.panel}>
        <SkeletonText width="30%" size="md" />
        <div className={styles.snapshotGrid}>
          <SkeletonBox className={styles.snapshotSkeleton} />
          <SkeletonBox className={styles.snapshotSkeleton} />
          <SkeletonBox className={styles.snapshotSkeleton} />
        </div>
      </article>

      <article className={styles.panel}>
        <SkeletonText width="25%" size="md" />
        <div className={styles.shortcutsGrid}>
          <SkeletonBox className={styles.shortcutSkeleton} />
          <SkeletonBox className={styles.shortcutSkeleton} />
          <SkeletonBox className={styles.shortcutSkeleton} />
          <SkeletonBox className={styles.shortcutSkeleton} />
        </div>
      </article>

      <article className={styles.panel} data-skeleton="appearance">
        <SkeletonText width="30%" size="md" />
        <SkeletonText width="15%" size="sm" />
        <div className={styles.themeGrid}>
          <SkeletonBox className={styles.themeSkeleton} />
          <SkeletonBox className={styles.themeSkeleton} />
          <SkeletonBox className={styles.themeSkeleton} />
          <SkeletonBox className={styles.themeSkeleton} />
        </div>
        <SkeletonText width="15%" size="sm" />
        <SkeletonBox className={styles.segmentSkeleton} />
        <SkeletonText width="15%" size="sm" />
        <SkeletonField />
        <SkeletonText width="45%" size="sm" />
      </article>

      <article className={styles.panel}>
        <div className={styles.helpGrid}>
          <div>
            <SkeletonText width="40%" size="md" />
            <SkeletonText width="85%" size="sm" />
            <SkeletonText width="50%" size="sm" />
          </div>
          <div>
            <SkeletonText width="25%" size="md" />
            <SkeletonText width="60%" size="sm" />
          </div>
        </div>
      </article>
    </section>
  );
}
