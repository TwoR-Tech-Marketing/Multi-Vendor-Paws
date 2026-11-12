import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureClientAuth: vi.fn(async () => undefined),
  callableFn: vi.fn(),
  httpsCallable: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

vi.mock("firebase/functions", () => ({ httpsCallable: mocks.httpsCallable }));
vi.mock("firebase/storage", () => ({
  ref: mocks.ref,
  uploadBytes: mocks.uploadBytes,
  getDownloadURL: mocks.getDownloadURL,
}));
vi.mock("@/lib/client-auth", () => ({ ensureClientAuth: mocks.ensureClientAuth }));
vi.mock("@/lib/firebase", () => ({ firebaseFunctions: {}, firebaseStorage: {} }));

import {
  attachServicePhoto,
  createBranch,
  createService,
  duplicateServices,
  getBranch,
  getBranchDeals,
  listBranches,
  setBranchStatus,
  setServiceStatus,
  updateBranch,
  updateService,
} from "@/features/branches/application/branches.api";
import { mapBranchesError } from "@/features/branches/domain/errors";

const RAW_BRANCH = {
  branchId: "b1",
  name: "Nasr City",
  address: "12 Abbas El Akkad",
  location: { lat: 30.05, lng: 31.34 },
  governorateId: "cairo",
  phone: "+20 100 000 0000",
  homeVisit: { enabled: true, feePiastres: 15000, radiusMeters: 3000 },
  status: "active",
  serviceCount: 2,
  createdAtMs: 1,
  updatedAtMs: 2,
};

const RAW_SERVICE = {
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
  updatedAtMs: 2,
};

function respond(data: unknown) {
  mocks.callableFn.mockResolvedValueOnce({ data });
}

function lastCall(): { name: string; payload: unknown } {
  const name = mocks.httpsCallable.mock.calls.at(-1)?.[1] as string;
  const payload = mocks.callableFn.mock.calls.at(-1)?.[0];
  return { name, payload };
}

beforeEach(() => {
  mocks.ensureClientAuth.mockClear();
  mocks.callableFn.mockReset();
  mocks.httpsCallable.mockReset();
  mocks.httpsCallable.mockReturnValue(mocks.callableFn);
  mocks.ref.mockReset();
  mocks.uploadBytes.mockReset();
  mocks.getDownloadURL.mockReset();
});

