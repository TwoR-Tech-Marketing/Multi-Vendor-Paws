import { httpsCallable } from "firebase/functions";

import type {
  VendorAccountStatus,
  VendorRestrictionType,
} from "@/features/auth/domain/types";
import type { ProviderProfile } from "@/features/vendor/domain/provider-profile-schema";
import type {
  VendorProfileChangeHistoryItem,
  VendorProfileChangePayload,
  VendorProfileChangeRequest,
  VendorProfileChangeRequestStatus,
  VendorStoreProfile,
} from "@/features/vendor/domain/types";
import {
  uploadVendorProfileLogo,
  VENDOR_LOGO_MAX_BYTES,
} from "@/features/vendor/infrastructure/vendor-logo.storage";
import { ApiClientError, vendorApiGet, vendorApiPatch } from "@/lib/auth-client";
import { firebaseFunctions } from "@/lib/firebase";
import { getProfileDataSource } from "@/lib/vendor-data-source";

const CALLABLE_GET = "vendor_profile-getMyVendorProfile";
const CALLABLE_SUBMIT = "vendor_profile-submitMyVendorProfileChange";
const CALLABLE_LIST = "vendor_profile-listMyVendorProfileChangeRequests";

export type VendorProfileSnapshot = {
  profile: VendorStoreProfile;
  pendingChange: VendorProfileChangeRequest | null;
  lastRejectedChange: VendorProfileChangeRequest | null;
};

export type VendorProfileHistoryPage = {
  items: VendorProfileChangeHistoryItem[];
  nextCursor: string | null;
};

/**
 * Why a change request was refused. Presentation maps each reason to copy.
 * `pending_exists`: a request is already waiting for review (BFF 409,
 * callable `already-exists`). `not_allowed`: the account cannot submit
 * changes right now (BFF 403, callable `failed-precondition`).
 * `logo_too_large`: the logo is over the Storage rule limit.
 */
export type VendorProfileSubmitErrorReason =
  | "pending_exists"
  | "not_allowed"
  | "logo_too_large"
  | "failed";

export class VendorProfileSubmitError extends Error {
  constructor(readonly reason: VendorProfileSubmitErrorReason) {
    super(reason);
    this.name = "VendorProfileSubmitError";
  }
}

/** The change request history list only exists on the shared callable path. */
export function isProfileHistoryAvailable(): boolean {
  return getProfileDataSource() === "callable";
}

// ---------------------------------------------------------------------------
// BFF path (default)
// ---------------------------------------------------------------------------

type SerializedVendorStoreProfile = Omit<
  VendorStoreProfile,
  "createdAt" | "updatedAt" | "restrictionExpiresAt"
> & {
  createdAt: string | null;
  updatedAt: string | null;
  restrictionExpiresAt: string | null;
};

type SerializedChangeRequest = Omit<
  VendorProfileChangeRequest,
  "createdAt" | "reviewedAt"
> & {
  createdAt: string | null;
  reviewedAt: string | null;
};

type VendorProfileResponse = {
  profile: SerializedVendorStoreProfile;
  pendingChange: SerializedChangeRequest | null;
  lastRejectedChange: SerializedChangeRequest | null;
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
    reviewedAt: parseDate(request.reviewedAt),
  };
}

async function fetchProfileFromBff(): Promise<VendorProfileSnapshot> {
  const data = await vendorApiGet<VendorProfileResponse>("/api/vendor/profile");

  return {
    profile: deserializeProfile(data.profile),
    pendingChange: data.pendingChange
      ? deserializeChangeRequest(data.pendingChange)
      : null,
    lastRejectedChange: data.lastRejectedChange
      ? deserializeChangeRequest(data.lastRejectedChange)
      : null,
  };
}

// ---------------------------------------------------------------------------
// Callable path (PC-2 shared callables, millis dates)
// ---------------------------------------------------------------------------

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RawRecord)
    : {};
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

export function millisToDate(value: unknown): Date | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const REQUEST_STATUSES: VendorProfileChangeRequestStatus[] = ["pending", "approved", "rejected"];

function requestStatus(value: unknown): VendorProfileChangeRequestStatus {
  return REQUEST_STATUSES.includes(value as VendorProfileChangeRequestStatus)
    ? (value as VendorProfileChangeRequestStatus)
    : "pending";
}

export function mapCallableChangeRequest(raw: unknown): VendorProfileChangeHistoryItem {
  const data = asRecord(raw);
  const providerProfile = asRecord(data.providerProfile);
  return {
    id: text(data.id),
    status: requestStatus(data.status),
    ownerName: text(data.ownerName),
    phone: text(data.phone),
    storeName: text(data.storeName),
    storeDescription: text(data.storeDescription),
    contactPhone: text(data.contactPhone),
    contactEmail: text(data.contactEmail),
    contactAddress: text(data.contactAddress),
    logoUrl: textOrNull(data.logoUrl),
    ...(Object.keys(providerProfile).length
      ? { providerProfile: providerProfile as ProviderProfile }
      : {}),
    createdAt: millisToDate(data.createdAtMs),
    reviewedAt: millisToDate(data.reviewedAtMs),
    reviewNotes: textOrNull(data.reviewNotes),
  };
}

