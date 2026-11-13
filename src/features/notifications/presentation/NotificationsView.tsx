import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { ErrorState } from "@/components/ui/error-state/ErrorState";
import type {
  VendorNotification,
  VendorNotificationFilter,
} from "@/features/notifications/domain/types";
import { resolveNotificationCopy } from "@/features/notifications/domain/notification-copy";
import { formatRelativeTime } from "@/features/notifications/domain/relative-time";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import { NotificationItem } from "./NotificationItem";
import { NotificationsSkeleton } from "./NotificationsSkeleton";
import styles from "./notifications.module.css";

export type NotificationsViewProps = {
  strings: AppStrings;
  locale: AppLocale;
  now: Date;
  tab: VendorNotificationFilter;
  items: VendorNotification[];
  unreadCount: number;
  isLoading: boolean;
  loadError: string | null;
  /** True when the load failed because the connection dropped. */
  isOffline?: boolean;
  actionError: string | null;
  isMarkingAll: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onTabChange: (tab: VendorNotificationFilter) => void;
  onMarkAll: () => void;
  onOpen: (notification: VendorNotification) => void;
  onLoadMore: () => void;
  onRetry: () => void;
};

function formatUnreadSummary(count: number, t: AppStrings["notifications"]): string {
  if (count === 0) return t.unreadSummaryZero;
  if (count === 1) return t.unreadSummaryOne;
  return t.unreadSummaryMany.replace("{count}", String(count));
}

export function NotificationsView(props: NotificationsViewProps) {
  const { strings, locale, now, tab, items, unreadCount, isLoading } = props;
  const t = strings.notifications;

  if (isLoading && items.length === 0) return <NotificationsSkeleton />;

  const emptyTitle = tab === "unread" ? t.emptyUnreadTitle : t.emptyAllTitle;
  const tabs: Array<{ id: VendorNotificationFilter; label: string }> = [
    { id: "all", label: t.tabAll },
    { id: "unread", label: t.tabUnread },
  ];

  return (
    <section className={styles.section} aria-label={strings.pages.notifications.title}>
      {props.loadError && items.length === 0 ? null : (
        <div className={styles.header}>
          <p className={styles.subtitle}>{formatUnreadSummary(unreadCount, t)}</p>
          <button
            type="button"
            className={styles.markAllBtn}
            disabled={props.isMarkingAll || unreadCount === 0}
            onClick={props.onMarkAll}
          >
            {props.isMarkingAll ? t.markAllBusy : t.markAllAsRead}
          </button>
        </div>
      )}

      <div className={styles.tabs} role="tablist" aria-label={strings.pages.notifications.title}>
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`${styles.tab} ${tab === id ? styles.tabActive : ""}`}
            onClick={() => props.onTabChange(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {props.loadError ? (
        <ErrorState
          kind={props.isOffline ? "offline" : "error"}
          title={props.isOffline ? strings.states.offlineTitle : strings.states.errorTitle}
          description={props.isOffline ? strings.states.offlineDescription : props.loadError}
          retryLabel={strings.common.retry}
          onRetry={props.onRetry}
          headingLevel={2}
          compact={items.length > 0}
        />
      ) : null}

      {props.actionError ? (
        <div className={styles.alertError} role="alert">
          <p>{props.actionError}</p>
        </div>
      ) : null}

      {items.length > 0 ? (
        <ul className={styles.list}>
          {items.map((notification) => {
            const copy = resolveNotificationCopy(notification, strings, locale);
            return (
              <NotificationItem
                key={notification.notificationId}
                notification={notification}
                title={copy.title}
                body={copy.body}
                timeLabel={formatRelativeTime(notification.createdAt, now, locale, t.justNow)}
                unreadLabel={t.unreadLabel}
                onOpen={props.onOpen}
              />
            );
          })}
        </ul>
      ) : null}

      {items.length > 0 && props.hasMore ? (
        <div className={styles.loadMoreRow}>
          <button
            type="button"
            className={styles.loadMoreBtn}
            disabled={props.isLoadingMore}
            onClick={props.onLoadMore}
          >
            {props.isLoadingMore ? t.loadingMore : t.loadMore}
          </button>
        </div>
      ) : null}

      {items.length === 0 && !props.loadError ? (
        <EmptyState title={emptyTitle} description={t.emptySubtitle} headingLevel={2} live />
      ) : null}
    </section>
  );
}
