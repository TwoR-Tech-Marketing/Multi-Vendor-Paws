import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  snap: { exists: false, data: () => undefined as unknown },
  doc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/firebase-admin", () => ({
  getAdminFirestore: () => ({
    collection: (name: string) => ({
      doc: (id: string) => {
        mocks.doc(name, id);
        return { get: async () => mocks.snap };
      },
    }),
  }),
}));

import { getVendorPreferencesAdmin } from "@/features/vendor/infrastructure/vendor-preferences.admin.repository";

beforeEach(() => {
  mocks.doc.mockReset();
  mocks.snap = { exists: false, data: () => undefined };
});

describe("getVendorPreferencesAdmin", () => {
  it("returns null without a vendors document (preferences stay on the device)", async () => {
    await expect(getVendorPreferencesAdmin("v1")).resolves.toBeNull();
    expect(mocks.doc).toHaveBeenCalledWith("vendors", "v1");
  });

  it("fills defaults when the field is absent", async () => {
    mocks.snap = { exists: true, data: () => ({ storeName: "Store" }) };
    await expect(getVendorPreferencesAdmin("v1")).resolves.toEqual({
      theme: "tenderpaws",
      mode: "system",
      language: "en",
    });
  });

  it("returns stored values and fills missing keys", async () => {
    mocks.snap = { exists: true, data: () => ({ preferences: { theme: "cobalt", language: "ar" } }) };
    await expect(getVendorPreferencesAdmin("v1")).resolves.toEqual({
      theme: "cobalt",
      mode: "system",
      language: "ar",
    });
  });
});
