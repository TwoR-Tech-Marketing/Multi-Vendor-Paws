import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getFirebaseClientConfig,
  getFirebaseEmulatorHosts,
  getMissingFirebaseClientEnvKeys,
  hasFirebaseEmulatorHosts,
  isDemoProjectId,
  isFirebaseClientConfigured,
  parseEmulatorHost,
} from "@/lib/firebase-client-env";

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

function stubComplete() {
  for (const name of REQUIRED) vi.stubEnv(name, `value-for-${name.toLowerCase()}`);
}

describe("firebase client env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lists every required variable by name when all are missing", () => {
    for (const name of REQUIRED) vi.stubEnv(name, undefined);
    expect(getMissingFirebaseClientEnvKeys()).toEqual(REQUIRED);
    expect(isFirebaseClientConfigured()).toBe(false);
    expect(getFirebaseClientConfig()).toBeNull();
  });

  it("returns no names and a full config when everything is set", () => {
    stubComplete();
    expect(getMissingFirebaseClientEnvKeys()).toEqual([]);
    expect(isFirebaseClientConfigured()).toBe(true);
    expect(getFirebaseClientConfig()).toMatchObject({
      apiKey: "value-for-next_public_firebase_api_key",
      projectId: "value-for-next_public_firebase_project_id",
    });
  });

  it("treats whitespace-only values as missing and trims real values", () => {
    stubComplete();
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_APP_ID", "   ");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "  key  ");
    expect(getMissingFirebaseClientEnvKeys()).toEqual(["NEXT_PUBLIC_FIREBASE_APP_ID"]);
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_APP_ID", "app");
    expect(getFirebaseClientConfig()?.apiKey).toBe("key");
  });

  it("never returns values, only names", () => {
    stubComplete();
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "");
    const missing = getMissingFirebaseClientEnvKeys();
    expect(missing).toEqual(["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"]);
    expect(missing.join(" ")).not.toContain("value-for");
  });

  it("reads emulator hosts and reports none when unset", () => {
    for (const name of EMULATORS) vi.stubEnv(name, "");
    expect(getFirebaseEmulatorHosts()).toEqual({});
    expect(hasFirebaseEmulatorHosts(getFirebaseEmulatorHosts())).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9099");
    vi.stubEnv("NEXT_PUBLIC_STORAGE_EMULATOR_HOST", " 127.0.0.1:9199 ");
    expect(getFirebaseEmulatorHosts()).toEqual({
      auth: "127.0.0.1:9099",
      storage: "127.0.0.1:9199",
    });
  });

  it("accepts only demo project ids", () => {
    expect(isDemoProjectId("demo-tenderpaws")).toBe(true);
    expect(isDemoProjectId("my-real-project")).toBe(false);
    expect(isDemoProjectId("")).toBe(false);
    expect(isDemoProjectId(undefined)).toBe(false);
  });

  it("parses host and port", () => {
    expect(parseEmulatorHost("127.0.0.1:8080")).toEqual({ host: "127.0.0.1", port: 8080 });
    expect(() => parseEmulatorHost("127.0.0.1")).toThrow();
    expect(() => parseEmulatorHost(":8080")).toThrow();
    expect(() => parseEmulatorHost("localhost:abc")).toThrow();
  });
});
