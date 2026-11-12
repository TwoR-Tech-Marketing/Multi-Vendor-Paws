import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: null as unknown,
  configured: true,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/firebase-admin.env", () => ({
  isFirebaseAdminConfigured: () => mocks.configured,
}));
vi.mock("@/lib/auth/session.server", () => ({
  getVendorSessionFromCookies: async () => mocks.session,
}));

import { GET } from "@/app/api/auth/me/route";

beforeEach(() => {
  mocks.session = null;
  mocks.configured = true;
});

describe("GET /api/auth/me", () => {
  it("clears an invalid or expired session cookie", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
    const cookie = res.cookies.get("__session");
    expect(cookie?.value).toBe("");
    expect(cookie?.maxAge).toBe(0);
  });

  it("returns the session and keeps the cookie when it is valid", async () => {
    mocks.session = { uid: "vendor_1", sessionKind: "active" };
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.cookies.get("__session")).toBeUndefined();
    await expect(res.json()).resolves.toEqual({ session: mocks.session });
  });

  it("adds the account preferences to the response", async () => {
    const preferences = { theme: "nile", mode: "system", language: "ar" };
    mocks.session = {
      uid: "vendor_1",
      sessionKind: "active",
      preferences,
      preferencesScope: "account",
    };
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.preferences).toEqual(preferences);
    expect(body.session.preferences).toEqual(preferences);
    expect(body.session.preferencesScope).toBe("account");
  });
});
