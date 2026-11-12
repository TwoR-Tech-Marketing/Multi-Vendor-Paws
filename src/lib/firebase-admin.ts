import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

import { getFirebaseAdminEnv } from "@/lib/firebase-admin.env";

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existing = getApps()[0];
  if (existing) {
    adminApp = existing;
    return existing;
  }

  const { projectId, clientEmail, privateKey } = getFirebaseAdminEnv();
  const storageBucket = getDefaultStorageBucket() || `${projectId}.appspot.com`;

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

/** Default Storage bucket from the environment, or null when not set. */
export function getDefaultStorageBucket(): string | null {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    null
  );
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