describe("branches.api callables", () => {
  it("lists branches and maps the serialized shape", async () => {
    respond({ ok: true, items: [RAW_BRANCH] });
    const items = await listBranches({ includeArchived: true });
    expect(mocks.ensureClientAuth).toHaveBeenCalledTimes(1);
    expect(mocks.ensureClientAuth.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.callableFn.mock.invocationCallOrder[0],
    );
    expect(lastCall()).toEqual({
      name: "vendor_branches-listVendorBranches",
      payload: { includeArchived: true },
    });
    expect(items).toEqual([RAW_BRANCH]);
  });

  it("defaults includeArchived to false and tolerates a missing items list", async () => {
    respond({ ok: true });
    expect(await listBranches()).toEqual([]);
    expect(lastCall().payload).toEqual({ includeArchived: false });
  });

  it("zeroes home visit values when disabled and defaults bad fields", async () => {
    respond({
      ok: true,
      items: [
        {
          branchId: "b2",
          homeVisit: { enabled: false, feePiastres: 99, radiusMeters: 99 },
          status: "weird",
          location: null,
        },
      ],
    });
    const [branch] = await listBranches();
    expect(branch.homeVisit).toEqual({ enabled: false, feePiastres: 0, radiusMeters: 0 });
    expect(branch.status).toBe("active");
    expect(branch.location).toBeNull();
    expect(branch.serviceCount).toBe(0);
  });

  it("gets one branch with its services", async () => {
    respond({ ok: true, branch: RAW_BRANCH, services: [RAW_SERVICE] });
    const detail = await getBranch("b1", { includeArchived: true });
    expect(lastCall()).toEqual({
      name: "vendor_branches-getVendorBranch",
      payload: { branchId: "b1", includeArchived: true },
    });
    expect(detail.branch.branchId).toBe("b1");
    expect(detail.services).toEqual([RAW_SERVICE]);
  });

  it("creates, updates and archives a branch without sending a vendorId", async () => {
    const payload = {
      name: "Nasr City",
      address: "12 Abbas El Akkad",
      location: { lat: 30.05, lng: 31.34 },
      phone: "0100000000",
      homeVisit: { enabled: false, feePiastres: 0, radiusMeters: 0 },
    };
    respond({ ok: true, branch: RAW_BRANCH });
    await createBranch(payload);
    expect(lastCall()).toEqual({ name: "vendor_branches-createVendorBranch", payload });

    respond({ ok: true, branch: RAW_BRANCH });
    await updateBranch("b1", { name: "New" });
    expect(lastCall()).toEqual({
      name: "vendor_branches-updateVendorBranch",
      payload: { branchId: "b1", name: "New" },
    });

    respond({ ok: true, branch: { ...RAW_BRANCH, status: "archived" } });
    const archived = await setBranchStatus("b1", "archived");
    expect(lastCall()).toEqual({
      name: "vendor_branches-setVendorBranchStatus",
      payload: { branchId: "b1", status: "archived" },
    });
    expect(archived.status).toBe("archived");

    for (const call of mocks.callableFn.mock.calls) {
      expect(call[0]).not.toHaveProperty("vendorId");
    }
  });

  it("creates, updates and archives services", async () => {
    respond({ ok: true, service: RAW_SERVICE });
    const service = await createService("b1", {
      nameEn: "Checkup",
      nameAr: "كشف",
      pricePiastres: 25000,
      durationMinutes: 30,
    });
    expect(lastCall()).toEqual({
      name: "vendor_branches-createVendorBranchService",
      payload: {
        branchId: "b1",
        nameEn: "Checkup",
        nameAr: "كشف",
        pricePiastres: 25000,
        durationMinutes: 30,
      },
    });
    expect(service).toEqual(RAW_SERVICE);

    respond({ ok: true, service: RAW_SERVICE });
    await updateService("b1", "s1", { pricePiastres: 30000 });
    expect(lastCall()).toEqual({
      name: "vendor_branches-updateVendorBranchService",
      payload: { branchId: "b1", serviceId: "s1", pricePiastres: 30000 },
    });

    respond({ ok: true, service: { ...RAW_SERVICE, status: "archived" } });
    await setServiceStatus("b1", "s1", "archived");
    expect(lastCall()).toEqual({
      name: "vendor_branches-setVendorBranchServiceStatus",
      payload: { branchId: "b1", serviceId: "s1", status: "archived" },
    });
  });

  it("duplicates all services or only the selected ones", async () => {
    respond({ ok: true, created: 2, skipped: 1, services: [RAW_SERVICE] });
    const all = await duplicateServices({
      fromBranchId: "b1",
      toBranchId: "b2",
      skipExisting: true,
    });
    expect(lastCall()).toEqual({
      name: "vendor_branches-duplicateVendorBranchServices",
      payload: { fromBranchId: "b1", toBranchId: "b2", skipExisting: true },
    });
    expect(all).toMatchObject({ created: 2, skipped: 1 });

    respond({ ok: true, created: 1, skipped: 0, services: [] });
    await duplicateServices({
      fromBranchId: "b1",
      toBranchId: "b2",
      serviceIds: ["s1"],
      skipExisting: false,
    });
    expect(lastCall().payload).toEqual({
      fromBranchId: "b1",
      toBranchId: "b2",
      serviceIds: ["s1"],
      skipExisting: false,
    });
  });

  it("maps branch deals and falls back to the default for bad rows", async () => {
    respond({
      ok: true,
      defaultPercent: 12,
      applyToAllBranches: false,
      effectiveFromMs: 5,
      vendorDeal: { type: "both", fixedFeePerOrderPiastres: 500, percentage: 8 },
      branches: [
        {
          branchId: "b1",
          name: "A",
          status: "active",
          deal: {
            source: "branchOverride",
            type: "fixed",
            fixedFeePerOrderPiastres: 1000,
            percentage: 0,
          },
        },
        { branchId: "b2", name: "B", status: "archived", deal: { source: "nope" } },
      ],
    });
    const deals = await getBranchDeals();
    expect(lastCall()).toEqual({ name: "vendor_branches-getVendorBranchDeals", payload: {} });
    expect(deals.defaultPercent).toBe(12);
    expect(deals.applyToAllBranches).toBe(false);
    expect(deals.vendorDeal).toEqual({
      type: "both",
      fixedFeePerOrderPiastres: 500,
      percentage: 8,
    });
    expect(deals.branches[0].deal).toEqual({
      source: "branchOverride",
      type: "fixed",
      fixedFeePerOrderPiastres: 1000,
      percentage: 0,
    });
    expect(deals.branches[1].deal).toEqual({
      source: "default",
      type: "percentage",
      fixedFeePerOrderPiastres: 0,
      percentage: 12,
    });
  });

  it("maps a pending applicant's deals (no deal yet)", async () => {
    respond({
      ok: true,
      defaultPercent: 10,
      applyToAllBranches: null,
      effectiveFromMs: null,
      vendorDeal: null,
      branches: [],
    });
    const deals = await getBranchDeals();
    expect(deals).toEqual({
      defaultPercent: 10,
      applyToAllBranches: null,
      effectiveFromMs: null,
      vendorDeal: null,
      branches: [],
    });
  });

  it("uploads a service photo to the service folder, then updates photoUrl", async () => {
    mocks.ref.mockImplementation((_storage: unknown, path: string) => ({ path }));
    mocks.uploadBytes.mockResolvedValue(undefined);
    mocks.getDownloadURL.mockResolvedValue("https://firebasestorage.googleapis.com/x");
    respond({ ok: true, service: { ...RAW_SERVICE, photoUrl: "https://firebasestorage.googleapis.com/x" } });

    const file = new File(["x"], "my photo.png", { type: "image/png" });
    const updated = await attachServicePhoto({
      vendorId: "uid1",
      branchId: "b1",
      serviceId: "s1",
      file,
    });

    expect(mocks.ensureClientAuth.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.uploadBytes.mock.invocationCallOrder[0],
    );
    const path = mocks.ref.mock.calls[0][1] as string;
    expect(path).toMatch(/^vendors\/uid1\/branches\/b1\/services\/s1\/\d+_my_photo\.png$/);
    expect(lastCall()).toEqual({
      name: "vendor_branches-updateVendorBranchService",
      payload: {
        branchId: "b1",
        serviceId: "s1",
        photoUrl: "https://firebasestorage.googleapis.com/x",
      },
    });
    expect(updated.photoUrl).toBe("https://firebasestorage.googleapis.com/x");
  });

  it("propagates callable errors for the caller to map", async () => {
    mocks.callableFn.mockRejectedValueOnce({
      code: "functions/failed-precondition",
      message: "Branch limit reached.",
    });
    await expect(listBranches()).rejects.toMatchObject({ code: "functions/failed-precondition" });
  });
});

describe("mapBranchesError", () => {
  it.each([
    [{ code: "functions/invalid-argument", message: "location is outside Egypt." }, "outsideEgypt"],
    [{ code: "functions/invalid-argument", message: "Invalid location." }, "invalidLocation"],
    [{ code: "functions/invalid-argument", message: "Invalid name." }, "invalidField"],
    [{ code: "functions/failed-precondition", message: "Branch limit reached." }, "limit"],
    [{ code: "functions/failed-precondition", message: "Service limit reached." }, "limit"],
    [{ code: "functions/failed-precondition", message: "Branch is archived." }, "archived"],
    [{ code: "functions/not-found", message: "Branch not found." }, "notFound"],
    [{ code: "functions/permission-denied", message: "Account is suspended." }, "notAllowed"],
    [{ code: "functions/unauthenticated", message: "" }, "notAllowed"],
    [{ code: "functions/internal", message: "boom" }, "generic"],
    [new Error("network"), "generic"],
    [null, "generic"],
  ])("maps %o to %s", (error, key) => {
    expect(mapBranchesError(error)).toBe(key);
  });
});
