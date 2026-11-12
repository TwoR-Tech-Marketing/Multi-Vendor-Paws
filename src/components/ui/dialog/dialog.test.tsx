import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { nextTrapIndex } from "@/components/ui/dialog/useFocusTrap";
import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog";
import { getStrings } from "@/shared/i18n/get-strings";

const noop = () => undefined;

function render(open: boolean, locale: "en" | "ar" = "en") {
  const s = getStrings(locale);
  return renderToStaticMarkup(
    <LogoutConfirmDialog
      open={open}
      title={s.common.signOut}
      message={s.common.comingSoonDescription}
      confirmLabel={s.common.confirm}
      cancelLabel={s.common.cancel}
      onCancel={noop}
      onConfirm={noop}
    />,
  );
}

describe("ConfirmDialog", () => {
  it("renders nothing while closed", () => {
    expect(render(false)).toBe("");
  });

  it("renders an open modal dialog named by its title", () => {
    const html = render(true);
    const en = getStrings("en");
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('data-state="open"');
    const labelledBy = html.match(/aria-labelledby="([^"]+)"/)?.[1];
    expect(labelledBy).toBeTruthy();
    expect(html).toContain(`id="${labelledBy}"`);
    expect(html).toContain(`aria-label="${en.common.cancel}"`);
    expect(html).toContain(en.common.confirm);
  });

  it("names the close button in Arabic", () => {
    const ar = getStrings("ar");
    expect(render(true, "ar")).toContain(`aria-label="${ar.common.cancel}"`);
  });
});

describe("nextTrapIndex", () => {
  it("wraps Tab from the last item to the first", () => {
    expect(nextTrapIndex(3, 2, false)).toBe(0);
  });

  it("wraps Shift+Tab from the first item to the last", () => {
    expect(nextTrapIndex(3, 0, true)).toBe(2);
  });

  it("pulls focus in when it is outside the dialog", () => {
    expect(nextTrapIndex(3, -1, false)).toBe(0);
    expect(nextTrapIndex(3, -1, true)).toBe(2);
  });

  it("lets the browser move focus inside the dialog", () => {
    expect(nextTrapIndex(3, 1, false)).toBeNull();
    expect(nextTrapIndex(3, 1, true)).toBeNull();
  });

  it("does nothing without focusable items", () => {
    expect(nextTrapIndex(0, -1, false)).toBeNull();
  });
});
