import { StatusBadge } from "@/components/ui/badge/StatusBadge";
import type { BranchDeal } from "@/features/branches/domain/types";
import { formatDealTerms } from "@/features/branches/presentation/branch-copy";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import styles from "./branches.module.css";

/** Read only deal for one branch. Deals are set by the admin. */
type BranchDealCardProps = { deal: BranchDeal; strings: AppStrings; locale: AppLocale };

export function BranchDealCard({ deal, strings, locale }: BranchDealCardProps) {
  const copy = strings.deals.branch;
  return (
    <section className={styles.panel} aria-label={copy.title}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>{copy.title}</h2>
        <StatusBadge tone="confirmed" label={copy.source[deal.source]} />
      </div>
      <p className={styles.dealValue}>{formatDealTerms(deal, strings, locale)}</p>
      <p className={styles.muted}>{copy.hint}</p>
    </section>
  );
}
