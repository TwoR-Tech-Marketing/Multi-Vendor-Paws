import { pickAllowedActions } from "@/features/appointments/domain/actions";
import type { AppointmentListRequest } from "@/features/appointments/domain/filters";
import {
  APPOINTMENT_STATUSES,
  HISTORY_ROLES,
  NO_SHOW_STATES,
  type Appointment,
  type AppointmentDetail,
  type AppointmentHistoryEntry,
  type AppointmentNoShow,
  type AppointmentPage,
  type AppointmentRow,
  type AppointmentService,
  type AppointmentStatus,
  type LocalizedName,
  type NoShowState,
} from "@/features/appointments/domain/types";
import {
  APPOINTMENT_CALLABLES,
  invokeAppointmentCallable,
} from "@/features/appointments/infrastructure/appointments.callables";

/**
 * Provider appointments through the shared `vendor_appointments` callables.
 * No BFF and no Firestore reads. The vendor id is always the caller's auth
 * uid on the server; nothing here sends one.
 */

type Raw = Record<string, unknown>;

function asObject(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

/** Integer piastres or counts; anything else reads as 0. */
function asInt(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) ? value : 0;
}

function asMillis(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asStatus(value: unknown): AppointmentStatus | null {
  return APPOINTMENT_STATUSES.find((s) => s === value) ?? null;
}

function asNoShowState(value: unknown): NoShowState | null {
  return NO_SHOW_STATES.find((s) => s === value) ?? null;
}

function mapName(value: unknown): LocalizedName {
  const raw = asObject(value);
  const en = asString(raw.en);
  return { en, ar: asString(raw.ar) || en };
}

export function mapAppointmentRow(value: unknown): AppointmentRow {
  const raw = asObject(value);
  return {
    appointmentId: asString(raw.appointmentId),
    appointmentNumber: asString(raw.appointmentNumber),
    status: asStatus(raw.status) ?? "paid",
    branchId: asString(raw.branchId),
    branchName: asString(raw.branchName),
    mode: raw.mode === "home" ? "home" : "branch",
    startMs: asMillis(raw.startMs) ?? 0,
    endMs: asMillis(raw.endMs) ?? 0,
    cairoDate: asString(raw.cairoDate),
    startLocal: asString(raw.startLocal),
    endLocal: asString(raw.endLocal),
    serviceNames: asArray(raw.serviceNames).map(mapName),
    buyerName: asString(raw.buyerName),
    buyerFirstName: asString(raw.buyerFirstName),
    totalPiastres: asInt(raw.totalPiastres),
    held: raw.held === true,
    noShowState: asNoShowState(raw.noShowState),
  };
}

function mapService(value: unknown): AppointmentService {
  const raw = asObject(value);
  const nameEn = asString(raw.nameEn);
  return {
    serviceId: asString(raw.serviceId),
    nameEn,
    nameAr: asString(raw.nameAr) || nameEn,
    pricePiastres: asInt(raw.pricePiastres),
    durationMinutes: asInt(raw.durationMinutes),
  };
}

function mapHistoryEntry(value: unknown): AppointmentHistoryEntry {
  const raw = asObject(value);
  return {
    status: asStatus(raw.status),
    atMs: asMillis(raw.atMs),
    byRole: HISTORY_ROLES.find((r) => r === raw.byRole) ?? "system",
    reason: asNullableString(raw.reason),
    note: asNullableString(raw.note),
  };
}

function mapNoShow(value: unknown): AppointmentNoShow | null {
  const raw = asObject(value);
  const state = asNoShowState(raw.state);
  if (!state) return null;
  return {
    state,
    flaggedAtMs: asMillis(raw.flaggedAtMs),
    answerDueAtMs: asMillis(raw.answerDueAtMs),
    answer: asNullableString(raw.answer),
    buyerNote: asNullableString(raw.buyerNote),
  };
}

/** Reads the nested response field first, then the stored snapshot field. */
function pick(raw: Raw, nested: string, snapshot: string, field: string): unknown {
  return asObject(raw[nested])[field] ?? asObject(raw[snapshot])[field];
}

export function mapAppointment(value: unknown): Appointment {
  const raw = asObject(value);
  const row = mapAppointmentRow(raw);
  const services = asArray(raw.services ?? raw.serviceSnapshots).map(mapService);
  const home = raw.homeAddress ? asObject(raw.homeAddress) : null;
  const counts = asObject(raw.rescheduleCount);
  return {
    ...row,
    noShowState: row.noShowState ?? mapNoShow(raw.noShow)?.state ?? null,
    serviceNames: row.serviceNames.length
      ? row.serviceNames
      : services.map((s) => ({ en: s.nameEn, ar: s.nameAr })),
    vendorType: asString(raw.vendorType),
    serviceIds: (raw.serviceIds ? asArray(raw.serviceIds) : services.map((s) => s.serviceId)).filter(
      (id): id is string => typeof id === "string" && id !== "",
    ),
    services,
    durationMinutes: asInt(raw.durationMinutes),
    buyerPhone: asString(raw.buyerPhone ?? asObject(raw.buyerSnapshot).phone),
    petName: asNullableString(pick(raw, "pet", "petSnapshot", "name")),
    homeAddress: home
      ? { text: asString(home.text), lat: asNumberOrNull(home.lat), lng: asNumberOrNull(home.lng) }
      : null,
    branchAddress: asString(pick(raw, "branch", "branchSnapshot", "address")),
    branchPhone: asString(pick(raw, "branch", "branchSnapshot", "phone")),
    itemsPiastres: asInt(raw.itemsPiastres),
    homeVisitFeePiastres: asInt(raw.homeVisitFeePiastres),
    discountPiastres: asInt(raw.discountPiastres),
    paymentMethod: asNullableString(raw.paymentMethod ?? asObject(raw.payment).method),
    rescheduleCount: {
      buyer: Math.max(0, asInt(counts.buyer)),
      provider: Math.max(0, asInt(counts.provider)),
    },
    cancelReason: asNullableString(raw.cancelReason),
    noShow: mapNoShow(raw.noShow),
    completedAtMs: asMillis(raw.completedAtMs),
    statusHistory: asArray(raw.statusHistory).map(mapHistoryEntry),
  };
}

export function mapAppointmentPage(value: unknown): AppointmentPage {
  const raw = asObject(value);
  const range = raw.dateRange ? asObject(raw.dateRange) : null;
  return {
    items: asArray(raw.items)
      .map(mapAppointmentRow)
      .filter((row) => row.appointmentId),
    nextCursor: asNullableString(raw.nextCursor),
    dateRange: range ? { from: asString(range.from), to: asString(range.to) } : null,
  };
}

export async function listVendorAppointments(
  request: AppointmentListRequest,
): Promise<AppointmentPage> {
  return mapAppointmentPage(
    await invokeAppointmentCallable(APPOINTMENT_CALLABLES.list, { ...request }),
  );
}

export async function getVendorAppointment(appointmentId: string): Promise<AppointmentDetail> {
  const data = asObject(
    await invokeAppointmentCallable(APPOINTMENT_CALLABLES.get, { appointmentId }),
  );
  return {
    appointment: mapAppointment(data.appointment),
    allowedActions: pickAllowedActions(data.allowedActions),
  };
}

export async function completeVendorAppointment(
  appointmentId: string,
  note?: string,
): Promise<Appointment> {
  const trimmed = note?.trim();
  const data = asObject(
    await invokeAppointmentCallable(APPOINTMENT_CALLABLES.complete, {
      appointmentId,
      ...(trimmed ? { note: trimmed } : {}),
    }),
  );
  return mapAppointment(data.appointment);
}

export async function cancelVendorAppointment(
  appointmentId: string,
  reason: string,
): Promise<Appointment> {
  const data = asObject(
    await invokeAppointmentCallable(APPOINTMENT_CALLABLES.cancel, {
      appointmentId,
      reason: reason.trim(),
    }),
  );
  return mapAppointment(data.appointment);
}

export async function rescheduleVendorAppointment(input: {
  appointmentId: string;
  startMs: number;
  reason: string;
}): Promise<Appointment> {
  const data = asObject(
    await invokeAppointmentCallable(APPOINTMENT_CALLABLES.reschedule, {
      appointmentId: input.appointmentId,
      startMs: input.startMs,
      reason: input.reason.trim(),
    }),
  );
  return mapAppointment(data.appointment);
}
