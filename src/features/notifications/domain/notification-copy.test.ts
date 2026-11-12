import { describe, expect, it } from "vitest";

import { resolveNotificationCopy } from "@/features/notifications/domain/notification-copy";
import type { VendorNotification } from "@/features/notifications/domain/types";
import { formatEgp } from "@/features/products/domain/currency";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");
const ar = getStrings("ar");

function payout(amount: number): VendorNotification {
  return {
    notificationId: "payout_recorded_v1_M2026-10",
    type: "payout_recorded",
    params: { amount, periodKey: "M2026-10" },
    titleFallback: null,
    bodyFallback: null,
    link: { target: "earnings", id: null },
    isRead: false,
    readAt: null,
    createdAt: new Date(0),
  };
}

describe("resolveNotificationCopy payout_recorded", () => {
  it("formats the payout amount in EGP in both languages", () => {
    expect(resolveNotificationCopy(payout(250000), en, "en").body).toContain(formatEgp(250000));
    expect(resolveNotificationCopy(payout(250000), ar, "ar").body).toContain(formatEgp(250000));
  });

  it("does not throw on a negative or fractional amount", () => {
    expect(() => resolveNotificationCopy(payout(-250000), en, "en")).not.toThrow();
    expect(resolveNotificationCopy(payout(-250000), en, "en").body).toContain(formatEgp(-250000));
    expect(resolveNotificationCopy(payout(199.9), en, "en").body).toContain(formatEgp(199));
  });
});

function appointment(type: string): VendorNotification {
  return {
    notificationId: `appt_${type}_a1_1`,
    type,
    params: { appointmentNumber: "#ABCD1234", date: "2026-11-14", time: "09:30" },
    titleFallback: null,
    bodyFallback: null,
    link: { target: "appointment", id: "a1" },
    isRead: false,
    readAt: null,
    createdAt: new Date(0),
  };
}

describe("resolveNotificationCopy appointments", () => {
  it.each([
    ["appointment_new", "appointmentNew"],
    ["appointment_cancelled", "appointmentCancelled"],
    ["appointment_rescheduled", "appointmentRescheduled"],
  ] as const)("renders %s in English and Arabic with a formatted date and time", (type, key) => {
    const copyEn = resolveNotificationCopy(appointment(type), en, "en");
    expect(copyEn.title).toBe(en.notifications.types[key].title);
    expect(copyEn.body).toContain("#ABCD1234");
    expect(copyEn.body).toContain("9:30 AM");
    expect(copyEn.body).not.toContain("2026-11-14");
    expect(copyEn.body).not.toContain("{");
    const copyAr = resolveNotificationCopy(appointment(type), ar, "ar");
    expect(copyAr.title).toBe(ar.notifications.types[key].title);
    expect(copyAr.body).toContain("9:30 ص");
    expect(copyAr.body).not.toContain("{");
  });
});
