import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieValue: undefined as string | undefined,
  verifySessionCookie: vi.fn(),
  createCustomToken: vi.fn(),
  configured: true,
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "__session" && mocks.cookieValue ? { value: mocks.cookieValue } : undefined,
  }),
}));
vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => ({
    verifySessionCookie: mocks.verifySessionCookie,
    createCustomToken: mocks.createCustomToken,
  }),
}));
vi.mock("@/lib/firebase-admin.env", () => ({
  isFirebaseAdminConfigured: () => mocks.configured,
}));
vi.mock("@/features/auth/infrastructure/resolve-vendor-session.callable", () => ({
  resolveVendorSessionViaCallableForUid: vi.fn(),
}));
vi.mock("@/features/vendor/infrastructure/vendor-store-profile.admin.repository", () => ({
  getVendorStoreProfileAdmin: vi.fn(),
}));

import { POST } from "@/app/api/auth/firebase-token/route";

function request(init: RequestInit & { headers?: Record<string, string> } = {}) {
  return new Request("http://localhost/api/auth/firebase-token", { method: "POST", ...init });
}

beforeEach(() => {
  mocks.cookieValue = undefined;
  mocks.configured = true;
  mocks.verifySessionCookie.mockReset();
  mocks.createCustomToken.mockReset();
  mocks.createCustomToken.mockImplementation(async (uid: string) => `custom-${uid}`);
});

describe("POST /api/auth/firebase-token", () => {
  it("returns 401 without a session cookie", async () => {
    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(mocks.createCustomToken).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid or revoked session cookie", async () => {
    mocks.cookieValue = "bad";
    mocks.verifySessionCookie.mockRejectedValue(new Error("auth/session-cookie-revoked"));

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(mocks.verifySessionCookie).toHaveBeenCalledWith("bad", true);
    expect(mocks.createCustomToken).not.toHaveBeenCalled();
  });

  it("returns a custom token for the session uid only", async () => {
    mocks.cookieValue = "good";
    mocks.verifySessionCookie.mockResolvedValue({ uid: "v1", email: "a@example.com" });

    const response = await POST(
      request({
        body: JSON.stringify({ uid: "someone-else" }),
        headers: { "content-type": "application/json", "sec-fetch-site": "same-origin" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ token: "custom-v1", uid: "v1" });
    expect(mocks.verifySessionCookie).toHaveBeenCalledWith("good", true);
    expect(mocks.createCustomToken).toHaveBeenCalledTimes(1);
    expect(mocks.createCustomToken).toHaveBeenCalledWith("v1");
  });

  it("refuses cross-site requests", async () => {
    mocks.cookieValue = "good";
    mocks.verifySessionCookie.mockResolvedValue({ uid: "v1", email: "a@example.com" });

    const response = await POST(request({ headers: { "sec-fetch-site": "cross-site" } }));

    expect(response.status).toBe(403);
    expect(mocks.createCustomToken).not.toHaveBeenCalled();
  });

  it("returns 401 when the server is not configured", async () => {
    mocks.configured = false;
    mocks.cookieValue = "good";

    const response = await POST(request());

    expect(response.status).toBe(401);
  });

  it("returns a generic 500 when minting fails", async () => {
    mocks.cookieValue = "good";
    mocks.verifySessionCookie.mockResolvedValue({ uid: "v1", email: "a@example.com" });
    mocks.createCustomToken.mockRejectedValue(new Error("signing failed"));

    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("signing failed");
  });
});
