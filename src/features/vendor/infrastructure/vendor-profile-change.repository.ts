import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";

import { firestore } from "@/lib/firebase";
import type {
  VendorProfileChangePayload,
  VendorProfileChangeRequest,
} from "@/features/vendor/domain/types";

const COLLECTION = "vendor_profile_change_requests";

type ChangeRequestDoc = VendorProfileChangePayload & {
  vendorId: string;
  authUid: string;
  status: string;
  createdAt?: Timestamp;
  reviewNotes?: string;
};

function toDate(value: Timestamp | undefined): Date | null {
  if (!value?.toDate) return null;
  return value.toDate();
}

function mapChangeRequest(
  id: string,
  data: ChangeRequestDoc,
): VendorProfileChangeRequest {
  return {
    id,
    vendorId: data.vendorId,
    authUid: data.authUid,
    ownerName: data.ownerName,
    phone: data.phone,
    storeName: data.storeName,
    storeDescription: data.storeDescription,
    contactPhone: data.contactPhone,
    contactEmail: data.contactEmail,
    contactAddress: data.contactAddress,
    logoUrl: data.logoUrl ?? null,
    status: data.status as VendorProfileChangeRequest["status"],
    createdAt: toDate(data.createdAt),
    reviewNotes: data.reviewNotes,
  };
}

export async function getPendingProfileChangeRequest(
  vendorId: string,
): Promise<VendorProfileChangeRequest | null> {
  const snap = await getDocs(
    query(
      collection(firestore, COLLECTION),
      where("vendorId", "==", vendorId),
      where("status", "==", "pending"),
      limit(1),
    ),
  );

  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  return mapChangeRequest(
    docSnap.id,
    docSnap.data() as ChangeRequestDoc,
  );
}

export async function submitProfileChangeRequest(
  vendorId: string,
  authUid: string,
  payload: VendorProfileChangePayload,
): Promise<string> {
  const existing = await getPendingProfileChangeRequest(vendorId);
  if (existing) {
    throw new Error("PENDING_CHANGE_EXISTS");
  }

  const docRef = await addDoc(collection(firestore, COLLECTION), {
    vendorId,
    authUid,
    ownerName: payload.ownerName.trim(),
    phone: payload.phone.trim(),
    storeName: payload.storeName.trim(),
    storeDescription: payload.storeDescription.trim(),
    contactPhone: payload.contactPhone.trim(),
    contactEmail: payload.contactEmail.trim().toLowerCase(),
    contactAddress: payload.contactAddress.trim(),
    logoUrl: payload.logoUrl ?? null,
    status: "pending",
    createdAt: serverTimestamp(),
    reviewNotes: null,
  });

  return docRef.id;
}
