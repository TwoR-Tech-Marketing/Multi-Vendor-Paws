import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  source: "bff" as "bff" | "callable",
  vendorApiGet: vi.fn(),
  vendorApiPatch: vi.fn(),
  callable: vi.fn(),
  httpsCallable: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: (...args: unknown[]) => {
    mocks.httpsCallable(...args);
    return mocks.callable;
  },
}));
vi.mock("@/lib/firebase", () => ({ firebaseFunctions: {} }));
vi.mock("@/lib/auth-client", () => {
  class ApiClientError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
    }
  }
  return { ApiClientError, vendorApiGet: mocks.vendorApiGet, vendorApiPatch: mocks.vendorApiPatch };
});
vi.mock("@/lib/vendor-data-source", () => ({
  getProfileDataSource: () => mocks.source,
}));
vi.mock("@/features/vendor/infrastructure/vendor-logo.storage", () => ({
  VENDOR_LOGO_MAX_BYTES: 5 * 1024 * 1024,
  uploadVendorProfileLogo: mocks.upload,
}));

import {
  fetchVendorProfileFromApi,
  fetchVendorProfileHistoryFromApi,
  isProfileHistoryAvailable,
  submitVendorProfileChangeFromApi,
  uploadVendorProfileLogoFromApi,
  type VendorProfileSubmitError,
} from "@/features/vendor/application/vendor-profile.api";
import { ApiClientError } from "@/lib/auth-client";

const createdAtMs = Date.UTC(2026, 10, 1, 8, 0, 0);
const reviewedAtMs = Date.UTC(2026, 10, 3, 9, 30, 0);

const rawRequest = {
  id: "r1",
  status: "rejected",
  ownerName: "Owner",
  phone: "0100",
  storeName: "Happy Tails",
  storeDescription: "Pet food",
  contactPhone: "0100",
  contactEmail: "shop@example.com",
  contactAddress: "Cairo",
  logoUrl: null,
  createdAtMs,
  reviewedAtMs,
  reviewNotes: "Logo is blurry",
};

const payload = {
  ownerName: "Owner",
  phone: "0100",
  storeName: "Happy Tails",
  storeDescription: "Pet food",
  contactPhone: "0100",
  contactEmail: "shop@example.com",
  contactAddress: "Cairo",
  logoUrl: "https://cdn.example.com/logo.png",
};

async function submitError(): Promise<VendorProfileSubmitError> {
  try {
    await submitVendorProfileChangeFromApi(payload);
  } catch (caught) {
    return caught as VendorProfileSubmitError;
  }
  throw new Error("expected a failure");
}

