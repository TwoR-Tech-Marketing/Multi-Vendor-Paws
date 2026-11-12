import { z } from "zod";

import type { ProviderPhotoOwner } from "@/features/vendor/domain/provider-photos";
import { providerProfileSchema } from "@/features/vendor/domain/provider-profile-schema";

/**
 * PATCH /api/vendor/profile body. `providerProfile` is validated against the
 * session vendor type; `vendorType` is never accepted (immutable after approval).
 * `photoOwner` limits provider photo URLs to the vendor's own photos folder.
 */
export function profileChangeSchema(
  sessionVendorType: string | null | undefined,
  photoOwner?: ProviderPhotoOwner,
) {
  return z.object({
    ownerName: z.string().min(1),
    phone: z.string().min(1),
    storeName: z.string().min(1),
    storeDescription: z.string().min(1),
    contactPhone: z.string().min(1),
    contactEmail: z.string().email(),
    contactAddress: z.string().min(1),
    logoUrl: z.string().nullable().optional(),
    providerProfile: providerProfileSchema(sessionVendorType, "change", photoOwner).optional(),
    vendorType: z.undefined("fieldNotAllowed").optional(),
  });
}
