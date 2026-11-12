import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  context: null as unknown,
  submit: vi.fn(),
  storedProfile: vi.fn(),
}));

vi.mock("@/lib/auth/require-vendor-api", () => ({
  getVendorApiContext: async () => mocks.context,
}));
vi.mock("@/features/vendor/infrastructure/vendor-profile-change.admin.repository", () => ({
  getLatestRejectedProfileChangeRequestAdmin: vi.fn(),
  getPendingProfileChangeRequestAdmin: vi.fn(),
  submitProfileChangeRequestAdmin: mocks.submit,
}));
vi.mock("@/features/vendor/infrastructure/vendor-store-profile.admin.repository", () => ({
  getVendorStoreProfileAdmin: mocks.storedProfile,
}));
vi.mock("@/lib/firebase-admin", () => ({
  getDefaultStorageBucket: () => "b1",
}));

import { PATCH } from "@/app/api/vendor/profile/route";

const body = {
  ownerName: "Owner",
  phone: "0100",
  storeName: "Happy Tails",
  storeDescription: "Pet food",
  contactPhone: "0100",
  contactEmail: "shop@example.com",
  contactAddress: "Cairo",
  logoUrl: null,
};

function contextFor(sessionKind: string, vendorType = "store") {
  return {
    uid: "v1",
    vendorId: "v1",
    session: {
      sessionKind,
      user: { uid: "v1", email: "a@example.com" },
      profile: { vendorId: "v1", vendorType },
    },
  };
}

function patch(extra: Record<string, unknown> = {}) {
  return PATCH(
    new Request("http://localhost/api/vendor/profile", {
      method: "PATCH",
      body: JSON.stringify({ ...body, ...extra }),
    }),
  );
}

function photoUrl(path: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/b1/o/${encodeURIComponent(path)}?alt=media`;
}

describe("PATCH /api/vendor/profile", () => {
  beforeEach(() => {
    mocks.submit.mockReset();
    mocks.storedProfile.mockReset();
    mocks.storedProfile.mockResolvedValue({
      providerProfile: { photoUrls: ["https://example.com/stored.jpg"] },
    });
  });

  it("refuses without a session", async () => {
    mocks.context = null;
    expect((await patch()).status).toBe(401);
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it.each(["pending", "rejected", "suspended", "banned"])(
    "refuses a %s vendor with 403 and writes nothing",
    async (kind) => {
      mocks.context = contextFor(kind);
      expect((await patch()).status).toBe(403);
      expect(mocks.submit).not.toHaveBeenCalled();
    },
  );

  it("creates the change request for an active vendor", async () => {
    mocks.context = contextFor("active");
    mocks.submit.mockResolvedValue(undefined);
    const response = await patch();
    expect(response.status).toBe(200);
    expect(mocks.submit).toHaveBeenCalledWith("v1", "v1", expect.objectContaining({ storeName: "Happy Tails" }));
  });

  it("keeps 409 when a request is already pending", async () => {
    mocks.context = contextFor("active");
    mocks.submit.mockRejectedValue(new Error("PENDING_CHANGE_EXISTS"));
    expect((await patch()).status).toBe(409);
  });

  describe("provider photos", () => {
    it("accepts own folder photos and stored photos for a clinic", async () => {
      mocks.context = contextFor("active", "clinic");
      mocks.submit.mockResolvedValue(undefined);
      const photoUrls = [photoUrl("vendors/v1/photos/1_a.jpg"), "https://example.com/stored.jpg"];
      const response = await patch({ providerProfile: { photoUrls } });
      expect(response.status).toBe(200);
      expect(mocks.submit).toHaveBeenCalledWith(
        "v1",
        "v1",
        expect.objectContaining({ providerProfile: { photoUrls } }),
      );
    });

    it("accepts an empty list to clear all photos", async () => {
      mocks.context = contextFor("active", "groomer");
      mocks.submit.mockResolvedValue(undefined);
      expect((await patch({ providerProfile: { photoUrls: [] } })).status).toBe(200);
    });

    it.each([
      ["another vendor folder", [photoUrl("vendors/v2/photos/1_a.jpg")]],
      ["an outside URL", ["https://example.com/new.jpg"]],
      ["duplicates", [photoUrl("vendors/v1/photos/1_a.jpg"), photoUrl("vendors/v1/photos/1_a.jpg")]],
      ["more than six", Array.from({ length: 7 }, (_, i) => photoUrl(`vendors/v1/photos/${i}.jpg`))],
    ])("refuses %s with 400 and writes nothing", async (_label, photoUrls) => {
      mocks.context = contextFor("active", "clinic");
      expect((await patch({ providerProfile: { photoUrls } })).status).toBe(400);
      expect(mocks.submit).not.toHaveBeenCalled();
    });

    it("refuses photos for a store", async () => {
      mocks.context = contextFor("active", "store");
      const photoUrls = [photoUrl("vendors/v1/photos/1_a.jpg")];
      expect((await patch({ providerProfile: { photoUrls } })).status).toBe(400);
    });

    it("does not load the stored profile when no photos are sent", async () => {
      mocks.context = contextFor("active");
      mocks.submit.mockResolvedValue(undefined);
      await patch();
      expect(mocks.storedProfile).not.toHaveBeenCalled();
    });
  });
});
