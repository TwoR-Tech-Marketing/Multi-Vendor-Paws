import { afterAll, describe, expect, it } from "vitest";

import {
  cairoDayEndMs,
  cairoDayNumber,
  cairoDayStartMs,
  parseIsoDay,
  resolveCairoDateRange,
  type CairoDateRangeParams,
} from "@/features/orders/lib/cairoDates";
import {
  orderMatchesDateFilter,
  resolveOrderDateBounds,
} from "@/features/orders/lib/orderListFilters";

const utc = (iso: string) => Date.parse(iso);
const day = (iso: string) => parseIsoDay(iso)!;

// 2026 Egypt DST: starts Fri 24 Apr (00:00 Cairo skipped, day starts 01:00 +03),
// ends Thu 29 Oct (24:00 +03 falls back to 23:00 +02, a 25 hour day).
describe("Cairo day bounds", () => {
  it("winter day starts at 22:00 UTC the evening before", () => {
    expect(cairoDayStartMs(day("2026-01-15"))).toBe(utc("2026-01-14T22:00:00.000Z"));
    expect(cairoDayEndMs(day("2026-01-15"))).toBe(utc("2026-01-15T21:59:59.999Z"));
  });

  it("summer day starts at 21:00 UTC the evening before", () => {
    expect(cairoDayStartMs(day("2026-07-01"))).toBe(utc("2026-06-30T21:00:00.000Z"));
    expect(cairoDayEndMs(day("2026-07-01"))).toBe(utc("2026-07-01T20:59:59.999Z"));
  });

  it("DST start day starts at the first valid instant, 01:00 Cairo", () => {
    expect(cairoDayEndMs(day("2026-04-23"))).toBe(utc("2026-04-23T21:59:59.999Z"));
    expect(cairoDayStartMs(day("2026-04-24"))).toBe(utc("2026-04-23T22:00:00.000Z"));
    expect(cairoDayEndMs(day("2026-04-24"))).toBe(utc("2026-04-24T20:59:59.999Z"));
  });

  it("DST end day lasts 25 hours", () => {
    const start = cairoDayStartMs(day("2026-10-29"));
    const end = cairoDayEndMs(day("2026-10-29"));
    expect(start).toBe(utc("2026-10-28T21:00:00.000Z"));
    expect(end).toBe(utc("2026-10-29T21:59:59.999Z"));
    expect(end + 1 - start).toBe(25 * 60 * 60 * 1000);
    expect(cairoDayStartMs(day("2026-10-30"))).toBe(utc("2026-10-29T22:00:00.000Z"));
  });

  it("maps instants on both sides of a Cairo midnight to the right day", () => {
    expect(cairoDayNumber(utc("2026-11-10T21:59:00.000Z"))).toBe(day("2026-11-10"));
    expect(cairoDayNumber(utc("2026-11-10T22:01:00.000Z"))).toBe(day("2026-11-11"));
  });

  it("parses only real calendar dates", () => {
    expect(parseIsoDay("2026-02-29")).toBeNull();
    expect(parseIsoDay("2026-13-01")).toBeNull();
    expect(parseIsoDay("26-01-01")).toBeNull();
    expect(parseIsoDay(undefined)).toBeNull();
    expect(parseIsoDay("2028-02-29")).not.toBeNull();
  });
});

const WINTER_NOW = utc("2026-11-11T08:00:00.000Z");

