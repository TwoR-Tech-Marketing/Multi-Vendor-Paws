"use client";

import { ThemedSvgIcon } from "@/components/ui/themed-icon/ThemedIcon";
import { exceptionHorizon } from "@/features/availability/domain/schemas";
import {
  addMonths,
  daysBetween,
  formatMonthTitle,
  monthGrid,
  monthOf,
} from "@/features/availability/domain/time";
import { WEEKDAYS, type AvailabilityException } from "@/features/availability/domain/types";
import type { AppStrings } from "@/shared/i18n/types";
import { uiAssets } from "@/shared/assets/ui-assets";

import styles from "./availability.module.css";

type ExceptionsCalendarProps = {
  month: string;
  todayDate: string;
  selectedDate: string | null;
  exceptions: Record<string, AvailabilityException>;
  strings: AppStrings;
  locale: string;
  onMonthChange: (month: string) => void;
  onSelect: (date: string) => void;
};

/**
 * Month grid, Saturday first. CSS grid places the first column at the inline
 * start, so in RTL the week runs right to left; chevrons mirror by CSS.
 */
export function ExceptionsCalendar({
  month,
  todayDate,
  selectedDate,
  exceptions,
  strings,
  locale,
  onMonthChange,
  onSelect,
}: ExceptionsCalendarProps) {
  const t = strings.availability;
  const horizon = exceptionHorizon(todayDate);
  const canPrev = month > monthOf(todayDate);
  const canNext = month < monthOf(horizon);

  return (
    <div className={styles.intervals}>
      <div className={styles.calendarHeader}>
        <button
          type="button"
          className={styles.navButton}
          aria-label={t.exceptions.prevMonth}
          disabled={!canPrev}
          onClick={() => onMonthChange(addMonths(month, -1))}
        >
          <ThemedSvgIcon src={uiAssets.chevronDown} className={styles.chevronPrev} width={16} height={16} />
        </button>
        <h3 className={styles.monthTitle} aria-live="polite">
          {formatMonthTitle(month, locale)}
        </h3>
        <button
          type="button"
          className={styles.navButton}
          aria-label={t.exceptions.nextMonth}
          disabled={!canNext}
          onClick={() => onMonthChange(addMonths(month, 1))}
        >
          <ThemedSvgIcon src={uiAssets.chevronDown} className={styles.chevronNext} width={16} height={16} />
        </button>
      </div>
      <div className={styles.calendarGrid} role="group" aria-label={t.exceptions.title}>
        {WEEKDAYS.map((day) => (
          <span key={day} className={styles.weekdayHead}>
            {t.daysShort[day]}
          </span>
        ))}
        {monthGrid(month).map((date, index) => {
          if (!date) return <span key={`empty-${index}`} className={styles.emptyCell} />;
          const offset = daysBetween(todayDate, date);
          const outOfRange = offset < 0 || date > horizon;
          const marked = Boolean(exceptions[date]);
          const className = [
            styles.dayCell,
            date === todayDate ? styles.dayCellToday : "",
            date === selectedDate ? styles.dayCellSelected : "",
            marked ? styles.dayCellMarked : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={date}
              type="button"
              className={className}
              disabled={outOfRange}
              aria-pressed={date === selectedDate}
              aria-label={marked ? `${date} ${t.exceptions.marked}` : date}
              data-date={date}
              onClick={() => onSelect(date)}
            >
              {Number(date.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
