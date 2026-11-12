import { addDays, daysBetween, parseHHmm } from "@/features/availability/domain/time";
import {
  AVAILABILITY_LIMITS as L,
  WEEKDAYS,
  type AvailabilityException,
  type DayRule,
  type Interval,
  type Weekday,
  type WeeklyHours,
} from "@/features/availability/domain/types";

/**
 * Client mirror of the vendor_availability validation (the server stays the
 * authority). Errors are keys under `errors.availability`.
 */

export type AvailabilityValidationError = "invalidInterval" | "overlap" | "limit";

const START = /^([01]\d|2[0-3]):(00|15|30|45)$/;
const END = /^(([01]\d|2[0-3]):(00|15|30|45)|24:00)$/;

/** Validates one day; returns sorted intervals with touching ones merged. */
export function normalizeIntervals(
  intervals: Interval[],
  minCount = 0,
): { ok: true; intervals: Interval[] } | { ok: false; error: AvailabilityValidationError } {
  if (intervals.length > L.maxIntervalsPerDay) return { ok: false, error: "limit" };
  if (intervals.length < minCount) return { ok: false, error: "invalidInterval" };
  const parsed = [];
  for (const { start, end } of intervals) {
    if (!START.test(start) || !END.test(end)) return { ok: false, error: "invalidInterval" };
    const s = parseHHmm(start);
    const e = parseHHmm(end);
    if (e - s < L.gridMinutes) return { ok: false, error: "invalidInterval" };
    parsed.push({ start, end, s, e });
  }
  parsed.sort((a, b) => a.s - b.s);
  const merged: typeof parsed = [];
  for (const item of parsed) {
    const last = merged[merged.length - 1];
    if (last && item.s < last.e) return { ok: false, error: "overlap" };
    if (last && item.s === last.e) {
      last.end = item.end;
      last.e = item.e;
    } else {
      merged.push({ ...item });
    }
  }
  return { ok: true, intervals: merged.map(({ start, end }) => ({ start, end })) };
}

export type WeeklyValidation =
  | { ok: true; weekly: WeeklyHours }
  | { ok: false; errors: Partial<Record<Weekday, AvailabilityValidationError>> };

export function validateWeekly(weekly: WeeklyHours): WeeklyValidation {
  const out = {} as WeeklyHours;
  const errors: Partial<Record<Weekday, AvailabilityValidationError>> = {};
  for (const day of WEEKDAYS) {
    const result = normalizeIntervals(weekly[day] ?? []);
    if (result.ok) out[day] = result.intervals;
    else errors[day] = result.error;
  }
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, weekly: out };
}

export function isValidCapacity(value: number): boolean {
  return Number.isInteger(value) && value >= L.minCapacity && value <= L.maxCapacity;
}

export function clampCapacity(value: number): number {
  return Math.min(L.maxCapacity, Math.max(L.minCapacity, Math.round(value)));
}

function validateDayRule(
  rule: DayRule | null,
): { ok: true; rule: DayRule | null } | { ok: false; error: AvailabilityValidationError } {
  if (rule === null || rule.closed) return { ok: true, rule };
  const result = normalizeIntervals(rule.intervals, 1);
  return result.ok ? { ok: true, rule: { closed: false, intervals: result.intervals } } : result;
}

export type ExceptionValidation =
  | { ok: true; exception: AvailabilityException | null }
  | { ok: false; error: AvailabilityValidationError | "note" | "date" };

/** Mirrors the server: an exception with no rule and no note means remove. */
export function validateException(
  date: string,
  exception: AvailabilityException,
  todayDate: string,
): ExceptionValidation {
  const offset = daysBetween(todayDate, date);
  if (offset < 0 || offset > L.exceptionHorizonDays) return { ok: false, error: "date" };
  const note = exception.note?.trim() ?? "";
  if (note.length > L.noteMax) return { ok: false, error: "note" };
  const branch = validateDayRule(exception.branch);
  if (!branch.ok) return branch;
  const home = validateDayRule(exception.home);
  if (!home.ok) return home;
  if (!branch.rule && !home.rule && !note) return { ok: true, exception: null };
  return { ok: true, exception: { branch: branch.rule, home: home.rule, note: note || null } };
}

/** Exceptions dated today or later. */
export function countFutureExceptions(
  exceptions: Record<string, AvailabilityException>,
  todayDate: string,
): number {
  return Object.keys(exceptions).filter((date) => daysBetween(todayDate, date) >= 0).length;
}

/** True when adding an exception on `date` would pass the 60 future limit. */
export function wouldExceedExceptionLimit(
  exceptions: Record<string, AvailabilityException>,
  date: string,
  todayDate: string,
): boolean {
  if (exceptions[date]) return false;
  return countFutureExceptions(exceptions, todayDate) >= L.maxFutureExceptions;
}

/** Last date an exception may use. */
export function exceptionHorizon(todayDate: string): string {
  return addDays(todayDate, L.exceptionHorizonDays);
}
