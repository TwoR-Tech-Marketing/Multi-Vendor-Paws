import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  callableFn: vi.fn(),
  httpsCallable: vi.fn(),
}));

vi.mock("firebase/functions", () => ({ httpsCallable: mocks.httpsCallable }));
vi.mock("@/lib/firebase", () => ({ firebaseFunctions: {} }));

import {
  getBranchAvailability,
  listBranchSlots,
  saveBranchAvailability,
  setBranchAvailabilityException,
} from "@/features/availability/application/availability.api";
import { conflictDetails, mapAvailabilityError } from "@/features/availability/domain/errors";
import { emptyWeekly } from "@/features/availability/domain/types";

const WEEKLY = { ...emptyWeekly(), sat: [{ start: "09:00", end: "17:00" }] };

const RAW_AVAILABILITY = {
  vendorId: "uid1",
  branchId: "b1",
  weekly: WEEKLY,
  capacity: 2,
  homeVisitWeekly: emptyWeekly(),
  homeVisitCapacity: 1,
  exceptions: {
    "2026-11-20": { branch: { closed: true }, home: null, note: "Holiday" },
    "2026-11-21": {
      branch: { closed: false, intervals: [{ start: "10:00", end: "12:00" }] },
      home: null,
      note: null,
    },
  },
  version: 3,
  updatedAtMs: 1700,
};

const RAW_CONFLICT = {
  appointmentId: "a1",
  mode: "branch",
  date: "2026-11-14",
  startMs: 1,
  endMs: 2,
  startLocal: "09:00",
  endLocal: "09:30",
  serviceIds: ["s1"],
  status: "paid",
  reason: "outside_hours",
};

function respond(data: unknown) {
  mocks.callableFn.mockResolvedValueOnce({ data });
}

function lastCall(): { name: string; payload: unknown } {
  return {
    name: mocks.httpsCallable.mock.calls.at(-1)?.[1] as string,
    payload: mocks.callableFn.mock.calls.at(-1)?.[0],
  };
}

const PAYLOAD = {
  weekly: WEEKLY,
  capacity: 2,
  homeVisitWeekly: emptyWeekly(),
  homeVisitCapacity: 1,
};

beforeEach(() => {
  mocks.callableFn.mockReset();
  mocks.httpsCallable.mockReset();
  mocks.httpsCallable.mockReturnValue(mocks.callableFn);
});

describe("availability.api callables", () => {
  it("gets availability with home visit and today", async () => {
    respond({
      ok: true,
      availability: RAW_AVAILABILITY,
      homeVisit: { enabled: true, feePiastres: 15000, radiusMeters: 3000 },
      todayDate: "2026-11-12",
    });
    const state = await getBranchAvailability("b1");
    expect(lastCall()).toEqual({
      name: "vendor_availability-getBranchAvailability",
      payload: { branchId: "b1" },
    });
    expect(state.availability).toEqual(RAW_AVAILABILITY);
    expect(state.homeVisit).toEqual({ enabled: true, feePiastres: 15000, radiusMeters: 3000 });
    expect(state.todayDate).toBe("2026-11-12");
  });

  it("maps a missing doc to defaults: closed days, capacity 1, version 0", async () => {
    respond({
      ok: true,
      availability: { weekly: { sat: [] }, version: 0 },
      homeVisit: { enabled: false, feePiastres: 9, radiusMeters: 9 },
      todayDate: "2026-11-12",
    });
    const state = await getBranchAvailability("b1");
    expect(state.availability.weekly).toEqual(emptyWeekly());
    expect(state.availability.capacity).toBe(1);
    expect(state.availability.homeVisitCapacity).toBe(1);
    expect(state.availability.version).toBe(0);
    expect(state.availability.exceptions).toEqual({});
    expect(state.homeVisit).toEqual({ enabled: false, feePiastres: 0, radiusMeters: 0 });
  });

  it("saves with the expected version and omits empty keep ids", async () => {
    respond({ ok: true, availability: { ...RAW_AVAILABILITY, version: 4 } });
    const saved = await saveBranchAvailability({
      branchId: "b1",
      expectedVersion: 3,
      payload: PAYLOAD,
      keepAppointmentIds: [],
    });
    expect(lastCall()).toEqual({
      name: "vendor_availability-saveBranchAvailability",
      payload: { branchId: "b1", expectedVersion: 3, ...PAYLOAD },
    });
    expect(saved.version).toBe(4);
  });

  it("sends unique keep ids", async () => {
    respond({ ok: true, availability: RAW_AVAILABILITY });
    await saveBranchAvailability({
      branchId: "b1",
      expectedVersion: 3,
      payload: PAYLOAD,
      keepAppointmentIds: ["a1", "a1", "a2"],
    });
    expect((lastCall().payload as Record<string, unknown>).keepAppointmentIds).toEqual(["a1", "a2"]);
  });

  it("sets and removes an exception", async () => {
    respond({ ok: true, availability: RAW_AVAILABILITY });
    await setBranchAvailabilityException({
      branchId: "b1",
      expectedVersion: 3,
      date: "2026-11-20",
      exception: { branch: { closed: true }, home: null, note: null },
    });
    expect(lastCall()).toEqual({
      name: "vendor_availability-setBranchAvailabilityException",
      payload: {
        branchId: "b1",
        expectedVersion: 3,
        date: "2026-11-20",
        exception: { branch: { closed: true }, home: null, note: null },
      },
    });

    respond({ ok: true, availability: RAW_AVAILABILITY });
    await setBranchAvailabilityException({
      branchId: "b1",
      expectedVersion: 3,
      date: "2026-11-20",
      exception: null,
      keepAppointmentIds: ["a1"],
    });
    expect(lastCall().payload).toMatchObject({ exception: null, keepAppointmentIds: ["a1"] });
  });

  it("lists slots and maps days", async () => {
    respond({
      ok: true,
      durationMinutes: 45,
      days: [
        {
          date: "2026-11-14",
          closed: false,
          slots: [{ startMs: 1, endMs: 2, startLocal: "09:00", endLocal: "09:45", remaining: 0 }],
        },
        { date: "2026-11-15", closed: true, slots: [] },
      ],
    });
    const preview = await listBranchSlots({
      branchId: "b1",
      serviceId: "s1",
      mode: "home",
      fromDate: "2026-11-14",
      toDate: "2026-11-20",
    });
    expect(lastCall()).toEqual({
      name: "vendor_availability-listBranchSlots",
      payload: {
        branchId: "b1",
        serviceId: "s1",
        mode: "home",
        fromDate: "2026-11-14",
        toDate: "2026-11-20",
      },
    });
    expect(preview.durationMinutes).toBe(45);
    expect(preview.days[0].slots[0].remaining).toBe(0);
    expect(preview.days[1].closed).toBe(true);
  });

  it("propagates callable errors", async () => {
    mocks.callableFn.mockRejectedValueOnce({ code: "functions/aborted", message: "x" });
    await expect(getBranchAvailability("b1")).rejects.toMatchObject({ code: "functions/aborted" });
  });
});

