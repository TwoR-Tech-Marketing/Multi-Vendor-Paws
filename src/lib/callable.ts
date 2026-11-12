import { httpsCallable } from "firebase/functions";

import { ensureClientAuth } from "@/lib/client-auth";
import { firebaseFunctions } from "@/lib/firebase";

/**
 * Calls one shared Cloud Functions callable as the session user and returns
 * its raw data. Errors propagate unchanged (FirebaseError shaped).
 */
export async function invokeCallable<TResult = unknown>(
  name: string,
  payload?: unknown,
): Promise<TResult> {
  await ensureClientAuth();
  const callable = httpsCallable<unknown, TResult>(firebaseFunctions, name);
  const result = await callable(payload);
  return result.data;
}
