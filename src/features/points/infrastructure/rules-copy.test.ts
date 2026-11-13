import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../../..");

describe("points rules and index repo copies", () => {
  const rules = readFileSync(path.join(root, "firestore.rules"), "utf8");

  it("denies every client write and lets only admins read", () => {
    for (const line of [
      "match /pointsLedger/{id}   { allow read: if isAdmin(); allow write: if false; }",
      "match /pointsBalances/{id} { allow read: if isAdmin(); allow write: if false; }",
      "match /pointsConfig/{id}   { allow read: if isAdmin(); allow write: if false; }",
    ]) {
      expect(rules).toContain(line);
    }
    // No other rule mentions the points collections.
    expect(rules.match(/points(Ledger|Balances|Config)/g)).toHaveLength(3);
  });

  it("has every points ledger index", () => {
    const indexes = JSON.parse(readFileSync(path.join(root, "firestore.indexes.json"), "utf8")) as {
      indexes: { collectionGroup: string; fields: { fieldPath: string; order?: string }[] }[];
    };
    const keys = new Set(
      indexes.indexes.map(
        (i) => `${i.collectionGroup}|${i.fields.map((f) => `${f.fieldPath}:${f.order}`).join(",")}`,
      ),
    );
    const A = "ASCENDING";
    const D = "DESCENDING";
    for (const key of [
      `pointsLedger|type:${A},open:${A},expiresAt:${A}`,
      `pointsLedger|uid:${A},counted:${A},createdAt:${D}`,
      `pointsLedger|uid:${A},open:${A},expiresAt:${A}`,
    ]) {
      expect(keys.has(key), key).toBe(true);
    }
  });
});
