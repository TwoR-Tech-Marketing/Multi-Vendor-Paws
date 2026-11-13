import { StatusBadge } from "@/components/ui/badge/StatusBadge";
import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import type { BranchDealRow } from "@/features/deals/domain/types";
import { dealSourceLabel, formatDealTermsLine } from "@/features/deals/presentation/deal-copy";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import styles from "./deals.module.css";

/** What each branch pays today and where that fee comes from. */
type DealBranchesTableProps = {
  branches: BranchDealRow[];
  strings: AppStrings;
  locale: AppLocale;
};

export function DealBranchesTable({ branches, strings, locale }: DealBranchesTableProps) {
  const t = strings.deals;
  return (
    <article className={styles.card} aria-label={t.branches}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{t.branches}</h2>
      </div>
      {branches.length === 0 ? (
        <EmptyState
          headingLevel={3}
          title={t.branchesEmptyTitle}
          description={t.branchesEmptyDescription}
        />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>{t.columns.branch}</th>
                <th>{t.columns.status}</th>
                <th>{t.columns.source}</th>
                <th>{t.columns.terms}</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.branchId}>
                  <td className={styles.branchName}>
                    <span title={branch.name}>{branch.name}</span>
                  </td>
                  <td>
                    <StatusBadge
                      tone={branch.status === "archived" ? "neutral" : "success"}
                      label={
                        branch.status === "archived"
                          ? strings.branches.archivedBadge
                          : strings.branches.activeBadge
                      }
                      status={branch.status}
                    />
                  </td>
                  <td>{dealSourceLabel(branch.deal.source, strings)}</td>
                  <td className={styles.termsCell}>
                    {formatDealTermsLine(branch.deal, strings, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
