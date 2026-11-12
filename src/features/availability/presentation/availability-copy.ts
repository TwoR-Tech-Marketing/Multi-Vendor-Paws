import { mapAvailabilityError } from "@/features/availability/domain/errors";
import type { AvailabilityValidationError } from "@/features/availability/domain/schemas";
import { formatDayLabel, formatTime12 } from "@/features/availability/domain/time";
import type { AvailabilityConflict } from "@/features/availability/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

/** Localized copy for any availability callable error. Never the raw message. */
export function availabilityErrorMessage(error: unknown, strings: AppStrings): string {
  const key = mapAvailabilityError(error);
  return key === "generic" ? strings.errors.generic : strings.errors.availability[key];
}

export function validationMessage(
  error: AvailabilityValidationError | "note" | "date",
  strings: AppStrings,
): string {
  return strings.errors.availability[error];
}

/** "9:30 AM" style time with the active locale's AM and PM markers. */
export function timeLabel(value: string, strings: AppStrings): string {
  return formatTime12(value, strings.availability);
}

/** "Sat 14 Nov, 9:00 AM to 9:30 AM" for a conflict row. */
export function conflictWhen(
  conflict: AvailabilityConflict,
  strings: AppStrings,
  locale: string,
): string {
  return strings.availability.conflicts.when
    .replace("{date}", conflict.date ? formatDayLabel(conflict.date, locale) : "")
    .replace("{start}", timeLabel(conflict.startLocal, strings))
    .replace("{end}", timeLabel(conflict.endLocal, strings));
}
