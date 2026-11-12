/**
 * Branch availability for clinic and groomer providers.
 * Shapes match the vendor_availability callables. Weekly hours and exception
 * intervals are Cairo wall clock "HH:mm" strings; instants are UTC millis.
 * Money is integer piastres.
 */

/** Week starts Saturday. */
export const WEEKDAYS = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export type AvailabilityMode = "branch" | "home";

export type Interval = { start: string; end: string };

export type WeeklyHours = Record<Weekday, Interval[]>;

export type DayRule = { closed: true } | { closed: false; intervals: Interval[] };

export type AvailabilityException = {
  branch: DayRule | null;
  home: DayRule | null;
  note: string | null;
};

export type Availability = {
  vendorId: string;
  branchId: string;
  weekly: WeeklyHours;
  capacity: number;
  homeVisitWeekly: WeeklyHours;
  homeVisitCapacity: number;
  /** Keyed by Cairo date "YYYY-MM-DD". */
  exceptions: Record<string, AvailabilityException>;
  version: number;
  updatedAtMs: number | null;
};

export type HomeVisitInfo = {
  enabled: boolean;
  feePiastres: number;
  radiusMeters: number;
};

export type AvailabilityState = {
  availability: Availability;
  homeVisit: HomeVisitInfo;
  /** Cairo date of today, from the server. */
  todayDate: string;
};

export type WeeklyPayload = {
  weekly: WeeklyHours;
  capacity: number;
  homeVisitWeekly: WeeklyHours;
  homeVisitCapacity: number;
};

export const CONFLICT_REASONS = [
  "outside_hours",
  "over_capacity",
  "home_visit_disabled",
  "branch_archived",
] as const;

export type ConflictReason = (typeof CONFLICT_REASONS)[number];

export type AvailabilityConflict = {
  appointmentId: string;
  mode: AvailabilityMode;
  date: string;
  startMs: number;
  endMs: number;
  startLocal: string;
  endLocal: string;
  serviceIds: string[];
  status: string;
  reason: ConflictReason;
};

export type Slot = {
  startMs: number;
  endMs: number;
  startLocal: string;
  endLocal: string;
  remaining: number;
};

export type SlotDay = {
  date: string;
  closed: boolean;
  slots: Slot[];
};

export type SlotPreview = {
  durationMinutes: number;
  days: SlotDay[];
};

/** Limits shared with the callables (the server is the authority). */
export const AVAILABILITY_LIMITS = {
  gridMinutes: 15,
  maxIntervalsPerDay: 4,
  minCapacity: 1,
  maxCapacity: 10,
  defaultCapacity: 1,
  maxFutureExceptions: 60,
  exceptionHorizonDays: 365,
  noteMax: 120,
  maxKeepIds: 200,
  maxSlotRangeDays: 31,
  previewDays: 7,
} as const;

export function emptyWeekly(): WeeklyHours {
  return { sat: [], sun: [], mon: [], tue: [], wed: [], thu: [], fri: [] };
}
