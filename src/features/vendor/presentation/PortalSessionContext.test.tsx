import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signOutVendor: vi.fn(async () => undefined),
  fetchCurrentSession: vi.fn(),
  logoutServerSession: vi.fn(),
  goOfflineQuietly: vi.fn(async () => undefined),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/lib/auth", () => ({ signOutVendor: mocks.signOutVendor }));
vi.mock("@/lib/auth-client", () => ({
  fetchCurrentSession: mocks.fetchCurrentSession,
  logoutServerSession: mocks.logoutServerSession,
}));
vi.mock("@/features/telehealth/application/telehealth.api", () => ({
  goOfflineQuietly: mocks.goOfflineQuietly,
}));

import {
  endPortalSession,
  loadPortalSession,
} from "@/features/vendor/presentation/PortalSessionContext";

beforeEach(() => {
  mocks.signOutVendor.mockReset();
  mocks.signOutVendor.mockResolvedValue(undefined);
  mocks.fetchCurrentSession.mockReset();
  mocks.logoutServerSession.mockReset();
  mocks.goOfflineQuietly.mockClear();
});

describe("loadPortalSession", () => {
  it("signs the client user out when there is no server session", async () => {
    mocks.fetchCurrentSession.mockResolvedValue(null);

    expect(await loadPortalSession()).toBeNull();
    expect(mocks.signOutVendor).toHaveBeenCalledTimes(1);
  });

  it("keeps the client user when the server session exists", async () => {
    const dto = { user: { uid: "v1" } };
    mocks.fetchCurrentSession.mockResolvedValue(dto);

    expect(await loadPortalSession()).toBe(dto);
    expect(mocks.signOutVendor).not.toHaveBeenCalled();
  });

  it("still returns null when the client sign out fails", async () => {
    mocks.fetchCurrentSession.mockResolvedValue(null);
    mocks.signOutVendor.mockRejectedValue(new Error("offline"));

    expect(await loadPortalSession()).toBeNull();
  });
});

describe("endPortalSession", () => {
  it("signs the client user out after the server logout", async () => {
    mocks.logoutServerSession.mockResolvedValue(undefined);

    await endPortalSession(false);

    expect(mocks.logoutServerSession).toHaveBeenCalledTimes(1);
    expect(mocks.signOutVendor).toHaveBeenCalledTimes(1);
    expect(mocks.logoutServerSession.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.signOutVendor.mock.invocationCallOrder[0],
    );
    expect(mocks.goOfflineQuietly).not.toHaveBeenCalled();
  });

  it("signs the client user out even when the server logout fails", async () => {
    mocks.logoutServerSession.mockRejectedValue(new Error("500"));

    await expect(endPortalSession(false)).rejects.toThrow("500");
    expect(mocks.signOutVendor).toHaveBeenCalledTimes(1);
  });

  it("takes a doctor offline before ending the session", async () => {
    mocks.logoutServerSession.mockResolvedValue(undefined);

    await endPortalSession(true);

    expect(mocks.goOfflineQuietly).toHaveBeenCalledTimes(1);
    expect(mocks.signOutVendor).toHaveBeenCalledTimes(1);
  });
});
