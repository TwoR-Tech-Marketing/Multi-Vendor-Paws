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
  const { amount, status, documentNameAr } = notification.params;
  if (notification.type === "payout_recorded" && typeof amount === "number") {
    out.amount = formatEgp(Math.trunc(amount));
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
    return {
      title: fillTemplate(t.types[key].title, params),
      body: fillTemplate(t.types[key].body, params),
    };
  }
  return {
    title: notification.titleFallback?.trim() || t.fallbackTitle,
    body: notification.bodyFallback?.trim() || t.fallbackBody,
  };
}
