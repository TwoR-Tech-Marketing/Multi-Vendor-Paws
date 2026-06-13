import type {
  VendorProfileChangeRequest,
  VendorStoreProfile,
} from "@/features/vendor/domain/types";
import { vendorApiGet, vendorApiPatch } from "@/lib/auth-client";

type SerializedVendorStoreProfile = Omit<
  VendorStoreProfile,
  "createdAt" | "updatedAt" | "restrictionExpiresAt"
> & {
  createdAt: string | null;
  updatedAt: string | null;
  restrictionExpiresAt: string | null;
};

type SerializedChangeRequest = Omit<VendorProfileChangeRequest, "createdAt"> & {
  createdAt: string | null;
};

type VendorProfileResponse = {
  profile: SerializedVendorStoreProfile;
  pendingChange: SerializedChangeRequest | null;
};

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function deserializeProfile(profile: SerializedVendorStoreProfile): VendorStoreProfile {
  return {
    ...profile,
    createdAt: parseDate(profile.createdAt),
    updatedAt: parseDate(profile.updatedAt),
    restrictionExpiresAt: parseDate(profile.restrictionExpiresAt),
  };
}

function deserializeChangeRequest(
  request: SerializedChangeRequest,
): VendorProfileChangeRequest {
  return {
    ...request,
    createdAt: parseDate(request.createdAt),
  };
}

export async function fetchVendorProfileFromApi(): Promise<{
  profile: VendorStoreProfile;
  pendingChange: VendorProfileChangeRequest | null;
}> {
  const data = await vendorApiGet<VendorProfileResponse>("/api/vendor/profile");

  return {
    profile: deserializeProfile(data.profile),
    pendingChange: data.pendingChange
      ? deserializeChangeRequest(data.pendingChange)
      : null,
  };
}

export async function submitVendorProfileChangeFromApi(
  payload: Parameters<typeof vendorApiPatch>[1],
): Promise<void> {
  await vendorApiPatch<{ success: true }>("/api/vendor/profile", payload);
}
