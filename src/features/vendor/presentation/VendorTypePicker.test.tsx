import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EMPTY_PROVIDER_TEXT_FIELDS } from "@/features/vendor/domain/provider-profile-schema";
import { ProviderFieldsInputs } from "@/features/vendor/presentation/ProviderFieldsInputs";
import { VendorTypePicker } from "@/features/vendor/presentation/VendorTypePicker";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};

describe("VendorTypePicker", () => {
  it("renders the four types with store checked by default", () => {
    const html = renderToStaticMarkup(
      <VendorTypePicker strings={en} value="store" onChange={noop} />,
    );
    for (const type of ["store", "clinic", "groomer", "doctor"] as const) {
      expect(html).toContain(`value="${type}"`);
      expect(html).toContain(en.vendorTypes[type].label);
    }
    expect(html.match(/checked=""/g)).toHaveLength(1);
    expect(html).toMatch(/checked="" value="store"/);
  });

  it("renders Arabic labels and marks the chosen type", () => {
    const html = renderToStaticMarkup(
      <VendorTypePicker strings={ar} value="doctor" onChange={noop} />,
    );
    expect(html).toContain(ar.vendorTypes.doctor.label);
    expect(html).toMatch(/checked="" value="doctor"/);
  });
});

describe("ProviderFieldsInputs", () => {
  function render(vendorType: string) {
    return renderToStaticMarkup(
      <ProviderFieldsInputs
        strings={en}
        vendorType={vendorType}
        value={EMPTY_PROVIDER_TEXT_FIELDS}
        onChange={noop}
      />,
    );
  }

  it("renders the fields of each type only", () => {
    expect(render("store")).toBe("");
    expect(render("groomer")).toBe("");
    expect(render("doctor")).toContain(en.vendorTypes.providerFields.specialty);
    expect(render("doctor")).not.toContain(en.vendorTypes.providerFields.education);
    const clinic = render("clinic");
    expect(clinic).toContain(en.vendorTypes.providerFields.education);
    expect(clinic).toContain(en.vendorTypes.providerFields.experience);
    expect(clinic).not.toContain(en.vendorTypes.providerFields.specialty);
  });
});
