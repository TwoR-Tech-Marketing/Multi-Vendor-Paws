import { describe, expect, it } from "vitest";

import { mapAppointmentError } from "@/features/appointments/domain/errors";

const precondition = (reason: string) => ({
  code: "functions/failed-precondition",
  details: { reason },
});

describe("mapAppointmentError for no-shows and extra invoices", () => {
  it("maps too_early on the no-show flag to the 120 minute message", () => {
    expect(mapAppointmentError(precondition("too_early"), "flagNoShow")).toBe("noShowTooEarly");
    expect(mapAppointmentError(precondition("too_early"))).toBe("tooEarly");
  });

  it("maps the invoice window and limit reasons", () => {
    expect(mapAppointmentError(precondition("window_closed"))).toBe("windowClosed");
    expect(mapAppointmentError(precondition("invoice_limit"))).toBe("invoiceLimit");
    expect(mapAppointmentError(precondition("held"))).toBe("held");
    expect(mapAppointmentError(precondition("invalid_transition"))).toBe("invalidTransition");
  });

  it("never passes an unknown reason through", () => {
    expect(mapAppointmentError(precondition("something_new"))).toBe("invalidTransition");
    expect(mapAppointmentError(new Error("boom"))).toBe("generic");
  });
});
