import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const callableImpl = vi.fn();
const httpsCallable = vi.fn<(functions: unknown, name: string) => typeof callableImpl>(
  () => callableImpl,
);
const vendorApiGet = vi.fn();

vi.mock("firebase/functions", () => ({
  httpsCallable: (functions: unknown, name: string) => httpsCallable(functions, name),
}));
vi.mock("@/lib/firebase", () => ({ firebaseFunctions: {} }));
vi.mock("@/lib/auth-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth-client")>("@/lib/auth-client");
  return { ...actual, vendorApiGet: (path: string) => vendorApiGet(path) };
});

import {
  fetchVendorNotifications,
  fetchVendorUnreadCount,
  mapVendorNotification,
  markVendorNotificationsRead,
  NotificationsApiError,
} from "@/features/notifications/application/notifications.api";
import { ApiClientError } from "@/lib/auth-client";

const callableItem = {
  notificationId: "n1",
  type: "order_new",
  params: { orderNumber: "TP-1", bad: { nested: true } },
  titleFallback: null,
  bodyFallback: null,
  link: { target: "order", id: "vo1" },
  isRead: false,
  readAt: null,
  createdAt: "2026-11-12T10:00:00.000Z",
};

beforeEach(() => {
  callableImpl.mockReset();
  httpsCallable.mockClear();
  vendorApiGet.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("notifications adapter, callable source", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_VENDOR_NOTIFICATIONS_DATA_SOURCE", "callable");
  });

  it("maps the list response and passes filter and cursor", async () => {
    callableImpl.mockResolvedValue({
      data: { ok: true, items: [callableItem, { junk: true }], nextCursor: "n1", unreadCount: 3 },
    });
    const page = await fetchVendorNotifications({ filter: "unread", pageSize: 20, cursor: "c0" });

    expect(httpsCallable).toHaveBeenCalledWith({}, "vendor_notifications-listMyVendorNotifications");
    expect(callableImpl).toHaveBeenCalledWith({ filter: "unread", pageSize: 20, cursor: "c0" });
    expect(page.nextCursor).toBe("n1");
    expect(page.unreadCount).toBe(3);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      notificationId: "n1",
      type: "order_new",
      params: { orderNumber: "TP-1" },
      link: { target: "order", id: "vo1" },
      isRead: false,
      readAt: null,
    });
    expect(page.items[0].createdAt.toISOString()).toBe("2026-11-12T10:00:00.000Z");
  });

  it("returns the unread count for the badge", async () => {
    callableImpl.mockResolvedValue({ data: { ok: true, unreadCount: 7 } });
    await expect(fetchVendorUnreadCount()).resolves.toBe(7);
    expect(httpsCallable).toHaveBeenCalledWith({}, "vendor_notifications-getMyVendorUnreadCount");
  });

  it("marks read by ids or all", async () => {
    callableImpl.mockResolvedValue({ data: { ok: true, updatedCount: 2, unreadCount: 0 } });
    await expect(markVendorNotificationsRead({ all: true })).resolves.toEqual({
      updatedCount: 2,
      unreadCount: 0,
    });
    expect(callableImpl).toHaveBeenCalledWith({ all: true });
    expect(httpsCallable).toHaveBeenCalledWith(
      {},
      "vendor_notifications-markMyVendorNotificationsRead",
    );
  });

  it("maps callable error codes without leaking messages", async () => {
    callableImpl.mockRejectedValue({ code: "functions/permission-denied", message: "raw" });
    const error = await fetchVendorNotifications().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(NotificationsApiError);
    expect((error as NotificationsApiError).code).toBe("permission-denied");
    expect((error as Error).message).not.toContain("raw");

    callableImpl.mockRejectedValue(new Error("boom"));
    const other = await fetchVendorUnreadCount().catch((e: unknown) => e);
    expect((other as NotificationsApiError).code).toBe("internal");
  });
});

describe("notifications adapter, bff source (default)", () => {
  it("keeps calling the BFF route and adds nextCursor null", async () => {
    vendorApiGet.mockResolvedValue({ items: [], unreadCount: 0, total: 0 });
    const page = await fetchVendorNotifications({ filter: "all" });
    expect(vendorApiGet).toHaveBeenCalledWith("/api/vendor/notifications");
    expect(httpsCallable).not.toHaveBeenCalled();
    expect(page).toEqual({ items: [], nextCursor: null, unreadCount: 0 });
  });

  it("shows no badge and makes no calls for count or mark", async () => {
    await expect(fetchVendorUnreadCount()).resolves.toBeNull();
    await expect(markVendorNotificationsRead({ notificationIds: ["n1"] })).resolves.toEqual({
      updatedCount: 0,
      unreadCount: 0,
    });
    expect(httpsCallable).not.toHaveBeenCalled();
  });

  it("maps BFF errors to typed codes", async () => {
    vendorApiGet.mockRejectedValue(new ApiClientError("x", 401));
    const error = await fetchVendorNotifications().catch((e: unknown) => e);
    expect((error as NotificationsApiError).code).toBe("unauthenticated");
  });
});

describe("mapVendorNotification", () => {
  it("drops unknown link targets and rows without an id", () => {
    expect(mapVendorNotification({ ...callableItem, link: { target: "nowhere" } })?.link).toBeNull();
    expect(mapVendorNotification({ type: "order_new" })).toBeNull();
  });
});
