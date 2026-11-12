/**
 * Telehealth (doctor side) as returned by the shared `vendor_telehealth`
 * callables. Money is integer piastres; times are epoch millis. Doctor views
 * never carry the buyer uid or payment data.
 */

export const TELEHEALTH_STATUSES = ["queued", "active", "ended", "refund_flagged"] as const;
export type TelehealthStatus = (typeof TELEHEALTH_STATUSES)[number];

/** Unknown statuses read as "unknown" and get the read only view. */
export type TelehealthSessionStatus = TelehealthStatus | "unknown";

export const TELEHEALTH_LIST_TABS = ["queue", "active", "ended"] as const;
export type TelehealthListTab = (typeof TELEHEALTH_LIST_TABS)[number];

/** Same limits as the callables and the Storage rule. */
export const TELEHEALTH_LIMITS = {
  textMax: 2000,
  captionMax: 500,
  photoMaxBytes: 5 * 1024 * 1024,
  photoMaxSide: 1600,
  queueWindowMs: 15 * 60 * 1000,
  queuePageSize: 20,
  listPageSize: 20,
  messagePageSize: 50,
} as const;

/** Chat photo thumbnail size in CSS pixels (image and its skeleton). */
export const TELEHEALTH_PHOTO_THUMB_PX = 220;

export const TELEHEALTH_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"] as const;

/** Polling while the page is visible. Paused when the tab is hidden. */
export const TELEHEALTH_POLL_MS = {
  queue: 10_000,
  messages: 3_000,
  session: 10_000,
} as const;

/** Server preview key for photo messages. */
export const PHOTO_PREVIEW_KEY = "[photo]";

export type TelehealthBuyer = {
  displayName: string;
  petName: string | null;
  petType: string | null;
};

export type TelehealthDoctor = {
  name: string;
  photoUrl: string | null;
  specialty: string | null;
};

export type TelehealthSession = {
  sessionId: string;
  status: TelehealthSessionStatus;
  buyer: TelehealthBuyer;
  intakeNote: string;
  doctor: TelehealthDoctor | null;
  pricePiastres: number;
  queuedAtMs: number | null;
  acceptedAtMs: number | null;
  endedAtMs: number | null;
  lastMessageAtMs: number | null;
  lastMessagePreview: string | null;
  messageCount: number;
  refundState: "open" | "refunded" | "resolved" | null;
  refundReason: string | null;
};

export type TelehealthQueueItem = {
  sessionId: string;
  buyer: TelehealthBuyer;
  intakeNote: string;
  queuedAtMs: number | null;
  expiresAtMs: number | null;
};

export type TelehealthMessage = {
  messageId: string;
  senderRole: "buyer" | "doctor";
  type: "text" | "photo";
  text: string | null;
  photoUrl: string | null;
  createdAtMs: number | null;
};

export type TelehealthStatusSummary = {
  online: boolean;
  canGoOnline: boolean;
  activeCount: number;
  queuedCount: number;
  pricePiastres: number | null;
};

export type TelehealthSessionPage = {
  items: TelehealthSession[];
  nextCursor: string | null;
};

export type TelehealthMessagePage = {
  items: TelehealthMessage[];
  hasMore: boolean;
};

export type TelehealthSendPayload =
  | { type: "text"; text: string }
  | { type: "photo"; photoUrl: string; text?: string };

/** Only an active session takes messages or an end action. */
export function isSessionOpen(status: TelehealthSessionStatus): boolean {
  return status === "active";
}

/** Merges new messages by id and keeps ascending time order. */
export function mergeMessages(
  current: TelehealthMessage[],
  incoming: TelehealthMessage[],
): TelehealthMessage[] {
  if (incoming.length === 0) return current;
  const byId = new Map(current.map((m) => [m.messageId, m]));
  for (const message of incoming) byId.set(message.messageId, message);
  return [...byId.values()].sort(
    (a, b) => (a.createdAtMs ?? Number.MAX_SAFE_INTEGER) - (b.createdAtMs ?? Number.MAX_SAFE_INTEGER),
  );
}

export type PhotoCheck = "ok" | "type" | "size";

/** Same type and size limits as the Storage rule. */
export function checkPhotoFile(file: { type: string; size: number }): PhotoCheck {
  if (!(TELEHEALTH_PHOTO_TYPES as readonly string[]).includes(file.type)) return "type";
  if (file.size <= 0 || file.size >= TELEHEALTH_LIMITS.photoMaxBytes) return "size";
  return "ok";
}