const CASES: Array<[string, CairoDateRangeParams, number, { fromMs: number | null; toMs: number | null } | null]> = [
  ["any", { datePreset: "any" }, WINTER_NOW, null],
  ["absent", {}, WINTER_NOW, null],
  [
    "today",
    { datePreset: "today" },
    WINTER_NOW,
    { fromMs: utc("2026-11-10T22:00:00.000Z"), toMs: utc("2026-11-11T21:59:59.999Z") },
  ],
  [
    "today just after a Cairo midnight (still the previous UTC day)",
    { datePreset: "today" },
    utc("2026-11-10T22:30:00.000Z"),
    { fromMs: utc("2026-11-10T22:00:00.000Z"), toMs: utc("2026-11-11T21:59:59.999Z") },
  ],
  [
    "yesterday",
    { datePreset: "yesterday" },
    WINTER_NOW,
    { fromMs: utc("2026-11-09T22:00:00.000Z"), toMs: utc("2026-11-10T21:59:59.999Z") },
  ],
  [
    "last7",
    { datePreset: "last7" },
    WINTER_NOW,
    { fromMs: utc("2026-11-04T22:00:00.000Z"), toMs: utc("2026-11-11T21:59:59.999Z") },
  ],
  [
    "last30",
    { datePreset: "last30" },
    WINTER_NOW,
    { fromMs: utc("2026-10-12T21:00:00.000Z"), toMs: utc("2026-11-11T21:59:59.999Z") },
  ],
  [
    "today on the DST start day",
    { datePreset: "today" },
    utc("2026-04-24T09:00:00.000Z"),
    { fromMs: utc("2026-04-23T22:00:00.000Z"), toMs: utc("2026-04-24T20:59:59.999Z") },
  ],
  [
    "yesterday across the DST end day",
    { datePreset: "yesterday" },
    utc("2026-10-30T09:00:00.000Z"),
    { fromMs: utc("2026-10-28T21:00:00.000Z"), toMs: utc("2026-10-29T21:59:59.999Z") },
  ],
  [
    "custom inclusive",
    { datePreset: "custom", dateFrom: "2026-04-24", dateTo: "2026-10-29" },
    WINTER_NOW,
    { fromMs: utc("2026-04-23T22:00:00.000Z"), toMs: utc("2026-10-29T21:59:59.999Z") },
  ],
  [
    "custom from only",
    { datePreset: "custom", dateFrom: "2026-11-01" },
    WINTER_NOW,
    { fromMs: utc("2026-10-31T22:00:00.000Z"), toMs: null },
  ],
  [
    "custom to only",
    { datePreset: "custom", dateTo: "2026-04-24" },
    WINTER_NOW,
    { fromMs: null, toMs: utc("2026-04-24T20:59:59.999Z") },
  ],
  ["custom with neither side", { datePreset: "custom" }, WINTER_NOW, null],
  [
    "custom with an invalid side keeps the other side",
    { datePreset: "custom", dateFrom: "2026-02-30", dateTo: "2026-11-01" },
    WINTER_NOW,
    { fromMs: null, toMs: utc("2026-11-01T21:59:59.999Z") },
  ],
];

const ORIGINAL_TZ = process.env.TZ;

describe.each(["UTC", "America/New_York", "Asia/Tokyo"])("resolveCairoDateRange with TZ=%s", (zone) => {
  afterAll(() => {
    if (ORIGINAL_TZ === undefined) delete process.env.TZ;
    else process.env.TZ = ORIGINAL_TZ;
  });

  it("the process zone is in effect", () => {
    process.env.TZ = zone;
    const offset = new Date(utc("2026-01-15T12:00:00.000Z")).getTimezoneOffset();
    expect(offset).toBe({ UTC: 0, "America/New_York": 300, "Asia/Tokyo": -540 }[zone]);
  });

  it.each(CASES)("%s", (_label, params, nowMs, expected) => {
    process.env.TZ = zone;
    expect(resolveCairoDateRange(params, nowMs)).toEqual(expected);
  });

  it("filters orders across a Cairo midnight", () => {
    process.env.TZ = zone;
    const now = new Date(WINTER_NOW);
    const today = { datePreset: "today" as const, dateFrom: "", dateTo: "" };
    expect(orderMatchesDateFilter(new Date("2026-11-10T21:59:00.000Z"), today, now)).toBe(false);
    expect(orderMatchesDateFilter(new Date("2026-11-10T22:01:00.000Z"), today, now)).toBe(true);
    const yesterday = { ...today, datePreset: "yesterday" as const };
    expect(orderMatchesDateFilter(new Date("2026-11-10T21:59:00.000Z"), yesterday, now)).toBe(true);
    expect(resolveOrderDateBounds(today, now)).toEqual({
      from: new Date("2026-11-10T22:00:00.000Z"),
      to: new Date("2026-11-11T21:59:59.999Z"),
    });
  });
});
