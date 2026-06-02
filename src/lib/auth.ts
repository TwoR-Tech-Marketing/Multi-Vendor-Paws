import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

import { firebaseAuth } from "@/lib/firebase";

export async function prepareAuthPersistence() {
  await setPersistence(firebaseAuth, browserLocalPersistence);
}

export async function signInVendor(email: string, password: string) {
  await prepareAuthPersistence();
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function signOutVendor() {
  return signOut(firebaseAuth);
}

export function subscribeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(firebaseAuth, callback);
}
