import {
  APPOINTMENT_ACTIONS,
  APPOINTMENT_LIMITS,
  type AppointmentAction,
} from "@/features/appointments/domain/types";

/**
 * The server's `allowedActions` decide every button. Names this portal does
 * not offer yet are dropped; nothing is derived from the status here.
 */
export function pickAllowedActions(raw: unknown): AppointmentAction[] {
  if (!Array.isArray(raw)) return [];
  return APPOINTMENT_ACTIONS.filter((action) => raw.includes(action));
}

/** Cancel and reschedule reasons: 3 to 300 characters after trimming. */
export function isValidReason(reason: string): boolean {
  const length = reason.trim().length;
  return length >= APPOINTMENT_LIMITS.reasonMin && length <= APPOINTMENT_LIMITS.reasonMax;
}