describe("vendor-profile.api", () => {
  beforeEach(() => {
    for (const fn of [
      mocks.vendorApiGet,
      mocks.vendorApiPatch,
      mocks.callable,
      mocks.httpsCallable,
      mocks.upload,
    ]) {
      fn.mockReset();
    }
  });

  describe("bff (default)", () => {
    beforeEach(() => {
      mocks.source = "bff";
    });

    it("reads the BFF route and parses ISO dates", async () => {
      mocks.vendorApiGet.mockResolvedValue({
        profile: {
          vendorId: "v1",
          createdAt: "2026-11-01T08:00:00.000Z",
          updatedAt: null,
          restrictionExpiresAt: null,
        },
        pendingChange: null,
        lastRejectedChange: { id: "r1", createdAt: "2026-11-01T08:00:00.000Z", reviewedAt: null },
      });
      const snapshot = await fetchVendorProfileFromApi();
      expect(mocks.vendorApiGet).toHaveBeenCalledWith("/api/vendor/profile");
      expect(mocks.callable).not.toHaveBeenCalled();
      expect(snapshot.profile.createdAt?.getTime()).toBe(createdAtMs);
      expect(snapshot.lastRejectedChange?.createdAt?.getTime()).toBe(createdAtMs);
      expect(isProfileHistoryAvailable()).toBe(false);
    });

    it("patches the BFF route without a source field", async () => {
      mocks.vendorApiPatch.mockResolvedValue({ success: true });
      await submitVendorProfileChangeFromApi(payload);
      expect(mocks.vendorApiPatch).toHaveBeenCalledWith("/api/vendor/profile", payload);
      expect(mocks.callable).not.toHaveBeenCalled();
    });

    it("maps 409 to pending_exists and 403 to not_allowed", async () => {
      mocks.vendorApiPatch.mockRejectedValueOnce(new ApiClientError("x", 409));
      expect((await submitError()).reason).toBe("pending_exists");
      mocks.vendorApiPatch.mockRejectedValueOnce(new ApiClientError("x", 403));
      expect((await submitError()).reason).toBe("not_allowed");
      mocks.vendorApiPatch.mockRejectedValueOnce(new ApiClientError("x", 500));
      expect((await submitError()).reason).toBe("failed");
    });
  });

  describe("callable", () => {
    beforeEach(() => {
      mocks.source = "callable";
    });

    it("maps the get callable response, millis to Date", async () => {
      mocks.callable.mockResolvedValue({
        data: {
          ok: true,
          profile: {
            vendorId: "v1",
            ownerName: "Owner",
            email: "a@example.com",
            phone: "0100",
            storeName: "Happy Tails",
            storeDescription: "Pet food",
            contactPhone: "0100",
            contactEmail: "shop@example.com",
            contactAddress: "Cairo",
            logoUrl: null,
            vendorType: "clinic",
            providerProfile: { education: "Cairo University" },
            status: "suspended",
            restrictionType: "suspend",
            restrictionReason: "Late orders",
            restrictionExpiresAtMs: reviewedAtMs,
            isPermanentRestriction: false,
            createdAtMs,
            updatedAtMs: null,
          },
          pendingChange: {
            ...rawRequest,
            id: "p1",
            status: "pending",
            reviewedAtMs: null,
            reviewNotes: null,
          },
          lastRejectedChange: rawRequest,
          canSubmitChange: false,
        },
      });

      const snapshot = await fetchVendorProfileFromApi();

      expect(mocks.httpsCallable).toHaveBeenCalledWith({}, "vendor_profile-getMyVendorProfile");
      expect(mocks.vendorApiGet).not.toHaveBeenCalled();
      expect(snapshot.profile.createdAt).toEqual(new Date(createdAtMs));
      expect(snapshot.profile.updatedAt).toBeNull();
      expect(snapshot.profile.restrictionExpiresAt).toEqual(new Date(reviewedAtMs));
      expect(snapshot.profile.restrictionType).toBe("suspend");
      expect(snapshot.profile.restrictionReason).toBe("Late orders");
      expect(snapshot.profile.vendorType).toBe("clinic");
      expect(snapshot.profile.providerProfile).toEqual({ education: "Cairo University" });
      expect(snapshot.pendingChange).toMatchObject({
        id: "p1",
        status: "pending",
        vendorId: "v1",
        authUid: "v1",
        reviewedAt: null,
      });
      expect(snapshot.lastRejectedChange?.reviewedAt).toEqual(new Date(reviewedAtMs));
      expect(snapshot.lastRejectedChange?.reviewNotes).toBe("Logo is blurry");
    });

    it("leaves restriction fields out for an active profile", async () => {
      mocks.callable.mockResolvedValue({
        data: {
          profile: { vendorId: "v1", status: "active", createdAtMs },
          pendingChange: null,
          lastRejectedChange: null,
        },
      });
      const snapshot = await fetchVendorProfileFromApi();
      expect(snapshot.profile.restrictionType).toBeUndefined();
      expect(snapshot.profile.vendorType).toBe("store");
      expect(snapshot.pendingChange).toBeNull();
    });

    it("submits through the callable with source portal and the current logo", async () => {
      mocks.callable.mockResolvedValue({ data: { ok: true, request: rawRequest } });
      await submitVendorProfileChangeFromApi(payload);
      expect(mocks.httpsCallable).toHaveBeenCalledWith(
        {},
        "vendor_profile-submitMyVendorProfileChange",
      );
      expect(mocks.callable).toHaveBeenCalledWith({ ...payload, source: "portal" });
      expect(mocks.vendorApiPatch).not.toHaveBeenCalled();
    });

    it("sends logoUrl null when there is no logo", async () => {
      mocks.callable.mockResolvedValue({ data: { ok: true } });
      await submitVendorProfileChangeFromApi({ ...payload, logoUrl: undefined });
      expect(mocks.callable.mock.calls[0][0]).toMatchObject({ logoUrl: null });
    });

    it("maps callable error codes, never the raw message", async () => {
      mocks.callable.mockRejectedValueOnce({ code: "functions/already-exists", message: "raw" });
      expect((await submitError()).reason).toBe("pending_exists");
      mocks.callable.mockRejectedValueOnce({ code: "functions/failed-precondition", message: "raw" });
      const notAllowed = await submitError();
      expect(notAllowed.reason).toBe("not_allowed");
      expect(notAllowed.message).not.toContain("raw");
      mocks.callable.mockRejectedValueOnce({ code: "functions/internal" });
      expect((await submitError()).reason).toBe("failed");
      mocks.callable.mockRejectedValueOnce(new Error("network"));
      expect((await submitError()).reason).toBe("failed");
    });

    it("lists history pages with a cursor and maps dates", async () => {
      mocks.callable.mockResolvedValue({ data: { ok: true, items: [rawRequest], nextCursor: "r1" } });
      const page = await fetchVendorProfileHistoryFromApi("r0");
      expect(mocks.httpsCallable).toHaveBeenCalledWith(
        {},
        "vendor_profile-listMyVendorProfileChangeRequests",
      );
      expect(mocks.callable).toHaveBeenCalledWith({ pageSize: 20, cursor: "r0" });
      expect(page.nextCursor).toBe("r1");
      expect(page.items[0]).toMatchObject({
        id: "r1",
        status: "rejected",
        reviewNotes: "Logo is blurry",
      });
      expect(page.items[0].createdAt).toEqual(new Date(createdAtMs));
      expect(isProfileHistoryAvailable()).toBe(true);
    });

    it("returns an empty last page", async () => {
      mocks.callable.mockResolvedValue({ data: { ok: true, items: [], nextCursor: null } });
      expect(await fetchVendorProfileHistoryFromApi(null)).toEqual({ items: [], nextCursor: null });
    });
  });

  describe("logo upload", () => {
    it("uploads under the vendor folder", async () => {
      mocks.upload.mockResolvedValue("https://cdn.example.com/new.png");
      const file = new File(["x"], "logo.png", { type: "image/png" });
      expect(await uploadVendorProfileLogoFromApi("v1", file)).toBe(
        "https://cdn.example.com/new.png",
      );
      expect(mocks.upload).toHaveBeenCalledWith("v1", file);
    });

    it("refuses a logo over the limit without uploading", async () => {
      const file = new File(["x"], "logo.png", { type: "image/png" });
      Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 });
      await expect(uploadVendorProfileLogoFromApi("v1", file)).rejects.toMatchObject({
        reason: "logo_too_large",
      });
      expect(mocks.upload).not.toHaveBeenCalled();
    });
  });
});
