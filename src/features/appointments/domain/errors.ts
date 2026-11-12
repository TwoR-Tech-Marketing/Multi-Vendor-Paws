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
};

function read(value: unknown, key: string): unknown {
  return value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined;
}

export function mapAppointmentError(error: unknown): AppointmentErrorKey {
  const reason = read(read(error, "details"), "reason");
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
