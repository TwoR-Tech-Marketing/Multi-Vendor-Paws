import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import type {
  VendorProfileChangePayload,
  VendorProfileChangeRequest,
} from "@/features/vendor/domain/types";
import { getAdminFirestore } from "@/lib/firebase-admin";

const COLLECTION = "vendor_profile_change_requests";
const VENDORS_COLLECTION = "vendors";
const USERS_COLLECTION = "users";

type ChangeRequestDoc = VendorProfileChangePayload & {
  vendorId: string;
  authUid: string;
  status: string;
  createdAt?: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
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
    reviewedAt: toDate(data.reviewedAt),
    reviewedBy: data.reviewedBy ?? null,
    reviewNotes: data.reviewNotes ?? null,
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

export async function getLatestRejectedProfileChangeRequestAdmin(
  vendorId: string,
): Promise<VendorProfileChangeRequest | null> {
  const snap = await getAdminFirestore()
    .collection(COLLECTION)
    .where("vendorId", "==", vendorId)
    .where("status", "==", "rejected")
    .get();

  if (snap.empty) return null;

  const sorted = snap.docs
    .map((docSnap) => mapChangeRequest(docSnap.id, docSnap.data() as ChangeRequestDoc))
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));

  return sorted[0] ?? null;
}

export async function getProfileChangeRequestByIdAdmin(
  requestId: string,
): Promise<VendorProfileChangeRequest | null> {
  const snap = await getAdminFirestore().collection(COLLECTION).doc(requestId).get();
  if (!snap.exists) return null;
  return mapChangeRequest(snap.id, snap.data() as ChangeRequestDoc);
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
    reviewedAt: null,
    reviewedBy: null,
    reviewNotes: null,
  });

  return docRef.id;
}

export async function reviewProfileChangeRequestAdmin(input: {
  requestId: string;
  decision: "approve" | "reject";
  reviewNotes: string | null;
  reviewerUid: string;
}): Promise<VendorProfileChangeRequest> {
  const db = getAdminFirestore();
  const requestRef = db.collection(COLLECTION).doc(input.requestId);

  return db.runTransaction(async (tx) => {
    const requestSnap = await tx.get(requestRef);
    if (!requestSnap.exists) {
      throw new Error("REQUEST_NOT_FOUND");
    }

    const request = mapChangeRequest(requestSnap.id, requestSnap.data() as ChangeRequestDoc);
    if (request.status !== "pending") {
      throw new Error("REQUEST_NOT_PENDING");
    }

    const now = Timestamp.now();
    const reviewNotes = input.reviewNotes?.trim() || null;

    if (input.decision === "approve") {
      const vendorRef = db.collection(VENDORS_COLLECTION).doc(request.vendorId);
      const userRef = db.collection(USERS_COLLECTION).doc(request.authUid);

      tx.set(
        vendorRef,
        {
          ownerName: request.ownerName,
          phone: request.phone,
          storeName: request.storeName,
          storeDescription: request.storeDescription,
          contactPhone: request.contactPhone,
          contactEmail: request.contactEmail,
          contactAddress: request.contactAddress,
          logoUrl: request.logoUrl ?? null,
          updatedAt: now,
        },
        { merge: true },
      );

      tx.set(
        userRef,
        {
          ownerName: request.ownerName,
          phone: request.phone,
          updatedAt: now,
        },
        { merge: true },
      );
    }

    tx.update(requestRef, {
      status: input.decision === "approve" ? "approved" : "rejected",
      reviewedAt: now,
      reviewedBy: input.reviewerUid,
      reviewNotes,
    });

    return {
      ...request,
      status: input.decision === "approve" ? "approved" : "rejected",
      reviewedAt: now.toDate(),
      reviewedBy: input.reviewerUid,
      reviewNotes,
    };
  });
}
