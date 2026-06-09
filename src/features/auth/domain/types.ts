export type VendorAccountStatus = "pending" | "active" | "suspended";

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
};

export type VendorRestrictionType = "ban" | "suspend";

export type VendorProfile = {
  vendorId: string;
  ownerName: string;
  email: string;
  storeName: string;
  status: VendorAccountStatus;
  approvalStatus?: string;
  restrictionType?: VendorRestrictionType;
  restrictionReason?: string;
  restrictionExpiresAt?: Date | null;
  isPermanentRestriction?: boolean;
};

export type VendorSignupRequestStatus = "pending" | "approved" | "rejected";
