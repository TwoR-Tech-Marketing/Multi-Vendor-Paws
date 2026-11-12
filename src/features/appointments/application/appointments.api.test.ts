import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ callableFn: vi.fn(), httpsCallable: vi.fn() }));

vi.mock("firebase/functions", () => ({ httpsCallable: mocks.httpsCallable }));
vi.mock("@/lib/firebase", () => ({ firebaseFunctions: {} }));

import {
  cancelVendorAppointment,
  completeVendorAppointment,
  getVendorAppointment,
  listVendorAppointments,
  mapAppointment,
  mapAppointmentRow,
  rescheduleVendorAppointment,
} from "@/features/appointments/application/appointments.api";
import { appointmentErrorMessage } from "@/features/appointments/presentation/appointments-copy";
import { RAW_APPOINTMENT, RAW_ROW } from "@/features/appointments/presentation/test-fixtures";
import { getStrings } from "@/shared/i18n/get-strings";

beforeEach(() => {
  mocks.callableFn.mockReset();
  mocks.httpsCallable.mockReset();
  mocks.httpsCallable.mockImplementation(() => mocks.callableFn);
});

function lastCall() {
  return {
    name: mocks.httpsCallable.mock.calls.at(-1)?.[1],
    payload: mocks.callableFn.mock.calls.at(-1)?.[0],
  };
}

describe("appointment mapping", () => {
  it("maps a row with integer piastres and safe defaults", () => {
    expect(mapAppointmentRow(RAW_ROW)).toEqual({
      appointmentId: "appt1",
      appointmentNumber: "#APPT1AAA",
      status: "paid",
      branchId: "b1",
      branchName: "Zamalek",
      mode: "branch",
      startMs: 1_000,
      endMs: 2_000,
      cairoDate: "2026-11-14",
      startLocal: "09:30",
      endLocal: "10:00",
      serviceNames: [{ en: "Checkup", ar: "كشف" }],
      buyerName: "Mona Ali",
      buyerFirstName: "Mona",
      totalPiastres: 25_000,
      held: false,
      noShowState: null,
    });
    const odd = mapAppointmentRow({ status: "pending_payment", totalPiastres: 12.5, held: "yes" });
    expect(odd.status).toBe("paid");
    expect(odd.totalPiastres).toBe(0);
    expect(odd.held).toBe(false);
  });

  it("maps the detail with snapshots, history roles and no uid", () => {
    const a = mapAppointment(RAW_APPOINTMENT);
    expect(a.buyerPhone).toBe("01000000000");
    expect(a.petName).toBe("Max");
    expect(a.services[0]).toEqual({
      serviceId: "s1",
      nameEn: "Checkup",
      nameAr: "كشف",
      pricePiastres: 20_000,
      durationMinutes: 30,
    });
    expect(a.homeVisitFeePiastres).toBe(5_000);
    expect(a.paymentMethod).toBe("dev_unpaid");
    expect(a.rescheduleCount).toEqual({ buyer: 1, provider: 0 });
    expect(a.statusHistory).toEqual([
      { status: "paid", atMs: 500, byRole: "buyer", reason: null, note: null },
      { status: "rescheduled", atMs: 700, byRole: "provider", reason: "Doctor away", note: "from 1" },
    ]);
    expect(JSON.stringify(a.statusHistory)).not.toContain("byUid");
    expect(a.noShow).toBeNull();
  });

  it("reads the nested branch and pet of the callable response", () => {
    const a = mapAppointment({
      ...RAW_ROW,
      branch: { name: "Zamalek", address: "26 July St", phone: "0222" },
      pet: { petId: "p1", name: "Luna" },
      buyerPhone: "0111",
      paymentMethod: "dev_unpaid",
      services: [{ serviceId: "s9", nameEn: "Bath", nameAr: "استحمام", pricePiastres: 100, durationMinutes: 15 }],
    });
    expect(a.branchAddress).toBe("26 July St");
    expect(a.petName).toBe("Luna");
    expect(a.buyerPhone).toBe("0111");
    expect(a.serviceIds).toEqual(["s9"]);
  });

  it("reads only callable response fields, never stored document fields", () => {
    const a = mapAppointment({
      ...RAW_ROW,
      buyerSnapshot: { phone: "0100" },
      petSnapshot: { name: "Rex" },
      branchSnapshot: { address: "Stored St" },
      serviceSnapshots: [{ serviceId: "s1", pricePiastres: 100 }],
      payment: { method: "fawaterak" },
    });
    expect(a.buyerPhone).toBe("");
    expect(a.petName).toBeNull();
    expect(a.branchAddress).toBe("");
    expect(a.services).toEqual([]);
    expect(a.paymentMethod).toBeNull();
  });

  it("reads the no-show state from the sub-object when the row field is missing", () => {
    const a = mapAppointment({
      ...RAW_APPOINTMENT,
      status: "no_show",
      noShowState: undefined,
      noShow: { state: "disputed", flaggedAtMs: 9 },
    });
    expect(a.noShowState).toBe("disputed");
    expect(a.noShow?.flaggedAtMs).toBe(9);
  });
});

