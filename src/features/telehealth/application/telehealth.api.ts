import {
  TELEHEALTH_LIMITS,
  TELEHEALTH_STATUSES,
  checkPhotoFile,
  type PhotoCheck,
  type TelehealthBuyer,
  type TelehealthMessage,
  type TelehealthMessagePage,
  type TelehealthQueueItem,
  type TelehealthSendPayload,
  type TelehealthSession,
  type TelehealthSessionPage,
  type TelehealthStatusSummary,
} from "@/features/telehealth/domain/types";
import { resizePhotoFile } from "@/features/telehealth/infrastructure/image-resize";
import {
  TELEHEALTH_CALLABLES,
  invokeTelehealthCallable,
  uploadTelehealthPhotoFile,
} from "@/features/telehealth/infrastructure/telehealth.callables";

/**
 * Doctor telehealth through the shared `vendor_telehealth` callables. No BFF
 * and no Firestore reads. The doctor id is always the caller's auth uid on
 * the server; nothing here sends one.
 */

type Raw = Record<string, unknown>;

function asObject(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function asInt(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) ? Math.max(0, value) : 0;
}

function asMillis(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function mapBuyer(value: unknown): TelehealthBuyer {
  const raw = asObject(value);
  return {
    displayName: asString(raw.displayName),
    petName: asNullableString(raw.petName),
    petType: asNullableString(raw.petType),
  };
}

export function mapSession(value: unknown): TelehealthSession {
  const raw = asObject(value);
  const doctor = raw.doctor ? asObject(raw.doctor) : null;
  const refund = raw.refundState;
  return {
    sessionId: asString(raw.sessionId),
    status: TELEHEALTH_STATUSES.find((s) => s === raw.status) ?? "unknown",
    buyer: mapBuyer(raw.buyer),
    intakeNote: asString(raw.intakeNote),
    doctor: doctor
      ? {
          name: asString(doctor.name),
          photoUrl: asNullableString(doctor.photoUrl),
          specialty: asNullableString(doctor.specialty),
        }
      : null,
    pricePiastres: asInt(raw.pricePiastres),
    queuedAtMs: asMillis(raw.queuedAtMs),
    acceptedAtMs: asMillis(raw.acceptedAtMs),
    endedAtMs: asMillis(raw.endedAtMs),
    lastMessageAtMs: asMillis(raw.lastMessageAtMs),
    lastMessagePreview: asNullableString(raw.lastMessagePreview),
    messageCount: asInt(raw.messageCount),
    refundState: refund === "open" || refund === "refunded" || refund === "resolved" ? refund : null,
    refundReason: asNullableString(raw.refundReason),
  };
}

export function mapQueueItem(value: unknown): TelehealthQueueItem {
  const raw = asObject(value);
  return {
    sessionId: asString(raw.sessionId),
    buyer: mapBuyer(raw.buyer),
    intakeNote: asString(raw.intakeNote),
    queuedAtMs: asMillis(raw.queuedAtMs),
    expiresAtMs: asMillis(raw.expiresAtMs),
  };
}

export function mapMessage(value: unknown): TelehealthMessage {
  const raw = asObject(value);
  return {
    messageId: asString(raw.messageId),
    senderRole: raw.senderRole === "doctor" ? "doctor" : "buyer",
    type: raw.type === "photo" ? "photo" : "text",
    text: typeof raw.text === "string" ? raw.text : null,
    photoUrl: asNullableString(raw.photoUrl),
    createdAtMs: asMillis(raw.createdAtMs),
  };
}

export function mapStatus(value: unknown): TelehealthStatusSummary {
  const raw = asObject(value);
  return {
    online: raw.online === true,
    canGoOnline: raw.canGoOnline === true,
    activeCount: asInt(raw.activeCount),
    queuedCount: asInt(raw.queuedCount),
    pricePiastres:
      typeof raw.pricePiastres === "number" && Number.isInteger(raw.pricePiastres)
        ? raw.pricePiastres
        : null,
  };
}

function call(name: Parameters<typeof invokeTelehealthCallable>[0], payload: Raw = {}) {
  return invokeTelehealthCallable(name, payload).then(asObject);
}

export async function getMyTelehealthStatus(): Promise<TelehealthStatusSummary> {
  return mapStatus(await call(TELEHEALTH_CALLABLES.status));
}

export async function setMyTelehealthAvailability(online: boolean): Promise<boolean> {
  return (await call(TELEHEALTH_CALLABLES.setAvailability, { online })).online === true;
}

/** Longest wait for going offline before sign out continues anyway. */
export const SIGN_OUT_OFFLINE_TIMEOUT_MS = 5000;

/**
 * Best effort offline on sign out. Never throws and never holds sign out
 * longer than `timeoutMs`.
 */
export async function goOfflineQuietly(
  timeoutMs: number = SIGN_OUT_OFFLINE_TIMEOUT_MS,
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs);
  });
  const offline = setMyTelehealthAvailability(false).then(
    () => undefined,
    // Not a doctor, already signed out or offline: nothing to do.
    () => undefined,
  );
  try {
    await Promise.race([offline, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export async function listTelehealthQueue(): Promise<TelehealthQueueItem[]> {
  const data = await call(TELEHEALTH_CALLABLES.queue, {
    pageSize: TELEHEALTH_LIMITS.queuePageSize,
  });
  return asList(data.items).map(mapQueueItem);
}

export async function acceptTelehealthSession(sessionId: string): Promise<TelehealthSession> {
  return mapSession((await call(TELEHEALTH_CALLABLES.accept, { sessionId })).session);
}

export async function endTelehealthSession(sessionId: string): Promise<TelehealthSession> {
  return mapSession((await call(TELEHEALTH_CALLABLES.end, { sessionId })).session);
}

export async function listMyTelehealthSessions(
  status: "active" | "ended",
  cursor: string | null = null,
): Promise<TelehealthSessionPage> {
  const payload: Raw = { status, pageSize: TELEHEALTH_LIMITS.listPageSize };
  if (cursor) payload.cursor = cursor;
  const data = await call(TELEHEALTH_CALLABLES.listMine, payload);
  return {
    items: asList(data.items).map(mapSession),
    nextCursor: asNullableString(data.nextCursor),
  };
}

export async function getTelehealthSession(sessionId: string): Promise<TelehealthSession> {
  return mapSession((await call(TELEHEALTH_CALLABLES.get, { sessionId })).session);
}

/** No cursor: the latest page. `after`: newer messages. `before`: older. */
export async function listTelehealthMessages(
  sessionId: string,
  cursor: { afterMessageId?: string; beforeMessageId?: string } = {},
): Promise<TelehealthMessagePage> {
  const data = await call(TELEHEALTH_CALLABLES.messages, {
    sessionId,
    ...cursor,
    pageSize: TELEHEALTH_LIMITS.messagePageSize,
  });
  return { items: asList(data.items).map(mapMessage), hasMore: data.hasMore === true };
}

export async function sendTelehealthMessage(
  sessionId: string,
  clientMessageId: string,
  payload: TelehealthSendPayload,
): Promise<TelehealthMessage> {
  const data = await call(TELEHEALTH_CALLABLES.send, { sessionId, clientMessageId, ...payload });
  return mapMessage(data.message);
}

export type PhotoUploadResult = { ok: true; photoUrl: string } | { ok: false; reason: PhotoCheck };

/** Resizes, checks type and size, then uploads to the session folder. */
export async function uploadTelehealthPhoto(
  sessionId: string,
  uid: string,
  file: File,
): Promise<PhotoUploadResult> {
  const typeCheck = checkPhotoFile({ type: file.type, size: 1 });
  if (typeCheck !== "ok") return { ok: false, reason: typeCheck };
  const resized = await resizePhotoFile(file, TELEHEALTH_LIMITS.photoMaxSide);
  const check = checkPhotoFile(resized);
  if (check !== "ok") return { ok: false, reason: check };
  return { ok: true, photoUrl: await uploadTelehealthPhotoFile(sessionId, uid, resized) };
}

/** UUID v4 for idempotent sends. */
export function newClientMessageId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
