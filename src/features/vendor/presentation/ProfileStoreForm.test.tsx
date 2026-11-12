import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { VendorStoreProfile } from "@/features/vendor/domain/types";
import { ProfileStoreForm } from "@/features/vendor/presentation/ProfileStoreForm";
import { getStrings } from "@/shared/i18n/get-strings";

vi.mock("@/features/vendor/application/vendor-profile.api", () => ({
  submitVendorProfileChangeFromApi: vi.fn(),
  uploadVendorProfileLogoFromApi: vi.fn(),
  VendorProfileSubmitError: class extends Error {},
}));

const en = getStrings("en");

const store: VendorStoreProfile = {
  vendorId: "v1",
  ownerName: "Owner",
  email: "a@b.co",
  phone: "0100",
  storeName: "Happy Tails",
  storeDescription: "Pet food",
  contactPhone: "0100",
  contactEmail: "c@b.co",
  contactAddress: "Cairo",
  logoUrl: null,
  vendorType: "store",
  providerProfile: {},
  status: "active",
};

function render(
  profile: VendorStoreProfile,
  lock: { disabled: boolean; lockedReason: "notApproved" | "suspended" | null } = {
    disabled: false,
    lockedReason: null,
  },
) {
  return renderToStaticMarkup(
    <ProfileStoreForm
      strings={en}
      profile={profile}
      pendingChange={null}
      lastRejectedChange={null}
      disabled={lock.disabled}
      lockedReason={lock.lockedReason}
      onSubmitted={async () => {}}
    />,
  );
}

describe("ProfileStoreForm", () => {
  it("keeps today's store form: no type row, store labels, no provider fields", () => {
    const html = render(store);
    expect(html).not.toContain(en.vendorTypes.profileRow);
    expect(html).toContain(en.profile.fields.storeName);
    expect(html).toContain(en.profile.fields.storeDescription);
    expect(html).toContain(en.profile.fields.logo);
    expect(html).not.toContain(en.vendorTypes.providerFields.education);
  });

  it("shows the type, type labels and provider fields for a clinic", () => {
    const html = render({
      ...store,
      vendorType: "clinic",
      providerProfile: { education: "Cairo University" },
    });
    expect(html).toContain(en.vendorTypes.profileRow);
    expect(html).toContain(en.vendorTypes.clinic.label);
    expect(html).toContain(en.vendorTypes.clinic.fields.storeName);
    expect(html).toContain(en.vendorTypes.providerFields.education);
    expect(html).toContain("Cairo University");
  });

  it("shows the doctor specialty", () => {
    const html = render({ ...store, vendorType: "doctor", providerProfile: { specialty: "Surgery" } });
    expect(html).toContain(en.vendorTypes.doctor.fields.storeDescription);
    expect(html).toContain('value="Surgery"');
  });

  it("lets an active vendor request changes with no lock note", () => {
    const html = render(store);
    expect(html).toContain(en.profile.requestChangesCta);
    expect(html).not.toContain(en.profile.changeAfterApproval);
  });

  it("is view only for a pending vendor, with the after approval note", () => {
    const html = render({ ...store, status: "pending" }, { disabled: true, lockedReason: "notApproved" });
    expect(html).toContain(en.profile.changeAfterApproval);
    expect(html).not.toContain(en.profile.requestChangesCta);
  });

  it("is view only for a suspended vendor, with the suspended note", () => {
    const html = render({ ...store, status: "suspended" }, { disabled: true, lockedReason: "suspended" });
    expect(html).toContain(en.profile.changeSuspended);
    expect(html).not.toContain(en.profile.requestChangesCta);
  });
});
