import { describe, expect, it } from "vitest";

import {
  clampCapacity,
  copyDayTo,
  countFutureExceptions,
  isValidCapacity,
  normalizeIntervals,
  validateException,
  validateWeekly,
  wouldExceedExceptionLimit,
} from "@/features/availability/domain/schemas";
import {
  addDays,
  addMonths,
  endTimeOptions,
  formatDayLabel,
  formatMonthTitle,
  formatTime12,
  isIsoDate,
  monthGrid,
  startTimeOptions,
  weekdayOf,
} from "@/features/availability/domain/time";
import { emptyWeekly, type AvailabilityException } from "@/features/availability/domain/types";

const iv = (start: string, end: string) => ({ start, end });

describe("normalizeIntervals (server mirror)", () => {
  it("sorts and merges touching intervals", () => {
    expect(normalizeIntervals([iv("13:00", "17:00"), iv("09:00", "13:00")])).toEqual({
      ok: true,
      intervals: [iv("09:00", "17:00")],
    });
  });

  it("accepts 24:00 as an end and an empty day", () => {
    expect(normalizeIntervals([iv("20:00", "24:00")]).ok).toBe(true);
    expect(normalizeIntervals([])).toEqual({ ok: true, intervals: [] });
  });

  it.each([
    [[iv("09:10", "10:00")], "invalidInterval"],
    [[iv("09:00", "09:00")], "invalidInterval"],
    [[iv("10:00", "09:00")], "invalidInterval"],
    [[iv("24:00", "24:00")], "invalidInterval"],
    [[iv("9:00", "10:00")], "invalidInterval"],
    [[iv("09:00", "12:00"), iv("11:00", "13:00")], "overlap"],
    [
      [iv("01:00", "02:00"), iv("03:00", "04:00"), iv("05:00", "06:00"), iv("07:00", "08:00"), iv("09:00", "10:00")],
      "limit",
    ],
  ])("refuses %o with %s", (intervals, error) => {
    expect(normalizeIntervals(intervals)).toEqual({ ok: false, error });
  });

  it("requires at least one interval for special hours", () => {
    expect(normalizeIntervals([], 1)).toEqual({ ok: false, error: "invalidInterval" });
  });
});

describe("validateWeekly", () => {
  it("returns per day errors", () => {
    const weekly = { ...emptyWeekly(), mon: [iv("09:00", "12:00"), iv("11:00", "13:00")] };
    expect(validateWeekly(weekly)).toEqual({ ok: false, errors: { mon: "overlap" } });
  });

  it("normalizes every day", () => {
    const weekly = { ...emptyWeekly(), sat: [iv("12:00", "14:00"), iv("09:00", "12:00")] };
    const result = validateWeekly(weekly);
    expect(result.ok && result.weekly.sat).toEqual([iv("09:00", "14:00")]);
  });
});

describe("copyDayTo", () => {
  it("copies only to the picked days", () => {
    const weekly = { ...emptyWeekly(), sat: [iv("09:00", "17:00")], sun: [iv("10:00", "11:00")] };
    const next = copyDayTo(weekly, "sat", ["mon", "wed", "sat"]);
    expect(next.mon).toEqual([iv("09:00", "17:00")]);
    expect(next.wed).toEqual([iv("09:00", "17:00")]);
    expect(next.sun).toEqual([iv("10:00", "11:00")]);
    expect(next.tue).toEqual([]);
    expect(next.mon).not.toBe(weekly.sat);
  });
});

describe("capacity", () => {
  it("is an integer from 1 to 10", () => {
    expect(isValidCapacity(1)).toBe(true);
    expect(isValidCapacity(10)).toBe(true);
    expect(isValidCapacity(0)).toBe(false);
    expect(isValidCapacity(11)).toBe(false);
    expect(isValidCapacity(1.5)).toBe(false);
    expect(clampCapacity(0)).toBe(1);
    expect(clampCapacity(12)).toBe(10);
  });
});

