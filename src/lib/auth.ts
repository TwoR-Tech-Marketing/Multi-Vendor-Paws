import {
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth";

import { clearClientAuth } from "@/lib/client-auth";
import { firebaseAuth } from "@/lib/firebase";

export async function prepareAuthPersistence() {
  await setPersistence(firebaseAuth, browserSessionPersistence);
}

export async function signInVendor(email: string, password: string) {
  await prepareAuthPersistence();
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

/** Sign in briefly to obtain an ID token for server session exchange. */
export async function signInVendorForIdToken(
  email: string,
  password: string,
): Promise<string> {
  const credential = await signInVendor(email, password);
  return credential.user.getIdToken(true);
}

/** Signs the browser Firebase user out; the httpOnly session is untouched. */
export async function signOutVendor() {
  return clearClientAuth();
}

export function subscribeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(firebaseAuth, callback);
}
