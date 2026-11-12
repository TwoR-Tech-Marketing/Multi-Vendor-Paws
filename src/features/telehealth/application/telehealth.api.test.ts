import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  callableFn: vi.fn(),
  httpsCallable: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  ref: vi.fn(),
}));

vi.mock("firebase/functions", () => ({ httpsCallable: mocks.httpsCallable }));
vi.mock("firebase/storage", () => ({
  ref: mocks.ref,
  uploadBytes: mocks.uploadBytes,
  getDownloadURL: mocks.getDownloadURL,
}));
vi.mock("@/lib/firebase", () => ({ firebaseFunctions: {}, firebaseStorage: {} }));

import {
  acceptTelehealthSession,
  endTelehealthSession,
  getMyTelehealthStatus,
  getTelehealthSession,
  goOfflineQuietly,
  listMyTelehealthSessions,
  listTelehealthMessages,
  listTelehealthQueue,
  mapSession,
  newClientMessageId,
  sendTelehealthMessage,
  setMyTelehealthAvailability,
  uploadTelehealthPhoto,
} from "@/features/telehealth/application/telehealth.api";
import { mapTelehealthError } from "@/features/telehealth/domain/errors";
import { telehealthPhotoPath } from "@/features/telehealth/infrastructure/telehealth.callables";
import { telehealthErrorMessage } from "@/features/telehealth/presentation/telehealth-copy";
import { getStrings } from "@/shared/i18n/get-strings";

const RAW_SESSION = {
  sessionId: "s1",
  status: "active",
  buyer: { displayName: "Mona", petName: "Max", petType: "dog" },
  intakeNote: "Max is not eating",
  doctor: { name: "Dr. Ali", photoUrl: null, specialty: "Cats" },
  pricePiastres: 20000,
  queuedAtMs: 1,
  acceptedAtMs: 2,
  endedAtMs: null,
  lastMessageAtMs: 3,
  lastMessagePreview: "[photo]",
  messageCount: 4,
  refundState: null,
  refundReason: null,
};

beforeEach(() => {
  mocks.callableFn.mockReset();
  mocks.httpsCallable.mockReset();
  mocks.httpsCallable.mockImplementation(() => mocks.callableFn);
  mocks.uploadBytes.mockReset();
  mocks.getDownloadURL.mockReset();
  mocks.ref.mockReset();
  mocks.ref.mockImplementation((_storage: unknown, path: string) => ({ path }));
});

function lastCall() {
  return {
    name: mocks.httpsCallable.mock.calls.at(-1)?.[1],
    payload: mocks.callableFn.mock.calls.at(-1)?.[0],
  };
}

