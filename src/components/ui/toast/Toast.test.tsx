import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Toast } from "@/components/ui/toast/Toast";
import { getStrings } from "@/shared/i18n/get-strings";

const noop = () => undefined;

describe("Toast", () => {
  it("shows an error toast and announces it assertively", () => {
    const html = renderToStaticMarkup(<Toast message="Could not save" dismissLabel="Dismiss" onDismiss={noop} />);
    expect(html).toContain('data-state="open"');
    expect(html).toContain('data-tone="error"');
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="assertive"');
    expect(html).toMatch(/role="alert"[^>]*>Could not save</);
    expect(html).toContain(">Dismiss</button>");
  });

  it("stays mounted but hidden and silent when closed", () => {
    const html = renderToStaticMarkup(
      <Toast open={false} message="Could not save" dismissLabel="Dismiss" onDismiss={noop} />,
    );
    expect(html).toContain('data-state="closed"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("inert");
    expect(html).not.toMatch(/role="alert"[^>]*>Could not save</);
  });

  it("uses a polite status for info", () => {
    const html = renderToStaticMarkup(<Toast tone="info" message="Saved" dismissLabel="Dismiss" onDismiss={noop} />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it("renders Arabic copy", () => {
    const t = getStrings("ar").settings;
    const html = renderToStaticMarkup(
      <Toast message={t.preferencesSaveError} dismissLabel={t.dismiss} onDismiss={noop} />,
    );
    expect(html).toContain(t.preferencesSaveError);
    expect(html).toContain(t.dismiss);
  });
});
