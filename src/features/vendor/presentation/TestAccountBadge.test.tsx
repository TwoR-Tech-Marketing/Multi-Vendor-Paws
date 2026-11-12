import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getStrings } from "@/shared/i18n/get-strings";

const prefs = { locale: "en" as "en" | "ar" };

vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return {
    useStrings: () => load(prefs.locale),
    usePreferences: () => ({ locale: prefs.locale, dir: prefs.locale === "ar" ? "rtl" : "ltr" }),
  };
});

import { TestAccountBadge } from "@/features/vendor/presentation/TestAccountBadge";

describe("TestAccountBadge", () => {
  beforeEach(() => {
    prefs.locale = "en";
  });

  it("renders nothing for a normal account", () => {
    expect(renderToStaticMarkup(<TestAccountBadge isTest={false} />)).toBe("");
  });

  it("renders the English label for a test account", () => {
    const html = renderToStaticMarkup(<TestAccountBadge isTest />);
    expect(html).toContain('data-testid="test-account-badge"');
    expect(html).toContain(getStrings("en").portal.testAccountBadge);
  });

  it("renders the Arabic label for a test account", () => {
    prefs.locale = "ar";
    const html = renderToStaticMarkup(<TestAccountBadge isTest />);
    const label = getStrings("ar").portal.testAccountBadge;
    expect(label).not.toBe(getStrings("en").portal.testAccountBadge);
    expect(html).toContain(label);
  });
});
