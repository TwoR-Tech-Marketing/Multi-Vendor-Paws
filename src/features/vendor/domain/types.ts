import type { ProviderProfile } from "@/features/vendor/domain/provider-profile-schema";
import type {
  VendorAccountStatus,
  VendorRestrictionType,
} from "@/features/auth/domain/types";

export type VendorStoreProfile = {
  vendorId: string;
  ownerName: string;
  email: string;
  phone: string;
  storeName: string;
  storeDescription: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  logoUrl: string | null;
  /** Normalized, store when missing. */
  vendorType: string;
  /** Empty for store vendors and every older document. */
  providerProfile: ProviderProfile;
  status: VendorAccountStatus;
  approvalStatus?: string;
  restrictionType?: VendorRestrictionType;
  restrictionReason?: string;
  restrictionExpiresAt?: Date | null;
  isPermanentRestriction?: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type VendorProfileChangeRequestStatus = "pending" | "approved" | "rejected";

export type VendorProfileChangePayload = {
  ownerName: string;
  phone: string;
  storeName: string;
  storeDescription: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  logoUrl?: string | null;
  /** Partial map, keys allowed for the session vendor type only. */
  providerProfile?: ProviderProfile;
};

export type VendorProfileChangeRequest = VendorProfileChangePayload & {
  id: string;
  vendorId: string;
  authUid: string;
  status: VendorProfileChangeRequestStatus;
  createdAt?: Date | null;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
};

/** A change request as the shared callables return it (no owner or admin uid). */
export type VendorProfileChangeHistoryItem = Omit<
  VendorProfileChangeRequest,
  "vendorId" | "authUid" | "reviewedBy"
>;
