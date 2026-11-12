import type { Appointment, AppointmentRow } from "@/features/appointments/domain/types";

/** Raw callable shapes, as the server returns them. */
export const RAW_ROW = {
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
};

export const RAW_APPOINTMENT = {
  ...RAW_ROW,
  vendorType: "clinic",
  serviceIds: ["s1"],
  serviceSnapshots: [
    { serviceId: "s1", nameEn: "Checkup", nameAr: "كشف", pricePiastres: 20_000, durationMinutes: 30 },
  ],
  durationMinutes: 30,
  buyerSnapshot: { name: "Mona Ali", firstName: "Mona", phone: "01000000000" },
  petSnapshot: { name: "Max" },
  homeAddress: null,
  branchSnapshot: { name: "Zamalek", address: "26 July St", phone: "0222222222" },
  itemsPiastres: 20_000,
  homeVisitFeePiastres: 5_000,
  discountPiastres: 0,
  payment: { method: "dev_unpaid" },
  rescheduleCount: { buyer: 1, provider: 0 },
  cancelReason: null,
  noShow: null,
  completedAtMs: null,
  statusHistory: [
    { status: "paid", atMs: 500, byRole: "buyer" },
    { status: "rescheduled", atMs: 700, byRole: "provider", reason: "Doctor away", note: "from 1" },
  ],
};

/** Mapped shapes (no mapper call, so tests may mock the api module). */
export function makeRow(overrides: Partial<AppointmentRow> = {}): AppointmentRow {
  return { ...(RAW_ROW as AppointmentRow), serviceNames: [{ en: "Checkup", ar: "كشف" }], ...overrides };
}

export function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    ...makeRow(),
    vendorType: "clinic",
    serviceIds: ["s1"],
    services: [
      { serviceId: "s1", nameEn: "Checkup", nameAr: "كشف", pricePiastres: 20_000, durationMinutes: 30 },
    ],
    durationMinutes: 30,
    buyerPhone: "01000000000",
    petName: "Max",
    homeAddress: null,
    branchAddress: "26 July St",
    branchPhone: "0222222222",
    itemsPiastres: 20_000,
    homeVisitFeePiastres: 5_000,
    discountPiastres: 0,
    paymentMethod: "dev_unpaid",
    rescheduleCount: { buyer: 1, provider: 0 },
    cancelReason: null,
    noShow: null,
    completedAtMs: null,
    statusHistory: [
      { status: "paid", atMs: 500, byRole: "buyer", reason: null, note: null },
      { status: "rescheduled", atMs: 700, byRole: "provider", reason: "Doctor away", note: "from 1" },
    ],
    ...overrides,
  };
}
