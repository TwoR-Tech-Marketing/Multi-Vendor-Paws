import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getFirebaseAdminEmulatorProjectId,
  getMissingFirebaseAdminEnvKeys,
  isFirebaseAdminEmulatorMode,
} from "@/lib/firebase-admin.env";

function clearCredentials() {
  vi.stubEnv("GOOGLE_APPLICATION_CREDENTIALS", "");
  vi.stubEnv("FIREBASE_CLIENT_EMAIL", "");
  vi.stubEnv("FIREBASE_PRIVATE_KEY", "");
  vi.stubEnv("FIREBASE_PROJECT_ID", "");
  vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "");
  vi.stubEnv("FIRESTORE_EMULATOR_HOST", "");
  vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "");
}

describe("Firebase Admin emulator mode", () => {
  beforeEach(() => {
    clearCredentials();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is active with both emulator hosts and a demo project, needing no credentials", () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "demo-tenderpaws");
    vi.stubEnv("FIRESTORE_EMULATOR_HOST", "127.0.0.1:8080");
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9099");
    expect(isFirebaseAdminEmulatorMode()).toBe(true);
    expect(getMissingFirebaseAdminEnvKeys()).toEqual([]);
    expect(getFirebaseAdminEmulatorProjectId()).toBe("demo-tenderpaws");
  });

  it("accepts the public project id when the server one is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "demo-tenderpaws");
    vi.stubEnv("FIRESTORE_EMULATOR_HOST", "127.0.0.1:8080");
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9099");
    expect(isFirebaseAdminEmulatorMode()).toBe(true);
  });

  it("stays off for a project id that is not demo-", () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "some-real-project");
    vi.stubEnv("FIRESTORE_EMULATOR_HOST", "127.0.0.1:8080");
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9099");
    expect(isFirebaseAdminEmulatorMode()).toBe(false);
    expect(getMissingFirebaseAdminEnvKeys()).toEqual([
      "FIREBASE_CLIENT_EMAIL",
      "FIREBASE_PRIVATE_KEY",
    ]);
    expect(() => getFirebaseAdminEmulatorProjectId()).toThrow();
  });

  it("stays off unless both emulator hosts are set", () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "demo-tenderpaws");
    vi.stubEnv("FIRESTORE_EMULATOR_HOST", "127.0.0.1:8080");
    expect(isFirebaseAdminEmulatorMode()).toBe(false);
    expect(getMissingFirebaseAdminEnvKeys()).toEqual([
      "FIREBASE_CLIENT_EMAIL",
      "FIREBASE_PRIVATE_KEY",
    ]);
  });

  it("still requires credentials with no emulator hosts, as before", () => {
    expect(getMissingFirebaseAdminEnvKeys()).toEqual([
      "FIREBASE_PROJECT_ID",
      "FIREBASE_CLIENT_EMAIL",
      "FIREBASE_PRIVATE_KEY",
    ]);
  });
});
