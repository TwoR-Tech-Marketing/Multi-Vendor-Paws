import {
  SkeletonButton,
  SkeletonFormField,
  SkeletonIcon,
  SkeletonText,
} from "@/components/ui/skeleton";
import { Strings } from "@/constants/strings";

import styles from "./profileSkeleton.module.css";

function MetaRowSkeleton() {
  return (
    <div className={styles.metaRow}>
      <SkeletonIcon size={18} />
      <SkeletonText width="28%" />
      <SkeletonText width="42%" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <section role="status" aria-label={Strings.common.loading} aria-busy="true">
      <div className={styles.banner}>
        <SkeletonText size="lg" width="38%" />
        <SkeletonText size="sm" width="72%" />
      </div>

      <div className={styles.grid}>
        <article className={styles.panel}>
          <SkeletonText size="lg" width="44%" />
          <div className={styles.divider} aria-hidden />
          <div className={styles.panelFields}>
            <SkeletonFormField labelWidth="32%" />
            <SkeletonFormField labelWidth="36%" />
            <SkeletonFormField labelWidth="30%" />
            <SkeletonFormField labelWidth="40%" />
          </div>
        </article>

        <article className={styles.panel}>
          <SkeletonText size="lg" width="52%" />
          <SkeletonText size="sm" width="80%" />
          <div className={styles.divider} aria-hidden />
          <div className={styles.panelFields}>
            <SkeletonFormField labelWidth="34%" />
            <SkeletonFormField labelWidth="38%" />
            <SkeletonFormField labelWidth="36%" />
          </div>
          <SkeletonButton width={180} />
        </article>
      </div>

      <article className={styles.sessionCard}>
        <div className={styles.metaRow}>
          <SkeletonIcon size={20} />
          <SkeletonText size="lg" width="34%" />
        </div>
        <div className={styles.divider} aria-hidden />
        <div className={styles.metaList}>
          <MetaRowSkeleton />
          <MetaRowSkeleton />
          <MetaRowSkeleton />
        </div>
        <SkeletonButton width={140} />
      </article>
    </section>
  );
}
