"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { LoadErrorState } from "@/components/ui/error-state/LoadErrorState";
import { toLoadErrorView, type LoadErrorView } from "@/components/ui/error-state/load-error";
import { Routes } from "@/constants/routes";
import {
  acceptTelehealthSession,
  getMyTelehealthStatus,
  listMyTelehealthSessions,
  listTelehealthQueue,
  setMyTelehealthAvailability,
} from "@/features/telehealth/application/telehealth.api";
import {
  TELEHEALTH_POLL_MS,
  type TelehealthListTab,
  type TelehealthQueueItem,
  type TelehealthStatusSummary,
} from "@/features/telehealth/domain/types";
import { TelehealthAvailabilityToggle } from "@/features/telehealth/presentation/TelehealthAvailabilityToggle";
import {
  TelehealthInboxView,
  type SessionListState,
} from "@/features/telehealth/presentation/TelehealthInboxView";
import { TelehealthInboxSkeleton } from "@/features/telehealth/presentation/TelehealthSkeletons";
import { telehealthErrorMessage } from "@/features/telehealth/presentation/telehealth-copy";
import { usePolling } from "@/features/telehealth/presentation/usePolling";
import { usePortalHeaderActions } from "@/features/vendor/presentation/PortalHeaderActionsContext";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./telehealth.module.css";

const EMPTY_LIST: SessionListState = { items: [], nextCursor: null };

/** Tabs a session kind may open: the server refuses the others. */
export function tabsForKind(kind: string): TelehealthListTab[] {
  if (kind === "active") return ["queue", "active", "ended"];
  if (kind === "suspended") return ["active", "ended"];
  return [];
}

export function TelehealthInboxSection() {
  const strings = useStrings();
  const { locale } = usePreferences();
  const router = useRouter();
  const { sessionKind } = usePortalSession();
  const { setActions } = usePortalHeaderActions();
  const t = strings.telehealth;
  const tabs = tabsForKind(sessionKind);

  const [status, setStatus] = useState<TelehealthStatusSummary | null>(null);
  const [loadError, setLoadError] = useState<LoadErrorView | null>(null);
  const [tab, setTab] = useState<TelehealthListTab>(tabs[0] ?? "active");
  const [queue, setQueue] = useState<TelehealthQueueItem[]>([]);
  const [lists, setLists] = useState({ active: EMPTY_LIST, ended: EMPTY_LIST });
  const [isListLoading, setIsListLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadTab = useCallback(
    async (current: TelehealthListTab, online: boolean) => {
      if (!tabsForKind(sessionKind).includes(current)) return;
      if (current === "queue") {
        setQueue(online ? await listTelehealthQueue() : []);
        return;
      }
      const page = await listMyTelehealthSessions(current);
      setLists((prev) => ({ ...prev, [current]: page }));
    },
    [sessionKind],
  );

  const refresh = useCallback(async () => {
    try {
      const next = await getMyTelehealthStatus();
      setStatus(next);
      await loadTab(tab, next.online);
      setLoadError(null);
    } catch (error) {
      setLoadError(toLoadErrorView(error, strings, t.loadError));
    } finally {
      setIsListLoading(false);
    }
  }, [loadTab, tab, strings, t.loadError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  usePolling(refresh, TELEHEALTH_POLL_MS.queue, status !== null && tab !== "ended");

  const toggle = useCallback(async () => {
    if (!status) return;
    setIsToggling(true);
    setActionError(null);
    try {
      const online = await setMyTelehealthAvailability(!status.online);
      setStatus({ ...status, online });
      await refresh();
    } catch (error) {
      setActionError(telehealthErrorMessage(error, strings));
    } finally {
      setIsToggling(false);
    }
  }, [status, refresh, strings]);

  useEffect(() => {
    if (!status) return;
    setActions(
      <TelehealthAvailabilityToggle
        online={status.online}
        canGoOnline={status.canGoOnline}
        isBusy={isToggling}
        strings={strings}
        onToggle={() => void toggle()}
      />,
    );
  }, [status, isToggling, strings, toggle, setActions]);

  useEffect(() => () => setActions(null), [setActions]);

  async function accept(sessionId: string) {
    setAcceptingId(sessionId);
    setActionError(null);
    try {
      const session = await acceptTelehealthSession(sessionId);
      router.push(Routes.vendor.telehealthChat(session.sessionId || sessionId));
    } catch (error) {
      setActionError(telehealthErrorMessage(error, strings));
      setAcceptingId(null);
      await refresh();
    }
  }

  async function loadMore() {
    if (tab === "queue") return;
    const cursor = lists[tab].nextCursor;
    if (!cursor) return;
    setIsLoadingMore(true);
    try {
      const page = await listMyTelehealthSessions(tab, cursor);
      setLists((prev) => ({
        ...prev,
        [tab]: { items: [...prev[tab].items, ...page.items], nextCursor: page.nextCursor },
      }));
    } catch (error) {
      setActionError(telehealthErrorMessage(error, strings));
    } finally {
      setIsLoadingMore(false);
    }
  }

  function changeTab(next: TelehealthListTab) {
    if (next === tab) return;
    setActionError(null);
    setIsListLoading(true);
    setTab(next);
  }

  if (!status) {
    if (!loadError) return <TelehealthInboxSkeleton />;
    return (
      <div className={styles.stack}>
        <section className={styles.panel}>
          <LoadErrorState view={loadError} strings={strings} onRetry={() => void refresh()} />
        </section>
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      {actionError ? (
        <div className={styles.alertError} role="alert">
          {actionError}
        </div>
      ) : null}
      {loadError ? (
        <LoadErrorState view={loadError} strings={strings} onRetry={() => void refresh()} compact />
      ) : null}
      <TelehealthInboxView
        strings={strings}
        locale={locale}
        tab={tab}
        tabs={tabs}
        status={status}
        isActiveAccount={sessionKind === "active"}
        queue={queue}
        lists={lists}
        isListLoading={isListLoading}
        isLoadingMore={isLoadingMore}
        acceptingId={acceptingId}
        onTabChange={changeTab}
        onAccept={(id) => void accept(id)}
        onLoadMore={() => void loadMore()}
      />
    </div>
  );
}
