import Link from "next/link";

import { Routes } from "@/constants/routes";
import type { AppointmentRow } from "@/features/appointments/domain/types";
import { AppointmentBadges } from "@/features/appointments/presentation/AppointmentBadges";
import {
  appointmentWhen,
  serviceSummary,
} from "@/features/appointments/presentation/appointments-copy";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./appointments.module.css";

type AppointmentsListProps = {
  items: AppointmentRow[];
  strings: AppStrings;
  locale: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
};

/** Inbox rows: time, customer, services, total and badges. Pure. */
export function AppointmentsList({
  items,
  strings,
  locale,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: AppointmentsListProps) {
  const t = strings.appointments;
  if (items.length === 0) return <p className={branchStyles.muted}>{t.empty}</p>;

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
                <p className={styles.rowText}>{row.buyerFirstName || row.buyerName}</p>
                <p className={styles.rowText}>{serviceSummary(row, strings, locale)}</p>
                <div className={styles.rowMeta}>
                  <span>{row.appointmentNumber}</span>
                  <span>{row.branchName}</span>
                  <span>{t.mode[row.mode]}</span>
                </div>
              </div>
              <div className={styles.rowSide}>
                <span className={styles.amount}>{formatEgp(row.totalPiastres)}</span>
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
