import { describe, expect, it } from "vitest";

import { Routes } from "@/constants/routes";
import {
  appendPage,
  formatUnreadBadge,
  markAllItemsRead,
  markItemRead,
} from "@/features/notifications/domain/notification-state";
import type { VendorNotification } from "@/features/notifications/domain/types";
import { resolveNotificationCopy } from "@/features/notifications/lib/notification-copy";
import { resolveNotificationHref } from "@/features/notifications/lib/notification-link";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");

function item(id: string, overrides: Partial<VendorNotification> = {}): VendorNotification {
  return {
    notificationId: id,
    type: "order_hold",
    params: { orderNumber: "TP-7" },
    titleFallback: null,
    bodyFallback: null,
    link: null,
    isRead: false,
    readAt: null,
    createdAt: new Date(0),
    ...overrides,
  };
}

describe("resolveNotificationCopy", () => {
  it("fills params into the type template", () => {
    expect(resolveNotificationCopy(item("a"), en)).toEqual({
      title: "Order on hold",
      body: "Order TP-7 is on hold.",
    });
  });

  it("formats payout amounts from integer piastres", () => {
    const copy = resolveNotificationCopy(
      item("a", { type: "payout_recorded", params: { amount: 12550 } }),
      en,
    );
    expect(copy.body).toContain("125.5");
  });

  it("uses fallback text for unknown types, then the generic copy", () => {
    expect(
      resolveNotificationCopy(item("a", { type: "admin_message", titleFallback: "Hi", bodyFallback: "Body" }), en),
    ).toEqual({ title: "Hi", body: "Body" });
    expect(resolveNotificationCopy(item("a", { type: "future_type" }), en)).toEqual({
      title: en.notifications.fallbackTitle,
      body: en.notifications.fallbackBody,
    });
  });
});

describe("resolveNotificationHref", () => {
  it("maps each link target to a portal route", () => {
    expect(resolveNotificationHref({ target: "order", id: "vo1" })).toBe(Routes.vendor.orderDetail("vo1"));
    expect(resolveNotificationHref({ target: "order", id: null })).toBe(Routes.vendor.orders);
    expect(resolveNotificationHref({ target: "products", id: null })).toBe(Routes.vendor.products);
    expect(resolveNotificationHref({ target: "earnings", id: null })).toBe(Routes.vendor.earnings);
    expect(resolveNotificationHref({ target: "documents", id: null })).toBe(Routes.vendor.profile);
    expect(resolveNotificationHref({ target: "accountStatus", id: null })).toBe(Routes.vendor.profile);
    expect(resolveNotificationHref(null)).toBeNull();
  });
});

describe("notification list state", () => {
  const now = new Date("2026-11-12T00:00:00.000Z");
  const readAt = new Date("2026-11-01T00:00:00.000Z");

  it("marks one item read without touching readAt of read items", () => {
    const items = [item("a"), item("b", { isRead: true, readAt })];
    const next = markItemRead(items, "a", now);
    expect(next[0]).toMatchObject({ isRead: true, readAt: now });
    expect(markItemRead(next, "b", now)[1].readAt).toBe(readAt);
  });

  it("marks all loaded items read", () => {
    const next = markAllItemsRead([item("a"), item("b", { isRead: true, readAt })], now);
    expect(next.every((n) => n.isRead)).toBe(true);
    expect(next[1].readAt).toBe(readAt);
  });

  it("appends pages without duplicates", () => {
    const merged = appendPage([item("a"), item("b")], [item("b"), item("c")]);
    expect(merged.map((n) => n.notificationId)).toEqual(["a", "b", "c"]);
  });

  it("formats the bell badge", () => {
    expect(formatUnreadBadge(0)).toBeNull();
    expect(formatUnreadBadge(5)).toBe("5");
    expect(formatUnreadBadge(250)).toBe("99+");
  });
});
