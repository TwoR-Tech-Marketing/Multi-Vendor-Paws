import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  checkPhotoFile,
  isSessionOpen,
  mergeMessages,
  type TelehealthMessage,
} from "@/features/telehealth/domain/types";

function message(messageId: string, createdAtMs: number | null): TelehealthMessage {
  return { messageId, senderRole: "buyer", type: "text", text: messageId, photoUrl: null, createdAtMs };
}

describe("telehealth domain", () => {
  it("only an active session is open", () => {
    expect(isSessionOpen("active")).toBe(true);
    for (const status of ["queued", "ended", "refund_flagged", "unknown"] as const) {
      expect(isSessionOpen(status)).toBe(false);
    }
  });

  it("merges messages by id in time order", () => {
    const current = [message("a", 1), message("c", 3)];
    const merged = mergeMessages(current, [message("b", 2), message("c", 3), message("d", null)]);
    expect(merged.map((m) => m.messageId)).toEqual(["a", "b", "c", "d"]);
    expect(mergeMessages(current, [])).toBe(current);
  });

  it("checks photo type and size like the storage rule", () => {
    expect(checkPhotoFile({ type: "image/jpeg", size: 1000 })).toBe("ok");
    expect(checkPhotoFile({ type: "image/heic", size: 5 * 1024 * 1024 - 1 })).toBe("ok");
    expect(checkPhotoFile({ type: "image/png", size: 5 * 1024 * 1024 })).toBe("size");
    expect(checkPhotoFile({ type: "image/webp", size: 0 })).toBe("size");
    expect(checkPhotoFile({ type: "image/gif", size: 10 })).toBe("type");
    expect(checkPhotoFile({ type: "application/pdf", size: 10 })).toBe("type");
  });
});

describe("telehealth rules copies", () => {
  const root = path.resolve(__dirname, "../../../..");
  const read = (file: string) => readFileSync(path.join(root, file), "utf8");

  it("keeps every telehealth collection closed to client writes", () => {
    const rules = read("firestore.rules");
    const block = rules.slice(rules.indexOf("match /telehealthSessions/{sessionId}"));
    expect(block).toContain("resource.data.doctorId == request.auth.uid");
    expect(block.slice(0, block.indexOf("match /messages/"))).toContain("allow write: if false;");
    expect(rules).toMatch(/match \/doctorAvailability\/\{doctorId\} \{ allow read: if isOwner\(doctorId\) \|\| isAdmin\(\); allow write: if false; \}/);
    expect(rules).toMatch(/match \/telehealthConfig\/\{docId\}\s+\{ allow read: if isSignedIn\(\); allow write: if false; \}/);
  });

  it("limits chat photos to participants, active sessions, 5 MB and image types", () => {
    const rules = read("storage.rules");
    expect(rules).toContain("match /telehealth/{sessionId}/{uid}/{file}");
    expect(rules).toContain("request.resource.size < 5 * 1024 * 1024");
    expect(rules).toContain("image/(jpeg|png|webp|heic)");
    expect(rules).toContain('.data.status == "active"');
    // The catch all grants nothing, so it cannot widen the telehealth rule.
    expect(rules).toMatch(/match \/\{allPaths=\*\*\} \{\s+allow read, write: if false;/);
  });

  it("declares the telehealth indexes (doctor, admin and buyer)", () => {
    const indexes = JSON.parse(read("firestore.indexes.json")) as {
      indexes: { collectionGroup: string; fields: { fieldPath: string; order: string }[] }[];
    };
    const shapes = indexes.indexes
      .filter((i) => i.collectionGroup === "telehealthSessions")
      .map((i) => i.fields.map((f) => `${f.fieldPath}:${f.order}`).join(","));
    expect(shapes).toEqual([
      "status:ASCENDING,queuedAt:ASCENDING",
      "doctorId:ASCENDING,status:ASCENDING,updatedAt:DESCENDING",
      "status:ASCENDING,refundState:ASCENDING,refundFlaggedAt:DESCENDING",
      "buyerUid:ASCENDING,createdAt:DESCENDING",
      "buyerUid:ASCENDING,status:ASCENDING,createdAt:DESCENDING",
    ]);
  });
});
