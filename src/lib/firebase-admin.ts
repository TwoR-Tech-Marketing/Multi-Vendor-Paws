import "server-only";

import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

import { getFirebaseAdminEnv } from "@/lib/firebase-admin.env";

let adminApp: App | null = null;

function loadFirebaseAdminAppModule() {
  // Lazy require keeps firebase-admin external on Vercel serverless.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("firebase-admin/app") as typeof import("firebase-admin/app");
}

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const { cert, getApps, initializeApp } = loadFirebaseAdminAppModule();
  const existing = getApps()[0];
  if (existing) {
    adminApp = existing;
    return existing;
  }

  const { projectId, clientEmail, privateKey } = getFirebaseAdminEnv();

  adminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  });

  return adminApp;
}

export function getAdminAuth(): Auth {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAuth } = require("firebase-admin/auth") as typeof import("firebase-admin/auth");
  return getAuth(getAdminApp());
}

export function getAdminFirestore(): Firestore {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getFirestore } = require("firebase-admin/firestore") as typeof import("firebase-admin/firestore");
  return getFirestore(getAdminApp());
}
