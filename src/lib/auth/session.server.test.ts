import { beforeEach, describe, expect, it, vi } from "vitest";

import { mapSessionPreferences } from "@/shared/preferences/domain/session-preferences";

const mocks = vi.hoisted(() => ({
  callableResult: {} as Record<string, unknown>,
  resolveFails: false,
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => ({
    getUser: async () => ({ metadata: { lastSignInTime: null, creationTime: null } }),
  }),
}));
vi.mock("@/features/vendor/infrastructure/vendor-store-profile.admin.repository", () => ({
  getVendorStoreProfileAdmin: async () => null,
}));
// Same mapping as the real callable client, applied to the raw callable result.
vi.mock("@/features/auth/infrastructure/resolve-vendor-session.callable", () => ({
  resolveVendorSessionViaCallableForUid: async () => {
    if (mocks.resolveFails) throw new Error("unavailable");
    return {
      kind: "active",
      message: "",
      profile: {
        vendorId: "v1",
        ownerName: "Owner",
        email: "v1@example.test",
        storeName: "Store",
        status: "active",
        vendorType: "store",
      },
      sessionPreferences: mapSessionPreferences(mocks.callableResult),
    };
  },
}));

import { buildVendorSessionDto } from "@/lib/auth/session.server";

const verified = { uid: "v1", email: "v1@example.test" };

beforeEach(() => {
  mocks.callableResult = {};
  mocks.resolveFails = false;
});

describe("buildVendorSessionDto preferences", () => {
  it("carries stored account preferences", async () => {
    mocks.callableResult = {
      preferences: { theme: "nile", mode: "dark", language: "ar" },
      preferencesScope: "account",
      preferencesSet: true,
    };
    const dto = await buildVendorSessionDto(verified);
    expect(dto?.preferences).toEqual({ theme: "nile", mode: "dark", language: "ar" });
    expect(dto?.preferencesScope).toBe("account");
    expect(dto?.preferencesSet).toBe(true);
  });

  it("is local only without a vendors document", async () => {
    mocks.callableResult = {
      preferences: { theme: "tenderpaws", mode: "system", language: "en" },
      preferencesScope: "local",
      preferencesSet: false,
    };
    const dto = await buildVendorSessionDto(verified);
    expect(dto?.preferencesScope).toBe("local");
    expect(dto?.preferencesSet).toBe(false);
  });

  it("marks an account without stored preferences as not set, defaults filled", async () => {
    mocks.callableResult = {
      preferences: { theme: "tenderpaws", mode: "system", language: "en" },
      preferencesScope: "account",
      preferencesSet: false,
    };
    const dto = await buildVendorSessionDto(verified);
    expect(dto?.preferences).toEqual({ theme: "tenderpaws", mode: "system", language: "en" });
    expect(dto?.preferencesScope).toBe("account");
    expect(dto?.preferencesSet).toBe(false);
  });

  it("falls back to local scope and defaults when the callable omits the fields", async () => {
    const dto = await buildVendorSessionDto(verified);
    expect(dto?.preferences).toEqual({ theme: "tenderpaws", mode: "system", language: "en" });
    expect(dto?.preferencesScope).toBe("local");
    expect(dto?.preferencesSet).toBe(false);
  });

  it("fails like before when the session cannot be resolved", async () => {
    mocks.resolveFails = true;
    await expect(buildVendorSessionDto(verified)).rejects.toThrow("unavailable");
  });
});
