import { z } from "zod";

import { providerProfileSchema } from "@/features/vendor/domain/provider-profile-schema";

/**
 * PATCH /api/vendor/profile body. `providerProfile` is validated against the
 * session vendor type; `vendorType` is never accepted (immutable after approval).
 */
export function profileChangeSchema(sessionVendorType: string | null | undefined) {
  return z.object({
    ownerName: z.string().min(1),
    phone: z.string().min(1),
    storeName: z.string().min(1),
    storeDescription: z.string().min(1),
    contactPhone: z.string().min(1),
    contactEmail: z.string().email(),
    contactAddress: z.string().min(1),
    logoUrl: z.string().nullable().optional(),
    providerProfile: providerProfileSchema(sessionVendorType, "change").optional(),
    vendorType: z.undefined("fieldNotAllowed").optional(),
  });
}
