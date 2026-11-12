import { formatDayLabel, formatTime12, isIsoDate } from "@/features/availability/domain/time";
import { formatEgp } from "@/features/products/domain/currency";
import type { VendorNotification } from "@/features/notifications/domain/types";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

type NotificationTypeCopy = AppStrings["notifications"]["types"];
type TypeKey = keyof NotificationTypeCopy;

const TYPE_TO_KEY: Record<string, TypeKey> = {
  order_new: "orderNew",
  order_hold: "orderHold",
  order_released: "orderReleased",
  account_approved: "accountApproved",
  account_rejected: "accountRejected",
  document_reviewed: "documentReviewed",
  account_suspended: "accountSuspended",
  payout_recorded: "payoutRecorded",
  appointment_new: "appointmentNew",
  appointment_cancelled: "appointmentCancelled",
  appointment_rescheduled: "appointmentRescheduled",
  review_new: "reviewNew",
  appointment_no_show_late: "appointmentNoShowLate",
  appointment_no_show_review: "appointmentNoShowReview",
  appointment_no_show_resolved: "appointmentNoShowResolved",
  order_cancelled_by_admin: "orderCancelledByAdmin",
  appointment_cancelled_by_admin: "appointmentCancelledByAdmin",
};

function fillTemplate(template: string, params: Record<string, string>): string {
  return template
    .replace(/\{(\w+)\}/g, (_, key: string) => params[key] ?? "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function paramsForDisplay(
  notification: VendorNotification,
  strings: AppStrings,
  locale: AppLocale,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(notification.params)) {
    out[key] = String(value);
  }
  const { amount, status, documentNameAr, outcome } = notification.params;
  if (notification.type === "payout_recorded" && typeof amount === "number") {
    out.amount = formatEgp(Math.trunc(amount));
  }
  if (notification.type.startsWith("appointment_")) {
    if (out.date && isIsoDate(out.date)) out.date = formatDayLabel(out.date, locale);
    if (out.time) out.time = formatTime12(out.time, strings.availability);
  }
  if (notification.type === "appointment_no_show_resolved") {
    const outcomes = strings.notifications.noShowOutcome;
    if (outcome === "confirmed" || outcome === "overturned") out.outcome = outcomes[outcome];
    else delete out.outcome;
  }
  if (notification.type === "document_reviewed") {
    if (status === "approved" || status === "rejected") {
      out.status = strings.notifications.documentStatus[status];
    }
    if (locale === "ar" && typeof documentNameAr === "string" && documentNameAr.trim()) {
      out.documentName = documentNameAr;
    }
  }
  return out;
}

export type NotificationCopy = { title: string; body: string };

/** Localized title and body from `type` and `params`, with fallback text. */
export function resolveNotificationCopy(
  notification: VendorNotification,
  strings: AppStrings,
  locale: AppLocale = "en",
): NotificationCopy {
  const t = strings.notifications;
  const key = TYPE_TO_KEY[notification.type];
  if (key) {
    const params = paramsForDisplay(notification, strings, locale);
    const template = t.types[key].body;
    const missing = template.includes("{outcome}") && params.outcome === undefined;
    return {
      title: fillTemplate(t.types[key].title, params),
      body: missing
        ? notification.bodyFallback?.trim() || t.fallbackBody
        : fillTemplate(template, params),
    };
  }
  return {
    title: notification.titleFallback?.trim() || t.fallbackTitle,
    body: notification.bodyFallback?.trim() || t.fallbackBody,
  };
}
