import {
  VENDOR_NOTIFICATION_LINK_TARGETS,
  type VendorNotification,
  type VendorNotificationLink,
  type VendorNotificationParams,
  type VendorNotificationsListRequest,
  type VendorNotificationsMarkRequest,
  type VendorNotificationsMarkResult,
  type VendorNotificationsPage,
} from "@/features/notifications/domain/types";
import { ApiClientError, vendorApiGet } from "@/lib/auth-client";
import { invokeCallable } from "@/lib/callable";
import { getNotificationsDataSource } from "@/lib/vendor-data-source";

const CALLABLE_LIST = "vendor_notifications-listMyVendorNotifications";
const CALLABLE_UNREAD = "vendor_notifications-getMyVendorUnreadCount";
const CALLABLE_MARK = "vendor_notifications-markMyVendorNotificationsRead";

export type NotificationsApiErrorCode =
  | "unauthenticated"
  | "permission-denied"
  | "invalid-argument"
  | "internal";

/**
 * Typed error for the notifications adapter. The message is never shown to
 * users; presentation maps every code to a localized string.
 */
export class NotificationsApiError extends Error {
  constructor(readonly code: NotificationsApiErrorCode) {
    super(`notifications:${code}`);
    this.name = "NotificationsApiError";
  }
}

function errorCodeFrom(error: unknown): NotificationsApiErrorCode {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return "unauthenticated";
    if (error.status === 403) return "permission-denied";
    if (error.status === 400) return "invalid-argument";
    return "internal";
  }
  const raw =
    error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code.replace(/^functions\//, "")
      : "";
  if (raw === "unauthenticated" || raw === "permission-denied" || raw === "invalid-argument") {
    return raw;
  }
  return "internal";
}

async function withMappedErrors<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    throw new NotificationsApiError(errorCodeFrom(error));
  }
}

function toDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

function toParams(value: unknown): VendorNotificationParams {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: VendorNotificationParams = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === "string" || (typeof entry === "number" && Number.isFinite(entry))) {
      out[key] = entry;
    }
  }
  return out;
}

function toLink(value: unknown): VendorNotificationLink | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const target = VENDOR_NOTIFICATION_LINK_TARGETS.find((t) => t === raw.target);
  if (!target) return null;
  return { target, id: typeof raw.id === "string" && raw.id ? raw.id : null };
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** Maps one callable or BFF item to the domain model. Returns null for unusable rows. */
export function mapVendorNotification(raw: unknown): VendorNotification | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  if (typeof item.notificationId !== "string" || !item.notificationId) return null;
  return {
    notificationId: item.notificationId,
    type: typeof item.type === "string" ? item.type : "",
    params: toParams(item.params),
    titleFallback: toStringOrNull(item.titleFallback),
    bodyFallback: toStringOrNull(item.bodyFallback),
    link: toLink(item.link),
    isRead: item.isRead === true,
    readAt: toDate(item.readAt),
    createdAt: toDate(item.createdAt) ?? new Date(0),
  };
}

/** Maps a list response (callable or BFF) to a page; BFF has no cursor. */
export function mapVendorNotificationsPage(raw: unknown): VendorNotificationsPage {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const items = Array.isArray(data.items)
    ? data.items
        .map(mapVendorNotification)
        .filter((item): item is VendorNotification => item !== null)
    : [];
  return {
    items,
    nextCursor: typeof data.nextCursor === "string" && data.nextCursor ? data.nextCursor : null,
    unreadCount: toCount(data.unreadCount),
  };
}

export async function fetchVendorNotifications(
  request: VendorNotificationsListRequest = {},
): Promise<VendorNotificationsPage> {
  return withMappedErrors(async () => {
    if (getNotificationsDataSource() === "callable") {
      const result = await invokeCallable(CALLABLE_LIST, {
        filter: request.filter ?? "all",
        pageSize: request.pageSize,
        cursor: request.cursor ?? null,
      });
      return mapVendorNotificationsPage(result);
    }
    const data = await vendorApiGet<unknown>("/api/vendor/notifications");
    return { ...mapVendorNotificationsPage(data), nextCursor: null };
  });
}

/**
 * Unread count for the top bar badge. Returns null on the BFF source, which
 * shows no badge (same as before the inbox).
 */
export async function fetchVendorUnreadCount(): Promise<number | null> {
  if (getNotificationsDataSource() !== "callable") return null;
  return withMappedErrors(async () => {
    const result = await invokeCallable(CALLABLE_UNREAD, {});
    const data = (result ?? {}) as Record<string, unknown>;
    return toCount(data.unreadCount);
  });
}

export async function markVendorNotificationsRead(
  request: VendorNotificationsMarkRequest,
): Promise<VendorNotificationsMarkResult> {
  if (getNotificationsDataSource() !== "callable") {
    return { updatedCount: 0, unreadCount: 0 };
  }
  return withMappedErrors(async () => {
    const result = await invokeCallable(CALLABLE_MARK, request);
    const data = (result ?? {}) as Record<string, unknown>;
    return { updatedCount: toCount(data.updatedCount), unreadCount: toCount(data.unreadCount) };
  });
}

/** Window event the inbox dispatches after a read change so the bell refreshes. */
export const NOTIFICATIONS_CHANGED_EVENT = "vendor-notifications-changed";
