import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  accountStepError,
  contactStepError,
  logoFileError,
  signupSubmitError,
  type RegisterError,
} from "@/features/auth/domain/register-errors";
import { RegisterErrorAlert } from "@/features/auth/presentation/RegisterErrorAlert";
import { getStrings } from "@/shared/i18n/get-strings";

type Lang = "en" | "ar";

const locale = vi.hoisted(() => ({ current: "en" as "en" | "ar" }));

vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return { useStrings: () => load(locale.current) };
});

const validAccount = {
  ownerName: "Owner",
  email: "owner@store.com",
  phone: "0100",
  password: "password1",
  confirmPassword: "password1",
};

function render(error: RegisterError | null, lang: Lang): string {
  locale.current = lang;
  return renderToStaticMarkup(<RegisterErrorAlert error={error} />);
}

describe("RegisterErrorAlert", () => {
  afterEach(() => {
    locale.current = "en";
  });

  it.each(["en", "ar"] as const)("shows localized account step errors in %s", (lang) => {
    const strings = getStrings(lang);
    const short = accountStepError({ ...validAccount, password: "short", confirmPassword: "short" });
    const mismatch = accountStepError({ ...validAccount, confirmPassword: "different1" });
    const missing = accountStepError({ ...validAccount, ownerName: "  " });
    const email = accountStepError({ ...validAccount, email: "not-an-email" });

    expect(render(short, lang)).toContain(strings.signup.errors.passwordShort);
    expect(render(mismatch, lang)).toContain(strings.signup.errors.passwordMismatch);
    expect(render(missing, lang)).toContain(strings.signup.errors.required);
    expect(render(email, lang)).toContain(strings.signup.errors.emailInvalid);
    expect(render(short, lang)).toContain('role="alert"');
  });

  it.each(["en", "ar"] as const)(
    "shows localized terms, contact, logo and submit errors in %s",
    (lang) => {
      const strings = getStrings(lang);
      const contact = contactStepError({
        contactPhone: "0100",
        contactEmail: "x",
        contactAddress: "Cairo",
      });
      const logo = logoFileError({ size: 6 * 1024 * 1024, type: "image/png" });

      expect(render({ source: "terms" }, lang)).toContain(strings.signup.termsRequired);
      expect(render(contact, lang)).toContain(strings.signup.errors.emailInvalid);
      expect(render(logo, lang)).toContain(strings.signup.errors.logoTooLarge);
      expect(render({ source: "vendorType", key: "specialtyRequired" }, lang)).toContain(
        strings.vendorTypes.errors.specialtyRequired,
      );
      expect(render(signupSubmitError({ code: "functions/already-exists" }), lang)).toContain(
        strings.signup.errors.emailInUse,
      );
      expect(render(signupSubmitError({ code: "functions/invalid-argument" }), lang)).toContain(
        strings.signup.errors.invalid,
      );
      expect(render(signupSubmitError(new Error("raw backend text")), lang)).toContain(
        strings.errors.generic,
      );
    },
  );

  it("never shows the English copy in Arabic", () => {
    const html = render({ source: "signup", key: "passwordMismatch" }, "ar");
    expect(html).not.toContain(getStrings("en").signup.errors.passwordMismatch);
  });

  it("renders nothing without an error and accepts valid input", () => {
    expect(render(null, "en")).toBe("");
    expect(accountStepError(validAccount)).toBeNull();
    expect(logoFileError({ size: 1024, type: "image/png" })).toBeNull();
  });
});
