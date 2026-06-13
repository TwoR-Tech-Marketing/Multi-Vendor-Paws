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
};

export type VendorProfileChangeRequest = VendorProfileChangePayload & {
  id: string;
  vendorId: string;
  authUid: string;
  status: VendorProfileChangeRequestStatus;
  createdAt?: Date | null;
  reviewNotes?: string;
};
