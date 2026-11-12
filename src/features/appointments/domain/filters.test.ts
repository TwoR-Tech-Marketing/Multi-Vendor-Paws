import { describe, expect, it } from "vitest";

import { isValidReason, pickAllowedActions } from "@/features/appointments/domain/actions";
import { mapAppointmentError } from "@/features/appointments/domain/errors";
import {
  DEFAULT_APPOINTMENT_FILTERS,
  STATUS_GROUPS,
  buildListRequest,
  cairoPresetRange,
  cairoTodayIso,
  groupOfStatus,
  statusesForGroup,
  validateCustomRange,
} from "@/features/appointments/domain/filters";
import { APPOINTMENT_STATUSES } from "@/features/appointments/domain/types";

/** 22:30 UTC on 12 Nov is already 00:30 on 13 Nov in Cairo (UTC+2). */
const LATE_UTC = Date.UTC(2026, 10, 12, 22, 30);

describe("Cairo date presets", () => {
  it("uses the Cairo calendar day, not the UTC day", () => {
    expect(cairoTodayIso(LATE_UTC)).toBe("2026-11-13");
    expect(cairoTodayIso(Date.UTC(2026, 10, 12, 21, 30))).toBe("2026-11-12");
  });

  it("resolves every preset to Cairo calendar dates", () => {
    expect(cairoPresetRange("today", LATE_UTC)).toEqual({ from: "2026-11-13", to: "2026-11-13" });
    expect(cairoPresetRange("tomorrow", LATE_UTC)).toEqual({ from: "2026-11-14", to: "2026-11-14" });
    expect(cairoPresetRange("next7", LATE_UTC)).toEqual({ from: "2026-11-13", to: "2026-11-19" });
    expect(cairoPresetRange("last7", LATE_UTC)).toEqual({ from: "2026-11-07", to: "2026-11-13" });
    expect(cairoPresetRange("last30", LATE_UTC)).toEqual({ from: "2026-10-15", to: "2026-11-13" });
    expect(cairoPresetRange("any", LATE_UTC)).toBeNull();
    expect(cairoPresetRange("custom", LATE_UTC)).toBeNull();
  });

  it("checks a custom range: both dates, ordered, at most 92 days", () => {
    expect(validateCustomRange("", "2026-11-13")).toBe("rangeIncomplete");
    expect(validateCustomRange("2026-02-30", "2026-03-01")).toBe("rangeIncomplete");
    expect(validateCustomRange("2026-11-14", "2026-11-13")).toBe("rangeOrder");
    expect(validateCustomRange("2026-01-01", "2026-04-02")).toBeNull();
    expect(validateCustomRange("2026-01-01", "2026-04-03")).toBe("rangeTooLong");
  });
});

describe("status chips", () => {
  it("covers every status exactly once outside All", () => {
    const covered = STATUS_GROUPS.flatMap((group) => statusesForGroup(group) ?? []);
    expect([...covered].sort()).toEqual([...APPOINTMENT_STATUSES].sort());
    expect(statusesForGroup("all")).toBeNull();
    expect(statusesForGroup("upcoming")).toEqual(["paid", "rescheduled"]);
    expect(groupOfStatus("cancelled_by_clinic")).toBe("cancelled");
    expect(groupOfStatus("refunded")).toBe("refunds");
  });
});

describe("buildListRequest", () => {
  it("defaults to upcoming soonest first with the page size", () => {
    expect(buildListRequest(DEFAULT_APPOINTMENT_FILTERS)).toEqual({
      statuses: ["paid", "rescheduled"],
      order: "asc",
      pageSize: 20,
    });
  });

  it("sends the branch, a server preset and the cursor; past views read newest first", () => {
    expect(
      buildListRequest({ ...DEFAULT_APPOINTMENT_FILTERS, group: "all", branchId: "b1", datePreset: "last7" }, "c1"),
    ).toEqual({ branchId: "b1", datePreset: "last7", order: "desc", pageSize: 20, cursor: "c1" });
    expect(buildListRequest({ ...DEFAULT_APPOINTMENT_FILTERS, group: "completed" })?.order).toBe("desc");
  });

  it("sends a valid custom range and nothing while it is invalid", () => {
    const custom = { ...DEFAULT_APPOINTMENT_FILTERS, datePreset: "custom" as const };
    expect(buildListRequest({ ...custom, dateFrom: "2026-11-01", dateTo: "2026-11-30" })).toMatchObject({
      dateFrom: "2026-11-01",
      dateTo: "2026-11-30",
    });
    expect(buildListRequest({ ...custom, dateFrom: "2026-11-30", dateTo: "2026-11-01" })).toBeNull();
    expect(buildListRequest(custom)).toBeNull();
  });
});

describe("allowed actions and reasons", () => {
  it("keeps only the actions the server allows, in a fixed order", () => {
    expect(pickAllowedActions(["reschedule", "complete", "flag_no_show"])).toEqual([
      "complete",
      "reschedule",
    ]);
    expect(pickAllowedActions(undefined)).toEqual([]);
    expect(pickAllowedActions("complete")).toEqual([]);
  });

  it("requires a reason of 3 to 300 characters after trimming", () => {
    expect(isValidReason("  ab  ")).toBe(false);
    expect(isValidReason("abc")).toBe(true);
    expect(isValidReason("x".repeat(300))).toBe(true);
    expect(isValidReason("x".repeat(301))).toBe(false);
  });
});

describe("mapAppointmentError", () => {
  const precondition = (reason: string) => ({
    code: "functions/failed-precondition",
    message: "raw",
    details: { reason },
  });

  it.each([
    ["held", "held"],
    ["invalid_transition", "invalidTransition"],
    ["too_early", "tooEarly"],
    ["too_late", "tooLate"],
    ["slot_taken", "slotTaken"],
    ["slot_unavailable", "slotUnavailable"],
    ["reschedule_limit", "rescheduleLimit"],
    ["service_unavailable", "slotUnavailable"],
    ["not_found", "notFound"],
  ])("maps reason %s", (reason, key) => {
    expect(mapAppointmentError(precondition(reason))).toBe(key);
  });

  it("maps codes when no known reason is given", () => {
    expect(mapAppointmentError({ code: "functions/aborted" })).toBe("busy");
    expect(mapAppointmentError({ code: "functions/not-found" })).toBe("notFound");
    expect(mapAppointmentError({ code: "functions/permission-denied" })).toBe("notAllowed");
    expect(mapAppointmentError({ code: "functions/invalid-argument" })).toBe("invalidField");
    expect(mapAppointmentError(precondition("something_new"))).toBe("invalidTransition");
    expect(mapAppointmentError(new Error("boom"))).toBe("generic");
    expect(mapAppointmentError(null)).toBe("generic");
  });
});
