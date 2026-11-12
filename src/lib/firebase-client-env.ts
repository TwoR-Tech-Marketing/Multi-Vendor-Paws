/**
 * Browser Firebase configuration, read with literal `process.env.NEXT_PUBLIC_*`
 * member expressions so Next.js inlines them into the client bundle.
 * Pure: no Firebase imports, safe on the server, the edge and in tests.
 */

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

export type FirebaseEmulatorHosts = {
  auth?: string;
  firestore?: string;
  functions?: string;
  storage?: string;
};

type ConfigEntry = {
  key: keyof FirebaseClientConfig;
  /** Variable name suffix after the public Firebase prefix. */
  suffix: string;
  value: string | undefined;
};

function readConfigEntries(): ConfigEntry[] {
  return [
    { key: "apiKey", suffix: "API_KEY", value: process.env.NEXT_PUBLIC_FIREBASE_API_KEY },
    { key: "authDomain", suffix: "AUTH_DOMAIN", value: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN },
    { key: "projectId", suffix: "PROJECT_ID", value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID },
    {
      key: "storageBucket",
      suffix: "STORAGE_BUCKET",
      value: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    },
    {
      key: "messagingSenderId",
      suffix: "MESSAGING_SENDER_ID",
      value: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    },
    { key: "appId", suffix: "APP_ID", value: process.env.NEXT_PUBLIC_FIREBASE_APP_ID },
  ];
}

function variableName(suffix: string): string {
  return `NEXT_PUBLIC_FIREBASE_${suffix}`;
}

function clean(value: string | undefined): string {
  return value?.trim() ?? "";
}

/** Names (never values) of the required browser Firebase variables that are missing or blank. */
export function getMissingFirebaseClientEnvKeys(): string[] {
  return readConfigEntries()
    .filter((entry) => clean(entry.value) === "")
    .map((entry) => variableName(entry.suffix));
}

export function isFirebaseClientConfigured(): boolean {
  return getMissingFirebaseClientEnvKeys().length === 0;
}

/** The complete browser config, or null when any required variable is missing. */
export function getFirebaseClientConfig(): FirebaseClientConfig | null {
  const entries = readConfigEntries();
  if (entries.some((entry) => clean(entry.value) === "")) return null;
  return Object.fromEntries(
    entries.map((entry) => [entry.key, clean(entry.value)]),
  ) as FirebaseClientConfig;
}

/** Emulator hosts for the browser SDKs. Empty object when none is set. */
export function getFirebaseEmulatorHosts(): FirebaseEmulatorHosts {
  const hosts: FirebaseEmulatorHosts = {};
  const auth = clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST);
  const firestore = clean(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST);
  const functions = clean(process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST);
  const storage = clean(process.env.NEXT_PUBLIC_STORAGE_EMULATOR_HOST);
  if (auth) hosts.auth = auth;
  if (firestore) hosts.firestore = firestore;
  if (functions) hosts.functions = functions;
  if (storage) hosts.storage = storage;
  return hosts;
}

export function hasFirebaseEmulatorHosts(hosts: FirebaseEmulatorHosts): boolean {
  return Object.keys(hosts).length > 0;
}

/** Emulator use is only allowed for demo projects, which can never reach real data. */
export function isDemoProjectId(projectId: string | undefined): boolean {
  return clean(projectId).startsWith("demo-");
}

/** Splits "127.0.0.1:9099" into host and port. Throws on a malformed value. */
export function parseEmulatorHost(value: string): { host: string; port: number } {
  const index = value.lastIndexOf(":");
  const host = index > 0 ? value.slice(0, index) : "";
  const port = Number(index > 0 ? value.slice(index + 1) : NaN);
  if (!host || !Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("Firebase emulator host must look like host:port.");
  }
  return { host, port };
}
