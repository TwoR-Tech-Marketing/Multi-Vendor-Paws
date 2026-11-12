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
): z.ZodType<ProviderProfile> {
  const fields = getProviderConfig(vendorType).providerFields.filter(
    (field) => phase === "change" || field !== "photoUrls",
  );
  const shape: Partial<Record<ProviderField, z.ZodType>> = {};
  for (const field of fields) {
    const base = fieldSchemas[field];
    shape[field] = field === "specialty" && phase === "signup" ? base : base.optional();
  }
  // ponytail: the shape is built per type at runtime, so its output is typed by hand.
  return z.strictObject(shape, "fieldNotAllowed") as unknown as z.ZodType<ProviderProfile>;
}

/** Text provider fields a form can edit. photoUrls has its own upload flow. */
export type ProviderTextFields = {
  specialty: string;
  education: string;
  experience: string;
};

export const EMPTY_PROVIDER_TEXT_FIELDS: ProviderTextFields = {
  specialty: "",
  education: "",
  experience: "",
};

/**
 * Builds the providerProfile payload for a type from form text: only the
 * type's text fields, undefined when nothing is left. Empty optional fields are
 * dropped unless `includeEmpty` (a change request clears them with null).
 * Doctor specialty is always kept so the schema can report it as required.
 */
export function buildProviderProfilePayload(
  vendorType: string,
  value: ProviderTextFields,
  includeEmpty = false,
): { specialty?: string; education?: string; experience?: string } | undefined {
  const fields = getProviderConfig(vendorType).providerFields;
  const out: { specialty?: string; education?: string; experience?: string } = {};
  for (const key of ["specialty", "education", "experience"] as const) {
    if (!fields.includes(key)) continue;
    if (includeEmpty || key === "specialty" || value[key].trim()) out[key] = value[key];
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Reapply (rejected applicant): send provider fields only when the type changed
 * or the applicant typed something; omitted keeps the stored map (contract 4.2).
 */
export function buildReapplyProviderProfile(
  storedType: string,
  nextType: string,
  value: ProviderTextFields,
): ReturnType<typeof buildProviderProfilePayload> {
  const draft = buildProviderProfilePayload(nextType, value);
  if (!draft) return undefined;
  const typed = Object.values(draft).some((text) => text.trim());
  return storedType !== nextType || typed ? draft : undefined;
}
