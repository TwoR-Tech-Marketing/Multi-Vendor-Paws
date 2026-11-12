import Link from "next/link";

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
  error: string | null;
  onRetry: () => void;
};

type ColumnProps = { label: string; piastres: number; strong?: boolean };

function Column({ label, piastres, strong }: ColumnProps) {
  return (
    <div className={`${styles.columnRow} ${strong ? styles.columnStrong : ""}`}>
      <dt>{label}</dt>
      <dd className={piastres < 0 ? styles.negative : undefined}>{formatEgp(piastres)}</dd>
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
              <th>{t.amount}</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.entryId}>
                <td>{payout.transferReference ?? "-"}</td>
                <td>{formatCairoDate(payout.paidAtMs ?? payout.createdAtMs, locale)}</td>
                <td className={styles.negative}>{formatEgp(-payout.amountPiastres)}</td>
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
        <span className={`${styles.badge} ${period.closed ? styles.badgeClosed : styles.badgeOpen}`}>
          {period.closed ? t.period.closed : t.period.open}
        </span>
      </div>
      <dl className={styles.columns}>
        <Column label={t.columns.opening} piastres={period.openingPiastres} />
        <Column label={t.columns.sales} piastres={period.salesPiastres} />
        <Column label={t.columns.fees} piastres={-period.feesPiastres} />
        <Column label={t.columns.refunds} piastres={period.refundsPiastres} />
        <Column label={t.columns.adjustments} piastres={period.adjustmentsPiastres} />
        <Column label={t.columns.payouts} piastres={period.payoutsPiastres} />
        <Column label={t.columns.closing} piastres={period.closingPiastres} strong />
      </dl>
      {period.payouts.length > 0 ? (
        <PayoutsTable strings={strings} locale={locale} payouts={period.payouts} />
      ) : null}
    </article>
  );
}

function ErrorAlert({ strings, error, onRetry }: { strings: AppStrings; error: string; onRetry: () => void }) {
  return (
    <div className={styles.alertError} role="alert">
      <p>{error}</p>
      <button type="button" className={styles.retryButton} onClick={onRetry}>
        {strings.common.retry}
      </button>
    </div>
  );
}

/** Read only vendor statement: balance, cycle and periods newest first. */
export function StatementView({ strings, locale, statement, isLoading, error, onRetry }: StatementViewProps) {
  const t = strings.statement;
  if (isLoading) return <StatementSkeleton label={strings.common.loading} />;
  if (!statement) {
    return (
      <section className={styles.sectionStack}>
        <ErrorAlert strings={strings} error={error ?? t.loadError} onRetry={onRetry} />
      </section>
    );
  }

  return (
    <section className={styles.sectionStack} aria-label={t.title}>
      {error ? <ErrorAlert strings={strings} error={error} onRetry={onRetry} /> : null}
      <div className={styles.summaryGrid}>
        <article className={`${styles.summaryCard} ${styles.summaryHighlight}`}>
          <span className={styles.summaryLabel}>{t.currentBalance}</span>
          <p className={styles.summaryValue}>{formatEgp(statement.currentBalancePiastres)}</p>
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
        <p className={styles.empty}>{t.empty}</p>
      ) : (
        statement.periods.map((period) => (
          <PeriodCard key={period.periodKey} strings={strings} locale={locale} period={period} />
        ))
      )}
    </section>
  );
}
