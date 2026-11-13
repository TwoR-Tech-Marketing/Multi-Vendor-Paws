import { mapTelehealthError } from "@/features/telehealth/domain/errors";
import {
  PHOTO_PREVIEW_KEY,
  type TelehealthBuyer,
  type TelehealthSession,
} from "@/features/telehealth/domain/types";
import type { AppStrings } from "@/shared/i18n/types";
import { formatDateTime, formatTime } from "@/shared/lib/format-date";

/** Localized copy for any telehealth callable error. Never the raw message. */
export function telehealthErrorMessage(error: unknown, strings: AppStrings): string {
  const key = mapTelehealthError(error);
  return key === "generic" ? strings.errors.generic : strings.errors.telehealth[key];
}

/** Cairo date and time with Western digits in both locales. */
export function formatTelehealthTime(ms: number | null, locale: string): string {
  if (ms === null) return "";
  return formatDateTime(new Date(ms), locale === "ar" ? "ar" : "en");
}

/** Cairo time of day only, for chat bubbles and queue expiry. */
export function formatTelehealthClock(ms: number | null, locale: string): string {
  if (ms === null) return "";
  return formatTime(new Date(ms), locale === "ar" ? "ar" : "en");
}

/** "Max (dog)", "Max", "dog" or empty. Pet details are display data from the buyer. */
export function formatPet(buyer: TelehealthBuyer): string {
  if (buyer.petName && buyer.petType) return `${buyer.petName} (${buyer.petType})`;
  return buyer.petName ?? buyer.petType ?? "";
}

/** Last message preview; the server photo key becomes localized copy. */
export function formatPreview(
  session: Pick<TelehealthSession, "lastMessagePreview" | "intakeNote">,
  strings: AppStrings,
): string {
  if (session.lastMessagePreview === PHOTO_PREVIEW_KEY) return strings.telehealth.photoPreview;
  return session.lastMessagePreview ?? session.intakeNote;
}
