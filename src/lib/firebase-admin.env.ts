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

export function getMissingFirebaseAdminEnvKeys(): string[] {
  const projectId = getProjectId();
  const serviceAccount = readServiceAccountFromFile();
  const hasInlineCredentials =
    Boolean(process.env.FIREBASE_CLIENT_EMAIL?.trim()) &&
    Boolean(process.env.FIREBASE_PRIVATE_KEY?.trim());
  const hasFileCredentials =
    Boolean(serviceAccount?.client_email) && Boolean(serviceAccount?.private_key);

  const missing: string[] = [];
  if (!projectId && !serviceAccount?.project_id) {
    missing.push("FIREBASE_PROJECT_ID");
  }
  if (!hasInlineCredentials && !hasFileCredentials) {
    missing.push("FIREBASE_CLIENT_EMAIL");
    missing.push("FIREBASE_PRIVATE_KEY");
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
