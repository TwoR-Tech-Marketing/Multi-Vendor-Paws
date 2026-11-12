import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
  ref: vi.fn((_storage: unknown, path: string) => ({ fullPath: path })),
  uploadBytes: vi.fn(async () => undefined),
  getDownloadURL: vi.fn(async () => "https://files.example/logo.png"),
}));

vi.mock("firebase/storage", () => storage);
vi.mock("firebase/functions", () => ({ httpsCallable: vi.fn() }));
vi.mock("@/lib/firebase", () => ({ firebaseStorage: {}, firebaseFunctions: {} }));

import { uploadSignupLogo } from "@/features/auth/infrastructure/vendor-signup.service";

describe("uploadSignupLogo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uploads under vendor_signup_requests/ with a fresh id and a safe name", async () => {
    const file = new File(["x"], "my logo!.png", { type: "image/png" });

    const url = await uploadSignupLogo(file);

    expect(url).toBe("https://files.example/logo.png");
    const path = storage.ref.mock.calls[0]?.[1] ?? "";
    expect(path.startsWith("vendor_signup_requests/")).toBe(true);
    expect(path).toMatch(/^vendor_signup_requests\/[0-9a-f-]{36}\/my_logo_\.png$/);
    expect(path).not.toContain("vendor_signup_logos");
    expect(storage.uploadBytes).toHaveBeenCalledWith(
      { fullPath: path },
      file,
      { contentType: "image/png" },
    );
  });

  it("uses a different request folder for each upload", async () => {
    const file = new File(["x"], "a.png", { type: "image/png" });
    await uploadSignupLogo(file);
    await uploadSignupLogo(file);
    const [first, second] = storage.ref.mock.calls.map((call) => call[1]);
    expect(first).not.toBe(second);
  });
});
