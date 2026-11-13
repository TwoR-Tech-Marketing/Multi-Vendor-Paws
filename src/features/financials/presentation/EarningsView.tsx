import Link from "next/link";

import { LoadErrorState } from "@/components/ui/error-state/LoadErrorState";
import type { LoadErrorView } from "@/components/ui/error-state/load-error";
import { Routes } from "@/constants/routes";
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
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";
import { formatDateTime } from "@/shared/lib/format-date";
import type { AppLocale } from "@/shared/preferences/domain/types";

import styles from "./earnings.module.css";

export type EarningsViewProps = {
  strings: AppStrings;
  locale: AppLocale;
  vendorType?: string;
  summary: VendorEarningsSummary | null;
  entries: VendorEarningsEntry[];
  isLoading: boolean;
  /** Load failure: full state before the first load, compact above kept data. */
  error: LoadErrorView | null;
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

/** Money cell class; negative amounts use the money out colour. */
function moneyClass(piastres: number): string {
  return piastres < 0 ? `${styles.money} ${styles.negative}` : styles.money;
}

type SummaryCardProps = {
  label: string;
  piastres: number;
  locale: AppLocale;
  highlight?: boolean;
};

function SummaryCard({ label, piastres, locale, highlight }: SummaryCardProps) {
  const amount = formatEgp(piastres, locale);
  return (
    <article className={`${styles.statCard} ${highlight ? styles.statCardHighlight : ""}`}>
      <span className={styles.statLabel}>{label}</span>
      <p className={styles.statValue} title={amount}>
        {amount}
      </p>
    </article>
  );
}

type EntriesTableProps = {
  strings: AppStrings;
  locale: AppLocale;
  entries: VendorEarningsEntry[];
};

function EntriesTable({ strings, locale, entries }: EntriesTableProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>{strings.earnings.tableDate}</th>
            <th>{strings.earnings.tableType}</th>
            <th>{strings.earnings.tableDescription}</th>
            <th className={styles.money}>{strings.earnings.tableAmount}</th>
            <th className={styles.money}>{strings.earnings.tableCommission}</th>
            <th className={styles.money}>{strings.earnings.tableNet}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.entryId}>
              <td className={styles.dateCell}>{formatDateTime(entry.createdAt, locale)}</td>
              <td>{strings.earnings.typeLabels[entry.type]}</td>
              <td className={styles.nameCell}>
                {entry.vendorOrderId ? (
                  <Link
                    href={Routes.vendor.orderDetail(entry.vendorOrderId)}
                    className={styles.orderLink}
                    title={entry.description ?? undefined}
                    aria-label={`${strings.earnings.viewOrder} ${entry.description ?? ""}`.trim()}
                  >
                    <bdi>{entry.description ?? "-"}</bdi>
                  </Link>
                ) : (
                  <span title={entry.description ?? undefined}>{entry.description ?? "-"}</span>
                )}
              </td>
              <td className={moneyClass(entry.amountPiastres)}>
                {formatEgp(entry.amountPiastres, locale)}
              </td>
              <td className={moneyClass(entry.commissionPiastres)}>
                {formatEgp(entry.commissionPiastres, locale)}
              </td>
              <td className={moneyClass(entry.netPiastres)}>
                {formatEgp(entry.netPiastres, locale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LedgerBody(props: EarningsViewProps) {
  const { strings, locale, entries, paged, tab } = props;
  if (paged && props.isLoadingEntries) return <EarningsRowsSkeleton label={strings.common.loading} />;
  if (entries.length === 0) {
    if (props.error) {
      return <LoadErrorState view={props.error} strings={strings} onRetry={props.onRetry} />;
    }
    if (paged && tab !== "all") {
      return (
        <p className={styles.filteredEmpty} role="status">
          {strings.earnings.entries.empty}
        </p>
      );
    }
    return <EarningsEmptyState strings={strings} vendorType={props.vendorType} />;
  }
  return (
    <>
      <EntriesTable strings={strings} locale={locale} entries={entries} />
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
  const { strings, locale, summary, error } = props;
  if (props.isLoading) return <EarningsSkeleton />;

  if (error && !summary) {
    return (
      <section className={styles.sectionStack}>
        <article className={styles.panel}>
          <LoadErrorState view={error} strings={strings} onRetry={props.onRetry} />
        </article>
      </section>
    );
  }

  return (
    <section className={styles.sectionStack}>
      {error && props.entries.length > 0 ? (
        <LoadErrorState view={error} strings={strings} onRetry={props.onRetry} compact />
      ) : null}

      <div className={styles.statsGrid}>
        <SummaryCard
          label={strings.earnings.summarySales}
          piastres={summary?.totalSalesPiastres ?? 0}
          locale={locale}
        />
        <SummaryCard
          label={strings.earnings.summaryCommission}
          piastres={summary?.totalCommissionPiastres ?? 0}
          locale={locale}
        />
        <SummaryCard
          label={strings.earnings.summaryNet}
          piastres={summary?.netEarningsPiastres ?? 0}
          locale={locale}
          highlight
        />
        <SummaryCard
          label={strings.earnings.summaryPending}
          piastres={summary?.pendingPayoutPiastres ?? 0}
          locale={locale}
        />
      </div>

      <article className={styles.panel}>
        <div className={`${styles.panelHeader} ${styles.panelHeaderRow}`}>
          <h2>{strings.earnings.ledgerTitle}</h2>
          <div className={styles.headerLinks}>
            <Link href={Routes.vendor.deal} className={styles.orderLink}>
              {strings.earnings.viewDeal}
            </Link>
            <Link href={Routes.vendor.payouts} className={styles.orderLink}>
              {strings.statement.viewStatement}
            </Link>
          </div>
        </div>
        {props.paged ? (
          <EarningsTypeTabs strings={strings} tab={props.tab} onTabChange={props.onTabChange} />
        ) : null}
        <LedgerBody {...props} />
      </article>
    </section>
  );
}
