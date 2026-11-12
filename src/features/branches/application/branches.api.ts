import type {
  Branch,
  BranchDeal,
  BranchDealRow,
  BranchDeals,
  BranchDetail,
  BranchPayload,
  BranchService,
  BranchStatus,
  DealSource,
  DealTerms,
  DealType,
  DuplicateServicesResult,
  HomeVisit,
  ServicePayload,
} from "@/features/branches/domain/types";
import { BRANCH_LIMITS } from "@/features/branches/domain/types";
import {
  BRANCH_CALLABLES,
  invokeBranchCallable,
  uploadServicePhotoFile,
} from "@/features/branches/infrastructure/branches.callables";

/**
 * Branches and services through the shared `vendor_branches` callables.
 * No BFF exists for this feature. vendorId is always the caller's auth
 * uid on the server; nothing here sends one.
 */

type Raw = Record<string, unknown>;

function asObject(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
}

function asInt(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isInteger(value) ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function asMillis(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asStatus(value: unknown): BranchStatus {
  return value === "archived" ? "archived" : "active";
}

function mapHomeVisit(value: unknown): HomeVisit {
  const raw = asObject(value);
  const enabled = raw.enabled === true;
  return {
    enabled,
    feePiastres: enabled ? Math.max(0, asInt(raw.feePiastres)) : 0,
    radiusMeters: enabled ? Math.max(0, asInt(raw.radiusMeters)) : 0,
  };
}

export function mapBranch(value: unknown): Branch {
  const raw = asObject(value);
  const location = asObject(raw.location);
  const hasLocation =
    typeof location.lat === "number" && typeof location.lng === "number";
  return {
    branchId: asString(raw.branchId),
    name: asString(raw.name),
    address: asString(raw.address),
    location: hasLocation
      ? { lat: location.lat as number, lng: location.lng as number }
      : null,
    governorateId: asNullableString(raw.governorateId),
    phone: asString(raw.phone),
    homeVisit: mapHomeVisit(raw.homeVisit),
    status: asStatus(raw.status),
    serviceCount: Math.max(0, asInt(raw.serviceCount)),
    createdAtMs: asMillis(raw.createdAtMs),
    updatedAtMs: asMillis(raw.updatedAtMs),
  };
}

export function mapService(value: unknown): BranchService {
  const raw = asObject(value);
  return {
    serviceId: asString(raw.serviceId),
    branchId: asString(raw.branchId),
    nameEn: asString(raw.nameEn),
    nameAr: asString(raw.nameAr),
    pricePiastres: Math.max(0, asInt(raw.pricePiastres)),
    durationMinutes: asInt(raw.durationMinutes, BRANCH_LIMITS.defaultDurationMinutes),
    photoUrl: asNullableString(raw.photoUrl),
    status: asStatus(raw.status),
    sourceServiceId: asNullableString(raw.sourceServiceId),
    createdAtMs: asMillis(raw.createdAtMs),
    updatedAtMs: asMillis(raw.updatedAtMs),
  };
}

const DEAL_TYPES: DealType[] = ["fixed", "percentage", "both"];
const DEAL_SOURCES: DealSource[] = ["branchOverride", "vendorDeal", "default"];

function mapDealTerms(value: unknown): DealTerms | null {
  const raw = asObject(value);
  if (!DEAL_TYPES.includes(raw.type as DealType)) return null;
  return {
    type: raw.type as DealType,
    fixedFeePerOrderPiastres: Math.max(0, asInt(raw.fixedFeePerOrderPiastres)),
    percentage: asNumber(raw.percentage),
  };
}

function mapBranchDeal(value: unknown, defaultPercent: number): BranchDeal {
  const raw = asObject(value);
  const terms = mapDealTerms(raw);
  const source = raw.source as DealSource;
  if (!terms || !DEAL_SOURCES.includes(source)) {
    return {
      source: "default",
      type: "percentage",
      fixedFeePerOrderPiastres: 0,
      percentage: defaultPercent,
    };
  }
  return { source, ...terms };
}

export function mapBranchDeals(value: unknown): BranchDeals {
  const raw = asObject(value);
  const defaultPercent = asNumber(raw.defaultPercent, 10);
  const rows = Array.isArray(raw.branches) ? raw.branches : [];
  return {
    defaultPercent,
    applyToAllBranches:
      typeof raw.applyToAllBranches === "boolean" ? raw.applyToAllBranches : null,
    effectiveFromMs: asMillis(raw.effectiveFromMs),
    vendorDeal: mapDealTerms(raw.vendorDeal),
    branches: rows.map((row): BranchDealRow => {
      const item = asObject(row);
      return {
        branchId: asString(item.branchId),
        name: asString(item.name),
        status: asStatus(item.status),
        deal: mapBranchDeal(item.deal, defaultPercent),
      };
    }),
  };
}

export async function listBranches(options?: { includeArchived?: boolean }): Promise<Branch[]> {
  const data = asObject(
    await invokeBranchCallable(BRANCH_CALLABLES.list, {
      includeArchived: options?.includeArchived === true,
    }),
  );
  return (Array.isArray(data.items) ? data.items : []).map(mapBranch);
}

export async function getBranch(
  branchId: string,
  options?: { includeArchived?: boolean },
): Promise<BranchDetail> {
  const data = asObject(
    await invokeBranchCallable(BRANCH_CALLABLES.get, {
      branchId,
      includeArchived: options?.includeArchived === true,
    }),
  );
  return {
    branch: mapBranch(data.branch),
    services: (Array.isArray(data.services) ? data.services : []).map(mapService),
  };
}

export async function createBranch(payload: BranchPayload): Promise<Branch> {
  const data = asObject(await invokeBranchCallable(BRANCH_CALLABLES.create, { ...payload }));
  return mapBranch(data.branch);
}

export async function updateBranch(
  branchId: string,
  payload: Partial<BranchPayload>,
): Promise<Branch> {
  const data = asObject(
    await invokeBranchCallable(BRANCH_CALLABLES.update, { branchId, ...payload }),
  );
  return mapBranch(data.branch);
}

export async function setBranchStatus(branchId: string, status: BranchStatus): Promise<Branch> {
  const data = asObject(
    await invokeBranchCallable(BRANCH_CALLABLES.setStatus, { branchId, status }),
  );
  return mapBranch(data.branch);
}

export async function createService(
  branchId: string,
  payload: ServicePayload,
): Promise<BranchService> {
  const data = asObject(
    await invokeBranchCallable(BRANCH_CALLABLES.createService, { branchId, ...payload }),
  );
  return mapService(data.service);
}

export async function updateService(
  branchId: string,
  serviceId: string,
  payload: Partial<ServicePayload> & { photoUrl?: string | null },
): Promise<BranchService> {
  const data = asObject(
    await invokeBranchCallable(BRANCH_CALLABLES.updateService, {
      branchId,
      serviceId,
      ...payload,
    }),
  );
  return mapService(data.service);
}

export async function setServiceStatus(
  branchId: string,
  serviceId: string,
  status: BranchStatus,
): Promise<BranchService> {
  const data = asObject(
    await invokeBranchCallable(BRANCH_CALLABLES.setServiceStatus, {
      branchId,
      serviceId,
      status,
    }),
  );
  return mapService(data.service);
}

export async function duplicateServices(input: {
  fromBranchId: string;
  toBranchId: string;
  serviceIds?: string[];
  skipExisting: boolean;
}): Promise<DuplicateServicesResult> {
  const payload: Record<string, unknown> = {
    fromBranchId: input.fromBranchId,
    toBranchId: input.toBranchId,
    skipExisting: input.skipExisting,
  };
  if (input.serviceIds && input.serviceIds.length > 0) {
    payload.serviceIds = input.serviceIds;
  }
  const data = asObject(
    await invokeBranchCallable(BRANCH_CALLABLES.duplicateServices, payload),
  );
  return {
    created: Math.max(0, asInt(data.created)),
    skipped: Math.max(0, asInt(data.skipped)),
    services: (Array.isArray(data.services) ? data.services : []).map(mapService),
  };
}

export async function getBranchDeals(): Promise<BranchDeals> {
  return mapBranchDeals(await invokeBranchCallable(BRANCH_CALLABLES.deals, {}));
}

/**
 * Photo flow: create without photo, upload, then update with photoUrl.
 * Returns the updated service.
 */
export async function attachServicePhoto(input: {
  vendorId: string;
  branchId: string;
  serviceId: string;
  file: File;
}): Promise<BranchService> {
  const photoUrl = await uploadServicePhotoFile(
    input.vendorId,
    input.branchId,
    input.serviceId,
    input.file,
  );
  return updateService(input.branchId, input.serviceId, { photoUrl });
}
