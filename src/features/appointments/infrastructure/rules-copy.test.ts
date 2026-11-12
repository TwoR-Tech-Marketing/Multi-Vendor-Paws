import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../../..");

function block(rules: string, header: string): string {
  const start = rules.indexOf(header);
  expect(start).toBeGreaterThan(0);
  return rules.slice(start, rules.indexOf("\n    }", start));
}

describe("appointments rules and index repo copies", () => {
  const rules = readFileSync(path.join(root, "firestore.rules"), "utf8");

  it("lets the provider, the buyer and admins read appointments, never client writes", () => {
    const body = block(rules, "match /appointments/{id} {");
    const party =
      "allow read: if isAdmin() || (isSignedIn() && (resource.data.vendorId == request.auth.uid || resource.data.buyerUid == request.auth.uid));";
    expect(body.split(party)).toHaveLength(3);
    expect(body).toContain("match /extraInvoices/{invoiceId} {");
    expect(body.split("allow write: if false;")).toHaveLength(3);
  });

  it("keeps support cases and the appointments config admin read only", () => {
    expect(rules).toContain(
      "match /supportCases/{id} { allow read: if isAdmin(); allow write: if false; }",
    );
    expect(rules).toContain(
      "match /appointmentsConfig/{id} { allow read: if isAdmin(); allow write: if false; }",
    );
  });

  it("has every inbox, hold, buyer and no-show index", () => {
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
    const expected = [
      `appointments|vendorId:${A},status:${A},endAt:${A}`,
      `appointments|buyerUid:${A},startAt:${D}`,
      `appointments|noShow.state:${A},noShow.answerDueAt:${A}`,
      `supportCases|status:${A},createdAt:${D}`,
      `supportCases|type:${A},status:${A},createdAt:${D}`,
    ];
    for (const order of [A, D]) {
      expected.push(
        `appointments|vendorId:${A},startAt:${order}`,
        `appointments|vendorId:${A},status:${A},startAt:${order}`,
        `appointments|vendorId:${A},branchId:${A},startAt:${order}`,
        `appointments|vendorId:${A},branchId:${A},status:${A},startAt:${order}`,
      );
    }
    for (const key of expected) expect(keys.has(key), key).toBe(true);
  });
});
