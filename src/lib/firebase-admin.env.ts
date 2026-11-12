import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type ServiceAccountJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }
  return value;
}

function getProjectId(): string | undefined {
  return (
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()
  );
}

function getServiceAccountJsonPath(): string | null {
  const rawPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!rawPath) return null;

  const absolutePath = resolve(process.cwd(), rawPath);
  return existsSync(absolutePath) ? absolutePath : null;
}

function readServiceAccountFromFile(): ServiceAccountJson | null {
  const jsonPath = getServiceAccountJsonPath();
  if (!jsonPath) return null;

  try {
    return JSON.parse(readFileSync(jsonPath, "utf8")) as ServiceAccountJson;
  } catch {
    return null;
  }
}

/**
 * True only when the Firestore, Auth and Storage emulator hosts are all set
 * and the project id is a demo project. Then the Admin SDK runs without
 * credentials against the local emulators. Nothing is relaxed when a host is
 * absent.
 */
export function isFirebaseAdminEmulatorMode(): boolean {
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST?.trim();
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST?.trim();
  const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST?.trim();
  if (!firestoreHost || !authHost || !storageHost) return false;
  return (getProjectId() ?? "").startsWith("demo-");
}

/** Demo project id used in emulator mode. Throws outside emulator mode. */
export function getFirebaseAdminEmulatorProjectId(): string {
  const projectId = getProjectId();
  if (!isFirebaseAdminEmulatorMode() || !projectId) {
    throw new Error("Firebase Admin emulator mode is not active.");
  }
  return projectId;
}

export function getMissingFirebaseAdminEnvKeys(): string[] {
  if (isFirebaseAdminEmulatorMode()) return [];

  const projectId = getProjectId();
  const serviceAccount = readServiceAccountFromFile();
  const hasClientEmail = Boolean(process.env.FIREBASE_CLIENT_EMAIL?.trim());
  const hasPrivateKey = Boolean(process.env.FIREBASE_PRIVATE_KEY?.trim());
  const hasInlineCredentials = hasClientEmail && hasPrivateKey;
  const hasFileCredentials =
    Boolean(serviceAccount?.client_email) && Boolean(serviceAccount?.private_key);

  const missing: string[] = [];
  if (!projectId && !serviceAccount?.project_id) {
    missing.push("FIREBASE_PROJECT_ID");
  }
  if (!hasInlineCredentials && !hasFileCredentials) {
    if (!hasClientEmail && !serviceAccount?.client_email) {
      missing.push("FIREBASE_CLIENT_EMAIL");
    }
    if (!hasPrivateKey && !serviceAccount?.private_key) {
      missing.push("FIREBASE_PRIVATE_KEY");
    }
  }
  return missing;
}

export function isFirebaseAdminConfigured(): boolean {
  return getMissingFirebaseAdminEnvKeys().length === 0;
}

export function getFirebaseAdminEnv() {
  const serviceAccount = readServiceAccountFromFile();
  if (serviceAccount?.client_email && serviceAccount.private_key) {
    return {
      projectId:
        serviceAccount.project_id ??
        getProjectId() ??
        requireEnv("FIREBASE_PROJECT_ID"),
      clientEmail: serviceAccount.client_email,
      privateKey: normalizePrivateKey(serviceAccount.private_key),
    };
  }

  const projectId = getProjectId();
  if (!projectId) {
    throw new Error("Missing required server environment variable: FIREBASE_PROJECT_ID");
  }

  return {
    projectId,
    clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
    privateKey: normalizePrivateKey(requireEnv("FIREBASE_PRIVATE_KEY")),
  };
}

function normalizePrivateKey(raw: string): string {
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  return trimmed.replace(/\\n/g, "\n");
}

export function getFirebaseAdminSetupMessage(): string {
  const missing = getMissingFirebaseAdminEnvKeys();
  if (missing.length === 0) return "";

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (credPath && !getServiceAccountJsonPath()) {
    return `Firebase Admin is not configured. GOOGLE_APPLICATION_CREDENTIALS points to "${credPath}" but the file was not found. Download a service account JSON from Firebase Console → Project Settings → Service accounts → Generate new private key, save it at that path, and restart npm run dev. See docs/production-security.md.`;
  }

  return `Firebase Admin is not configured. Either set GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json and place the downloaded JSON there, or add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to .env.local. Get credentials from Firebase Console → Project Settings → Service accounts → Generate new private key. See docs/production-security.md.`;
}
