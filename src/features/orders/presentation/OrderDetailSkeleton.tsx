import { SkeletonBox, SkeletonButton, SkeletonField, SkeletonText } from "@/components/ui/skeleton";
import { Strings } from "@/constants/strings";

import styles from "./orders.module.css";

const ITEM_ROWS = 3;
const SUMMARY_ROWS = 6;

/** Order detail loading state: items card, customer and summary cards, history. */
export function OrderDetailSkeleton() {
  return (
    <section
      className={styles.sectionStack}
      role="status"
      aria-label={Strings.common.loading}
      aria-busy="true"
    >
      <div className={styles.detailGrid}>
        <article className={styles.panel}>
          <div className={styles.detailPanel}>
            <div className={styles.sectionTitle}>
              <SkeletonText size="lg" width="30%" />
            </div>
            {Array.from({ length: ITEM_ROWS }).map((_, index) => (
              <div key={index} className={styles.itemRow}>
                <SkeletonBox width={44} height={44} borderRadius="var(--tp-radius-control)" />
                <div className={styles.itemMeta}>
                  <SkeletonText width="70%" />
                  <SkeletonText size="sm" width="40%" />
                </div>
                <SkeletonText width={88} />
              </div>
            ))}
          </div>
        </article>
        <div className={styles.sectionStack}>
          <article className={styles.panel}>
            <div className={styles.detailPanel}>
              <div className={styles.sectionTitle}>
                <SkeletonText size="lg" width="40%" />
              </div>
              <div className={styles.metaList}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className={styles.metaRow}>
                    <SkeletonText width={80} />
                    <SkeletonText width={120} />
                  </div>
                ))}
              </div>
            </div>
          </article>
          <article className={styles.panel}>
            <div className={styles.detailPanel}>
              <div className={styles.sectionTitle}>
                <SkeletonText size="lg" width="40%" />
              </div>
              <div className={styles.metaList}>
                {Array.from({ length: SUMMARY_ROWS }).map((_, index) => (
                  <div key={index} className={styles.metaRow}>
                    <SkeletonText width={96} />
                    <SkeletonText width={88} />
                  </div>
                ))}
              </div>
              <div className={styles.statusForm}>
                <SkeletonField />
                <SkeletonButton />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
