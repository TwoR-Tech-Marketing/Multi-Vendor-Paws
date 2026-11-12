import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureClientAuth: vi.fn(async () => undefined),
  ref: vi.fn((_storage: unknown, path: string) => ({ path })),
  uploadBytes: vi.fn(async () => undefined),
  getDownloadURL: vi.fn(async () => "https://example.com/file"),
}));

vi.mock("@/lib/client-auth", () => ({ ensureClientAuth: mocks.ensureClientAuth }));
vi.mock("@/lib/firebase", () => ({ firebaseStorage: {} }));
vi.mock("firebase/storage", () => ({
  ref: mocks.ref,
  uploadBytes: mocks.uploadBytes,
  getDownloadURL: mocks.getDownloadURL,
}));

import { uploadVendorProfileLogo } from "@/features/vendor/infrastructure/vendor-logo.storage";
import { uploadVendorProviderPhoto } from "@/features/vendor/infrastructure/vendor-photos.storage";

beforeEach(() => {
  mocks.ensureClientAuth.mockClear();
  mocks.uploadBytes.mockClear();
});

describe("vendor storage uploads", () => {
  const file = new File(["x"], "a.png", { type: "image/png" });

  it("signs the client in from the session before uploading a logo", async () => {
    await uploadVendorProfileLogo("v1", file);

    expect(mocks.ensureClientAuth).toHaveBeenCalledTimes(1);
    expect(mocks.ensureClientAuth.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.uploadBytes.mock.invocationCallOrder[0],
    );
  });

  it("signs the client in from the session before uploading a provider photo", async () => {
    await uploadVendorProviderPhoto("v1", file);

    expect(mocks.ensureClientAuth).toHaveBeenCalledTimes(1);
    expect(mocks.ensureClientAuth.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.uploadBytes.mock.invocationCallOrder[0],
    );
  });

  it("does not upload when there is no session", async () => {
    mocks.ensureClientAuth.mockRejectedValueOnce({ code: "functions/unauthenticated" });

    await expect(uploadVendorProfileLogo("v1", file)).rejects.toMatchObject({
      code: "functions/unauthenticated",
    });
    expect(mocks.uploadBytes).not.toHaveBeenCalled();
  });
});
