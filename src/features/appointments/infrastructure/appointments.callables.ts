import { invokeCallable } from "@/lib/callable";

/** Callable names of the `vendor_appointments` export group (provider side). */
export const APPOINTMENT_CALLABLES = {
  list: "vendor_appointments-listVendorAppointments",
  get: "vendor_appointments-getVendorAppointment",
  complete: "vendor_appointments-completeVendorAppointment",
  cancel: "vendor_appointments-cancelVendorAppointment",
  reschedule: "vendor_appointments-rescheduleVendorAppointment",
  flagNoShow: "vendor_appointments-flagNoShow",
  resolveLateArrival: "vendor_appointments-resolveLateArrival",
  createExtraInvoice: "vendor_appointments-createExtraInvoice",
  voidExtraInvoice: "vendor_appointments-voidExtraInvoice",
} as const;

export type AppointmentCallableName =
  (typeof APPOINTMENT_CALLABLES)[keyof typeof APPOINTMENT_CALLABLES];

/** Calls one appointments callable and returns its raw data. Errors propagate. */
export async function invokeAppointmentCallable(
  name: AppointmentCallableName,
  payload: Record<string, unknown>,
): Promise<unknown> {
  return invokeCallable(name, payload);
}
