import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import type {
  VendorProfileChangePayload,
  VendorProfileChangeRequest,
} from "@/features/vendor/domain/types";
import { getAdminFirestore } from "@/lib/firebase-admin";

const COLLECTION = "vendor_profile_change_requests";

type ChangeRequestDoc = VendorProfileChangePayload & {
  vendorId: string;
  authUid: string;
  status: string;
  createdAt?: FirebaseFirestore.Timestamp;
  reviewNotes?: string;
};

function toDate(value: FirebaseFirestore.Timestamp | undefined): Date | null {
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

export async function getPendingProfileChangeRequestAdmin(
  vendorId: string,
): Promise<VendorProfileChangeRequest | null> {
  const snap = await getAdminFirestore()
    .collection(COLLECTION)
    .where("vendorId", "==", vendorId)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  return mapChangeRequest(docSnap.id, docSnap.data() as ChangeRequestDoc);
}

export async function submitProfileChangeRequestAdmin(
  vendorId: string,
  authUid: string,
  payload: VendorProfileChangePayload,
): Promise<string> {
  const existing = await getPendingProfileChangeRequestAdmin(vendorId);
  if (existing) {
    throw new Error("PENDING_CHANGE_EXISTS");
  }

  const docRef = await getAdminFirestore().collection(COLLECTION).add({
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
    createdAt: FieldValue.serverTimestamp(),
    reviewNotes: null,
  });

  return docRef.id;
}
