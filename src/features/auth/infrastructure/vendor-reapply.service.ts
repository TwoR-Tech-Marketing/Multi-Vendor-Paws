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
};

type ReapplyResponse = {
  success: boolean;
  data?: {
    requestId: string;
    status: "pending";
    reapplyCount: number;
  };
};

/** Portal BFF proxies to vendor_signup-reapplyVendorSignupRequest (cookie session). */
export async function reapplyVendorSignupRequest(
  payload: VendorReapplyPayload,
): Promise<ReapplyResponse> {
  return vendorApiPost<ReapplyResponse>("/api/vendor/signup/reapply", payload);
}
