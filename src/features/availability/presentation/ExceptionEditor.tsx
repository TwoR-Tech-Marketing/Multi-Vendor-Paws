"use client";

import { useState } from "react";

import { validateException } from "@/features/availability/domain/schemas";
import { formatDayLabel } from "@/features/availability/domain/time";
import {
  AVAILABILITY_LIMITS,
  type AvailabilityException,
  type AvailabilityMode,
  type DayRule,
  type Interval,
} from "@/features/availability/domain/types";
import { validationMessage } from "@/features/availability/presentation/availability-copy";
import {
  canAddInterval,
  IntervalList,
  nextInterval,
} from "@/features/availability/presentation/IntervalList";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./availability.module.css";

type RuleChoice = "weekly" | "closed" | "special";

type ModeDraft = { choice: RuleChoice; intervals: Interval[] };

function toDraft(rule: DayRule | null): ModeDraft {
  if (!rule) return { choice: "weekly", intervals: [] };
  if (rule.closed) return { choice: "closed", intervals: [] };
  return { choice: "special", intervals: rule.intervals };
}

function toRule(draft: ModeDraft): DayRule | null {
  if (draft.choice === "weekly") return null;
  if (draft.choice === "closed") return { closed: true };
  return { closed: false, intervals: draft.intervals };
}

type ExceptionEditorProps = {
  date: string;
  todayDate: string;
  exception: AvailabilityException | null;
  homeVisitEnabled: boolean;
  /** Adding a new date would pass the 60 upcoming exceptions limit. */
  atLimit: boolean;
  strings: AppStrings;
  locale: string;
  readOnly: boolean;
  isSaving: boolean;
  onSave: (exception: AvailabilityException | null) => void;
  onRemove: () => void;
};

/** Closed or special hours per mode for one date. Remount with `key={date}`. */
export function ExceptionEditor({
  date,
  todayDate,
  exception,
  homeVisitEnabled,
  atLimit,
  strings,
  locale,
  readOnly,
  isSaving,
  onSave,
  onRemove,
}: ExceptionEditorProps) {
  const t = strings.availability.exceptions;
  const [branch, setBranch] = useState<ModeDraft>(toDraft(exception?.branch ?? null));
  const [home, setHome] = useState<ModeDraft>(toDraft(exception?.home ?? null));
  const [note, setNote] = useState(exception?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  const modes: { mode: AvailabilityMode; label: string; draft: ModeDraft; set: (d: ModeDraft) => void }[] = [
    { mode: "branch", label: t.branchMode, draft: branch, set: setBranch },
  ];
  if (homeVisitEnabled) modes.push({ mode: "home", label: t.homeMode, draft: home, set: setHome });

  function submit() {
    const result = validateException(
      date,
      { branch: toRule(branch), home: toRule(home), note: note || null },
      todayDate,
    );
    if (!result.ok) {
      setError(validationMessage(result.error, strings));
      return;
    }
    setError(null);
    onSave(result.exception);
  }

  return (
    <section className={branchStyles.form} aria-label={formatDayLabel(date, locale)}>
      <h3 className={branchStyles.panelTitle}>{formatDayLabel(date, locale)}</h3>
      {modes.map(({ mode, label, draft, set }) => (
        <fieldset key={mode} className={styles.modeBlock} disabled={readOnly}>
          <legend className={branchStyles.label}>{label}</legend>
          {(["weekly", "closed", "special"] as const).map((choice) => (
            <label key={choice} className={styles.radioRow}>
              <input
                type="radio"
                name={`${mode}-rule`}
                value={choice}
                checked={draft.choice === choice}
                onChange={() =>
                  set({
                    choice,
                    intervals:
                      choice === "special" && draft.intervals.length === 0
                        ? [{ start: "09:00", end: "17:00" }]
                        : draft.intervals,
                  })
                }
              />
              <span>
                {choice === "weekly" ? t.weeklyRule : choice === "closed" ? t.closed : t.special}
              </span>
            </label>
          ))}
          {draft.choice === "special" ? (
            <>
              <IntervalList
                intervals={draft.intervals}
                strings={strings}
                readOnly={readOnly}
                label={label}
                onChange={(intervals) => set({ ...draft, intervals })}
              />
              {readOnly ? null : (
                <div className={branchStyles.actions}>
                  <button
                    type="button"
                    className={styles.smallButton}
                    disabled={!canAddInterval(draft.intervals)}
                    onClick={() => {
                      const add = nextInterval(draft.intervals);
                      if (add) set({ ...draft, intervals: [...draft.intervals, add] });
                    }}
                  >
                    {strings.availability.addInterval}
                  </button>
                </div>
              )}
            </>
          ) : null}
        </fieldset>
      ))}

      <label className={branchStyles.field}>
        <span className={branchStyles.label}>{t.note}</span>
        <textarea
          className={styles.textarea}
          value={note}
          maxLength={AVAILABILITY_LIMITS.noteMax}
          readOnly={readOnly}
          onChange={(event) => setNote(event.target.value)}
        />
        <span className={branchStyles.muted}>{t.noteHint}</span>
      </label>

      {error ? (
        <p className={branchStyles.fieldError} role="alert">
          {error}
        </p>
      ) : null}
      {!exception && atLimit ? <p className={branchStyles.muted}>{t.limitReached}</p> : null}

      {readOnly ? null : (
        <div className={branchStyles.actions}>
          <button
            type="button"
            className={branchStyles.primaryButton}
            disabled={isSaving || (!exception && atLimit)}
            onClick={submit}
          >
            {isSaving ? strings.availability.saving : t.add}
          </button>
          {exception ? (
            <button
              type="button"
              className={branchStyles.dangerButton}
              disabled={isSaving}
              onClick={onRemove}
            >
              {t.remove}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
