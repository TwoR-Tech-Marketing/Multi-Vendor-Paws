import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getStrings } from "@/shared/i18n/get-strings";
import { makeBranch } from "@/features/branches/presentation/test-fixtures";

const state = vi.hoisted(() => ({ locale: "en" as "en" | "ar" }));

vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return { useStrings: () => load(state.locale) };
});

import { BranchForm, initialBranchValues } from "@/features/branches/presentation/BranchForm";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};

describe("BranchForm", () => {
  it("renders the add form with every field label, the map and Cairo default", () => {
    const html = renderToStaticMarkup(
      <BranchForm isSaving={false} serverError={null} onSubmit={noop} onCancel={noop} />,
    );
    expect(html).toContain(en.branches.add);
    for (const label of [
      en.branches.fields.name,
      en.branches.fields.address,
      en.branches.fields.location,
      en.branches.fields.phone,
      en.branches.fields.homeVisit,
    ]) {
      expect(html).toContain(label);
    }
    expect(html).toContain('value="30.0444"');
    expect(html).toContain('role="application"');
    expect(html).not.toContain(en.branches.fields.homeVisitFee);
  });

  it("prefills an existing branch with the home visit fee in EGP", () => {
    const branch = makeBranch({
      homeVisit: { enabled: true, feePiastres: 15025, radiusMeters: 3000 },
    });
    const html = renderToStaticMarkup(
      <BranchForm branch={branch} isSaving={false} serverError={null} onSubmit={noop} onCancel={noop} />,
    );
    expect(html).toContain(en.branches.edit);
    expect(html).toContain(en.branches.fields.homeVisitFee);
    expect(html).toContain('value="150.25"');
    expect(html).toContain('value="3000"');
    expect(initialBranchValues(branch).homeVisitFeeEgp).toBe("150.25");
  });

  it("shows the server error and the saving state", () => {
    const html = renderToStaticMarkup(
      <BranchForm
        isSaving
        serverError={en.errors.branches.outsideEgypt}
        onSubmit={noop}
        onCancel={noop}
      />,
    );
    expect(html).toContain(en.errors.branches.outsideEgypt);
    expect(html).toContain(en.branches.saving);
  });

  it("renders in Arabic", () => {
    state.locale = "ar";
    const html = renderToStaticMarkup(
      <BranchForm isSaving={false} serverError={null} onSubmit={noop} onCancel={noop} />,
    );
    expect(html).toContain(ar.branches.fields.name);
    expect(html).toContain(ar.branches.save);
    state.locale = "en";
  });
});
