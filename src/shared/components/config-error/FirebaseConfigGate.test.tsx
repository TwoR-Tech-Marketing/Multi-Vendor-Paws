import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FirebaseConfigGate } from "@/shared/components/config-error/FirebaseConfigGate";

const REQUIRED = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

function render() {
  return renderToStaticMarkup(
    <FirebaseConfigGate>
      <p>route content</p>
    </FirebaseConfigGate>,
  );
}

describe("FirebaseConfigGate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders the route tree when the settings are complete", () => {
    for (const name of REQUIRED) vi.stubEnv(name, "secret-value");
    const html = render();
    expect(html).toContain("route content");
    expect(html).not.toContain('role="alert"');
  });

  it("names the missing variables outside production, never their values", () => {
    vi.stubEnv("NODE_ENV", "development");
    for (const name of REQUIRED) vi.stubEnv(name, "secret-value");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "");
    const html = render();
    expect(html).not.toContain("route content");
    expect(html).toContain("NEXT_PUBLIC_FIREBASE_API_KEY");
    expect(html).not.toContain("NEXT_PUBLIC_FIREBASE_APP_ID");
    expect(html).not.toContain("secret-value");
  });

  it("hides the variable names in a production build", () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const name of REQUIRED) vi.stubEnv(name, "");
    const html = render();
    expect(html).not.toContain("route content");
    expect(html).toContain('role="alert"');
    expect(html).not.toContain("NEXT_PUBLIC");
  });
});
