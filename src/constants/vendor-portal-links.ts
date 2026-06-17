export const VendorPortalLinks = {
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@tenderpaws.app",
  sellerGuideUrl: process.env.NEXT_PUBLIC_SELLER_GUIDE_URL?.trim() || "",
  termsUrl: process.env.NEXT_PUBLIC_TERMS_URL?.trim() || "",
  privacyUrl: process.env.NEXT_PUBLIC_PRIVACY_URL?.trim() || "",
  vendorAgreementUrl: process.env.NEXT_PUBLIC_VENDOR_AGREEMENT_URL?.trim() || "",
} as const;
