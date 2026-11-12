import {
  APPOINTMENT_LIMITS,
  type Appointment,
  type AppointmentAction,
} from "@/features/appointments/domain/types";

const MINUTE_MS = 60_000;

/** Earliest instant the server accepts a no-show flag: start plus 120 minutes. */
export function noShowAvailableAtMs(startMs: number): number {
  return startMs + APPOINTMENT_LIMITS.noShowAfterMinutes * MINUTE_MS;
}

/** The question the customer saw: groomers get their own wording, every other type the clinic one. */
export function noShowQuestionKey(vendorType: string): "question" | "questionGroomer" {
  return vendorType === "groomer" ? "questionGroomer" : "question";
}

/**
 * True once the appointment has started (the server offers `complete`) but
 * not the no-show flag yet, so the portal explains when it opens. Uses only
 * the server's allowed actions, never the local clock.
 */
export function showNoShowTooEarly(
  appointment: Pick<Appointment, "status" | "held" | "noShow">,
  allowedActions: readonly AppointmentAction[],
): boolean {
  const booked = appointment.status === "paid" || appointment.status === "rescheduled";
  return (
    booked &&
    !appointment.held &&
    appointment.noShow === null &&
    allowedActions.includes("complete") &&
    !allowedActions.includes("flagNoShow")
  );
}
