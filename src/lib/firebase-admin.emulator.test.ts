import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const adminApp = vi.hoisted(() => ({
  initializeApp: vi.fn(() => ({ name: "admin" })),
  cert: vi.fn(() => ({ kind: "cert" })),
}));

vi.mock("server-only", () => ({}));
vi.mock("firebase-admin/app", () => ({
  getApps: () => [],
  initializeApp: adminApp.initializeApp,
  cert: adminApp.cert,
}));
vi.mock("firebase-admin/auth", () => ({ getAuth: () => ({ kind: "auth" }) }));
vi.mock("firebase-admin/firestore", () => ({ getFirestore: () => ({ kind: "firestore" }) }));
vi.mock("firebase-admin/storage", () => ({ getStorage: () => ({ kind: "storage" }) }));

describe("Admin SDK initialization", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("GOOGLE_APPLICATION_CREDENTIALS", "");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "");
    vi.stubEnv("FIREBASE_STORAGE_BUCKET", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses no credential against the emulators with a demo project", async () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "demo-tenderpaws");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "");
    vi.stubEnv("FIRESTORE_EMULATOR_HOST", "127.0.0.1:8080");
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9099");
    const mod = await import("@/lib/firebase-admin");
    mod.getAdminFirestore();
    expect(adminApp.cert).not.toHaveBeenCalled();
    expect(adminApp.initializeApp).toHaveBeenCalledWith({
      projectId: "demo-tenderpaws",
      storageBucket: "demo-tenderpaws.appspot.com",
    });
    expect(mod.getDefaultStorageBucket()).toBe("demo-tenderpaws.appspot.com");
  });

  it("keeps requiring the service account without emulator hosts", async () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "demo-tenderpaws");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "");
    vi.stubEnv("FIRESTORE_EMULATOR_HOST", "");
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "");
    const mod = await import("@/lib/firebase-admin");
    expect(() => mod.getAdminFirestore()).toThrow(/FIREBASE_CLIENT_EMAIL/);
    expect(adminApp.initializeApp).not.toHaveBeenCalled();
  });

  it("initializes with the certificate as before when credentials are set", async () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "some-project");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "svc@example.test");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "key");
    vi.stubEnv("FIRESTORE_EMULATOR_HOST", "");
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "");
    const mod = await import("@/lib/firebase-admin");
    mod.getAdminFirestore();
    expect(adminApp.cert).toHaveBeenCalledTimes(1);
    expect(adminApp.initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({ credential: { kind: "cert" }, projectId: "some-project" }),
    );
  });
});
