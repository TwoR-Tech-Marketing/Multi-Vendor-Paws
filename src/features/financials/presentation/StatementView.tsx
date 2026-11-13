import Link from "next/link";

import { StatusBadge } from "@/components/ui/badge/StatusBadge";
import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { LoadErrorState } from "@/components/ui/error-state/LoadErrorState";
import { toLoadErrorView, type LoadErrorView } from "@/components/ui/error-state/load-error";
import { Routes } from "@/constants/routes";
import { formatPeriodRange, formatCairoDate } from "@/features/financials/domain/statement-dates";
import type {
  StatementPayout,
  StatementPeriod,
  VendorStatement,
} from "@/features/financials/domain/statement-types";
import { StatementSkeleton } from "@/features/financials/presentation/StatementSkeleton";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import styles from "./statement.module.css";

export type StatementViewProps = {
  strings: AppStrings;
  locale: AppLocale;
  statement: VendorStatement | null;
  isLoading: boolean;
  /** Load failure: full state without a statement, compact above a kept one. */
  error: LoadErrorView | null;
  onRetry: () => void;
};

type ColumnProps = { label: string; piastres: number; locale: AppLocale; strong?: boolean };

function Column({ label, piastres, locale, strong }: ColumnProps) {
  return (
    <div className={`${styles.columnRow} ${strong ? styles.columnStrong : ""}`}>
      <dt>{label}</dt>
      <dd className={piastres < 0 ? styles.negative : undefined}>{formatEgp(piastres, locale)}</dd>
    </div>
  );
}

function PayoutsTable({
  strings,
  locale,
  payouts,
}: {
  strings: AppStrings;
  locale: AppLocale;
  payouts: StatementPayout[];
}) {
  const t = strings.statement.payout;
  return (
    <div className={styles.payouts}>
      <h4 className={styles.payoutsTitle}>{t.title}</h4>
      <div className={styles.tableWrap}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>{t.reference}</th>
              <th>{t.paidOn}</th>
              <th className={styles.money}>{t.amount}</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.entryId}>
                <td className={styles.refCell}>
                  <bdi title={payout.transferReference ?? undefined}>
                    {payout.transferReference ?? "-"}
                  </bdi>
                </td>
                <td className={styles.dateCell}>
                  {formatCairoDate(payout.paidAtMs ?? payout.createdAtMs, locale)}
                </td>
                <td className={`${styles.money} ${styles.negative}`}>
                  {formatEgp(-payout.amountPiastres, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PeriodCard({
  strings,
  locale,
  period,
}: {
  strings: AppStrings;
  locale: AppLocale;
  period: StatementPeriod;
}) {
  const t = strings.statement;
  const range = formatPeriodRange(t.period.range, period.startMs, period.endMs, locale);
  return (
    <article className={styles.periodCard} aria-label={range}>
      <div className={styles.periodHeader}>
        <h3 className={styles.periodTitle}>{range}</h3>
        <StatusBadge
          tone={period.closed ? "neutral" : "success"}
          label={period.closed ? t.period.closed : t.period.open}
          status={period.closed ? "closed" : "open"}
        />
      </div>
      <dl className={styles.columns}>
        <Column label={t.columns.opening} piastres={period.openingPiastres} locale={locale} />
        <Column label={t.columns.sales} piastres={period.salesPiastres} locale={locale} />
        <Column label={t.columns.fees} piastres={-period.feesPiastres} locale={locale} />
        <Column label={t.columns.refunds} piastres={period.refundsPiastres} locale={locale} />
        <Column label={t.columns.adjustments} piastres={period.adjustmentsPiastres} locale={locale} />
        <Column label={t.columns.payouts} piastres={period.payoutsPiastres} locale={locale} />
        <Column label={t.columns.closing} piastres={period.closingPiastres} locale={locale} strong />
      </dl>
      {period.payouts.length > 0 ? (
        <PayoutsTable strings={strings} locale={locale} payouts={period.payouts} />
      ) : null}
    </article>
  );
}

/** Read only vendor statement: balance, cycle and periods newest first. */
export function StatementView({ strings, locale, statement, isLoading, error, onRetry }: StatementViewProps) {
  const t = strings.statement;
  if (isLoading) return <StatementSkeleton label={strings.common.loading} />;
  if (!statement) {
    const view = error ?? toLoadErrorView(null, strings, t.loadError, false);
    return (
      <section className={styles.sectionStack}>
        <article className={styles.stateCard}>
          <LoadErrorState view={view} strings={strings} onRetry={onRetry} />
        </article>
      </section>
    );
  }

  return (
    <section className={styles.sectionStack} aria-label={t.title}>
      {error ? <LoadErrorState view={error} strings={strings} onRetry={onRetry} compact /> : null}
      <div className={styles.summaryGrid}>
        <article className={`${styles.summaryCard} ${styles.summaryHighlight}`}>
          <span className={styles.summaryLabel}>{t.currentBalance}</span>
          <p className={`${styles.summaryValue} ${styles.summaryMoney}`}>
            {formatEgp(statement.currentBalancePiastres, locale)}
          </p>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{t.cycleLabel}</span>
          <p className={styles.summaryValue}>{t.cycle[statement.cycle]}</p>
        </article>
      </div>

      <div className={styles.titleRow}>
        <h2 className={styles.sectionTitle}>{t.periodsTitle}</h2>
        <Link href={Routes.vendor.deal} className={styles.link}>
          {strings.earnings.viewDeal}
        </Link>
      </div>
      {statement.periods.length === 0 ? (
        <article className={styles.stateCard}>
          <EmptyState headingLevel={3} title={t.emptyTitle} description={t.emptyDescription} />
        </article>
      ) : (
        statement.periods.map((period) => (
          <PeriodCard key={period.periodKey} strings={strings} locale={locale} period={period} />
        ))
      )}
    </section>
  );
}
