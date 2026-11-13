import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ locale: "en" as "en" | "ar", params: "" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(state.params),
}));
vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings } = await import("@/shared/i18n/get-strings");
  return { useStrings: () => getStrings(state.locale) };
});
vi.mock("@/lib/auth", () => ({ signInVendorForIdToken: vi.fn(), signOutVendor: vi.fn() }));
vi.mock("@/lib/auth-client", () => ({
  createServerSession: vi.fn(),
  ApiClientError: class ApiClientError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
    }
  },
}));
vi.mock("@/lib/firebase", () => ({ firebaseAuth: {} }));
vi.mock("firebase/auth", () => ({ sendPasswordResetEmail: vi.fn() }));

import { authErrorMessage } from "@/features/auth/presentation/auth-copy";
import { ForgotPasswordClient } from "@/features/auth/presentation/ForgotPasswordClient";
import { LoginClient } from "@/features/auth/presentation/LoginClient";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");
const ar = getStrings("ar");

beforeEach(() => {
  state.locale = "en";
  state.params = "";
});

describe("LoginClient", () => {
  it("renders one h1 and labelled fields from the strings", () => {
    const html = renderToStaticMarkup(<LoginClient />);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain(`>${en.auth.loginTitle}</h1>`);
    expect(html).toContain(en.auth.emailLabel);
    expect(html).toContain('href="/forgot-password"');
    expect(html).toContain('href="/register"');
  });

  it("renders Arabic copy and the failed sign in message", () => {
    state.locale = "ar";
    state.params = "invalid=1";
    const html = renderToStaticMarkup(<LoginClient />);
    expect(html).toContain(ar.auth.loginTitle);
    expect(html).toContain(ar.auth.loginFailed);
    expect(html).toContain('role="alert"');
    expect(html).not.toContain("Vendor sign in");
  });
});

describe("ForgotPasswordClient", () => {
  it("renders the reset form in Arabic", () => {
    state.locale = "ar";
    const html = renderToStaticMarkup(<ForgotPasswordClient />);
    expect(html).toContain(`>${ar.auth.resetTitle}</h1>`);
    expect(html).toContain(ar.auth.resetSend);
    expect(html).toContain('href="/login"');
  });
});

describe("authErrorMessage", () => {
  it("never shows a raw message", () => {
    expect(authErrorMessage(new Error("internal stack"), en)).toBe(en.errors.generic);
    expect(authErrorMessage({ code: "auth/too-many-requests" }, ar)).toBe(ar.auth.tooManyAttempts);
    expect(authErrorMessage(new TypeError("Failed to fetch"), en)).toBe(
      en.states.offlineDescription,
    );
  });
});
