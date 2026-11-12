import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  context: null as unknown,
  submit: vi.fn(),
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
  getVendorStoreProfileAdmin: vi.fn(),
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

function contextFor(sessionKind: string) {
  return {
    uid: "v1",
    vendorId: "v1",
    session: {
      sessionKind,
      user: { uid: "v1", email: "a@example.com" },
      profile: { vendorId: "v1", vendorType: "store" },
    },
  };
}

function patch() {
  return PATCH(
    new Request("http://localhost/api/vendor/profile", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  );
}

describe("PATCH /api/vendor/profile", () => {
  beforeEach(() => {
    mocks.submit.mockReset();
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
});
