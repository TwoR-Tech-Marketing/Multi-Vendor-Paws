import { readFileSync } from "node:fs";
import path from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CoverageModeToggle } from "@/features/coverage/presentation/CoverageModeToggle";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};

describe("CoverageModeToggle", () => {
  it("presses only the selected mode inside a labelled group", () => {
    const html = renderToStaticMarkup(
      <CoverageModeToggle mode="zone" strings={en} onChange={noop} />,
    );
    expect(html).toContain(`role="group" aria-label="${en.coverage.modeLabel}"`);
    expect(html).toMatch(new RegExp(`aria-pressed="true"[^>]*>${en.coverage.modeZone}<`));
    expect(html).toMatch(new RegExp(`aria-pressed="false"[^>]*>${en.coverage.modeGovernorates}<`));
  });

  it("renders Arabic labels", () => {
    const html = renderToStaticMarkup(
      <CoverageModeToggle mode="governorates" strings={ar} onChange={noop} />,
    );
    expect(html).toMatch(new RegExp(`aria-pressed="true"[^>]*>${ar.coverage.modeGovernorates}<`));
  });
});

describe("coverage.module.css", () => {
  const css = readFileSync(path.join(__dirname, "coverage.module.css"), "utf8");

  it("styles the pressed mode with the selection tokens, not a second primary button", () => {
    expect(css).toMatch(/\.modeButton \{\s*composes: button secondary/);
    expect(css).toMatch(/\.modeButton\[aria-pressed="true"\] \{[^}]*var\(--tp-color-selected-bg\)/);
  });

  it("keeps governorate rows at the 40 px target with a visible focus ring", () => {
    expect(css).toMatch(/\.govItem \{[^}]*min-height: var\(--tp-size-control\)/);
    expect(css).toMatch(/\.govItem:focus-within \{[^}]*var\(--tp-color-focus\)/);
  });
});
