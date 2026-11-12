import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { invokeCallable } from "@/lib/callable";
import { ensureClientAuth } from "@/lib/client-auth";
import { firebaseStorage } from "@/lib/firebase";

/** Callable names of the `vendor_telehealth` export group (doctor side only). */
export const TELEHEALTH_CALLABLES = {
  status: "vendor_telehealth-getMyTelehealthStatus",
  setAvailability: "vendor_telehealth-setMyTelehealthAvailability",
  queue: "vendor_telehealth-listTelehealthQueue",
  accept: "vendor_telehealth-acceptTelehealthSession",
  end: "vendor_telehealth-endTelehealthSession",
  listMine: "vendor_telehealth-listMyTelehealthSessions",
  get: "vendor_telehealth-getTelehealthSession",
  messages: "vendor_telehealth-listTelehealthMessages",
  send: "vendor_telehealth-sendTelehealthMessage",
} as const;

export type TelehealthCallableName =
  (typeof TELEHEALTH_CALLABLES)[keyof typeof TELEHEALTH_CALLABLES];

/** Calls one telehealth callable and returns its raw data. Errors propagate. */
export async function invokeTelehealthCallable(
  name: TelehealthCallableName,
  payload: Record<string, unknown>,
): Promise<unknown> {
  return invokeCallable(name, payload);
}

function sanitize(fileName: string): string {
  return fileName.replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

/** Storage path checked by the Storage rule and the send callable. */
export function telehealthPhotoPath(
  sessionId: string,
  uid: string,
  fileName: string,
  nowMs: number,
): string {
  return `telehealth/${sessionId}/${uid}/${nowMs}_${sanitize(fileName)}`;
}

/** Uploads a chat photo to the sender's session folder; returns its download URL. */
export async function uploadTelehealthPhotoFile(
  sessionId: string,
  uid: string,
  file: Blob & { name: string },
): Promise<string> {
  await ensureClientAuth();
  const objectRef = ref(
    firebaseStorage,
    telehealthPhotoPath(sessionId, uid, file.name, Date.now()),
  );
  await uploadBytes(objectRef, file, { contentType: file.type });
  return getDownloadURL(objectRef);
}
