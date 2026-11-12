"use client";

import { PortalSelect } from "@/components/ui/select/PortalSelect";
import {
  endTimeOptions,
  formatHHmm,
  parseHHmm,
  startTimeOptions,
} from "@/features/availability/domain/time";
import { AVAILABILITY_LIMITS, type Interval } from "@/features/availability/domain/types";
import { timeLabel } from "@/features/availability/presentation/availability-copy";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./availability.module.css";

const DAY_END = 24 * 60;

/** Next interval to add: 9 AM to 5 PM on an empty day, else one hour after the last. */
export function nextInterval(intervals: Interval[]): Interval | null {
  if (intervals.length === 0) return { start: "09:00", end: "17:00" };
  const lastEnd = Math.max(...intervals.map((i) => parseHHmm(i.end)));
  if (!(lastEnd < DAY_END)) return null;
  return {
    start: formatHHmm(lastEnd),
    end: formatHHmm(Math.min(DAY_END, lastEnd + 60)),
  };
}

type IntervalListProps = {
  intervals: Interval[];
  strings: AppStrings;
  readOnly: boolean;
  /** Accessible name prefix, for example the day name. */
  label: string;
  onChange: (intervals: Interval[]) => void;
};

export function IntervalList({ intervals, strings, readOnly, label, onChange }: IntervalListProps) {
  const t = strings.availability;
  const startOptions = startTimeOptions().map((v) => ({ value: v, label: timeLabel(v, strings) }));
  const endOptions = endTimeOptions().map((v) => ({ value: v, label: timeLabel(v, strings) }));

  function update(index: number, patch: Partial<Interval>) {
    onChange(intervals.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  if (intervals.length === 0) {
    return <span className={styles.closedLabel}>{t.closed}</span>;
  }

  return (
    <div className={styles.intervals}>
      {intervals.map((interval, index) =>
        readOnly ? (
          <span key={index} className={styles.timeText}>
            {timeLabel(interval.start, strings)} - {timeLabel(interval.end, strings)}
          </span>
        ) : (
          <div key={index} className={styles.intervalRow}>
            <PortalSelect
              className={styles.timeSelect}
              value={interval.start}
              ariaLabel={`${label} ${t.from}`}
              options={startOptions}
              onChange={(value) => update(index, { start: value })}
            />
            <PortalSelect
              className={styles.timeSelect}
              value={interval.end}
              ariaLabel={`${label} ${t.to}`}
              options={endOptions}
              onChange={(value) => update(index, { end: value })}
            />
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => onChange(intervals.filter((_, i) => i !== index))}
            >
              {t.removeInterval}
            </button>
          </div>
        ),
      )}
    </div>
  );
}

export function canAddInterval(intervals: Interval[]): boolean {
  return intervals.length < AVAILABILITY_LIMITS.maxIntervalsPerDay && nextInterval(intervals) !== null;
}
