/**
 * Maps a callable error (FirebaseError shaped: `code` like
 * "functions/failed-precondition", optional `details.reason`) to a key under
 * `errors.appointments`. Raw messages never reach the UI.
 */

export type AppointmentErrorKey =
  | "held"
  | "invalidTransition"
  | "tooEarly"
  | "tooLate"
  | "slotTaken"
  | "slotUnavailable"
  | "rescheduleLimit"
  | "noShowTooEarly"
  | "windowClosed"
  | "invoiceLimit"
  | "paymentInProgress"
  | "busy"
  | "notFound"
  | "notAllowed"
  | "invalidField"
  | "generic";

const REASON_KEYS: Record<string, AppointmentErrorKey> = {
  held: "held",
  invalid_transition: "invalidTransition",
  too_early: "tooEarly",
  too_late: "tooLate",
  slot_taken: "slotTaken",
  slot_unavailable: "slotUnavailable",
  provider_unavailable: "slotUnavailable",
  branch_unavailable: "slotUnavailable",
  service_unavailable: "slotUnavailable",
  not_found: "notFound",
  invalid_field: "invalidField",
  reschedule_limit: "rescheduleLimit",
  window_closed: "windowClosed",
  invoice_limit: "invoiceLimit",
  payment_in_progress: "paymentInProgress",
};

function read(value: unknown, key: string): unknown {
  return value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined;
}

/**
 * `action` names the call that failed: `too_early` on the no-show flag means
 * the 120 minute wait, not the appointment start.
 */
export function mapAppointmentError(error: unknown, action?: string): AppointmentErrorKey {
  const reason = read(read(error, "details"), "reason");
  if (reason === "too_early" && action === "flagNoShow") return "noShowTooEarly";
  if (typeof reason === "string" && Object.hasOwn(REASON_KEYS, reason)) return REASON_KEYS[reason];
  const rawCode = read(error, "code");
  const code = typeof rawCode === "string" ? rawCode.replace(/^functions\//, "") : "";
  switch (code) {
    case "failed-precondition":
      return "invalidTransition";
    case "aborted":
      return "busy";
    case "not-found":
      return "notFound";
    case "permission-denied":
    case "unauthenticated":
      return "notAllowed";
    case "invalid-argument":
      return "invalidField";
    default:
      return "generic";
  }
}
