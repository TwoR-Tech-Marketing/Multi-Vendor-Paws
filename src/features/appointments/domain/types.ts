/**
 * Appointment shapes returned by the `vendor_appointments` callables. Money is
 * integer piastres; instants are epoch millis; `cairoDate`, `startLocal` and
 * `endLocal` are Cairo wall clock values computed on the server.
 */

export const APPOINTMENT_STATUSES = [
  "paid",
  "rescheduled",
  "completed",
  "cancelled_by_user",
  "cancelled_by_clinic",
  "no_show",
  "refund_pending",
  "refunded",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const NO_SHOW_STATES = [
  "awaiting_buyer",
  "confirmed",
  "late_returned",
  "disputed",
  "overturned",
] as const;

export type NoShowState = (typeof NO_SHOW_STATES)[number];

export const HISTORY_ROLES = ["buyer", "provider", "admin", "system"] as const;

export type HistoryRole = (typeof HISTORY_ROLES)[number];

export type AppointmentMode = "branch" | "home";

export type LocalizedName = { en: string; ar: string };

export type AppointmentRow = {
  appointmentId: string;
  appointmentNumber: string;
  status: AppointmentStatus;
  branchId: string;
  branchName: string;
  mode: AppointmentMode;
  startMs: number;
  endMs: number;
  cairoDate: string;
  startLocal: string;
  endLocal: string;
  serviceNames: LocalizedName[];
  buyerName: string;
  buyerFirstName: string;
  totalPiastres: number;
  held: boolean;
  noShowState: NoShowState | null;
};

export type AppointmentService = {
  serviceId: string;
  nameEn: string;
  nameAr: string;
  pricePiastres: number;
  durationMinutes: number;
};

export type AppointmentHistoryEntry = {
  status: AppointmentStatus | null;
  atMs: number | null;
  byRole: HistoryRole;
  reason: string | null;
  note: string | null;
};

export type AppointmentNoShow = {
  state: NoShowState;
  flaggedAtMs: number | null;
  answerDueAtMs: number | null;
  answer: string | null;
  buyerNote: string | null;
};

export type HomeAddress = { text: string; lat: number | null; lng: number | null };

export type Appointment = AppointmentRow & {
  vendorType: string;
  serviceIds: string[];
  services: AppointmentService[];
  durationMinutes: number;
  buyerPhone: string;
  petName: string | null;
  homeAddress: HomeAddress | null;
  branchAddress: string;
  branchPhone: string;
  itemsPiastres: number;
  homeVisitFeePiastres: number;
  discountPiastres: number;
  paymentMethod: string | null;
  rescheduleCount: { buyer: number; provider: number };
  cancelReason: string | null;
  noShow: AppointmentNoShow | null;
  completedAtMs: number | null;
  statusHistory: AppointmentHistoryEntry[];
};

/** Provider actions this portal offers. The server decides which apply. */
export const APPOINTMENT_ACTIONS = ["complete", "cancel", "reschedule"] as const;

export type AppointmentAction = (typeof APPOINTMENT_ACTIONS)[number];

export type AppointmentDetail = {
  appointment: Appointment;
  allowedActions: AppointmentAction[];
};

export type AppointmentPage = {
  items: AppointmentRow[];
  nextCursor: string | null;
  dateRange: { from: string; to: string } | null;
};

/** Same limits as the callables. */
export const APPOINTMENT_LIMITS = {
  reasonMin: 3,
  reasonMax: 300,
  noteMax: 300,
  pageSize: 20,
  maxRangeDays: 92,
  slotWindowDays: 7,
} as const;
