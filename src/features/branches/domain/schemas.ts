import { z } from "zod";

import { egpToPiastres } from "@/features/products/domain/currency";
import {
  BRANCH_LIMITS as L,
  type BranchPayload,
  type ServicePayload,
} from "@/features/branches/domain/types";

/**
 * Form values are strings as typed. Parsing returns the callable payload with
 * money converted to integer piastres, or one error per field. Error values
 * are field names; presentation shows `branches.validation.<field>` or
 * `services.validation.<field>`.
 */

export type BranchFormValues = {
  name: string;
  address: string;
  lat: string;
  lng: string;
  phone: string;
  homeVisitEnabled: boolean;
  homeVisitFeeEgp: string;
  homeVisitRadiusMeters: string;
};

export type ServiceFormValues = {
  nameEn: string;
  nameAr: string;
  priceEgp: string;
  durationMinutes: string;
};

export type BranchFormField =
  | "name"
  | "address"
  | "location"
  | "phone"
  | "homeVisitFee"
  | "homeVisitRadius";

export type ServiceFormField = "nameEn" | "nameAr" | "price" | "duration";

export type FormResult<P, F extends string> =
  | { ok: true; payload: P }
  | { ok: false; errors: Partial<Record<F, true>> };

const MAX_FEE_EGP = L.maxFeePiastres / 100;
const MAX_PRICE_EGP = L.maxPricePiastres / 100;

/** Up to two decimals, non negative. Empty string is not a number. */
const egpString = (maxEgp: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/)
    .transform(Number)
    .refine((value) => value <= maxEgp);

const intString = (min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((value) => value >= min && value <= max);

const coordinate = (limit: number) =>
  z
    .string()
    .trim()
    .min(1)
    .transform(Number)
    .refine((value) => Number.isFinite(value) && Math.abs(value) <= limit);

export const branchFormSchema = z.object({
  name: z.string().trim().min(L.nameMin).max(L.nameMax),
  address: z.string().trim().min(L.addressMin).max(L.addressMax),
  lat: coordinate(90),
  lng: coordinate(180),
  phone: z
    .string()
    .trim()
    .min(L.phoneMin)
    .max(L.phoneMax)
    .regex(/^[0-9+\- ]+$/),
  homeVisitEnabled: z.boolean(),
  homeVisitFeeEgp: z.string(),
  homeVisitRadiusMeters: z.string(),
});

export const serviceFormSchema = z.object({
  nameEn: z.string().trim().min(L.nameMin).max(L.nameMax),
  nameAr: z.string().trim().min(L.nameMin).max(L.nameMax),
  priceEgp: egpString(MAX_PRICE_EGP),
  durationMinutes: intString(L.minDurationMinutes, L.maxDurationMinutes).refine(
    (value) => value % L.durationStepMinutes === 0,
  ),
});

const BRANCH_FIELD_BY_PATH: Record<string, BranchFormField> = {
  name: "name",
  address: "address",
  lat: "location",
  lng: "location",
  phone: "phone",
};

const SERVICE_FIELD_BY_PATH: Record<string, ServiceFormField> = {
  nameEn: "nameEn",
  nameAr: "nameAr",
  priceEgp: "price",
  durationMinutes: "duration",
};

export function parseBranchForm(
  values: BranchFormValues,
): FormResult<BranchPayload, BranchFormField> {
  const errors: Partial<Record<BranchFormField, true>> = {};
  const parsed = branchFormSchema.safeParse(values);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = BRANCH_FIELD_BY_PATH[String(issue.path[0])];
      if (field) errors[field] = true;
    }
  }

  let homeVisit = { enabled: false, feePiastres: 0, radiusMeters: 0 };
  if (values.homeVisitEnabled) {
    const fee = egpString(MAX_FEE_EGP).safeParse(values.homeVisitFeeEgp);
    const radius = intString(L.minRadiusMeters, L.maxRadiusMeters).safeParse(
      values.homeVisitRadiusMeters,
    );
    if (!fee.success) errors.homeVisitFee = true;
    if (!radius.success) errors.homeVisitRadius = true;
    if (fee.success && radius.success) {
      homeVisit = {
        enabled: true,
        feePiastres: egpToPiastres(fee.data),
        radiusMeters: radius.data,
      };
    }
  }

  if (!parsed.success || Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const data = parsed.data;
  return {
    ok: true,
    payload: {
      name: data.name,
      address: data.address,
      location: { lat: data.lat, lng: data.lng },
      phone: data.phone,
      homeVisit,
    },
  };
}

export function parseServiceForm(
  values: ServiceFormValues,
): FormResult<ServicePayload, ServiceFormField> {
  const parsed = serviceFormSchema.safeParse(values);
  if (!parsed.success) {
    const errors: Partial<Record<ServiceFormField, true>> = {};
    for (const issue of parsed.error.issues) {
      const field = SERVICE_FIELD_BY_PATH[String(issue.path[0])];
      if (field) errors[field] = true;
    }
    return { ok: false, errors };
  }
  const data = parsed.data;
  return {
    ok: true,
    payload: {
      nameEn: data.nameEn,
      nameAr: data.nameAr,
      pricePiastres: egpToPiastres(data.priceEgp),
      durationMinutes: data.durationMinutes,
    },
  };
}
