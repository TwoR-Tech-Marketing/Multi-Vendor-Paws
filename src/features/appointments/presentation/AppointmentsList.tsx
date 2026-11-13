import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { Routes } from "@/constants/routes";
import type { AppointmentRow } from "@/features/appointments/domain/types";
import { AppointmentBadges } from "@/features/appointments/presentation/AppointmentBadges";
import {
  appointmentWhen,
  serviceSummary,
} from "@/features/appointments/presentation/appointments-copy";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./appointments.module.css";

type AppointmentsListProps = {
  items: AppointmentRow[];
  strings: AppStrings;
  locale: AppLocale;
  hasMore: boolean;
  isLoadingMore: boolean;
  /** Filters differ from the defaults, so the empty state offers to clear them. */
  isFiltered?: boolean;
  onLoadMore: () => void;
  onClearFilters?: () => void;
};

/** Inbox rows: time, customer, services, total and badges. Pure. */
export function AppointmentsList({
  items,
  strings,
  locale,
  hasMore,
  isLoadingMore,
  isFiltered = false,
  onLoadMore,
  onClearFilters,
}: AppointmentsListProps) {
  const t = strings.appointments;
  if (items.length === 0) {
    return (
      <EmptyState
        headingLevel={2}
        live
        title={t.emptyTitle}
        description={t.empty}
        action={
          isFiltered && onClearFilters ? (
            <button type="button" className={branchStyles.secondaryButton} onClick={onClearFilters}>
              {t.clearFilters}
            </button>
          ) : null
        }
      />
    );
  }

  return (
    <>
      <ul className={styles.list}>
        {items.map((row) => (
          <li key={row.appointmentId}>
            <Link
              href={Routes.vendor.appointmentDetail(row.appointmentId)}
              className={styles.row}
              aria-label={t.open.replace("{number}", row.appointmentNumber)}
            >
              <div className={styles.rowMain}>
                <p className={styles.rowTitle}>{appointmentWhen(row, strings, locale)}</p>
                <p className={styles.rowLine} title={row.buyerFirstName || row.buyerName}>
                  {row.buyerFirstName || row.buyerName}
                </p>
                <p className={styles.rowLine} title={serviceSummary(row, strings, locale)}>
                  {serviceSummary(row, strings, locale)}
                </p>
                <div className={styles.rowMeta}>
                  <bdi className={styles.ref}>{row.appointmentNumber}</bdi>
                  <span className={styles.metaText} title={row.branchName}>
                    {row.branchName}
                  </span>
                  <span>{t.mode[row.mode]}</span>
                </div>
              </div>
              <div className={styles.rowSide}>
                <span className={styles.amount}>{formatEgp(row.totalPiastres, locale)}</span>
                <AppointmentBadges
                  status={row.status}
                  held={row.held}
                  noShowState={row.noShowState}
                  strings={strings}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <div className={branchStyles.actions}>
          <button
            type="button"
            className={branchStyles.secondaryButton}
            disabled={isLoadingMore}
            onClick={onLoadMore}
          >
            {isLoadingMore ? t.loadingMore : t.loadMore}
          </button>
        </div>
      ) : null}
    </>
  );
}
