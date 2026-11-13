import Link from "next/link";

import { StatusBadge } from "@/components/ui/badge/StatusBadge";
import { Routes } from "@/constants/routes";
import type { Branch, BranchDeal } from "@/features/branches/domain/types";
import { formatDealTerms } from "@/features/branches/presentation/branch-copy";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import styles from "./branches.module.css";

type BranchCardProps = {
  branch: Branch;
  deal: BranchDeal | null;
  strings: AppStrings;
  locale: AppLocale;
  readOnly: boolean;
  onEdit: (branch: Branch) => void;
  onArchive: (branch: Branch) => void;
  onRestore: (branch: Branch) => void;
};

export function BranchCard({
  branch,
  deal,
  strings,
  locale,
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
        <h3 className={styles.cardTitle} title={branch.name}>
          {branch.name}
        </h3>
        <StatusBadge
          tone={archived ? "neutral" : "success"}
          label={archived ? t.archivedBadge : t.activeBadge}
          status={branch.status}
        />
      </div>
      <p className={styles.cardLine} title={branch.address}>
        {branch.address}
      </p>
      <div className={styles.badgeRow}>
        <StatusBadge
          tone="neutral"
          label={
            branch.serviceCount === 1
              ? t.serviceCountOne
              : t.serviceCount.replace("{count}", branch.serviceCount.toLocaleString("en-US"))
          }
        />
        {branch.homeVisit.enabled ? <StatusBadge tone="success" label={t.homeVisitBadge} /> : null}
      </div>
      {deal ? (
        <p className={styles.cardLine}>
          {strings.deals.branch.source[deal.source]}: {formatDealTerms(deal, strings, locale)}
        </p>
      ) : null}
      <div className={styles.actions}>
        <Link
          className={styles.linkButton}
          href={Routes.vendor.branchDetail(branch.branchId)}
          aria-label={`${t.view} ${branch.name}`}
        >
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
