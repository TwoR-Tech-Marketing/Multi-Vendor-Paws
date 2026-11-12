import Link from "next/link";

import { Routes } from "@/constants/routes";
import { formatSignedEgp } from "@/features/financials/domain/money-format";
import type {
  EarningsEntryFilter,
  VendorEarningsEntry,
  VendorEarningsSummary,
} from "@/features/financials/domain/types";
import { EarningsEmptyState } from "@/features/financials/presentation/EarningsEmptyState";
import {
  EarningsRowsSkeleton,
  EarningsSkeleton,
} from "@/features/financials/presentation/EarningsSkeleton";
import { EarningsTypeTabs } from "@/features/financials/presentation/EarningsTypeTabs";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./earnings.module.css";

export type EarningsViewProps = {
  strings: AppStrings;
  vendorType?: string;
  summary: VendorEarningsSummary | null;
  entries: VendorEarningsEntry[];
  isLoading: boolean;
  error: string | null;
  /** Type tabs and load more, callable source only. */
  paged: boolean;
  tab: EarningsEntryFilter;
  isLoadingEntries: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onTabChange: (tab: EarningsEntryFilter) => void;
  onLoadMore: () => void;
  onRetry: () => void;
};

function formatDate(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function SummaryCard({ label, piastres, highlight }: { label: string; piastres: number; highlight?: boolean }) {
  return (
    <article className={`${styles.statCard} ${highlight ? styles.statCardHighlight : ""}`}>
      <span className={styles.statLabel}>{label}</span>
      <p className={styles.statValue}>{formatSignedEgp(piastres)}</p>
    </article>
  );
}

function EntriesTable({ strings, entries }: { strings: AppStrings; entries: VendorEarningsEntry[] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>{strings.earnings.tableDate}</th>
            <th>{strings.earnings.tableType}</th>
            <th>{strings.earnings.tableDescription}</th>
            <th>{strings.earnings.tableAmount}</th>
            <th>{strings.earnings.tableCommission}</th>
            <th>{strings.earnings.tableNet}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.entryId}>
              <td>{formatDate(entry.createdAt)}</td>
              <td>{strings.earnings.typeLabels[entry.type]}</td>
              <td>
                {entry.vendorOrderId ? (
                  <Link
                    href={Routes.vendor.orderDetail(entry.vendorOrderId)}
                    className={styles.orderLink}
                    aria-label={strings.earnings.viewOrder}
                  >
                    {entry.description ?? "-"}
                  </Link>
                ) : (
                  (entry.description ?? "-")
                )}
              </td>
              <td>{formatSignedEgp(entry.amountPiastres)}</td>
              <td>{formatSignedEgp(entry.commissionPiastres)}</td>
              <td>{formatSignedEgp(entry.netPiastres)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LedgerBody(props: EarningsViewProps) {
  const { strings, entries, paged, tab } = props;
  if (paged && props.isLoadingEntries) return <EarningsRowsSkeleton label={strings.common.loading} />;
  if (entries.length === 0) {
    if (paged && tab !== "all") return <p className={styles.filteredEmpty}>{strings.earnings.entries.empty}</p>;
    return <EarningsEmptyState strings={strings} vendorType={props.vendorType} />;
  }
  return (
    <>
      <EntriesTable strings={strings} entries={entries} />
      {paged && props.hasMore ? (
        <div className={styles.loadMoreRow}>
          <button
            type="button"
            className={styles.loadMoreBtn}
            disabled={props.isLoadingMore}
            onClick={props.onLoadMore}
          >
            {props.isLoadingMore ? strings.earnings.loadingMore : strings.earnings.loadMore}
          </button>
        </div>
      ) : null}
    </>
  );
}

export function EarningsView(props: EarningsViewProps) {
  const { strings, summary, error } = props;
  if (props.isLoading) return <EarningsSkeleton />;

  return (
    <section className={styles.sectionStack}>
      {error ? (
        <div className={styles.alertError} role="alert">
          <p>{error}</p>
          <button type="button" className={styles.retryButton} onClick={props.onRetry}>
            {strings.common.retry}
          </button>
        </div>
      ) : null}

      <div className={styles.statsGrid}>
        <SummaryCard label={strings.earnings.summarySales} piastres={summary?.totalSalesPiastres ?? 0} />
        <SummaryCard
          label={strings.earnings.summaryCommission}
          piastres={summary?.totalCommissionPiastres ?? 0}
        />
        <SummaryCard
          label={strings.earnings.summaryNet}
          piastres={summary?.netEarningsPiastres ?? 0}
          highlight
        />
        <SummaryCard
          label={strings.earnings.summaryPending}
          piastres={summary?.pendingPayoutPiastres ?? 0}
        />
      </div>

      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>{strings.earnings.ledgerTitle}</h2>
        </div>
        {props.paged ? (
          <EarningsTypeTabs strings={strings} tab={props.tab} onTabChange={props.onTabChange} />
        ) : null}
        <LedgerBody {...props} />
      </article>
    </section>
  );
}
