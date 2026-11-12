import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../../..");

describe("test account flag rules copy", () => {
  const rules = readFileSync(path.join(root, "firestore.rules"), "utf8");

  it("blocks owner writes of the flag on users", () => {
    const start = rules.indexOf("match /users/{uid} {");
    expect(start).toBeGreaterThan(0);
    const body = rules.slice(start, start + 900);
    expect(body).toContain("!('isTest' in request.resource.data)");
    expect(body).toContain(".affectedKeys().hasAny(['isTest'])");
  });

  it("blocks owner changes of the flag on vendors", () => {
    expect(rules).toContain(
      ".hasAny(['vendorType', 'providerProfile', 'isTest'])",
    );
  });
});
