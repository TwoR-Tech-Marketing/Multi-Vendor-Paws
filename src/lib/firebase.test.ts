import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  initializeApp: vi.fn(() => ({ name: "app" })),
  connectAuthEmulator: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
  connectFunctionsEmulator: vi.fn(),
  connectStorageEmulator: vi.fn(),
}));

vi.mock("firebase/app", () => ({
  getApps: () => [],
  getApp: () => ({ name: "app" }),
  initializeApp: sdk.initializeApp,
}));
vi.mock("firebase/auth", () => ({
  getAuth: () => ({ kind: "auth" }),
  connectAuthEmulator: sdk.connectAuthEmulator,
}));
vi.mock("firebase/firestore", () => ({
  getFirestore: () => ({ kind: "firestore" }),
  connectFirestoreEmulator: sdk.connectFirestoreEmulator,
}));
vi.mock("firebase/functions", () => ({
  getFunctions: () => ({ kind: "functions" }),
  connectFunctionsEmulator: sdk.connectFunctionsEmulator,
}));
vi.mock("firebase/storage", () => ({
  getStorage: () => ({ kind: "storage" }),
  connectStorageEmulator: sdk.connectStorageEmulator,
}));

const REQUIRED = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];
const EMULATORS = [
  "NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST",
  "NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST",
  "NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST",
  "NEXT_PUBLIC_STORAGE_EMULATOR_HOST",
];
const FLAG = Symbol.for("multi-vendor-paws.firebase.emulatorsConnected");

function stubConfig(projectId: string) {
  for (const name of REQUIRED) vi.stubEnv(name, "x");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", projectId);
}

function stubEmulators() {
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9099");
  vi.stubEnv("NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST", "127.0.0.1:8080");
  vi.stubEnv("NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST", "127.0.0.1:5001");
  vi.stubEnv("NEXT_PUBLIC_STORAGE_EMULATOR_HOST", "127.0.0.1:9199");
}

describe("firebase client module", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete (globalThis as Record<symbol, unknown>)[FLAG];
    for (const name of EMULATORS) vi.stubEnv(name, "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("imports without throwing when the variables are missing", async () => {
    for (const name of REQUIRED) vi.stubEnv(name, "");
    const mod = await import("@/lib/firebase");
    expect(sdk.initializeApp).not.toHaveBeenCalled();
    expect(() => (mod.firebaseAuth as unknown as { currentUser: unknown }).currentUser).toThrow(
      /not configured/,
    );
  });

  it("initializes as before and never touches emulators when no host is set", async () => {
    stubConfig("some-project");
    const mod = await import("@/lib/firebase");
    expect(sdk.initializeApp).toHaveBeenCalledTimes(1);
    expect(mod.firebaseFunctions).toEqual({ kind: "functions" });
    expect(sdk.connectAuthEmulator).not.toHaveBeenCalled();
    expect(sdk.connectFirestoreEmulator).not.toHaveBeenCalled();
    expect(sdk.connectFunctionsEmulator).not.toHaveBeenCalled();
    expect(sdk.connectStorageEmulator).not.toHaveBeenCalled();
  });

  it("connects every SDK to its emulator once for a demo project", async () => {
    stubConfig("demo-tenderpaws");
    stubEmulators();
    await import("@/lib/firebase");
    vi.resetModules();
    await import("@/lib/firebase");
    expect(sdk.connectAuthEmulator).toHaveBeenCalledTimes(1);
    expect(sdk.connectAuthEmulator).toHaveBeenCalledWith(
      { kind: "auth" },
      "http://127.0.0.1:9099",
      { disableWarnings: true },
    );
    expect(sdk.connectFirestoreEmulator).toHaveBeenCalledTimes(1);
    expect(sdk.connectFirestoreEmulator).toHaveBeenCalledWith(
      { kind: "firestore" },
      "127.0.0.1",
      8080,
    );
    expect(sdk.connectFunctionsEmulator).toHaveBeenCalledWith(
      { kind: "functions" },
      "127.0.0.1",
      5001,
    );
    expect(sdk.connectStorageEmulator).toHaveBeenCalledWith({ kind: "storage" }, "127.0.0.1", 9199);
  });

  it("refuses emulator hosts with a project id that is not demo-", async () => {
    stubConfig("some-project");
    vi.stubEnv("NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST", "127.0.0.1:5001");
    await expect(import("@/lib/firebase")).rejects.toThrow(/demo-/);
    expect(sdk.initializeApp).not.toHaveBeenCalled();
    expect(sdk.connectFunctionsEmulator).not.toHaveBeenCalled();
  });
});
