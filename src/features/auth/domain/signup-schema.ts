import { z } from "zod";

import { providerProfileSchema } from "@/features/vendor/domain/provider-profile-schema";
import {
  PROVIDER_FIELD_LIMITS,
  VENDOR_TYPES,
  type VendorType,
} from "@/features/vendor/domain/vendor-type-config";

/**
 * Store and provider step of the vendor signup. Issue messages are keys
 * of `vendorTypes.errors`. Mirrors the server checks in
 * vendor_signup-submitVendorSignupRequest, which stays the real validation.
 */
function businessSchema(type: VendorType) {
  const description = z.string().trim().min(1, "descriptionRequired");
  return z.object({
    vendorType: z.literal(type),
    storeName: z.string().trim().min(1, "nameRequired"),
    storeDescription:
      type === "doctor"
        ? description.max(PROVIDER_FIELD_LIMITS.doctorDescriptionMax, "descriptionTooLong")
        : description,
    providerProfile:
      type === "doctor"
        ? z.preprocess((value) => value ?? {}, providerProfileSchema(type, "signup"))
        : providerProfileSchema(type, "signup").optional(),
  });
}

export const signupBusinessSchema = z.discriminatedUnion(
  "vendorType",
  VENDOR_TYPES.map(businessSchema) as [
    ReturnType<typeof businessSchema>,
    ...ReturnType<typeof businessSchema>[],
  ],
);

export type SignupBusinessInput = z.input<typeof signupBusinessSchema>;
export type SignupBusinessData = z.output<typeof signupBusinessSchema>;

/** First issue as a `vendorTypes.errors` key, or null when valid. */
export function firstSignupBusinessError(input: unknown): string | null {
  const result = signupBusinessSchema.safeParse(input);
  return result.success ? null : (result.error.issues[0]?.message ?? "generic");
}
