import {
  AVAILABILITY_LIMITS,
  CONFLICT_REASONS,
  WEEKDAYS,
  type Availability,
  type AvailabilityConflict,
  type AvailabilityException,
  type AvailabilityMode,
  type AvailabilityState,
  type ConflictReason,
  type DayRule,
  type Interval,
  type Slot,
  type SlotDay,
  type SlotPreview,
  type WeeklyHours,
  type WeeklyPayload,
} from "@/features/availability/domain/types";
import {
  AVAILABILITY_CALLABLES,
  invokeAvailabilityCallable,
} from "@/features/availability/infrastructure/availability.callables";

/**
 * Branch availability through the shared `vendor_availability` callables.
 * No BFF exists for this feature. vendorId is always the caller's auth uid on
 * the server; nothing here sends one.
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

function asInt(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isInteger(value) ? value : fallback;
}

function asMillis(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function mapIntervals(value: unknown): Interval[] {
  return asArray(value).map((item) => {
    const raw = asObject(item);
    return { start: asString(raw.start), end: asString(raw.end) };
  });
}

/** A missing day key means closed. */
export function mapWeekly(value: unknown): WeeklyHours {
  const raw = asObject(value);
  const out = {} as WeeklyHours;
  for (const day of WEEKDAYS) out[day] = mapIntervals(raw[day]);
  return out;
}

function mapDayRule(value: unknown): DayRule | null {
  if (!value || typeof value !== "object") return null;
  const raw = asObject(value);
  if (raw.closed === true) return { closed: true };
  return { closed: false, intervals: mapIntervals(raw.intervals) };
}

function mapException(value: unknown): AvailabilityException {
  const raw = asObject(value);
  return {
    branch: mapDayRule(raw.branch),
    home: mapDayRule(raw.home),
    note: typeof raw.note === "string" && raw.note ? raw.note : null,
  };
}

function capacityOf(value: unknown): number {
  const n = asInt(value, AVAILABILITY_LIMITS.defaultCapacity);
  return n >= AVAILABILITY_LIMITS.minCapacity && n <= AVAILABILITY_LIMITS.maxCapacity
    ? n
    : AVAILABILITY_LIMITS.defaultCapacity;
}

export function mapAvailability(value: unknown): Availability {
  const raw = asObject(value);
  const exceptions: Record<string, AvailabilityException> = {};
  for (const [date, item] of Object.entries(asObject(raw.exceptions))) {
    exceptions[date] = mapException(item);
  }
  return {
    vendorId: asString(raw.vendorId),
    branchId: asString(raw.branchId),
    weekly: mapWeekly(raw.weekly),
    capacity: capacityOf(raw.capacity),
    homeVisitWeekly: mapWeekly(raw.homeVisitWeekly),
    homeVisitCapacity: capacityOf(raw.homeVisitCapacity),
    exceptions,
    version: Math.max(0, asInt(raw.version)),
    updatedAtMs: asMillis(raw.updatedAtMs),
  };
}

function mapMode(value: unknown): AvailabilityMode {
  return value === "home" ? "home" : "branch";
}

export function mapConflict(value: unknown): AvailabilityConflict {
  const raw = asObject(value);
  const reason = CONFLICT_REASONS.includes(raw.reason as ConflictReason)
    ? (raw.reason as ConflictReason)
    : "outside_hours";
  return {
    appointmentId: asString(raw.appointmentId),
    mode: mapMode(raw.mode),
    date: asString(raw.date),
    startMs: asMillis(raw.startMs) ?? 0,
    endMs: asMillis(raw.endMs) ?? 0,
    startLocal: asString(raw.startLocal),
    endLocal: asString(raw.endLocal),
    serviceIds: asArray(raw.serviceIds).filter((id): id is string => typeof id === "string"),
    status: asString(raw.status),
    reason,
  };
}

export function mapConflicts(value: unknown): AvailabilityConflict[] {
  return asArray(value)
    .map(mapConflict)
    .filter((c) => c.appointmentId);
}

function mapSlot(value: unknown): Slot {
  const raw = asObject(value);
  return {
    startMs: asMillis(raw.startMs) ?? 0,
    endMs: asMillis(raw.endMs) ?? 0,
    startLocal: asString(raw.startLocal),
    endLocal: asString(raw.endLocal),
    remaining: Math.max(0, asInt(raw.remaining)),
  };
}

export function mapSlotPreview(value: unknown): SlotPreview {
  const raw = asObject(value);
  return {
    durationMinutes: asInt(raw.durationMinutes, 30),
    days: asArray(raw.days).map((item): SlotDay => {
      const day = asObject(item);
      return {
        date: asString(day.date),
        closed: day.closed === true,
        slots: asArray(day.slots).map(mapSlot),
      };
    }),
  };
}

export function mapAvailabilityState(value: unknown): AvailabilityState {
  const raw = asObject(value);
  const homeVisit = asObject(raw.homeVisit);
  const enabled = homeVisit.enabled === true;
  return {
    availability: mapAvailability(raw.availability),
    homeVisit: {
      enabled,
      feePiastres: enabled ? Math.max(0, asInt(homeVisit.feePiastres)) : 0,
      radiusMeters: enabled ? Math.max(0, asInt(homeVisit.radiusMeters)) : 0,
    },
    todayDate: asString(raw.todayDate),
  };
}

function keepPayload(keepAppointmentIds?: string[]): Raw {
  return keepAppointmentIds && keepAppointmentIds.length > 0
    ? { keepAppointmentIds: [...new Set(keepAppointmentIds)] }
    : {};
}

export async function getBranchAvailability(branchId: string): Promise<AvailabilityState> {
  return mapAvailabilityState(
    await invokeAvailabilityCallable(AVAILABILITY_CALLABLES.get, { branchId }),
  );
}

export async function saveBranchAvailability(input: {
  branchId: string;
  expectedVersion: number;
  payload: WeeklyPayload;
  keepAppointmentIds?: string[];
}): Promise<Availability> {
  const data = asObject(
    await invokeAvailabilityCallable(AVAILABILITY_CALLABLES.save, {
      branchId: input.branchId,
      expectedVersion: input.expectedVersion,
      ...input.payload,
      ...keepPayload(input.keepAppointmentIds),
    }),
  );
  return mapAvailability(data.availability);
}

/** `exception: null` removes the date's exception. */
export async function setBranchAvailabilityException(input: {
  branchId: string;
  expectedVersion: number;
  date: string;
  exception: AvailabilityException | null;
  keepAppointmentIds?: string[];
}): Promise<Availability> {
  const data = asObject(
    await invokeAvailabilityCallable(AVAILABILITY_CALLABLES.setException, {
      branchId: input.branchId,
      expectedVersion: input.expectedVersion,
      date: input.date,
      exception: input.exception,
      ...keepPayload(input.keepAppointmentIds),
    }),
  );
  return mapAvailability(data.availability);
}

/** One service, or several (slot length is the sum of their durations). */
export async function listBranchSlots(
  input: {
    branchId: string;
    mode: AvailabilityMode;
    fromDate: string;
    toDate: string;
  } & ({ serviceId: string; serviceIds?: never } | { serviceIds: string[]; serviceId?: never }),
): Promise<SlotPreview> {
  return mapSlotPreview(
    await invokeAvailabilityCallable(AVAILABILITY_CALLABLES.listSlots, { ...input }),
  );
}
