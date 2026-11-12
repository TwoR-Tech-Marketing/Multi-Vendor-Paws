import { NextResponse } from "next/server";

import type {
  VendorProfileChangeRequest,
  VendorStoreProfile,
} from "@/features/vendor/domain/types";
import { profileChangeSchema } from "@/features/vendor/domain/profile-change-schema";
import {
  getLatestRejectedProfileChangeRequestAdmin,
  getPendingProfileChangeRequestAdmin,
  submitProfileChangeRequestAdmin,
} from "@/features/vendor/infrastructure/vendor-profile-change.admin.repository";
import { getVendorStoreProfileAdmin } from "@/features/vendor/infrastructure/vendor-store-profile.admin.repository";
import { apiForbidden, apiGenericError, apiUnauthorized } from "@/lib/api/response";
import { getVendorApiContext } from "@/lib/auth/require-vendor-api";
import { getDefaultStorageBucket } from "@/lib/firebase-admin";
import { Strings } from "@/constants/strings";

function serializeProfile(profile: VendorStoreProfile) {
  return {
    ...profile,
    createdAt: profile.createdAt?.toISOString() ?? null,
    updatedAt: profile.updatedAt?.toISOString() ?? null,
    restrictionExpiresAt: profile.restrictionExpiresAt?.toISOString() ?? null,
  };
}

function serializeChangeRequest(request: VendorProfileChangeRequest) {
  return {
    ...request,
    createdAt: request.createdAt?.toISOString() ?? null,
    reviewedAt: request.reviewedAt?.toISOString() ?? null,
  };
}

function sendsProviderPhotos(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const provider = (body as { providerProfile?: unknown }).providerProfile;
  return !!provider && typeof provider === "object" && "photoUrls" in provider;
}

/** Stored photos stay valid; new ones must sit in the vendor's photos folder. */
async function loadPhotoOwner(uid: string, email: string) {
  const stored = await getVendorStoreProfileAdmin(uid, email);
  return {
    vendorId: uid,
    storedUrls: stored?.providerProfile?.photoUrls ?? [],
    bucket: getDefaultStorageBucket(),
  };
}

export async function GET() {
  const context = await getVendorApiContext();
  if (!context) return apiUnauthorized();

  try {
    const [profile, pendingChange, lastRejectedChange] = await Promise.all([
      getVendorStoreProfileAdmin(context.uid, context.session.user.email),
      getPendingProfileChangeRequestAdmin(context.vendorId),
      getLatestRejectedProfileChangeRequestAdmin(context.vendorId),
    ]);

    if (!profile) {
      return apiGenericError();
    }

    return NextResponse.json({
      profile: serializeProfile(profile),
      pendingChange: pendingChange ? serializeChangeRequest(pendingChange) : null,
      lastRejectedChange: lastRejectedChange
        ? serializeChangeRequest(lastRejectedChange)
        : null,
    });
  } catch {
    return apiGenericError();
  }
}

export async function PATCH(request: Request) {
  const context = await getVendorApiContext();
  if (!context) return apiUnauthorized();

  // Only active vendors submit change requests (pending, rejected,
  // suspended and banned are view only), like the shared callable.
  if (context.session.sessionKind !== "active") {
    return apiForbidden();
  }

  try {
    const body: unknown = await request.json();
    const photoOwner = sendsProviderPhotos(body)
      ? await loadPhotoOwner(context.uid, context.session.user.email)
      : undefined;
    const parsed = profileChangeSchema(
      context.session.profile.vendorType,
      photoOwner,
    ).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: Strings.errors.generic }, { status: 400 });
    }
    const payload = parsed.data;

    if (context.vendorId !== context.session.profile.vendorId) {
      return apiForbidden();
    }

    await submitProfileChangeRequestAdmin(context.vendorId, context.uid, payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "PENDING_CHANGE_EXISTS") {
      return NextResponse.json(
        { error: Strings.profile.pendingChangeExists },
        { status: 409 },
      );
    }
    return apiGenericError();
  }
}
