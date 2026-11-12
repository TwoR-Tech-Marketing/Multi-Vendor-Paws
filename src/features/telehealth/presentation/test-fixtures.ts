import type {
  TelehealthMessage,
  TelehealthQueueItem,
  TelehealthSession,
  TelehealthStatusSummary,
} from "@/features/telehealth/domain/types";

/** 2026-11-12 10:00 UTC (12:00 Cairo). */
export const FIXED_MS = Date.UTC(2026, 10, 12, 10, 0, 0);

export function makeStatus(patch: Partial<TelehealthStatusSummary> = {}): TelehealthStatusSummary {
  return { online: true, canGoOnline: true, activeCount: 1, queuedCount: 2, pricePiastres: 20000, ...patch };
}

export function makeQueueItem(patch: Partial<TelehealthQueueItem> = {}): TelehealthQueueItem {
  return {
    sessionId: "q1",
    buyer: { displayName: "Mona", petName: "Max", petType: "dog" },
    intakeNote: "Max is not eating since yesterday",
    queuedAtMs: FIXED_MS,
    expiresAtMs: FIXED_MS + 15 * 60 * 1000,
    ...patch,
  };
}

export function makeSession(patch: Partial<TelehealthSession> = {}): TelehealthSession {
  return {
    sessionId: "s1",
    status: "active",
    buyer: { displayName: "Mona", petName: "Max", petType: "dog" },
    intakeNote: "Max is not eating since yesterday",
    doctor: { name: "Dr. Ali", photoUrl: null, specialty: "Cats" },
    pricePiastres: 20000,
    queuedAtMs: FIXED_MS,
    acceptedAtMs: FIXED_MS,
    endedAtMs: null,
    lastMessageAtMs: FIXED_MS,
    lastMessagePreview: "Thank you",
    messageCount: 2,
    refundState: null,
    refundReason: null,
    ...patch,
  };
}

export function makeMessage(patch: Partial<TelehealthMessage> = {}): TelehealthMessage {
  return {
    messageId: "m1",
    senderRole: "buyer",
    type: "text",
    text: "Hello doctor",
    photoUrl: null,
    createdAtMs: FIXED_MS,
    ...patch,
  };
}
