import type { BranchDealRow } from "@/features/deals/domain/types";
import { dealSourceLabel, formatDealTermsLine } from "@/features/deals/presentation/deal-copy";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./deals.module.css";

/** What each branch pays today and where that fee comes from. */
export function DealBranchesTable({ branches, strings }: { branches: BranchDealRow[]; strings: AppStrings }) {
  const t = strings.deals;
  return (
    <article className={styles.card} aria-label={t.branches}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{t.branches}</h2>
      </div>
      {branches.length === 0 ? (
        <p className={styles.empty}>{t.branchesEmpty}</p>
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
                  <td className={styles.branchName}>{branch.name}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        branch.status === "archived" ? styles.badgeMuted : styles.badgeSuccess
                      }`}
                    >
                      {branch.status === "archived"
                        ? strings.branches.archivedBadge
                        : strings.branches.activeBadge}
                    </span>
                  </td>
                  <td>{dealSourceLabel(branch.deal.source, strings)}</td>
                  <td>{formatDealTermsLine(branch.deal, strings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