function withOwner(
  item: VendorProfileChangeHistoryItem,
  vendorId: string,
): VendorProfileChangeRequest {
  // The callable never returns the auth uid; it equals the vendor id.
  return { ...item, vendorId, authUid: vendorId };
}

export function mapCallableProfile(raw: unknown): VendorProfileSnapshot {
  const data = asRecord(raw);
  const p = asRecord(data.profile);
  const vendorId = text(p.vendorId);

  const profile: VendorStoreProfile = {
    vendorId,
    ownerName: text(p.ownerName),
    email: text(p.email),
    phone: text(p.phone),
    storeName: text(p.storeName),
    storeDescription: text(p.storeDescription),
    contactPhone: text(p.contactPhone),
    contactEmail: text(p.contactEmail),
    contactAddress: text(p.contactAddress),
    logoUrl: textOrNull(p.logoUrl),
    vendorType: text(p.vendorType, "store"),
    providerProfile: asRecord(p.providerProfile) as ProviderProfile,
    status: text(p.status, "pending") as VendorAccountStatus,
    createdAt: millisToDate(p.createdAtMs),
    updatedAt: millisToDate(p.updatedAtMs),
  };
  if (typeof p.approvalStatus === "string") profile.approvalStatus = p.approvalStatus;
  if (typeof p.restrictionType === "string") {
    profile.restrictionType = p.restrictionType as VendorRestrictionType;
    profile.restrictionReason = text(p.restrictionReason);
    profile.restrictionExpiresAt = millisToDate(p.restrictionExpiresAtMs);
    profile.isPermanentRestriction = p.isPermanentRestriction === true;
  }

  return {
    profile,
    pendingChange: data.pendingChange
      ? withOwner(mapCallableChangeRequest(data.pendingChange), vendorId)
      : null,
    lastRejectedChange: data.lastRejectedChange
      ? withOwner(mapCallableChangeRequest(data.lastRejectedChange), vendorId)
      : null,
  };
}

function errorCode(error: unknown): string | null {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code.replace(/^functions\//, "");
  }
  return null;
}

/** Maps BFF and callable failures of a change request to a reason. */
export function toSubmitErrorReason(error: unknown): VendorProfileSubmitErrorReason {
  if (error instanceof ApiClientError) {
    if (error.status === 409) return "pending_exists";
    if (error.status === 403) return "not_allowed";
    return "failed";
  }
  const code = errorCode(error);
  if (code === "already-exists") return "pending_exists";
  if (code === "failed-precondition") return "not_allowed";
  return "failed";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchVendorProfileFromApi(): Promise<VendorProfileSnapshot> {
  if (getProfileDataSource() === "callable") {
    const callable = httpsCallable(firebaseFunctions, CALLABLE_GET);
    const result = await callable({});
    return mapCallableProfile(result.data);
  }
  return fetchProfileFromBff();
}

/**
 * Submits a change request. Always send the current `logoUrl` when the logo
 * is unchanged: a missing value clears it on review. Throws
 * `VendorProfileSubmitError` with a reason on failure.
 */
export async function submitVendorProfileChangeFromApi(
  payload: VendorProfileChangePayload,
): Promise<void> {
  try {
    if (getProfileDataSource() === "callable") {
      const callable = httpsCallable(firebaseFunctions, CALLABLE_SUBMIT);
      await callable({ ...payload, logoUrl: payload.logoUrl ?? null, source: "portal" });
      return;
    }
    await vendorApiPatch<{ success: true }>("/api/vendor/profile", payload);
  } catch (error) {
    throw new VendorProfileSubmitError(toSubmitErrorReason(error));
  }
}

/** History of change requests, newest first (callable path only). */
export async function fetchVendorProfileHistoryFromApi(
  cursor: string | null,
  pageSize = 20,
): Promise<VendorProfileHistoryPage> {
  const callable = httpsCallable(firebaseFunctions, CALLABLE_LIST);
  const result = await callable({ pageSize, cursor });
  const data = asRecord(result.data);
  const items = Array.isArray(data.items) ? data.items.map(mapCallableChangeRequest) : [];
  return {
    items,
    nextCursor: typeof data.nextCursor === "string" && data.nextCursor ? data.nextCursor : null,
  };
}

/**
 * Uploads a new store logo to `vendors/{vendorId}/logo/` (PC-2). Throws
 * `VendorProfileSubmitError("logo_too_large")` above the Storage rule limit.
 */
export async function uploadVendorProfileLogoFromApi(
  vendorId: string,
  file: File,
): Promise<string> {
  if (file.size >= VENDOR_LOGO_MAX_BYTES) {
    throw new VendorProfileSubmitError("logo_too_large");
  }
  try {
    return await uploadVendorProfileLogo(vendorId, file);
  } catch {
    throw new VendorProfileSubmitError("failed");
  }
}
