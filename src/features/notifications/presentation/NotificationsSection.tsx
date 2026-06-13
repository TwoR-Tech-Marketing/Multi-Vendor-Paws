"use client";

import { useMemo, useState } from "react";

import { ThemedSvgIcon } from "@/components/ui/themed-icon/ThemedIcon";
import { uiAssets } from "@/shared/assets/ui-assets";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import { NotificationsSkeleton } from "./NotificationsSkeleton";
import styles from "./notifications.module.css";

type NotificationTab = "all" | "unread";

function formatUnreadSummary(
  count: number,
  strings: ReturnType<typeof useStrings>["notifications"],
): string {
  if (count === 0) return strings.unreadSummaryZero;
  if (count === 1) return strings.unreadSummaryOne;
  return strings.unreadSummaryMany.replace("{count}", String(count));
}

export function NotificationsSection() {
  const strings = useStrings();
  const t = strings.notifications;
  const [tab, setTab] = useState<NotificationTab>("all");

  const unreadCount = 0;
  const visibleCount = 0;
  const isLoading = false;

  const unreadSummary = useMemo(
    () => formatUnreadSummary(unreadCount, t),
    [t, unreadCount],
  );

  const emptyTitle = tab === "unread" ? t.emptyUnreadTitle : t.emptyAllTitle;

  return (
    <section className={styles.section} aria-label={strings.pages.notifications.title}>
      <div className={styles.header}>
        <p className={styles.subtitle}>{unreadSummary}</p>
        <button
          type="button"
          className={styles.markAllBtn}
          disabled={isLoading || unreadCount === 0}
        >
          {isLoading ? t.markAllBusy : t.markAllAsRead}
        </button>
      </div>

      <div className={styles.tabs} role="tablist" aria-label={strings.pages.notifications.title}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "all"}
          className={`${styles.tab} ${tab === "all" ? styles.tabActive : ""}`}
          onClick={() => setTab("all")}
        >
          {t.tabAll}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "unread"}
          className={`${styles.tab} ${tab === "unread" ? styles.tabActive : ""}`}
          onClick={() => setTab("unread")}
        >
          {t.tabUnread}
        </button>
      </div>

      {isLoading && visibleCount === 0 ? <NotificationsSkeleton /> : null}

      {!isLoading && visibleCount === 0 ? (
        <div className={styles.emptyState} role="status" aria-live="polite">
          <div className={styles.emptyIcon} aria-hidden>
            <ThemedSvgIcon
              src={uiAssets.bellRead}
              className={styles.emptyBell}
              tone="muted"
              width={26}
              height={34}
            />
          </div>
          <p className={styles.emptyTitle}>{emptyTitle}</p>
          <p className={styles.emptySubtitle}>{t.emptySubtitle}</p>
        </div>
      ) : null}
    </section>
  );
}
