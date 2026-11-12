import { WEEKDAYS, type Weekday } from "@/features/availability/domain/types";

/**
 * Pure wall clock and calendar helpers. Dates are Cairo "YYYY-MM-DD" keys
 * handled as plain calendar days (UTC arithmetic, no time zone database);
 * the server gives today's Cairo date.
 */

const GRID = 15;
const DAY_MINUTES = 24 * 60;
const DAY_MS = 86_400_000;

/** "HH:mm" (or "24:00") to minutes since midnight; NaN when malformed. */
export function parseHHmm(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return Number.NaN;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatHHmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Start options on the 15 minute grid: 00:00 to 23:45. */
export function startTimeOptions(): string[] {
  return Array.from({ length: DAY_MINUTES / GRID }, (_, i) => formatHHmm(i * GRID));
}

/** End options on the 15 minute grid: 00:15 to 24:00. */
export function endTimeOptions(): string[] {
  return Array.from({ length: DAY_MINUTES / GRID }, (_, i) => formatHHmm((i + 1) * GRID));
}

/**
 * 12 hour display with localized AM and PM markers and Western digits,
 * for example "9:30 AM" or "9:30 م". "24:00" shows as midnight (12:00 AM).
 */
export function formatTime12(value: string, labels: { am: string; pm: string }): string {
  const minutes = parseHHmm(value);
  if (Number.isNaN(minutes)) return value;
  const wrapped = minutes % DAY_MINUTES;
  const h24 = Math.floor(wrapped / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = String(wrapped % 60).padStart(2, "0");
  return `${h12}:${mm} ${h24 < 12 ? labels.am : labels.pm}`;
}

function toUtcMs(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && fromUtcMs(toUtcMs(value)) === value;
}

export function addDays(date: string, days: number): string {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/** Weekday key of a calendar date (week starts Saturday). */
export function weekdayOf(date: string): Weekday {
  const jsDay = new Date(toUtcMs(date)).getUTCDay(); // 0 = Sunday
  return WEEKDAYS[(jsDay + 1) % 7];
}

/** "YYYY-MM" of a date. */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/**
 * Calendar cells for a month, Saturday first. Leading cells before the first
 * of the month are null so the grid lines up under the weekday headers.
 */
export function monthGrid(month: string): (string | null)[] {
  const first = `${month}-01`;
  const lead = WEEKDAYS.indexOf(weekdayOf(first));
  const length = daysBetween(first, `${addMonths(month, 1)}-01`);
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let i = 0; i < length; i++) cells.push(addDays(first, i));
  return cells;
}

/** Western digits in both locales. */
export function intlLocale(locale: string): string {
  return locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB";
}

export function formatMonthTitle(month: string, locale: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(toUtcMs(`${month}-01`)));
}

export function formatDayLabel(date: string, locale: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(toUtcMs(date)));
}