describe("appointment callables", () => {
  it("lists with the request as given and maps the page", async () => {
    mocks.callableFn.mockResolvedValue({
      data: { ok: true, items: [RAW_ROW, { appointmentId: "" }], nextCursor: "c2", dateRange: null },
    });
    const page = await listVendorAppointments({ statuses: ["paid"], order: "asc", pageSize: 20 });
    expect(lastCall()).toEqual({
      name: "vendor_appointments-listVendorAppointments",
      payload: { statuses: ["paid"], order: "asc", pageSize: 20 },
    });
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBe("c2");
  });

  it("gets the detail and keeps only known allowed actions", async () => {
    mocks.callableFn.mockResolvedValue({
      data: {
        ok: true,
        appointment: RAW_APPOINTMENT,
        extraInvoices: [],
        allowedActions: ["cancel", "flag_no_show", "complete"],
      },
    });
    const detail = await getVendorAppointment("appt1");
    expect(lastCall()).toEqual({
      name: "vendor_appointments-getVendorAppointment",
      payload: { appointmentId: "appt1" },
    });
    expect(detail.allowedActions).toEqual(["complete", "cancel"]);
  });

  it("sends complete, cancel and reschedule payloads with trimmed text", async () => {
    mocks.callableFn.mockResolvedValue({ data: { ok: true, appointment: RAW_APPOINTMENT } });
    await completeVendorAppointment("appt1");
    expect(lastCall()).toEqual({
      name: "vendor_appointments-completeVendorAppointment",
      payload: { appointmentId: "appt1" },
    });
    await cancelVendorAppointment("appt1", "  Clinic closed  ");
    expect(lastCall()).toEqual({
      name: "vendor_appointments-cancelVendorAppointment",
      payload: { appointmentId: "appt1", reason: "Clinic closed" },
    });
    const moved = await rescheduleVendorAppointment({
      appointmentId: "appt1",
      startMs: 5_000,
      reason: " Doctor away ",
    });
    expect(lastCall()).toEqual({
      name: "vendor_appointments-rescheduleVendorAppointment",
      payload: { appointmentId: "appt1", startMs: 5_000, reason: "Doctor away" },
    });
    expect(moved.appointmentId).toBe("appt1");
  });

  it("turns a refusal into friendly copy in both languages", async () => {
    mocks.callableFn.mockRejectedValue({
      code: "functions/failed-precondition",
      message: "Appointment is held (internal).",
      details: { reason: "held" },
    });
    const error = await completeVendorAppointment("appt1").catch((e: unknown) => e);
    const en = getStrings("en");
    const ar = getStrings("ar");
    expect(appointmentErrorMessage(error, en)).toBe(en.errors.appointments.held);
    expect(appointmentErrorMessage(error, ar)).toBe(ar.errors.appointments.held);
    expect(appointmentErrorMessage(new Error("x"), en)).toBe(en.errors.generic);
  });
});
