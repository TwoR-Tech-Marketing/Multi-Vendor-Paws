import { describe, expect, it } from "vitest";

import { portalSessionBodySchema } from "@/features/auth/domain/session-body";

describe("portalSessionBodySchema", () => {
  it("accepts a non-empty id token", () => {
    expect(portalSessionBodySchema.parse({ idToken: "token" })).toEqual({
      idToken: "token",
    });
  });

  it("rejects a missing or empty id token", () => {
    expect(portalSessionBodySchema.safeParse({}).success).toBe(false);
    expect(portalSessionBodySchema.safeParse({ idToken: "" }).success).toBe(false);
    expect(portalSessionBodySchema.safeParse({ idToken: 1 }).success).toBe(false);
  });
});
