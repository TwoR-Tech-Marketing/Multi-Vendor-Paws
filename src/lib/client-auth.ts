import { FirebaseError } from "firebase/app";
import {
  browserSessionPersistence,
  setPersistence,
  signInWithCustomToken,
  signOut,
} from "firebase/auth";

import { firebaseAuth } from "@/lib/firebase";

/** Server route that mints a custom token for the httpOnly session uid. */
export const FIREBASE_TOKEN_PATH = "/api/auth/firebase-token";

type FirebaseTokenResponse = {
  token: string;
  uid: string;
};

/** Uid confirmed to match the server session in this page load. */
let verifiedUid: string | null = null;
let inFlight: Promise<void> | null = null;

function unauthenticated(): FirebaseError {
  return new FirebaseError("functions/unauthenticated", "Session is missing or expired.");
}

function isTokenResponse(value: unknown): value is FirebaseTokenResponse {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.token === "string" &&
    record.token.length > 0 &&
    typeof record.uid === "string" &&
    record.uid.length > 0
  );
}

async function fetchSessionToken(): Promise<FirebaseTokenResponse> {
  const response = await fetch(FIREBASE_TOKEN_PATH, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
  });

  if (response.status === 401) {
    throw unauthenticated();
  }
  if (!response.ok) {
    throw new FirebaseError("functions/internal", "Session token request failed.");
  }

  const data: unknown = await response.json();
  if (!isTokenResponse(data)) {
    throw new FirebaseError("functions/internal", "Session token response was invalid.");
  }
  return data;
}

async function syncWithSession(): Promise<void> {
  await firebaseAuth.authStateReady();

  let session: FirebaseTokenResponse;
  try {
    session = await fetchSessionToken();
  } catch (error) {
    // No valid server session: never leave a client user from another account.
    if (error instanceof FirebaseError && error.code === "functions/unauthenticated") {
      await clearClientAuth();
    }
    throw error;
  }

  if (firebaseAuth.currentUser?.uid !== session.uid) {
    await setPersistence(firebaseAuth, browserSessionPersistence);
    await signInWithCustomToken(firebaseAuth, session.token);
  }
  verifiedUid = session.uid;
}

/**
 * Makes sure the browser Firebase Auth user is the httpOnly session user
 * before a shared callable or Storage upload. The session cookie stays the
 * authority: the client user comes from a custom token minted for the
 * session uid. Concurrent callers share one request.
 */
export async function ensureClientAuth(): Promise<void> {
  const current = firebaseAuth.currentUser;
  if (current && verifiedUid && current.uid === verifiedUid) return;

  if (!inFlight) {
    inFlight = syncWithSession().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

/** Signs the browser Firebase user out and forgets the verified session uid. */
export async function clearClientAuth(): Promise<void> {
  verifiedUid = null;
  await signOut(firebaseAuth);
}

/** Test helper: resets module state between cases. */
export function resetClientAuthStateForTests(): void {
  verifiedUid = null;
  inFlight = null;
}
