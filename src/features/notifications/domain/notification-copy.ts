import { formatEgp } from "@/features/products/domain/currency";
import type { VendorNotification } from "@/features/notifications/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

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

function paramsForDisplay(notification: VendorNotification): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(notification.params)) {
    out[key] = String(value);
  }
  const amount = notification.params.amount;
  if (notification.type === "payout_recorded" && typeof amount === "number") {
    out.amount = formatEgp(Math.trunc(amount));
  }
  return out;
}

export type NotificationCopy = { title: string; body: string };

/** Localized title and body from `type` and `params`, with fallback text. */
export function resolveNotificationCopy(
  notification: VendorNotification,
  strings: AppStrings,
): NotificationCopy {
  const t = strings.notifications;
  const key = TYPE_TO_KEY[notification.type];
  if (key) {
    const params = paramsForDisplay(notification);
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
