import type { Branch, BranchService } from "@/features/branches/domain/types";

export function makeBranch(patch: Partial<Branch> = {}): Branch {
  return {
    branchId: "b1",
    name: "Nasr City",
    address: "12 Abbas El Akkad",
    location: { lat: 30.05, lng: 31.34 },
    governorateId: "cairo",
    phone: "0100000000",
    homeVisit: { enabled: false, feePiastres: 0, radiusMeters: 0 },
    status: "active",
    serviceCount: 2,
    createdAtMs: 1,
    updatedAtMs: 1,
    ...patch,
  };
}

export function makeService(patch: Partial<BranchService> = {}): BranchService {
  return {
    serviceId: "s1",
    branchId: "b1",
    nameEn: "Checkup",
    nameAr: "كشف",
    pricePiastres: 25000,
    durationMinutes: 30,
    photoUrl: null,
    status: "active",
    sourceServiceId: null,
    createdAtMs: 1,
    updatedAtMs: 1,
    ...patch,
  };
}
