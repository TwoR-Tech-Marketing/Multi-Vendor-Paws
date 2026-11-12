import type { ProviderProfile } from "@/features/vendor/domain/provider-profile-schema";
import { vendorApiPost } from "@/lib/auth-client";

export type VendorReapplyPayload = {
  ownerName: string;
  storeName: string;
  storeDescription: string;
  phone: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  logoUrl?: string | null;
  /** Omitted keeps the stored type. */
  vendorType?: string;
  /** Omitted keeps the stored map unless the type changes. */
  providerProfile?: ProviderProfile;
};

type ReapplyResponse = {
  success: boolean;
  data?: {
    requestId: string;
    status: "pending";
    reapplyCount: number;
    vendorType?: string;
  };
};

/** Portal BFF proxies to vendor_signup-reapplyVendorSignupRequest (cookie session). */
export async function reapplyVendorSignupRequest(
  payload: VendorReapplyPayload,
): Promise<ReapplyResponse> {
  return vendorApiPost<ReapplyResponse>("/api/vendor/signup/reapply", payload);
}