describe("mapAvailabilityError", () => {
  it.each([
    [{ code: "functions/aborted", message: "Availability changed, reload." }, "versionChanged"],
    [
      {
        code: "functions/failed-precondition",
        message: "Booked appointments conflict with this change.",
        details: { reason: "conflicts", conflicts: [RAW_CONFLICT] },
      },
      "conflicts",
    ],
    [{ code: "functions/failed-precondition", message: "Exception limit reached." }, "limit"],
    [{ code: "functions/failed-precondition", message: "Branch is archived." }, "archived"],
    [{ code: "functions/invalid-argument", message: "Overlapping intervals in weekly.sat." }, "overlap"],
    [
      { code: "functions/invalid-argument", message: "Invalid weekly.sat: 0 to 4 intervals allowed." },
      "limit",
    ],
    [{ code: "functions/invalid-argument", message: "Invalid weekly.sat[0]." }, "invalidInterval"],
    [{ code: "functions/not-found", message: "Branch not found." }, "notFound"],
    [{ code: "functions/permission-denied", message: "x" }, "notAllowed"],
    [{ code: "functions/unauthenticated", message: "x" }, "notAllowed"],
    [{ code: "functions/internal", message: "x" }, "generic"],
    [new Error("boom"), "generic"],
    [{ code: "functions/invalid-argument", message: "Overlapping", details: { reason: "grid" } }, "invalidInterval"],
    [{ code: "functions/invalid-argument", message: "x", details: { reason: "interval_limit" } }, "limit"],
    [{ code: "functions/invalid-argument", message: "x", details: { reason: "overlap" } }, "overlap"],
    [{ code: "functions/failed-precondition", message: "x", details: { reason: "exception_limit" } }, "limit"],
    [{ code: "functions/failed-precondition", message: "x", details: { reason: "archived" } }, "archived"],
    [{ code: "functions/invalid-argument", message: "x", details: { reason: "invalid_date" } }, "date"],
    [{ code: "functions/invalid-argument", message: "x", details: { reason: "note_too_long" } }, "note"],
    [{ code: "functions/aborted", message: "x", details: { reason: "version_changed" } }, "versionChanged"],
    [{ code: "functions/failed-precondition", message: "x", details: { reason: "conflicts" } }, "conflicts"],
    [{ code: "functions/not-found", message: "x", details: { reason: "unknown_code" } }, "notFound"],
    [{ code: "functions/internal", message: "x", details: { reason: "constructor" } }, "generic"],
    [null, "generic"],
  ])("maps %o to %s", (error, key) => {
    expect(mapAvailabilityError(error)).toBe(key);
  });

  it("reads conflict details only for a conflicts refusal", () => {
    expect(
      conflictDetails({ details: { reason: "conflicts", conflicts: [RAW_CONFLICT] } }),
    ).toEqual([RAW_CONFLICT]);
    expect(conflictDetails({ details: { reason: "other" } })).toBeNull();
    expect(conflictDetails({})).toBeNull();
  });
});
