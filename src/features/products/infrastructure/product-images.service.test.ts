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

import { uploadProductImage } from "@/features/products/infrastructure/product-images.service";

beforeEach(() => {
  mocks.ensureClientAuth.mockClear();
  mocks.uploadBytes.mockClear();
});

describe("uploadProductImage", () => {
  it("signs the client in from the session before uploading", async () => {
    const file = new File(["x"], "a.png", { type: "image/png" });

    await uploadProductImage("v1", "p1", file);

    expect(mocks.ensureClientAuth).toHaveBeenCalledTimes(1);
    expect(mocks.ensureClientAuth.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.uploadBytes.mock.invocationCallOrder[0],
    );
  });
});
