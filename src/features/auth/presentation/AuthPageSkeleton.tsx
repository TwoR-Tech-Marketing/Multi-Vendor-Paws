import {
  SkeletonAvatar,
  SkeletonButton,
  SkeletonFormField,
  SkeletonText,
} from "@/components/ui/skeleton";
import { Strings } from "@/constants/strings";

import styles from "./auth.module.css";
import skeletonStyles from "./authSkeleton.module.css";

export function AuthPageSkeleton() {
  return (
    <main className={styles.page} role="status" aria-label={Strings.common.loading}>
      <section className={`${styles.card} ${skeletonStyles.card}`}>
        <div className={skeletonStyles.brand}>
          <SkeletonAvatar size={56} />
          <SkeletonText size="lg" width="60%" className={skeletonStyles.title} />
          <SkeletonText size="sm" width="85%" className={skeletonStyles.subtitle} />
        </div>

        <SkeletonFormField labelWidth="28%" className={skeletonStyles.fieldGroup} />
        <SkeletonFormField labelWidth="32%" className={skeletonStyles.fieldGroup} />

        <SkeletonButton className={skeletonStyles.submit} />
        <SkeletonText size="sm" width="70%" className={skeletonStyles.footer} />
      </section>
    </main>
  );
}
