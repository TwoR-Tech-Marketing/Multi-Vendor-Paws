import type { BranchDeal } from "@/features/branches/domain/types";
import { formatDealTerms } from "@/features/branches/presentation/branch-copy";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./branches.module.css";

/** Read only deal for one branch. Deals are set by the admin. */
export function BranchDealCard({ deal, strings }: { deal: BranchDeal; strings: AppStrings }) {
  const copy = strings.deals.branch;
  return (
    <section className={styles.panel} aria-label={copy.title}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>{copy.title}</h2>
        <span className={`${styles.badge} ${styles.badgeAccent}`}>{copy.source[deal.source]}</span>
      </div>
      <p className={styles.dealValue}>{formatDealTerms(deal, strings)}</p>
      <p className={styles.muted}>{copy.hint}</p>
    </section>
  );
}
