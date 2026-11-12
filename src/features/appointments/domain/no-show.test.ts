import { describe, expect, it } from "vitest";

import {
  noShowAvailableAtMs,
  noShowQuestionKey,
  showNoShowTooEarly,
} from "@/features/appointments/domain/no-show";

const booked = { status: "paid" as const, held: false, noShow: null };

describe("no-show rules", () => {
  it("opens the flag 120 minutes after the start", () => {
    expect(noShowAvailableAtMs(0)).toBe(120 * 60_000);
  });

  it("uses the groomer question only for groomers", () => {
    expect(noShowQuestionKey("groomer")).toBe("questionGroomer");
    expect(noShowQuestionKey("clinic")).toBe("question");
    expect(noShowQuestionKey("")).toBe("question");
  });

  it("explains the wait only for a booked, actionable appointment the server does not let flag yet", () => {
    expect(showNoShowTooEarly(booked, ["complete"])).toBe(true);
    expect(showNoShowTooEarly({ ...booked, status: "rescheduled" }, ["cancel"])).toBe(true);
    expect(showNoShowTooEarly(booked, ["complete", "flagNoShow"])).toBe(false);
    expect(showNoShowTooEarly(booked, [])).toBe(false);
    expect(showNoShowTooEarly({ ...booked, held: true }, ["complete"])).toBe(false);
    expect(showNoShowTooEarly({ ...booked, status: "completed" }, ["createExtraInvoice"])).toBe(false);
  });
});
