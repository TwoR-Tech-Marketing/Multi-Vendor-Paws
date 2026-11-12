import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({ firebaseFunctions: {} }));
vi.mock("firebase/functions", () => ({ httpsCallable: vi.fn() }));

import {
  applyReload,
  applySaved,
  classifyWriteError,
  isDirty,
  payloadOf,
  type EditorData,
} from "@/features/availability/application/availability-write";
import { emptyWeekly, type Availability } from "@/features/availability/domain/types";

function availability(patch: Partial<Availability> = {}): Availability {
  return {
    vendorId: "uid1",
    branchId: "b1",
    weekly: { ...emptyWeekly(), sat: [{ start: "09:00", end: "17:00" }] },
    capacity: 1,
    homeVisitWeekly: emptyWeekly(),
    homeVisitCapacity: 1,
    exceptions: {},
    version: 1,
    updatedAtMs: 1,
    ...patch,
  };
}

function editor(a: Availability, draftPatch: Partial<ReturnType<typeof payloadOf>> = {}): EditorData {
  return {
    state: {
      availability: a,
      homeVisit: { enabled: false, feePiastres: 0, radiusMeters: 0 },
      todayDate: "2026-11-12",
    },
    draft: { ...payloadOf(a), ...draftPatch },
  };
}

const EDITED = { capacity: 4 };

describe("applySaved", () => {
  it("resets the draft to the saved doc after a weekly save", () => {
    const saved = availability({ capacity: 4, version: 2 });
    const next = applySaved("weekly", editor(availability(), EDITED), saved);
    expect(next.state.availability).toBe(saved);
    expect(next.draft).toEqual(payloadOf(saved));
    expect(isDirty(next.draft, next.state.availability)).toBe(false);
  });

  it("keeps unsaved weekly edits after an exception write", () => {
    const saved = availability({
      version: 2,
      exceptions: { "2026-11-20": { branch: { closed: true }, home: null, note: null } },
    });
    const before = editor(availability(), EDITED);
    const next = applySaved("exception", before, saved);
    expect(next.state.availability.version).toBe(2);
    expect(next.state.availability.exceptions["2026-11-20"]).toBeDefined();
    expect(next.draft).toBe(before.draft);
    expect(next.draft.capacity).toBe(4);
    expect(isDirty(next.draft, next.state.availability)).toBe(true);
  });
});

describe("classifyWriteError", () => {
  const conflict = {
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

  it("opens the conflicts dialog with the ids already kept", () => {
    const failure = classifyWriteError(
      {
        code: "functions/failed-precondition",
        message: "Booked appointments conflict with this change.",
        details: {
          reason: "conflicts",
          conflicts: [conflict, { ...conflict, appointmentId: "a2", reason: "bad" }],
        },
      },
      ["a1"],
    );
    expect(failure.type).toBe("conflicts");
    if (failure.type !== "conflicts") return;
    expect(failure.kept).toEqual(["a1"]);
    expect(failure.conflicts.map((c) => c.appointmentId)).toEqual(["a1", "a2"]);
    expect(failure.conflicts[1].reason).toBe("outside_hours");
  });

  it("asks to reload on a version mismatch", () => {
    expect(classifyWriteError({ code: "functions/aborted", message: "x" }, [])).toEqual({
      type: "versionChanged",
    });
  });

  it("maps other refusals to an error key", () => {
    expect(
      classifyWriteError(
        { code: "functions/failed-precondition", message: "Exception limit reached." },
        [],
      ),
    ).toEqual({ type: "error", key: "limit" });
    expect(classifyWriteError(new Error("boom"), [])).toEqual({ type: "error", key: "generic" });
  });
});

describe("applyReload", () => {
  const latest = availability({ version: 5, capacity: 2 });
  const loaded = editor(latest).state;

  it("takes the server doc on first load", () => {
    const next = applyReload(loaded);
    expect(next.state).toBe(loaded);
    expect(next.draft).toEqual(payloadOf(latest));
  });

  it("discards unsaved edits after a version change so the next save cannot overwrite", () => {
    const before = editor(availability(), EDITED);
    expect(isDirty(before.draft, before.state.availability)).toBe(true);
    const next = applyReload(loaded);
    expect(next.state.availability.version).toBe(5);
    expect(next.draft).toEqual(payloadOf(latest));
    expect(next.draft.capacity).toBe(2);
    expect(isDirty(next.draft, next.state.availability)).toBe(false);
  });
});
