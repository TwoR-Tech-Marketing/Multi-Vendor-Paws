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

export const NO_SHOW_ANSWERS = [
  "did_not_attend",
  "attended",
  "arrived_late",
  "report_issue",
] as const;

export type NoShowAnswer = (typeof NO_SHOW_ANSWERS)[number];

export const NO_SHOW_CONFIRMERS = ["buyer", "timeout", "provider", "admin"] as const;

export type NoShowConfirmer = (typeof NO_SHOW_CONFIRMERS)[number];

export type AppointmentNoShow = {
  state: NoShowState;
  flaggedAtMs: number | null;
  answerDueAtMs: number | null;
  answer: NoShowAnswer | null;
  answeredAtMs: number | null;
  buyerNote: string | null;
  confirmedBy: NoShowConfirmer | null;
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
export const APPOINTMENT_ACTIONS = [
  "complete",
  "cancel",
  "reschedule",
  "flagNoShow",
  "markCompleted",
  "confirmNoShow",
  "createExtraInvoice",
  "voidExtraInvoice",
] as const;

export type AppointmentAction = (typeof APPOINTMENT_ACTIONS)[number];

/** Actions shown as buttons in the action bar; invoice actions live on the invoices card. */
export const ACTION_BAR_ACTIONS = [
  "complete",
  "markCompleted",
  "flagNoShow",
  "confirmNoShow",
  "reschedule",
  "cancel",
] as const satisfies readonly AppointmentAction[];

export type ActionBarAction = (typeof ACTION_BAR_ACTIONS)[number];

export const EXTRA_INVOICE_STATUSES = ["unpaid", "paid", "void"] as const;

export type ExtraInvoiceStatus = (typeof EXTRA_INVOICE_STATUSES)[number];

export type ExtraInvoiceLine = {
  kind: "service" | "custom";
  serviceId: string | null;
  nameEn: string;
  nameAr: string;
  unitPricePiastres: number;
  quantity: number;
  lineTotalPiastres: number;
};

export type ExtraInvoice = {
  invoiceId: string;
  status: ExtraInvoiceStatus;
  lines: ExtraInvoiceLine[];
  totalPiastres: number;
  note: string | null;
  createdAtMs: number | null;
  paidAtMs: number | null;
  voidedAtMs: number | null;
};

export type AppointmentDetail = {
  appointment: Appointment;
  extraInvoices: ExtraInvoice[];
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
  /** Minutes after the start before a no-show can be flagged (server enforced). */
  noShowAfterMinutes: 120,
} as const;

/** Extra invoice limits, mirrored for form feedback. The server is the authority. */
export const EXTRA_INVOICE_LIMITS = {
  maxInvoices: 5,
  maxLines: 10,
  quantityMin: 1,
  quantityMax: 10,
  nameMin: 2,
  nameMax: 80,
  unitPriceMinPiastres: 100,
  unitPriceMaxPiastres: 1_000_000,
  totalMinPiastres: 100,
  totalMaxPiastres: 5_000_000,
  noteMax: 300,
} as const;
