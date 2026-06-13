import {
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

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

export async function signOutVendor() {
  return signOut(firebaseAuth);
}

export function subscribeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(firebaseAuth, callback);
}
