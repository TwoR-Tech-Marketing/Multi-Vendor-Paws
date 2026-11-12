/**
 * Branches and services for clinic and groomer providers.
 * Shapes match the vendor_branches callables. Money is integer piastres.
 */

export type BranchStatus = "active" | "archived";

export type LatLng = { lat: number; lng: number };

export type HomeVisit = {
  enabled: boolean;
  feePiastres: number;
  radiusMeters: number;
};

export type Branch = {
  branchId: string;
  name: string;
  address: string;
  location: LatLng | null;
  governorateId: string | null;
  phone: string;
  homeVisit: HomeVisit;
  status: BranchStatus;
  serviceCount: number;
  createdAtMs: number | null;
  updatedAtMs: number | null;
};

export type BranchService = {
  serviceId: string;
  branchId: string;
  nameEn: string;
  nameAr: string;
  pricePiastres: number;
  durationMinutes: number;
  photoUrl: string | null;
  status: BranchStatus;
  sourceServiceId: string | null;
  createdAtMs: number | null;
  updatedAtMs: number | null;
};

export type BranchDetail = {
  branch: Branch;
  services: BranchService[];
};

export type BranchPayload = {
  name: string;
  address: string;
  location: LatLng;
  phone: string;
  homeVisit: HomeVisit;
};

export type ServicePayload = {
  nameEn: string;
  nameAr: string;
  pricePiastres: number;
  durationMinutes: number;
};

export type DuplicateServicesResult = {
  created: number;
  skipped: number;
  services: BranchService[];
};

export type DealType = "fixed" | "percentage" | "both";

export type DealSource = "branchOverride" | "vendorDeal" | "default";

export type DealTerms = {
  type: DealType;
  fixedFeePerOrderPiastres: number;
  percentage: number;
};

export type BranchDeal = DealTerms & { source: DealSource };

export type BranchDealRow = {
  branchId: string;
  name: string;
  status: BranchStatus;
  deal: BranchDeal;
};

export type BranchDeals = {
  defaultPercent: number;
  applyToAllBranches: boolean | null;
  effectiveFromMs: number | null;
  vendorDeal: DealTerms | null;
  branches: BranchDealRow[];
};

/** Limits shared with the callables (server limits). */
export const BRANCH_LIMITS = {
  maxActiveBranches: 20,
  maxActiveServices: 100,
  nameMin: 2,
  nameMax: 80,
  addressMin: 5,
  addressMax: 300,
  phoneMin: 7,
  phoneMax: 20,
  maxFeePiastres: 10_000_000,
  minRadiusMeters: 500,
  maxRadiusMeters: 50_000,
  maxPricePiastres: 10_000_000,
  defaultDurationMinutes: 30,
  minDurationMinutes: 5,
  maxDurationMinutes: 480,
  durationStepMinutes: 5,
} as const;

/** Map default when a branch has no location yet (Cairo). */
export const DEFAULT_BRANCH_LOCATION: LatLng = { lat: 30.0444, lng: 31.2357 };
