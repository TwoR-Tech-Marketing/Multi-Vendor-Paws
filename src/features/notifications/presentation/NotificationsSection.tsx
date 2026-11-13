"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  fetchVendorNotifications,
  markVendorNotificationsRead,
  NOTIFICATIONS_CHANGED_EVENT,
} from "@/features/notifications/application/notifications.api";
import {
  appendPage,
  applyItemOpened,
  applyMarkAll,
  createRequestTracker,
} from "@/features/notifications/domain/notification-state";
import type {
  VendorNotification,
  VendorNotificationFilter,
} from "@/features/notifications/domain/types";
import { resolveNotificationHref } from "@/features/notifications/domain/notification-link";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { isNetworkError } from "@/shared/lib/network-error";
import { usePreferences } from "@/shared/preferences/PreferencesContext";

import { NotificationsView } from "./NotificationsView";

const PAGE_SIZE = 20;

function notifyChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

export function NotificationsSection() {
  const router = useRouter();
  const { strings, locale } = usePreferences();
  const { profile } = usePortalSession();
  const t = strings.notifications;

  const [tab, setTab] = useState<VendorNotificationFilter>("all");
  const [items, setItems] = useState<VendorNotification[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [requests] = useState(createRequestTracker);

  const loadFirstPage = useCallback(
    async (filter: VendorNotificationFilter) => {
      const requestId = requests.next();
      setIsLoading(true);
      setLoadError(null);
      setActionError(null);
      setItems([]);
      try {
        const page = await fetchVendorNotifications({ filter, pageSize: PAGE_SIZE });
        if (!requests.isLatest(requestId)) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
        setUnreadCount(page.unreadCount);
        setNow(new Date());
      } catch (failure) {
        if (!requests.isLatest(requestId)) return;
        setNextCursor(null);
        setIsOffline(isNetworkError(failure));
        setLoadError(t.loadError);
      } finally {
        if (requests.isLatest(requestId)) setIsLoading(false);
      }
    },
    [requests, t.loadError],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFirstPage(tab);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadFirstPage, tab]);

  async function onLoadMore() {
    if (!nextCursor || isLoadingMore) return;
    const requestId = requests.next();
    setIsLoadingMore(true);
    setActionError(null);
    try {
      const page = await fetchVendorNotifications({
        filter: tab,
        pageSize: PAGE_SIZE,
        cursor: nextCursor,
      });
      if (!requests.isLatest(requestId)) return;
      setItems((current) => appendPage(current, page.items));
      setNextCursor(page.nextCursor);
      setUnreadCount(page.unreadCount);
    } catch {
      if (requests.isLatest(requestId)) setActionError(t.loadError);
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function onMarkAll() {
    setIsMarkingAll(true);
    setActionError(null);
    try {
      const result = await markVendorNotificationsRead({ all: true });
      setItems((current) => applyMarkAll(current, tab, new Date()));
      setUnreadCount(result.unreadCount);
      notifyChanged();
    } catch {
      setActionError(t.markReadError);
    } finally {
      setIsMarkingAll(false);
    }
  }

  async function onOpen(notification: VendorNotification) {
    const href = resolveNotificationHref(notification.link, profile.vendorType);
    if (!notification.isRead) {
      setItems((current) =>
        applyItemOpened(current, notification.notificationId, tab, new Date()),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      try {
        const result = await markVendorNotificationsRead({
          notificationIds: [notification.notificationId],
        });
        setUnreadCount(result.unreadCount);
        notifyChanged();
      } catch {
        if (!href) setActionError(t.markReadError);
      }
    }
    if (href) router.push(href);
  }

  return (
    <NotificationsView
      strings={strings}
      locale={locale}
      now={now}
      tab={tab}
      items={items}
      unreadCount={unreadCount}
      isLoading={isLoading}
      loadError={loadError}
      isOffline={isOffline}
      actionError={actionError}
      isMarkingAll={isMarkingAll}
      hasMore={nextCursor !== null}
      isLoadingMore={isLoadingMore}
      onTabChange={setTab}
      onMarkAll={() => void onMarkAll()}
      onOpen={(notification) => void onOpen(notification)}
      onLoadMore={() => void onLoadMore()}
      onRetry={() => void loadFirstPage(tab)}
    />
  );
}
