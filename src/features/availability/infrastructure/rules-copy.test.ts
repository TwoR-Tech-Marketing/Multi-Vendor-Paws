import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../../..");

describe("availability rules and index repo copies", () => {
  it("lets only the owner and admins read availability and slot locks, never client writes", () => {
    const rules = readFileSync(path.join(root, "firestore.rules"), "utf8");
    const start = rules.indexOf("match /vendors/{vendorId}/branches/{branchId} {");
    const block = rules.slice(start, rules.indexOf("match /vendor_signup_requests", start));
    for (const sub of ["match /availability/{docId} {", "match /slotLocks/{lockId} {"]) {
      const at = block.indexOf(sub);
      expect(at).toBeGreaterThan(0);
      const body = block.slice(at, block.indexOf("\n      }", at));
      expect(body).toContain("allow read: if isOwner(vendorId) || isAdmin();");
      expect(body).toContain("allow write: if false;");
    }
  });

  it("has the appointments booked query index", () => {
    const indexes = JSON.parse(readFileSync(path.join(root, "firestore.indexes.json"), "utf8")) as {
      indexes: { collectionGroup: string; fields: { fieldPath: string; order?: string }[] }[];
    };
    const match = indexes.indexes.find(
      (i) =>
        i.collectionGroup === "appointments" &&
        i.fields.map((f) => `${f.fieldPath}:${f.order}`).join(",") ===
          "vendorId:ASCENDING,branchId:ASCENDING,status:ASCENDING,endAt:ASCENDING",
    );
    expect(match).toBeDefined();
  });
});
