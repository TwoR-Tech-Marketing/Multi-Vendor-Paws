"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemedSvgIcon } from "@/components/ui/themed-icon/ThemedIcon";
import { Routes } from "@/constants/routes";
import {
  fetchVendorUnreadCount,
  NOTIFICATIONS_CHANGED_EVENT,
} from "@/features/notifications/application/notifications.api";
import { formatUnreadBadge } from "@/features/notifications/domain/notification-state";
import { uiAssets } from "@/shared/assets/ui-assets";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./portal.module.css";

/** Unread count for the bell; null on the BFF source (no badge, same as before PC-3). */
function useUnreadCount(pathname: string): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      fetchVendorUnreadCount()
        .then((value) => {
          if (!cancelled) setCount(value);
        })
        .catch(() => {
          // ponytail: a failed badge refresh keeps the last count; the inbox shows errors.
        });
    };
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    };
  }, [pathname]);

  return count;
}

export function NotificationBellButton() {
  const strings = useStrings();
  const pathname = usePathname();
  const isNotificationsActive = pathname.startsWith(Routes.vendor.notifications);
  const badge = formatUnreadBadge(useUnreadCount(pathname) ?? 0);
  const ariaLabel = badge
    ? strings.notifications.openWithUnread.replace("{count}", badge)
    : strings.notifications.open;

  return (
    <div className={styles.bellWrap}>
      <Link
        href={Routes.vendor.notifications}
        prefetch
        scroll={false}
        className={`${styles.bellBtn} ${isNotificationsActive ? styles.bellBtnActive : ""}`}
        aria-label={ariaLabel}
        aria-current={isNotificationsActive ? "page" : undefined}
      >
        <span className={styles.bellIcon} aria-hidden>
          <ThemedSvgIcon src={uiAssets.bellRead} tone="muted" width={22} height={29} />
        </span>
        {badge ? (
          <span className={styles.bellBadge} aria-hidden>
            {badge}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