describe("validateException", () => {
  const today = "2026-11-12";
  const closed: AvailabilityException = { branch: { closed: true }, home: null, note: " Eid " };

  it("trims the note and keeps closed rules", () => {
    expect(validateException("2026-11-20", closed, today)).toEqual({
      ok: true,
      exception: { branch: { closed: true }, home: null, note: "Eid" },
    });
  });

  it("treats an empty exception as remove", () => {
    expect(
      validateException("2026-11-20", { branch: null, home: null, note: "  " }, today),
    ).toEqual({ ok: true, exception: null });
  });

  it("allows today to today plus 365 only", () => {
    expect(validateException(today, closed, today).ok).toBe(true);
    expect(validateException(addDays(today, 365), closed, today).ok).toBe(true);
    expect(validateException("2026-11-11", closed, today)).toEqual({ ok: false, error: "date" });
    expect(validateException(addDays(today, 366), closed, today)).toEqual({
      ok: false,
      error: "date",
    });
  });

  it("refuses long notes and empty special hours", () => {
    expect(
      validateException("2026-11-20", { branch: null, home: null, note: "x".repeat(121) }, today),
    ).toEqual({ ok: false, error: "note" });
    expect(
      validateException(
        "2026-11-20",
        { branch: { closed: false, intervals: [] }, home: null, note: null },
        today,
      ),
    ).toEqual({ ok: false, error: "invalidInterval" });
  });

  it("counts the 60 upcoming exceptions limit", () => {
    const exceptions: Record<string, AvailabilityException> = { "2026-11-01": closed };
    for (let i = 0; i < 60; i++) exceptions[addDays(today, i)] = closed;
    expect(countFutureExceptions(exceptions, today)).toBe(60);
    expect(wouldExceedExceptionLimit(exceptions, addDays(today, 100), today)).toBe(true);
    expect(wouldExceedExceptionLimit(exceptions, today, today)).toBe(false);
  });
});

describe("time helpers", () => {
  it("formats 12 hour times with localized markers and Western digits", () => {
    const en = { am: "AM", pm: "PM" };
    const ar = { am: "ص", pm: "م" };
    expect(formatTime12("00:00", en)).toBe("12:00 AM");
    expect(formatTime12("09:30", en)).toBe("9:30 AM");
    expect(formatTime12("12:00", en)).toBe("12:00 PM");
    expect(formatTime12("23:45", en)).toBe("11:45 PM");
    expect(formatTime12("24:00", en)).toBe("12:00 AM");
    expect(formatTime12("13:15", ar)).toBe("1:15 م");
  });

  it("builds 15 minute grid options", () => {
    expect(startTimeOptions()).toHaveLength(96);
    expect(startTimeOptions()[0]).toBe("00:00");
    expect(startTimeOptions().at(-1)).toBe("23:45");
    expect(endTimeOptions()[0]).toBe("00:15");
    expect(endTimeOptions().at(-1)).toBe("24:00");
  });

  it("starts the week on Saturday", () => {
    expect(weekdayOf("2026-11-14")).toBe("sat");
    expect(weekdayOf("2026-11-13")).toBe("fri");
    // November 2026 starts on a Sunday: one blank Saturday cell first.
    const grid = monthGrid("2026-11");
    expect(grid[0]).toBeNull();
    expect(grid[1]).toBe("2026-11-01");
    expect(grid.filter(Boolean)).toHaveLength(30);
    // August 2026 starts on a Saturday: no leading blanks.
    expect(monthGrid("2026-08")[0]).toBe("2026-08-01");
  });

  it("does calendar arithmetic across months and years", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-02-28")).toBe(true);
  });

  it("uses Western digits in Arabic dates", () => {
    expect(formatMonthTitle("2026-11", "ar")).toMatch(/2026/);
    expect(formatDayLabel("2026-11-14", "ar")).toMatch(/14/);
    expect(formatDayLabel("2026-11-14", "ar")).not.toMatch(/[٠-٩]/);
    expect(formatMonthTitle("2026-11", "en")).toBe("November 2026");
  });
});
