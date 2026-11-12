import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../../..");

describe("reviews rules and index repo copies", () => {
  const rules = readFileSync(path.join(root, "firestore.rules"), "utf8");

  it("lets only the buyer and admins read a review, never client writes", () => {
    const start = rules.indexOf("match /appointmentReviews/{id} {");
    expect(start).toBeGreaterThan(0);
    const body = rules.slice(start, rules.indexOf("\n    }", start));
    expect(body).toContain(
      "allow read: if isAdmin() || (isSignedIn() && resource.data.buyerUid == request.auth.uid);",
    );
    expect(body).toContain("allow write: if false;");
    expect(body).not.toContain("vendorId");
  });

  it("keeps stats owner readable and dashboard counters admin only", () => {
    expect(rules).toContain(
      "match /vendors/{vendorId}/stats/{docId}      { allow read: if isOwner(vendorId) || isAdmin(); allow write: if false; }",
    );
    expect(rules).toContain(
      "match /vendors/{vendorId}/dailyStats/{docId} { allow read: if isAdmin(); allow write: if false; }",
    );
    expect(rules).toContain(
      "match /vendors/{vendorId}/patients/{buyerUid} { allow read: if isAdmin(); allow write: if false; }",
    );
    const branches = rules.slice(rules.indexOf("match /vendors/{vendorId}/branches/{branchId} {"));
    const stats = branches.slice(branches.indexOf("match /stats/{docId} {"));
    expect(stats.slice(0, stats.indexOf("\n      }"))).toContain("allow read: if isOwner(vendorId) || isAdmin();");
  });

  it("has every review index", () => {
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
      `appointmentReviews|vendorId:${A},status:${A},createdAt:${D}`,
      `appointmentReviews|vendorId:${A},branchId:${A},status:${A},createdAt:${D}`,
      `appointmentReviews|vendorId:${A},status:${A},hasReply:${A},createdAt:${D}`,
      `appointmentReviews|vendorId:${A},status:${A},lowRating:${A},createdAt:${D}`,
      `appointmentReviews|status:${A},createdAt:${D}`,
      `appointmentReviews|categorySet:${A},status:${A},createdAt:${D}`,
      `appointmentReviews|status:${A},lowRating:${A},createdAt:${D}`,
      `appointmentReviews|vendorId:${A},branchId:${A},status:${A},hasReply:${A},createdAt:${D}`,
      `appointmentReviews|vendorId:${A},branchId:${A},status:${A},lowRating:${A},createdAt:${D}`,
      `appointments|vendorId:${A},status:${A},startAt:${A}`,
    ]) {
      expect(keys.has(key), key).toBe(true);
    }
  });
});
