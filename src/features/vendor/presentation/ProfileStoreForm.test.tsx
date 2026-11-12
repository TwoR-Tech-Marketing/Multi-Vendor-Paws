import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type {
  VendorProfileChangeRequest,
  VendorStoreProfile,
} from "@/features/vendor/domain/types";
import { ProfileStoreForm } from "@/features/vendor/presentation/ProfileStoreForm";
import { getStrings } from "@/shared/i18n/get-strings";

vi.mock("@/features/vendor/application/vendor-profile.api", () => ({
  submitVendorProfileChangeFromApi: vi.fn(),
  uploadVendorProfileLogoFromApi: vi.fn(),
  uploadVendorProviderPhotoFromApi: vi.fn(),
  providerPhotoOwner: vi.fn(),
  VendorProfileSubmitError: class extends Error {},
}));

const en = getStrings("en");
const ar = getStrings("ar");

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
  options: { pendingChange?: VendorProfileChangeRequest | null; locale?: "en" | "ar" } = {},
) {
  return renderToStaticMarkup(
    <ProfileStoreForm
      strings={options.locale === "ar" ? ar : en}
      profile={profile}
      pendingChange={options.pendingChange ?? null}
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

  describe("provider photos", () => {
    const photos = ["https://example.com/p1.jpg", "https://example.com/p2.jpg"];

    it("shows the current photos with a shimmer per thumbnail for a clinic and a groomer", () => {
      for (const vendorType of ["clinic", "groomer"]) {
        const html = render({ ...store, vendorType, providerProfile: { photoUrls: photos } });
        expect(html).toContain(en.profile.photos.title);
        expect(html).toContain(en.profile.photos.hint.replace("{max}", "6"));
        expect(html).toContain('alt="Photo 1"');
        expect(html).toContain('alt="Photo 2"');
        expect(html.match(/aria-hidden="true"/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
      }
    });

    it("shows no photo grid for a store or a doctor, and the doctor keeps the logo as photo", () => {
      expect(render(store)).not.toContain(en.profile.photos.title);
      const doctor = render({ ...store, vendorType: "doctor", providerProfile: { specialty: "Surgery" } });
      expect(doctor).not.toContain(en.profile.photos.hint.replace("{max}", "6"));
      expect(doctor).toContain(en.vendorTypes.doctor.fields.logoUrl);
    });

    it("shows the empty note when a view only clinic has no photos", () => {
      const html = render(
        { ...store, vendorType: "clinic", status: "pending" },
        { disabled: true, lockedReason: "notApproved" },
      );
      expect(html).toContain(en.profile.photos.empty);
    });

    it("shows the requested photos of a pending change", () => {
      const pendingChange: VendorProfileChangeRequest = {
        ...store,
        id: "r1",
        authUid: "v1",
        status: "pending",
        providerProfile: { photoUrls: ["https://example.com/new.jpg"] },
      };
      const html = render(
        { ...store, vendorType: "groomer", providerProfile: { photoUrls: photos } },
        { disabled: false, lockedReason: null },
        { pendingChange },
      );
      expect(html).toContain(en.profile.photos.proposedTitle);
      expect(html).toContain("https://example.com/new.jpg");
    });

    it("says all photos are removed when a pending change clears them", () => {
      const pendingChange: VendorProfileChangeRequest = {
        ...store,
        id: "r1",
        authUid: "v1",
        status: "pending",
        providerProfile: { photoUrls: [] },
      };
      const html = render(
        { ...store, vendorType: "clinic", providerProfile: { photoUrls: photos } },
        { disabled: false, lockedReason: null },
        { pendingChange },
      );
      expect(html).toContain(en.profile.photos.cleared);
    });

    it("renders the photo copy in Arabic", () => {
      const html = render(
        { ...store, vendorType: "clinic", providerProfile: { photoUrls: photos } },
        undefined,
        { locale: "ar" },
      );
      expect(html).toContain(ar.profile.photos.title);
      expect(html).toContain(ar.profile.photos.alt.replace("{index}", "1"));
    });
  });
});
