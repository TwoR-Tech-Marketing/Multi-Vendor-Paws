import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");

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

describe("payments rules and index repo copies", () => {
  const rules = readFileSync(path.join(root, "firestore.rules"), "utf8");

  it("lets only an admin or the owning buyer read a payment and denies writes", () => {
    expect(rules).toContain(
      [
        "    match /payments/{id} {",
        "      allow read: if isAdmin() || (isSignedIn() && resource.data.buyerUid == request.auth.uid);",
        "      allow write: if false;",
        "    }",
      ].join("\n"),
    );
  });

  it("keeps the other payment collections and order holds admin read only", () => {
    for (const line of [
      "match /paymentInvoices/{id}      { allow read: if isAdmin(); allow write: if false; }",
      "match /paymentWebhookEvents/{id} { allow read: if isAdmin(); allow write: if false; }",
      "match /paymentsConfig/{id}       { allow read: if isAdmin(); allow write: if false; }",
      "match /orderHolds/{id}           { allow read: if isAdmin(); allow write: if false; }",
    ]) {
      expect(rules).toContain(line);
    }
    expect(rules.match(/match \/(payments|paymentInvoices|paymentWebhookEvents|paymentsConfig|orderHolds)\//g)).toHaveLength(5);
  });

  it("has every payment and hold sweep index", () => {
    const indexes = JSON.parse(readFileSync(path.join(root, "firestore.indexes.json"), "utf8")) as {
      indexes: { collectionGroup: string; queryScope: string; fields: { fieldPath: string; order?: string }[] }[];
    };
    const keys = new Set(
      indexes.indexes.map(
        (i) =>
          `${i.collectionGroup}|${i.queryScope}|${i.fields.map((f) => `${f.fieldPath}:${f.order}`).join(",")}`,
      ),
    );
    const A = "ASCENDING";
    const D = "DESCENDING";
    for (const key of [
      `payments|COLLECTION|state:${A},holdExpiresAt:${A}`,
      `payments|COLLECTION|state:${A},updatedAt:${A}`,
      `payments|COLLECTION|buyerUid:${A},createdAt:${D}`,
      `orderHolds|COLLECTION|state:${A},holdExpiresAt:${A}`,
      `appointments|COLLECTION|status:${A},holdExpiresAt:${A}`,
    ]) {
      expect(keys.has(key), key).toBe(true);
    }
  });
});
