import { mapAppointmentError } from "@/features/appointments/domain/errors";
import type {
  AppointmentHistoryEntry,
  AppointmentRow,
  AppointmentStatus,
} from "@/features/appointments/domain/types";
import { formatDayLabel, formatTime12, isIsoDate } from "@/features/availability/domain/time";
import { CAIRO_TIME_ZONE } from "@/features/orders/lib/cairoDates";
import type { AppStrings } from "@/shared/i18n/types";

/** Localized copy for any appointments callable error. Never the raw message. */
export function appointmentErrorMessage(
  error: unknown,
  strings: AppStrings,
  action?: string,
): string {
  const key = mapAppointmentError(error, action);
  return key === "generic" ? strings.errors.generic : strings.errors.appointments[key];
}

/** "Sat 14 Nov, 9:00 AM to 9:30 AM" from the server's Cairo wall clock fields. */
export function appointmentWhen(
  row: Pick<AppointmentRow, "cairoDate" | "startLocal" | "endLocal">,
  strings: AppStrings,
  locale: string,
): string {
  return strings.appointments.when
    .replace("{date}", isIsoDate(row.cairoDate) ? formatDayLabel(row.cairoDate, locale) : "")
    .replace("{start}", formatTime12(row.startLocal, strings.availability))
    .replace("{end}", formatTime12(row.endLocal, strings.availability));
}

/** First two service names in the active language, then "+N more". */
export function serviceSummary(
  row: Pick<AppointmentRow, "serviceNames">,
  strings: AppStrings,
  locale: string,
): string {
  const names = row.serviceNames.map((n) => (locale === "ar" ? n.ar || n.en : n.en || n.ar));
  const shown = names.slice(0, 2).join(", ");
  const rest = names.length - 2;
  return rest > 0
    ? `${shown} ${strings.appointments.moreServices.replace("{count}", String(rest))}`
    : shown;
}

/** Cairo date and time of an instant, Western digits in both languages. */
export function formatInstant(ms: number | null, locale: string): string {
  if (ms === null) return "";
  return new Date(ms).toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: CAIRO_TIME_ZONE,
  });
}

export function statusLabel(status: AppointmentStatus, strings: AppStrings): string {
  return strings.appointments.status[status];
}

/** "Cancelled by customer by Customer" style line for one history entry. */
export function historyLine(entry: AppointmentHistoryEntry, strings: AppStrings): string {
  const t = strings.appointments.history;
  const status = entry.status ? statusLabel(entry.status, strings) : "";
  return t.entry.replace("{status}", status).replace("{role}", t.byRole[entry.byRole]);
}
