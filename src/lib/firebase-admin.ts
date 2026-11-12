import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

import {
  getFirebaseAdminEmulatorProjectId,
  getFirebaseAdminEnv,
  isFirebaseAdminEmulatorMode,
} from "@/lib/firebase-admin.env";

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existing = getApps()[0];
  if (existing) {
    adminApp = existing;
    return existing;
  }

  if (isFirebaseAdminEmulatorMode()) {
    // Local emulators with a demo project: no credential, never real data.
    const projectId = getFirebaseAdminEmulatorProjectId();
    adminApp = initializeApp({ projectId, storageBucket: defaultBucketFor(projectId) });
    return adminApp;
  }

  const { projectId, clientEmail, privateKey } = getFirebaseAdminEnv();
  const storageBucket = defaultBucketFor(projectId);

  adminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
    storageBucket,
  });

  return adminApp;
}

function defaultBucketFor(projectId: string): string {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    `${projectId}.appspot.com`
  );
}

/** Default Storage bucket, the same one the Admin SDK is initialized with. */
export function getDefaultStorageBucket(): string {
  const projectId = isFirebaseAdminEmulatorMode()
    ? getFirebaseAdminEmulatorProjectId()
    : getFirebaseAdminEnv().projectId;
  return defaultBucketFor(projectId);
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}
