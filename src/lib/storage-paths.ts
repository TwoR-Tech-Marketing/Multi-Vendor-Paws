/**
 * Centralized Firebase Storage paths. Everything a vendor owns lives under
 * `vendors/{vendorId}/...` so Storage rules can enforce isolation with one
 * match block.
 *
 * These helpers never touch the network. Pair with `getAdminStorage()` or a
 * client SDK upload to actually transfer bytes.
 */

export const StoragePaths = {
  vendorLogo(vendorId: string, fileName: string): string {
    return `vendors/${vendorId}/logo/${Date.now()}_${sanitize(fileName)}`;
  },
  /** Clinic or groomer photo shown on the provider profile. */
  vendorProviderPhoto(vendorId: string, fileName: string): string {
    return `vendors/${vendorId}/photos/${Date.now()}_${sanitize(fileName)}`;
  },
  vendorCover(vendorId: string, fileName: string): string {
    return `vendors/${vendorId}/cover/${Date.now()}_${sanitize(fileName)}`;
  },
  vendorProductImage(
    vendorId: string,
    productId: string,
    fileName: string,
  ): string {
    return `vendors/${vendorId}/products/${productId}/${Date.now()}_${sanitize(
      fileName,
    )}`;
  },
  /** Service photo under the caller's branch folder (checked by the callable). */
  vendorServicePhoto(
    vendorId: string,
    branchId: string,
    serviceId: string,
    fileName: string,
  ): string {
    return `vendors/${vendorId}/branches/${branchId}/services/${serviceId}/${Date.now()}_${sanitize(
      fileName,
    )}`;
  },
  vendorPayoutAttachment(
    vendorId: string,
    payoutId: string,
    fileName: string,
  ): string {
    return `vendors/${vendorId}/payouts/${payoutId}/${sanitize(fileName)}`;
  },
  signupRequestLogo(requestId: string, fileName: string): string {
    return `vendor_signup_requests/${requestId}/${sanitize(fileName)}`;
  },
} as const;

function sanitize(fileName: string): string {
  return fileName.replace(/[^\w.\-]+/g, "_").slice(0, 120);
}
