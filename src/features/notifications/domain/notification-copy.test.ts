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

describe("resolveNotificationCopy review_new", () => {
  const review: VendorNotification = {
    notificationId: "review_new_a1",
    type: "review_new",
    params: { rating: "4.3" },
    titleFallback: null,
    bodyFallback: null,
    link: { target: "review", id: "a1" },
    isRead: false,
    readAt: null,
    createdAt: new Date(0),
  };

  it("renders the rating with Western digits in English and Arabic", () => {
    const copyEn = resolveNotificationCopy(review, en, "en");
    expect(copyEn.title).toBe(en.notifications.types.reviewNew.title);
    expect(copyEn.body).toBe("A customer rated their visit 4.3 out of 5.");
    const copyAr = resolveNotificationCopy(review, ar, "ar");
    expect(copyAr.title).toBe(ar.notifications.types.reviewNew.title);
    expect(copyAr.body).toContain("4.3");
    expect(copyAr.body).not.toContain("{");
  });
});

describe("resolveNotificationCopy no-show types", () => {
  it.each([
    ["appointment_no_show_late", "appointmentNoShowLate"],
    ["appointment_no_show_review", "appointmentNoShowReview"],
  ] as const)("renders %s with the appointment number in both languages", (type, key) => {
    const copyEn = resolveNotificationCopy(appointment(type), en, "en");
    expect(copyEn.title).toBe(en.notifications.types[key].title);
    expect(copyEn.body).toContain("#ABCD1234");
    expect(copyEn.body).not.toContain("{");
    const copyAr = resolveNotificationCopy(appointment(type), ar, "ar");
    expect(copyAr.title).toBe(ar.notifications.types[key].title);
    expect(copyAr.body).toContain("#ABCD1234");
    expect(copyAr.body).not.toContain("{");
  });

  it("uses the exact late arrival and review wording", () => {
    expect(resolveNotificationCopy(appointment("appointment_no_show_late"), en, "en").body).toBe(
      "Please mark appointment #ABCD1234 as completed or no-show.",
    );
    expect(resolveNotificationCopy(appointment("appointment_no_show_review"), ar, "ar").body).toBe(
      "اعترض العميل على تسجيل عدم الحضور للموعد #ABCD1234. فريقنا يراجعه.",
    );
  });

  it("fills the resolved outcome from its key", () => {
    const resolved = (outcome: string) => ({
      ...appointment("appointment_no_show_resolved"),
      params: { appointmentNumber: "#ABCD1234", date: "2026-11-14", time: "09:30", outcome },
    });
    expect(resolveNotificationCopy(resolved("confirmed"), en, "en")).toEqual({
      title: "No-show update",
      body: "The no-show for #ABCD1234 was confirmed.",
    });
    expect(resolveNotificationCopy(resolved("overturned"), en, "en").body).toBe(
      "The no-show for #ABCD1234 was removed.",
    );
    expect(resolveNotificationCopy(resolved("confirmed"), ar, "ar")).toEqual({
      title: "تحديث عدم الحضور",
      body: "تم تأكيد عدم الحضور للموعد #ABCD1234.",
    });
    expect(resolveNotificationCopy(resolved("overturned"), ar, "ar").body).toBe(
      "تم إلغاء عدم الحضور للموعد #ABCD1234.",
    );
  });

  it("falls back to the generic body for an unknown outcome", () => {
    const odd = {
      ...appointment("appointment_no_show_resolved"),
      params: { appointmentNumber: "#ABCD1234", outcome: "raw_code" },
    };
    const copy = resolveNotificationCopy(odd, en, "en");
    expect(copy.title).toBe(en.notifications.types.appointmentNoShowResolved.title);
    expect(copy.body).toBe(en.notifications.fallbackBody);
    expect(copy.body).not.toContain("raw_code");
  });
});

describe("resolveNotificationCopy support cancellations", () => {
  const orderCancelled: VendorNotification = {
    notificationId: "hold_cancel_order_v1",
    type: "order_cancelled_by_admin",
    params: { orderNumber: "#ORD12345" },
    titleFallback: "Fallback title",
    bodyFallback: "Fallback body",
    link: { target: "order", id: "v1" },
    isRead: false,
    readAt: null,
    createdAt: new Date(0),
  };

  it("renders a cancelled order in English and Arabic", () => {
    expect(resolveNotificationCopy(orderCancelled, en, "en")).toEqual({
      title: "Order cancelled",
      body: "Order #ORD12345 was cancelled by TenderPaws support.",
    });
    expect(resolveNotificationCopy(orderCancelled, ar, "ar")).toEqual({
      title: "تم إلغاء الطلب",
      body: "تم إلغاء الطلب #ORD12345 من قبل دعم TenderPaws.",
    });
  });

  it("renders a cancelled appointment in English and Arabic", () => {
    const appt = {
      ...appointment("appointment_cancelled_by_admin"),
      titleFallback: "Fallback title",
      bodyFallback: "Fallback body",
    };
    expect(resolveNotificationCopy(appt, en, "en")).toEqual({
      title: "Appointment cancelled",
      body: "Appointment #ABCD1234 was cancelled by TenderPaws support.",
    });
    expect(resolveNotificationCopy(appt, ar, "ar")).toEqual({
      title: "تم إلغاء الموعد",
      body: "تم إلغاء الموعد #ABCD1234 من قبل دعم TenderPaws.",
    });
  });

  it("keeps the stored fallback text for an unknown type", () => {
    const unknown = { ...orderCancelled, type: "something_new" };
    expect(resolveNotificationCopy(unknown, en, "en")).toEqual({
      title: "Fallback title",
      body: "Fallback body",
    });
    expect(resolveNotificationCopy(unknown, ar, "ar")).toEqual({
      title: "Fallback title",
      body: "Fallback body",
    });
  });
});
