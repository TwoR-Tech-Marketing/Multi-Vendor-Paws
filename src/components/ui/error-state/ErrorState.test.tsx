import { readFileSync } from "node:fs";
import path from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ErrorState } from "@/components/ui/error-state/ErrorState";
import { toLoadErrorView } from "@/components/ui/error-state/load-error";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");
const ar = getStrings("ar");
const esc = (text: string) => text.replace(/'/g, "&#x27;");

describe("ErrorState", () => {
  it("renders an alert with the title, one line and a retry", () => {
    const html = renderToStaticMarkup(
      <ErrorState
        title={en.states.errorTitle}
        description={en.orders.loadError}
        retryLabel={en.states.retry}
        onRetry={() => {}}
      />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('data-kind="error"');
    expect(html).toContain('data-testid="error-state-art"');
    expect(html).toContain(`${esc(en.states.errorTitle)}</h3>`);
    expect(html).toContain(esc(en.orders.loadError));
    expect(html).toContain(`>${en.states.retry}</button>`);
  });

  it("hides the retry without a handler and uses the offline art for offline", () => {
    const html = renderToStaticMarkup(
      <ErrorState kind="offline" title={en.states.offlineTitle} retryLabel={en.states.retry} />,
    );
    expect(html).toContain('data-kind="offline"');
    expect(html).toContain('data-testid="offline-state-art"');
    expect(html).not.toContain("<button");
  });

  it("disables the retry and swaps its label while retrying", () => {
    const html = renderToStaticMarkup(
      <ErrorState
        title="x"
        retryLabel={en.states.retry}
        retryingLabel={en.states.retrying}
        isRetrying
        onRetry={() => {}}
        headingLevel={2}
        compact
      />,
    );
    expect(html).toContain("<h2");
    expect(html).toContain("disabled");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(en.states.retrying);
  });

  it("renders Arabic copy", () => {
    const html = renderToStaticMarkup(
      <ErrorState title={ar.states.offlineTitle} description={ar.states.offlineDescription} />,
    );
    expect(html).toContain(ar.states.offlineTitle);
    expect(html).toContain(ar.states.offlineDescription);
  });
});

describe("toLoadErrorView", () => {
  it("returns the offline copy when the browser is offline or fetch failed", () => {
    expect(toLoadErrorView(new Error("x"), en, "d", true).kind).toBe("offline");
    expect(toLoadErrorView(new TypeError("Failed to fetch"), en, "d", false)).toEqual({
      kind: "offline",
      title: en.states.offlineTitle,
      description: en.states.offlineDescription,
    });
    expect(toLoadErrorView({ code: "functions/unavailable" }, ar, "d", false).title).toBe(
      ar.states.offlineTitle,
    );
  });

  it("returns the screen message for server errors", () => {
    expect(toLoadErrorView(new Error("internal"), en, en.orders.loadError, false)).toEqual({
      kind: "error",
      title: en.states.errorTitle,
      description: en.orders.loadError,
    });
    expect(toLoadErrorView({ code: "internal" }, en, undefined, false).description).toBe(
      en.states.errorDescription,
    );
  });
});

describe("errorState.module.css", () => {
  const css = readFileSync(path.join(__dirname, "errorState.module.css"), "utf8");

  it("fades in within the base duration and stops under reduced motion", () => {
    expect(css).toContain("var(--tp-motion-duration-base) var(--tp-motion-ease-out)");
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\s*\.errorState \{\s*animation: none/);
  });
});
