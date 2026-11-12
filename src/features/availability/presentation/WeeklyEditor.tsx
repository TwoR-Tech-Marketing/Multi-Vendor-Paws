"use client";

import { useState } from "react";

import {
  copyDayTo,
  type AvailabilityValidationError,
} from "@/features/availability/domain/schemas";
import { WEEKDAYS, type Weekday, type WeeklyHours } from "@/features/availability/domain/types";
import { validationMessage } from "@/features/availability/presentation/availability-copy";
import { CopyDayDialog } from "@/features/availability/presentation/CopyDayDialog";
import {
  canAddInterval,
  IntervalList,
  nextInterval,
} from "@/features/availability/presentation/IntervalList";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./availability.module.css";

type WeeklyEditorProps = {
  weekly: WeeklyHours;
  errors: Partial<Record<Weekday, AvailabilityValidationError>>;
  strings: AppStrings;
  readOnly: boolean;
  onChange: (weekly: WeeklyHours) => void;
};

/** One row per weekday, Saturday first; days start at the inline start in RTL. */
export function WeeklyEditor({ weekly, errors, strings, readOnly, onChange }: WeeklyEditorProps) {
  const t = strings.availability;
  const [copyFrom, setCopyFrom] = useState<Weekday | null>(null);

  function setDay(day: Weekday, intervals: WeeklyHours[Weekday]) {
    onChange({ ...weekly, [day]: intervals });
  }

  return (
    <div className={styles.dayList}>
      {WEEKDAYS.map((day) => {
        const intervals = weekly[day];
        const error = errors[day];
        const add = nextInterval(intervals);
        return (
          <div key={day} className={styles.dayRow} data-day={day}>
            <span className={styles.dayName}>{t.days[day]}</span>
            <div className={styles.intervals}>
              <IntervalList
                intervals={intervals}
                strings={strings}
                readOnly={readOnly}
                label={t.days[day]}
                onChange={(value) => setDay(day, value)}
              />
              {error ? (
                <p className={branchStyles.fieldError} role="alert">
                  {validationMessage(error, strings)}
                </p>
              ) : null}
            </div>
            {readOnly ? (
              <span />
            ) : (
              <div className={styles.dayActions}>
                <button
                  type="button"
                  className={styles.smallButton}
                  disabled={!canAddInterval(intervals)}
                  onClick={() => add && setDay(day, [...intervals, add])}
                >
                  {t.addInterval}
                </button>
                <button
                  type="button"
                  className={styles.smallButton}
                  onClick={() => setCopyFrom(day)}
                >
                  {t.copyDay}
                </button>
              </div>
            )}
          </div>
        );
      })}
      {copyFrom && !readOnly ? (
        <CopyDayDialog
          from={copyFrom}
          strings={strings}
          onApply={(targets) => {
            onChange(copyDayTo(weekly, copyFrom, targets));
            setCopyFrom(null);
          }}
          onClose={() => setCopyFrom(null)}
        />
      ) : null}
    </div>
  );
}
