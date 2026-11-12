"use client";

import { daysBetween, formatDayLabel } from "@/features/availability/domain/time";
import type { AvailabilityException, DayRule } from "@/features/availability/domain/types";
import { timeLabel } from "@/features/availability/presentation/availability-copy";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./availability.module.css";

type UpcomingExceptionsProps = {
  exceptions: Record<string, AvailabilityException>;
  todayDate: string;
  strings: AppStrings;
  locale: string;
  onSelect: (date: string) => void;
};

function ruleSummary(rule: DayRule, strings: AppStrings): string {
  if (rule.closed) return strings.availability.exceptions.closed;
  return rule.intervals
    .map((i) => `${timeLabel(i.start, strings)} - ${timeLabel(i.end, strings)}`)
    .join(", ");
}

/** Upcoming exceptions in date order, so they are reachable without the calendar. */
export function UpcomingExceptions({
  exceptions,
  todayDate,
  strings,
  locale,
  onSelect,
}: UpcomingExceptionsProps) {
  const t = strings.availability.exceptions;
  const dates = Object.keys(exceptions)
    .filter((date) => daysBetween(todayDate, date) >= 0)
    .sort();

  return (
    <div className={branchStyles.field}>
      <span className={branchStyles.label}>{t.upcoming}</span>
      {dates.length === 0 ? (
        <p className={branchStyles.muted}>{t.none}</p>
      ) : (
        <ul className={styles.upcomingList}>
          {dates.map((date) => {
            const exception = exceptions[date];
            const parts = [
              exception.branch ? `${t.branchMode}: ${ruleSummary(exception.branch, strings)}` : "",
              exception.home ? `${t.homeMode}: ${ruleSummary(exception.home, strings)}` : "",
            ].filter(Boolean);
            return (
              <li key={date} className={styles.upcomingItem}>
                <button type="button" className={styles.linkButton} onClick={() => onSelect(date)}>
                  {formatDayLabel(date, locale)}
                </button>
                <span className={branchStyles.muted}>{parts.join(" · ") || exception.note}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
