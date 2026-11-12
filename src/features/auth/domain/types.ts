import type { ProviderProfile } from "@/features/vendor/domain/provider-profile-schema";

export type VendorAccountStatus = "pending" | "rejected" | "active" | "suspended";

export type VendorSignupPayload = {
  ownerName: string;
  /** Business email — used for Firebase Auth sign-in (not contactEmail). */
  email: string;
  phone: string;
  password: string;
  storeName: string;
  storeDescription: string;
  contactPhone: string;
  /** Store-facing contact email for buyers — not used for vendor login. */
  contactEmail: string;
  contactAddress: string;
  logoUrl?: string | null;
  /** S1.7: store when omitted. */
  vendorType?: string;
  providerProfile?: ProviderProfile;
};

export type VendorRestrictionType = "ban" | "suspend";

export type VendorProfile = {
  vendorId: string;
  ownerName: string;
  email: string;
  storeName: string;
  status: VendorAccountStatus;
  approvalStatus?: string;
  logoUrl?: string | null;
  isBanned?: boolean;
  restrictionType?: VendorRestrictionType;
  restrictionReason?: string;
  restrictionExpiresAt?: Date | null;
  isPermanentRestriction?: boolean;
  /** S1.2 / S1.14: hidden | view_only when suspended */
  suspensionMode?: "hidden" | "view_only" | null;
  rejectionReason?: string | null;
  rejectedAt?: Date | null;
  signupRequestId?: string | null;
  /** S1.7: normalized; "store" when the vendor and signup docs have none. */
  vendorType: string;
};

export type VendorSignupRequestStatus = "pending" | "approved" | "rejected";