describe("telehealth api", () => {
  it("reads the doctor status", async () => {
    mocks.callableFn.mockResolvedValue({
      data: { ok: true, online: true, canGoOnline: true, activeCount: 2, queuedCount: 5, pricePiastres: 20000 },
    });
    expect(await getMyTelehealthStatus()).toEqual({
      online: true,
      canGoOnline: true,
      activeCount: 2,
      queuedCount: 5,
      pricePiastres: 20000,
    });
    expect(lastCall()).toEqual({ name: "vendor_telehealth-getMyTelehealthStatus", payload: {} });
  });

  it("defaults a broken status to offline and no price", async () => {
    mocks.callableFn.mockResolvedValue({ data: { online: "yes", pricePiastres: 1.5 } });
    expect(await getMyTelehealthStatus()).toEqual({
      online: false,
      canGoOnline: false,
      activeCount: 0,
      queuedCount: 0,
      pricePiastres: null,
    });
  });

  it("sets availability and goes offline quietly on errors", async () => {
    mocks.callableFn.mockResolvedValue({ data: { ok: true, online: true } });
    expect(await setMyTelehealthAvailability(true)).toBe(true);
    expect(lastCall()).toEqual({
      name: "vendor_telehealth-setMyTelehealthAvailability",
      payload: { online: true },
    });
    mocks.callableFn.mockRejectedValue({ code: "functions/permission-denied" });
    await expect(goOfflineQuietly()).resolves.toBeUndefined();
    expect(lastCall().payload).toEqual({ online: false });
  });

  it("lists the queue with the page size and maps items", async () => {
    mocks.callableFn.mockResolvedValue({
      data: {
        ok: true,
        items: [
          { sessionId: "q1", buyer: { displayName: "Mona", petName: null }, intakeNote: "Hi", queuedAtMs: 10, expiresAtMs: 900010, buyerUid: "secret" },
        ],
      },
    });
    const items = await listTelehealthQueue();
    expect(lastCall()).toEqual({ name: "vendor_telehealth-listTelehealthQueue", payload: { pageSize: 20 } });
    expect(items).toEqual([
      {
        sessionId: "q1",
        buyer: { displayName: "Mona", petName: null, petType: null },
        intakeNote: "Hi",
        queuedAtMs: 10,
        expiresAtMs: 900010,
      },
    ]);
    expect(items[0]).not.toHaveProperty("buyerUid");
  });

  it("accepts, gets and ends a session by id only", async () => {
    mocks.callableFn.mockResolvedValue({ data: { ok: true, session: RAW_SESSION, replayed: false } });
    expect((await acceptTelehealthSession("s1")).status).toBe("active");
    expect(lastCall()).toEqual({ name: "vendor_telehealth-acceptTelehealthSession", payload: { sessionId: "s1" } });
    await getTelehealthSession("s1");
    expect(lastCall()).toEqual({ name: "vendor_telehealth-getTelehealthSession", payload: { sessionId: "s1" } });
    await endTelehealthSession("s1");
    expect(lastCall()).toEqual({ name: "vendor_telehealth-endTelehealthSession", payload: { sessionId: "s1" } });
  });

  it("maps a session and reads unknown statuses as unknown", () => {
    expect(mapSession(RAW_SESSION)).toMatchObject({
      sessionId: "s1",
      status: "active",
      buyer: { displayName: "Mona", petName: "Max", petType: "dog" },
      doctor: { name: "Dr. Ali", photoUrl: null, specialty: "Cats" },
      pricePiastres: 20000,
      lastMessagePreview: "[photo]",
      messageCount: 4,
    });
    expect(mapSession({ status: "timed_out" }).status).toBe("unknown");
    expect(mapSession(null)).toMatchObject({ sessionId: "", doctor: null, refundState: null });
    expect(mapSession({ status: "refund_flagged", refundState: "open" })).toMatchObject({
      status: "refund_flagged",
      refundState: "open",
    });
  });

  it("lists my sessions with status, page size and cursor", async () => {
    mocks.callableFn.mockResolvedValue({ data: { ok: true, items: [RAW_SESSION], nextCursor: "s1" } });
    const page = await listMyTelehealthSessions("ended");
    expect(lastCall().payload).toEqual({ status: "ended", pageSize: 20 });
    expect(page.nextCursor).toBe("s1");
    mocks.callableFn.mockResolvedValue({ data: { ok: true, items: [], nextCursor: null } });
    await listMyTelehealthSessions("active", "s1");
    expect(lastCall()).toEqual({
      name: "vendor_telehealth-listMyTelehealthSessions",
      payload: { status: "active", pageSize: 20, cursor: "s1" },
    });
  });

  it("lists messages after or before a cursor", async () => {
    mocks.callableFn.mockResolvedValue({
      data: {
        ok: true,
        hasMore: true,
        items: [
          { messageId: "m1", senderRole: "buyer", type: "text", text: "Hello", photoUrl: null, createdAtMs: 5 },
          { messageId: "m2", senderRole: "doctor", type: "photo", text: null, photoUrl: "https://x/p.jpg", createdAtMs: 6 },
        ],
      },
    });
    const page = await listTelehealthMessages("s1", { afterMessageId: "m0" });
    expect(lastCall()).toEqual({
      name: "vendor_telehealth-listTelehealthMessages",
      payload: { sessionId: "s1", afterMessageId: "m0", pageSize: 50 },
    });
    expect(page.hasMore).toBe(true);
    expect(page.items[1]).toEqual({
      messageId: "m2",
      senderRole: "doctor",
      type: "photo",
      text: null,
      photoUrl: "https://x/p.jpg",
      createdAtMs: 6,
    });
    await listTelehealthMessages("s1");
    expect(lastCall().payload).toEqual({ sessionId: "s1", pageSize: 50 });
  });

  it("sends with the client message id and never a vendor id", async () => {
    mocks.callableFn.mockResolvedValue({
      data: { ok: true, replayed: true, message: { messageId: "id1", senderRole: "doctor", type: "text", text: "Hi", createdAtMs: 1 } },
    });
    const message = await sendTelehealthMessage("s1", "id1", { type: "text", text: "Hi" });
    expect(message.messageId).toBe("id1");
    expect(lastCall()).toEqual({
      name: "vendor_telehealth-sendTelehealthMessage",
      payload: { sessionId: "s1", clientMessageId: "id1", type: "text", text: "Hi" },
    });
  });

  it("creates UUID v4 client message ids", () => {
    const a = newClientMessageId();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(newClientMessageId()).not.toBe(a);
  });

  it("uploads photos to the session folder of the sender", async () => {
    mocks.getDownloadURL.mockResolvedValue("https://storage/p.png");
    const file = new File([new Uint8Array(10)], "my photo.png", { type: "image/png" });
    expect(await uploadTelehealthPhoto("s1", "doc1", file)).toEqual({ ok: true, photoUrl: "https://storage/p.png" });
    const path: string = mocks.ref.mock.calls[0][1];
    expect(path).toMatch(/^telehealth\/s1\/doc1\/\d+_my_photo\.png$/);
    expect(mocks.uploadBytes.mock.calls[0][2]).toEqual({ contentType: "image/png" });
  });

  it("refuses wrong types and large photos before uploading", async () => {
    const gif = new File([new Uint8Array(10)], "a.gif", { type: "image/gif" });
    expect(await uploadTelehealthPhoto("s1", "doc1", gif)).toEqual({ ok: false, reason: "type" });
    const big = new File([new Uint8Array(5 * 1024 * 1024)], "a.heic", { type: "image/heic" });
    expect(await uploadTelehealthPhoto("s1", "doc1", big)).toEqual({ ok: false, reason: "size" });
    expect(mocks.uploadBytes).not.toHaveBeenCalled();
  });

  it("builds the storage path the rules check", () => {
    expect(telehealthPhotoPath("s1", "u1", "x y.jpg", 7)).toBe("telehealth/s1/u1/7_x_y.jpg");
  });
});

