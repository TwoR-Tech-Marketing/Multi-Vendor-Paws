import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FirebaseConfigErrorScreen } from "@/shared/components/config-error/FirebaseConfigErrorScreen";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");
const ar = getStrings("ar");
const esc = (text: string) => text.replace(/'/g, "&#x27;");
const missing = ["NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_APP_ID"];

describe("FirebaseConfigErrorScreen", () => {
  it("lists the missing variable names in development", () => {
    const html = renderToStaticMarkup(
      <FirebaseConfigErrorScreen strings={en} missingKeys={missing} showDetails />,
    );
    expect(html).toContain(en.configError.devTitle);
    expect(html).toContain(en.configError.devDemoHint);
    for (const name of missing) expect(html).toContain(name);
    expect(html).toContain('role="alert"');
  });

  it("shows only a friendly message in production", () => {
    const html = renderToStaticMarkup(
      <FirebaseConfigErrorScreen strings={en} missingKeys={missing} showDetails={false} />,
    );
    expect(html).toContain(esc(en.configError.title));
    expect(html).toContain(esc(en.configError.description));
    expect(html).not.toContain("NEXT_PUBLIC");
    expect(html).not.toContain(en.configError.devDemoHint);
    expect(html.toLowerCase()).not.toMatch(/firebase|environment|variable|api|emulator/);
  });

  it("renders the Arabic copy", () => {
    const html = renderToStaticMarkup(
      <FirebaseConfigErrorScreen strings={ar} missingKeys={missing} showDetails={false} />,
    );
    expect(html).toContain(ar.configError.title);
    expect(html).not.toContain("NEXT_PUBLIC");
  });
});
