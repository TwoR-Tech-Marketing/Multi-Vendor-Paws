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

/** How long a confirmed client uid is trusted before asking the session again. */
export const CLIENT_AUTH_RECHECK_MS = 5 * 60 * 1000;

/** Uid confirmed to match the server session, and when. */
let verifiedUid: string | null = null;
let verifiedAt = 0;
let inFlight: Promise<void> | null = null;
/** Bumped by every sign out so a sync that started before it never signs in. */
let generation = 0;

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
  const startedAt = generation;
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

  // A sign out happened while the token was on its way: do not sign back in.
  if (generation !== startedAt) throw unauthenticated();

  if (firebaseAuth.currentUser?.uid !== session.uid) {
    await setPersistence(firebaseAuth, browserSessionPersistence);
    await signInWithCustomToken(firebaseAuth, session.token);
    if (generation !== startedAt) {
      await signOut(firebaseAuth);
      throw unauthenticated();
    }
  }
  verifiedUid = session.uid;
  verifiedAt = Date.now();
}

/**
 * Makes sure the browser Firebase Auth user is the httpOnly session user
 * before a shared callable or Storage upload. The session cookie stays the
 * authority: the client user comes from a custom token minted for the
 * session uid. Concurrent callers share one request.
 */
export async function ensureClientAuth(): Promise<void> {
  const current = firebaseAuth.currentUser;
  const fresh = Date.now() - verifiedAt < CLIENT_AUTH_RECHECK_MS;
  if (current && verifiedUid && current.uid === verifiedUid && fresh) return;

  if (!inFlight) {
    const request: Promise<void> = syncWithSession().finally(() => {
      if (inFlight === request) inFlight = null;
    });
    inFlight = request;
  }
  return inFlight;
}

/** Signs the browser Firebase user out and forgets the verified session uid. */
export async function clearClientAuth(): Promise<void> {
  generation += 1;
  verifiedUid = null;
  verifiedAt = 0;
  inFlight = null;
  await signOut(firebaseAuth);
}

/** Test helper: resets module state between cases. */
export function resetClientAuthStateForTests(): void {
  verifiedUid = null;
  verifiedAt = 0;
  inFlight = null;
  generation = 0;
}