describe("mapTelehealthError", () => {
  const precondition = (reason?: string) => ({
    code: "functions/failed-precondition",
    message: "raw",
    details: reason ? { reason } : undefined,
  });

  it.each([
    [precondition("taken"), "taken"],
    [precondition("expired"), "expired"],
    [precondition("offline"), "offline"],
    [precondition("limit"), "limit"],
    [precondition("closed"), "closed"],
    [precondition(), "closed"],
    [{ code: "functions/not-found" }, "notFound"],
    [{ code: "functions/permission-denied" }, "notAllowed"],
    [{ code: "functions/unauthenticated" }, "notAllowed"],
    [{ code: "functions/invalid-argument" }, "invalidField"],
    [{ code: "functions/internal", message: "stack" }, "generic"],
    [new Error("network"), "generic"],
    [null, "generic"],
  ])("maps %o to %s", (error, key) => {
    expect(mapTelehealthError(error)).toBe(key);
  });

  it("gives friendly copy in both languages and never the raw message", () => {
    const en = getStrings("en");
    const ar = getStrings("ar");
    for (const reason of ["taken", "expired", "offline", "limit"] as const) {
      expect(telehealthErrorMessage(precondition(reason), en)).toBe(en.errors.telehealth[reason]);
      expect(telehealthErrorMessage(precondition(reason), ar)).toBe(ar.errors.telehealth[reason]);
      expect(ar.errors.telehealth[reason]).not.toBe(en.errors.telehealth[reason]);
    }
    expect(telehealthErrorMessage({ code: "functions/internal", message: "stack" }, en)).toBe(
      en.errors.generic,
    );
  });
});
