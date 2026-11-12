import { z } from "zod";

import {
  PROVIDER_FIELD_LIMITS as L,
  getProviderConfig,
  type ProviderField,
} from "@/features/vendor/domain/vendor-type-config";

/**
 * Issue messages are keys of `vendorTypes.errors` in the locale files, so the
 * UI can show them in English or Arabic.
 */
export type ProviderErrorKey =
  | "specialtyRequired"
  | "specialtyLength"
  | "textTooLong"
  | "descriptionTooLong"
  | "photoUrlsInvalid"
  | "fieldNotAllowed";

export type ProviderProfile = {
  specialty?: string;
  education?: string | null;
  experience?: string | null;
  photoUrls?: string[];
};

const optionalFreeText = z
  .string()
  .trim()
  .max(L.freeTextMax, "textTooLong")
  .nullable()
  .optional()
  .transform((value) => (value === undefined ? undefined : value || null));

const fieldSchemas = {
  specialty: z
    .string("specialtyRequired")
    .trim()
    .min(L.specialtyMin, "specialtyLength")
    .max(L.specialtyMax, "specialtyLength"),
  education: optionalFreeText,
  experience: optionalFreeText,
  photoUrls: z
    .array(
      z
        .string("photoUrlsInvalid")
        .startsWith("https://", "photoUrlsInvalid")
        .max(L.photoUrlMaxLength, "photoUrlsInvalid"),
    )
    .max(L.photoUrlsMax, "photoUrlsInvalid"),
} as const;

/**
 * Strict map of the provider fields allowed for `vendorType` (contract 2.2).
 * - signup: photoUrls refused (no upload path before approval), doctor specialty required.
 * - change: partial map, every allowed key optional.
 * Unknown and store types accept only an empty map.
 */
export function providerProfileSchema(
  vendorType: string | null | undefined,
  phase: "signup" | "change",
) {
  const fields = getProviderConfig(vendorType).providerFields.filter(
    (field) => phase === "change" || field !== "photoUrls",
  );
  const shape: Partial<Record<ProviderField, z.ZodType>> = {};
  for (const field of fields) {
    const base = fieldSchemas[field];
    shape[field] = field === "specialty" && phase === "signup" ? base : base.optional();
  }
  return z.strictObject(shape, "fieldNotAllowed");
}
