import type { OrderDatePreset } from "@/features/orders/domain/types";

/**
 * Africa/Cairo calendar day bounds for order date filters.
 *
 * Offsets come from the IANA zone through Intl (DST aware), never a fixed
 * offset, so the result does not depend on the process time zone. A day starts
 * at the first instant whose Cairo calendar date is that day (00:00, or the
 * first valid instant when 00:00 is skipped by a DST change) and ends one
 * millisecond before the next day starts.
 */

export const CAIRO_TIME_ZONE = "Africa/Cairo";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

type CairoParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CAIRO_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function cairoParts(ms: number): CairoParts {
  const out: Record<string, number> = {};
  for (const part of partsFormatter.formatToParts(new Date(ms))) {
    if (part.type !== "literal") out[part.type] = Number(part.value);
  }
  return out as CairoParts;
}

/** Offset of Cairo from UTC in millis at an instant. */
export function cairoOffsetMs(ms: number): number {
  const p = cairoParts(ms);
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wall - Math.floor(ms / 1000) * 1000;
}

function dayNumber(year: number, month: number, day: number): number {
  return Math.round(Date.UTC(year, month - 1, day) / DAY_MS);
}

/** Cairo calendar day number (days since 1970-01-01) of an instant. */
export function cairoDayNumber(ms: number): number {
  const p = cairoParts(ms);
  return dayNumber(p.year, p.month, p.day);
}

/** First instant (epoch millis) of a Cairo calendar day. */
export function cairoDayStartMs(dayNum: number): number {
  const wallMidnight = dayNum * DAY_MS;
  const offsets = new Set([
    cairoOffsetMs(wallMidnight - 14 * HOUR_MS),
    cairoOffsetMs(wallMidnight + 14 * HOUR_MS),
  ]);
  const candidates = [...offsets]
    .map((offset) => wallMidnight - offset)
    .sort((a, b) => a - b);
  for (const candidate of candidates) {
    if (cairoDayNumber(candidate) >= dayNum) return candidate;
  }
  return candidates[candidates.length - 1];
}

/** Last millisecond of a Cairo calendar day. */
export function cairoDayEndMs(dayNum: number): number {
  return cairoDayStartMs(dayNum + 1) - 1;
}

/** Parses a real `YYYY-MM-DD` calendar date into a day number, else null. */
export function parseIsoDay(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return dayNumber(year, month, day);
}

export type CairoDateRange = { fromMs: number | null; toMs: number | null };

export type CairoDateRangeParams = {
  datePreset?: OrderDatePreset;
  dateFrom?: string;
  dateTo?: string;
};

/**
 * Resolves a date filter into Cairo bounds. Returns null when no date filter
 * applies. A custom range with one side only leaves the other side open
 * (null). A custom side that is not a real `YYYY-MM-DD` date is treated as
 * absent, so the list endpoint keeps accepting every request it accepts today.
 */
export function resolveCairoDateRange(
  params: CairoDateRangeParams,
  nowMs: number,
): CairoDateRange | null {
  const preset = params.datePreset ?? "any";
  const today = cairoDayNumber(nowMs);

  switch (preset) {
    case "today":
      return { fromMs: cairoDayStartMs(today), toMs: cairoDayEndMs(today) };
    case "yesterday":
      return { fromMs: cairoDayStartMs(today - 1), toMs: cairoDayEndMs(today - 1) };
    case "last7":
      return { fromMs: cairoDayStartMs(today - 6), toMs: cairoDayEndMs(today) };
    case "last30":
      return { fromMs: cairoDayStartMs(today - 29), toMs: cairoDayEndMs(today) };
    case "custom": {
      const fromDay = params.dateFrom ? parseIsoDay(params.dateFrom) : null;
      const toDay = params.dateTo ? parseIsoDay(params.dateTo) : null;
      if (fromDay === null && toDay === null) return null;
      return {
        fromMs: fromDay === null ? null : cairoDayStartMs(fromDay),
        toMs: toDay === null ? null : cairoDayEndMs(toDay),
      };
    }
    default:
      return null;
  }
}
