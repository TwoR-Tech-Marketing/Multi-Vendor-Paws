import { NextResponse } from "next/server";
import { z } from "zod";

import type {
  VendorProfileChangePayload,
  VendorProfileChangeRequest,
  VendorStoreProfile,
} from "@/features/vendor/domain/types";
import {
  getLatestRejectedProfileChangeRequestAdmin,
  getPendingProfileChangeRequestAdmin,
  submitProfileChangeRequestAdmin,
} from "@/features/vendor/infrastructure/vendor-profile-change.admin.repository";
import { getVendorStoreProfileAdmin } from "@/features/vendor/infrastructure/vendor-store-profile.admin.repository";
import { apiForbidden, apiGenericError, apiUnauthorized } from "@/lib/api/response";
import { getVendorApiContext } from "@/lib/auth/require-vendor-api";
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

const patchSchema = z.object({
  ownerName: z.string().min(1),
  phone: z.string().min(1),
  storeName: z.string().min(1),
  storeDescription: z.string().min(1),
  contactPhone: z.string().min(1),
  contactEmail: z.string().email(),
  contactAddress: z.string().min(1),
  logoUrl: z.string().nullable().optional(),
});

export async function PATCH(request: Request) {
  const context = await getVendorApiContext();
  if (!context) return apiUnauthorized();

  if (context.session.sessionKind === "suspended") {
    return apiForbidden();
  }

  try {
    const payload = patchSchema.parse(await request.json()) as VendorProfileChangePayload;

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
