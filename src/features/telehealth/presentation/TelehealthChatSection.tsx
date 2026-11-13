"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { LoadErrorState } from "@/components/ui/error-state/LoadErrorState";
import { toLoadErrorView, type LoadErrorView } from "@/components/ui/error-state/load-error";
import { ConfirmDialog } from "@/components/ui/LogoutConfirmDialog";
import { Routes } from "@/constants/routes";
import {
  endTelehealthSession,
  getTelehealthSession,
  listTelehealthMessages,
  newClientMessageId,
  sendTelehealthMessage,
  uploadTelehealthPhoto,
} from "@/features/telehealth/application/telehealth.api";
import { mapTelehealthError } from "@/features/telehealth/domain/errors";
import {
  TELEHEALTH_POLL_MS,
  isSessionOpen,
  mergeMessages,
  type TelehealthMessage,
  type TelehealthSendPayload,
  type TelehealthSession,
} from "@/features/telehealth/domain/types";
import { TelehealthChatSkeleton } from "@/features/telehealth/presentation/TelehealthSkeletons";
import { TelehealthChatView } from "@/features/telehealth/presentation/TelehealthChatView";
import { TelehealthComposer } from "@/features/telehealth/presentation/TelehealthComposer";
import { TelehealthMessageList } from "@/features/telehealth/presentation/TelehealthMessageList";
import { telehealthErrorMessage } from "@/features/telehealth/presentation/telehealth-copy";
import { usePolling } from "@/features/telehealth/presentation/usePolling";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./telehealth.module.css";

export function TelehealthChatSection({ sessionId }: { sessionId: string }) {
  const strings = useStrings();
  const { locale } = usePreferences();
  const { user } = usePortalSession();
  const t = strings.telehealth.chat;

  const [session, setSession] = useState<TelehealthSession | null>(null);
  const [messages, setMessages] = useState<TelehealthMessage[]>([]);
  const [hasOlder, setHasOlder] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [loadError, setLoadError] = useState<LoadErrorView | null>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // One id per composed text so a retry after a lost response never duplicates.
  const draftIdRef = useRef<string | null>(null);
  const lastIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addMessages = useCallback((incoming: TelehealthMessage[]) => {
    setMessages((current) => {
      const next = mergeMessages(current, incoming);
      lastIdRef.current = next.at(-1)?.messageId ?? null;
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const [loaded, page] = await Promise.all([
        getTelehealthSession(sessionId),
        listTelehealthMessages(sessionId),
      ]);
      setSession(loaded);
      addMessages(page.items);
      setHasOlder(page.hasMore);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        toLoadErrorView(
          error,
          strings,
          mapTelehealthError(error) === "notFound"
            ? strings.errors.telehealth.notFound
            : t.loadError,
        ),
      );
    }
  }, [sessionId, addMessages, strings, t.loadError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const pollMessages = useCallback(async () => {
    const after = lastIdRef.current;
    const page = await listTelehealthMessages(sessionId, after ? { afterMessageId: after } : {});
    addMessages(page.items);
  }, [sessionId, addMessages]);

  const pollSession = useCallback(async () => {
    const next = await getTelehealthSession(sessionId);
    setSession(next);
    if (!isSessionOpen(next.status)) await pollMessages();
  }, [sessionId, pollMessages]);

  const open = session !== null && isSessionOpen(session.status);
  usePolling(pollMessages, TELEHEALTH_POLL_MS.messages, open);
  usePolling(pollSession, TELEHEALTH_POLL_MS.session, open);

  const count = messages.length;
  useEffect(() => {
    const box = scrollRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [count]);

  async function loadOlder() {
    const first = messages[0]?.messageId;
    if (!first) return;
    setIsLoadingOlder(true);
    try {
      const page = await listTelehealthMessages(sessionId, { beforeMessageId: first });
      addMessages(page.items);
      setHasOlder(page.hasMore);
    } catch (error) {
      setActionError(telehealthErrorMessage(error, strings));
    } finally {
      setIsLoadingOlder(false);
    }
  }

  async function handleSendError(error: unknown) {
    setActionError(telehealthErrorMessage(error, strings));
    if (mapTelehealthError(error) === "closed") {
      setSession(await getTelehealthSession(sessionId).catch(() => session));
    }
  }

  async function send(clientMessageId: string, payload: TelehealthSendPayload) {
    const message = await sendTelehealthMessage(sessionId, clientMessageId, payload);
    addMessages([message]);
  }

  async function sendText() {
    const text = draft.trim();
    if (!text) return;
    draftIdRef.current ??= newClientMessageId();
    setIsSending(true);
    setActionError(null);
    setSuccess(null);
    try {
      await send(draftIdRef.current, { type: "text", text });
      draftIdRef.current = null;
      setDraft("");
    } catch (error) {
      await handleSendError(error);
    } finally {
      setIsSending(false);
    }
  }

  async function sendPhoto(file: File) {
    setIsUploading(true);
    setActionError(null);
    setSuccess(null);
    try {
      let upload: Awaited<ReturnType<typeof uploadTelehealthPhoto>>;
      try {
        upload = await uploadTelehealthPhoto(sessionId, user.uid, file);
      } catch {
        setActionError(strings.errors.telehealth.photoUpload);
        return;
      }
      if (!upload.ok) {
        setActionError(upload.reason === "type" ? t.photoType : t.photoSize);
        return;
      }
      await send(newClientMessageId(), { type: "photo", photoUrl: upload.photoUrl });
    } catch (error) {
      await handleSendError(error);
    } finally {
      setIsUploading(false);
    }
  }

  async function end() {
    setIsEnding(true);
    setActionError(null);
    try {
      setSession(await endTelehealthSession(sessionId));
      setSuccess(t.endSuccess);
    } catch (error) {
      await handleSendError(error);
    } finally {
      setIsEnding(false);
      setConfirmEnd(false);
    }
  }

  if (!session) {
    if (!loadError) return <TelehealthChatSkeleton />;
    return (
      <div className={styles.stack}>
        <div className={styles.actions}>
          <Link className={styles.secondaryButton} href={Routes.vendor.telehealth}>
            {t.back}
          </Link>
        </div>
        <section className={styles.panel}>
          <LoadErrorState view={loadError} strings={strings} onRetry={() => void load()} />
        </section>
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      {success ? (
        <div className={styles.alertSuccess} role="status">
          {success}
        </div>
      ) : null}
      {actionError ? (
        <div className={styles.alertError} role="alert">
          {actionError}
        </div>
      ) : null}
      <TelehealthChatView
        session={session}
        strings={strings}
        isEnding={isEnding}
        onEnd={() => setConfirmEnd(true)}
        messageList={
          <TelehealthMessageList
            messages={messages}
            strings={strings}
            locale={locale}
            hasOlder={hasOlder}
            isLoadingOlder={isLoadingOlder}
            onLoadOlder={() => void loadOlder()}
            scrollRef={scrollRef}
          />
        }
        composer={
          <TelehealthComposer
            draft={draft}
            strings={strings}
            isSending={isSending}
            isUploading={isUploading}
            onDraftChange={(value) => {
              draftIdRef.current = null;
              setDraft(value);
            }}
            onSend={() => void sendText()}
            onPhoto={(file) => void sendPhoto(file)}
          />
        }
      />
      <ConfirmDialog
        open={confirmEnd}
        title={t.endConfirmTitle}
        message={t.endConfirm}
        confirmLabel={isEnding ? t.ending : t.end}
        cancelLabel={strings.common.cancel}
        isConfirming={isEnding}
        onCancel={() => setConfirmEnd(false)}
        onConfirm={end}
      />
    </div>
  );
}
