import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { formatEgp } from "@/features/products/domain/currency";
import { makeAppointment } from "@/features/appointments/presentation/test-fixtures";
import { getStrings } from "@/shared/i18n/get-strings";

vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return { useStrings: () => load("en"), usePreferences: () => ({ locale: "en", dir: "ltr" }) };
});
vi.mock("@/features/appointments/application/appointments.api", () => ({
  getVendorAppointment: vi.fn(() => new Promise(() => {})),
  completeVendorAppointment: vi.fn(),
  cancelVendorAppointment: vi.fn(),
  rescheduleVendorAppointment: vi.fn(),
}));

vi.mock("@/features/appointments/application/invoice-services", () => ({
  listInvoiceServices: vi.fn(() => new Promise(() => {})),
}));

vi.mock("@/features/availability/application/availability.api", () => ({
  listBranchSlots: vi.fn(() => new Promise(() => {})),
}));

import { AppointmentActionBar } from "@/features/appointments/presentation/AppointmentActionBar";
import { AppointmentDetailSection } from "@/features/appointments/presentation/AppointmentDetailSection";
import { AppointmentDetailView } from "@/features/appointments/presentation/AppointmentDetailView";
import { CancelAppointmentDialog } from "@/features/appointments/presentation/CancelAppointmentDialog";
import {
  RescheduleDialog,
  rescheduleSlotRequest,
} from "@/features/appointments/presentation/RescheduleDialog";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};

describe("AppointmentActionBar", () => {
  it("renders exactly the allowed actions", () => {
    const html = renderToStaticMarkup(
      <AppointmentActionBar actions={["complete"]} strings={en} disabled={false} onAction={noop} />,
    );
    expect(html).toContain(en.appointments.actions.complete);
    expect(html).not.toContain(en.appointments.actions.cancel);
    expect(html).not.toContain(en.appointments.actions.reschedule);
  });

  it("renders all three when allowed, and a note when none are", () => {
    const all = renderToStaticMarkup(
      <AppointmentActionBar
        actions={["complete", "cancel", "reschedule"]}
        strings={ar}
        disabled={false}
        onAction={noop}
      />,
    );
    expect(all).toContain(ar.appointments.actions.complete);
    expect(all).toContain(ar.appointments.actions.cancel);
    expect(all).toContain(ar.appointments.actions.reschedule);
    const none = renderToStaticMarkup(
      <AppointmentActionBar actions={[]} strings={en} disabled={false} onAction={noop} />,
    );
    expect(none).toContain(en.appointments.actions.none);
    expect(none).not.toContain("<button");
  });
});

describe("AppointmentDetailView", () => {
  it("shows buyer contact, services with piastre prices and the timeline", () => {
    const html = renderToStaticMarkup(
      <AppointmentDetailView appointment={makeAppointment()} strings={en} locale="en" />,
    );
    expect(html).toContain("01000000000");
    expect(html).toContain("Max");
    expect(html).toContain(formatEgp(20_000));
    expect(html).toContain(formatEgp(5_000));
    expect(html).toContain(formatEgp(25_000));
    expect(html).toContain(`${en.appointments.status.paid} by ${en.appointments.history.byRole.buyer}`);
    expect(html).toContain("Reason: Doctor away");
    expect(html).not.toContain(en.appointments.heldBanner);
    expect(html).not.toContain(en.appointments.noShow.title);
  });

  it("shows the held banner and the no-show state read only", () => {
    const html = renderToStaticMarkup(
      <AppointmentDetailView
        appointment={makeAppointment({
          status: "no_show",
          held: true,
          noShowState: "late_returned",
          noShow: {
            state: "late_returned",
            flaggedAtMs: 1_000,
            answerDueAtMs: null,
            answer: "arrived_late",
            answeredAtMs: null,
            buyerNote: null,
            confirmedBy: null,
          },
        })}
        strings={ar}
        locale="ar"
      />,
    );
    expect(html).toContain(ar.appointments.heldBanner);
    expect(html).toContain(ar.appointments.noShow.title);
    expect(html).toContain(ar.appointments.noShow.state.late_returned);
    expect(html).toContain("كشف");
    expect(html).not.toContain("<button");
  });
});

describe("AppointmentDetailSection", () => {
  it("starts with the shimmer skeleton", () => {
    const html = renderToStaticMarkup(<AppointmentDetailSection appointmentId="appt1" />);
    expect(html).toContain('aria-busy="true"');
  });
});

describe("CancelAppointmentDialog", () => {
  it("asks for a reason and keeps the confirm button disabled until it is valid", () => {
    const html = renderToStaticMarkup(
      <CancelAppointmentDialog strings={en} isSubmitting={false} error={null} onConfirm={noop} onClose={noop} />,
    );
    expect(html).toContain(en.appointments.cancelReason);
    expect(html).toContain(en.appointments.reasonHint);
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Cancel appointment</);
  });
});

describe("RescheduleDialog", () => {
  it("loads open times with a skeleton and needs a time and a reason to submit", () => {
    const html = renderToStaticMarkup(
      <RescheduleDialog
        appointment={makeAppointment()}
        strings={en}
        locale="en"
        isSubmitting={false}
        error={null}
        onConfirm={noop}
        onClose={noop}
      />,
    );
    expect(html).toContain(en.appointments.dialogs.rescheduleTitle);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(en.appointments.rescheduleReason);
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Previous week</);
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Move appointment</);
  });
});

describe("rescheduleSlotRequest", () => {
  it("asks for slots with every service of the appointment, week by week in Cairo days", () => {
    const appointment = makeAppointment({ serviceIds: ["s1", "s2"], mode: "home" });
    const lateUtc = Date.UTC(2026, 10, 12, 22, 30);
    expect(rescheduleSlotRequest(appointment, 0, lateUtc)).toEqual({
      branchId: "b1",
      serviceIds: ["s1", "s2"],
      mode: "home",
      fromDate: "2026-11-13",
      toDate: "2026-11-19",
    });
    const next = rescheduleSlotRequest(appointment, 1, lateUtc);
    expect(next.fromDate).toBe("2026-11-20");
    expect(next).not.toHaveProperty("serviceId");
  });
});
