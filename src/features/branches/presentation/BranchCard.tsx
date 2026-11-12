import Link from "next/link";

import { Routes } from "@/constants/routes";
import type { Branch, BranchDeal } from "@/features/branches/domain/types";
import { formatDealTerms } from "@/features/branches/presentation/branch-copy";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./branches.module.css";

type BranchCardProps = {
  branch: Branch;
  deal: BranchDeal | null;
  strings: AppStrings;
  readOnly: boolean;
  onEdit: (branch: Branch) => void;
  onArchive: (branch: Branch) => void;
  onRestore: (branch: Branch) => void;
};

export function BranchCard({
  branch,
  deal,
  strings,
  readOnly,
  onEdit,
  onArchive,
  onRestore,
}: BranchCardProps) {
  const t = strings.branches;
  const archived = branch.status === "archived";

  return (
    <article className={styles.card} data-branch-id={branch.branchId}>
      <div className={styles.cardTitleRow}>
        <h3 className={styles.cardTitle}>{branch.name}</h3>
        <span className={`${styles.badge} ${archived ? styles.badgeArchived : styles.badgeActive}`}>
          {archived ? t.archivedBadge : t.activeBadge}
        </span>
      </div>
      <p className={styles.cardLine}>{branch.address}</p>
      <div className={styles.badgeRow}>
        <span className={styles.badge}>
          {t.serviceCount.replace("{count}", String(branch.serviceCount))}
        </span>
        {branch.homeVisit.enabled ? (
          <span className={`${styles.badge} ${styles.badgeAccent}`}>{t.homeVisitBadge}</span>
        ) : null}
      </div>
      {deal ? (
        <p className={styles.cardLine}>
          {strings.deals.branch.source[deal.source]}: {formatDealTerms(deal, strings)}
        </p>
      ) : null}
      <div className={styles.actions}>
        <Link className={styles.linkButton} href={Routes.vendor.branchDetail(branch.branchId)}>
          {t.view}
        </Link>
        {!readOnly && !archived ? (
          <>
            <button type="button" className={styles.secondaryButton} onClick={() => onEdit(branch)}>
              {t.edit}
            </button>
            <button type="button" className={styles.dangerButton} onClick={() => onArchive(branch)}>
              {t.archive}
            </button>
          </>
        ) : null}
        {!readOnly && archived ? (
          <button type="button" className={styles.secondaryButton} onClick={() => onRestore(branch)}>
            {t.restore}
          </button>
        ) : null}
      </div>
    </article>
  );
}
