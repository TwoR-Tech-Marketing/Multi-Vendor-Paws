import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getStrings } from "@/shared/i18n/get-strings";

const locale = vi.hoisted(() => ({ current: "en" as "en" | "ar" }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/features/auth/infrastructure/vendor-signup.service", () => ({
  submitVendorSignupRequest: vi.fn(),
  uploadSignupLogo: vi.fn(),
}));
vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return { useStrings: () => load(locale.current) };
});

import { RegisterClient } from "@/features/auth/presentation/RegisterClient";

describe("RegisterClient", () => {
  it.each(["en", "ar"] as const)("renders the account step from %s strings", (lang) => {
    locale.current = lang;
    const strings = getStrings(lang);
    const html = renderToStaticMarkup(<RegisterClient />);

    expect(html).toContain(strings.signup.title);
    expect(html).toContain(strings.signup.steps.account);
    expect(html).toContain(strings.signup.steps.business);
    expect(html).toContain(strings.signup.sections.account);
    expect(html).toContain(strings.signup.fields.ownerName);
    expect(html).toContain(strings.signup.fields.confirmPassword);
    expect(html).toContain(strings.signup.continue);
  });

  it("shows no English copy in Arabic", () => {
    locale.current = "ar";
    const html = renderToStaticMarkup(<RegisterClient />);
    const en = getStrings("en");
    for (const text of [
      en.signup.title,
      en.signup.fields.ownerName,
      en.signup.hints.email,
      en.signup.continue,
      "Owner",
      "Password",
    ]) {
      expect(html).not.toContain(text);
    }
  });
});
