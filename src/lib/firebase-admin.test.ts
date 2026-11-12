import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/firebase-admin.env", () => ({
  getFirebaseAdminEnv: () => ({ projectId: "demo-project", clientEmail: "x", privateKey: "y" }),
}));

import { getDefaultStorageBucket } from "@/lib/firebase-admin";

describe("getDefaultStorageBucket", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the configured bucket", () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "demo-project.firebasestorage.app");
    expect(getDefaultStorageBucket()).toBe("demo-project.firebasestorage.app");
  });

  it("falls back to the project bucket the Admin SDK uses, never to any bucket", () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "");
    vi.stubEnv("FIREBASE_STORAGE_BUCKET", "");
    expect(getDefaultStorageBucket()).toBe("demo-project.appspot.com");
  });
});
