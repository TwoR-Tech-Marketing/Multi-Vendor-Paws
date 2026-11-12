import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { VendorProfile } from "@/features/auth/domain/types";
import { RejectedReapplyForm } from "@/features/vendor/presentation/RejectedReapplyForm";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return { useStrings: () => load("en") };
});

const profile: VendorProfile = {
  vendorId: "v1",
  ownerName: "Owner",
  email: "a@b.co",
  storeName: "Name",
  status: "rejected" as VendorProfile["status"],
  vendorType: "doctor",
};

describe("RejectedReapplyForm", () => {
  it("starts from the stored type with its labels and provider fields", () => {
    const html = renderToStaticMarkup(<RejectedReapplyForm profile={profile} />);
    expect(html).toMatch(/checked="" value="doctor"/);
    expect(html).toContain(en.vendorTypes.doctor.fields.storeName);
    expect(html).toContain(en.vendorTypes.providerFields.specialty);
  });

  it("keeps store labels for store applicants", () => {
    const html = renderToStaticMarkup(
      <RejectedReapplyForm profile={{ ...profile, vendorType: "store" }} />,
    );
    expect(html).toMatch(/checked="" value="store"/);
    expect(html).toContain(en.vendorTypes.store.fields.storeName);
    expect(html).not.toContain(en.vendorTypes.providerFields.specialty);
  });

  it("prefills the stored provider fields", () => {
    const html = renderToStaticMarkup(
      <RejectedReapplyForm profile={profile} storedProviderProfile={{ specialty: "Surgery" }} />,
    );
    expect(html).toContain('value="Surgery"');
  });

  it("selects no type when the stored type is unknown", () => {
    const html = renderToStaticMarkup(
      <RejectedReapplyForm profile={{ ...profile, vendorType: "hotel" }} />,
    );
    expect(html).not.toContain('checked=""');
    expect(html).toContain(en.vendorTypes.unknown.fields.storeName);
  });
});
