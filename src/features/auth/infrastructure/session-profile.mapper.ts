import type { VendorProfile } from "@/features/auth/domain/types";
import { normalizeVendorType } from "@/features/vendor/domain/vendor-type-config";

/** `profile` as returned by vendor_session-resolveVendorSession. */
export type CallableSessionProfile = Omit<
  VendorProfile,
  "restrictionExpiresAt" | "rejectedAt" | "vendorType" | "isTest"
> & {
  restrictionExpiresAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  signupRequestId?: string | null;
  suspensionMode?: "hidden" | "view_only" | null;
  isBanned?: boolean;
  logoUrl?: string | null;
  approvalStatus?: string | null;
  /** Absent from older callables, read as store. */
  vendorType?: string | null;
  /** Absent from older callables, read as false. */
  isTest?: boolean | null;
};

export function mapProfile(profile: CallableSessionProfile | null): VendorProfile | null {
  if (!profile) return null;

  return {
    vendorId: profile.vendorId,
    ownerName: profile.ownerName,
    email: profile.email,
    storeName: profile.storeName,
    status: profile.status,
    approvalStatus: profile.approvalStatus ?? undefined,
    logoUrl: profile.logoUrl ?? null,
    isBanned: Boolean(profile.isBanned),
    restrictionType: profile.restrictionType ?? undefined,
    restrictionReason: profile.restrictionReason ?? undefined,
    restrictionExpiresAt: profile.restrictionExpiresAt
      ? new Date(profile.restrictionExpiresAt)
      : null,
    isPermanentRestriction: Boolean(profile.isPermanentRestriction),
    suspensionMode: profile.suspensionMode ?? null,
    rejectionReason: profile.rejectionReason ?? null,
    rejectedAt: profile.rejectedAt ? new Date(profile.rejectedAt) : null,
    signupRequestId: profile.signupRequestId ?? null,
    vendorType: normalizeVendorType(profile.vendorType),
    isTest: profile.isTest === true,
  };
}
