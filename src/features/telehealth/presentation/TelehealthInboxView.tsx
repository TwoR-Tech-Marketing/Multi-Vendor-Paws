import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import {
  TELEHEALTH_LIST_TABS,
  type TelehealthListTab,
  type TelehealthQueueItem,
  type TelehealthSession,
  type TelehealthStatusSummary,
} from "@/features/telehealth/domain/types";
import { formatEgp } from "@/features/products/domain/currency";
import { TelehealthQueueList } from "@/features/telehealth/presentation/TelehealthQueueList";
import { TelehealthSessionList } from "@/features/telehealth/presentation/TelehealthSessionList";
import { TelehealthListSkeleton } from "@/features/telehealth/presentation/TelehealthSkeletons";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import styles from "./telehealth.module.css";

export type SessionListState = {
  items: TelehealthSession[];
  nextCursor: string | null;
};

type TelehealthInboxViewProps = {
  strings: AppStrings;
  locale: AppLocale;
  tab: TelehealthListTab;
  tabs: readonly TelehealthListTab[];
  status: TelehealthStatusSummary;
  isActiveAccount: boolean;
  queue: TelehealthQueueItem[];
  lists: Record<"active" | "ended", SessionListState>;
  isListLoading: boolean;
  isLoadingMore: boolean;
  acceptingId: string | null;
  onTabChange: (tab: TelehealthListTab) => void;
  onAccept: (sessionId: string) => void;
  onLoadMore: () => void;
};

/** Hint, counts, tabs and the list for the selected tab. Pure: driven by props. */
export function TelehealthInboxView({
  strings,
  locale,
  tab,
  tabs,
  status,
  isActiveAccount,
  queue,
  lists,
  isListLoading,
  isLoadingMore,
  acceptingId,
  onTabChange,
  onAccept,
  onLoadMore,
}: TelehealthInboxViewProps) {
  const t = strings.telehealth;
  const hint = !isActiveAccount ? t.inactiveHint : status.online ? t.onlineHint : t.offlineHint;

  function body() {
    if (isListLoading) return <TelehealthListSkeleton />;
    if (tab === "queue") {
      return status.online ? (
        <TelehealthQueueList
          items={queue}
          strings={strings}
          locale={locale}
          acceptingId={acceptingId}
          onAccept={onAccept}
        />
      ) : (
        <EmptyState headingLevel={3} title={t.queueOffline} />
      );
    }
    const list = lists[tab];
    return (
      <TelehealthSessionList
        sessions={list.items}
        emptyText={tab === "active" ? t.activeEmptyTitle : t.endedEmptyTitle}
        strings={strings}
        locale={locale}
        hasMore={list.nextCursor !== null}
        isLoadingMore={isLoadingMore}
        onLoadMore={onLoadMore}
      />
    );
  }

  return (
    <section className={styles.panel}>
      <div className={isActiveAccount ? styles.muted : styles.alertInfo}>{hint}</div>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>{t.tabsLabel}</h2>
        <div className={styles.rowMeta}>
          {isActiveAccount && status.online ? (
            <span>{t.queueCount.replace("{count}", String(status.queuedCount))}</span>
          ) : null}
          <span>{t.activeCount.replace("{count}", String(status.activeCount))}</span>
          {status.pricePiastres !== null ? (
            <span>{t.price.replace("{amount}", formatEgp(status.pricePiastres, locale))}</span>
          ) : null}
        </div>
      </div>
      {tabs.length > 0 ? (
        <div className={styles.tabs} role="tablist" aria-label={t.tabsLabel}>
          {TELEHEALTH_LIST_TABS.filter((id) => tabs.includes(id)).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`${styles.tab} ${tab === id ? styles.tabActive : ""}`}
              onClick={() => onTabChange(id)}
            >
              {t.tabs[id]}
            </button>
          ))}
        </div>
      ) : null}
      {tabs.includes(tab) ? body() : null}
    </section>
  );
}
