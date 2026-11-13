import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const UI = path.resolve(__dirname);
const SRC = path.resolve(__dirname, "../..");

/** Shared component styles that must read theme tokens only. */
const SHARED_MODULES = [
  "button/button.module.css",
  "field/field.module.css",
  "card/card.module.css",
  "table/table.module.css",
  "tabs/tabs.module.css",
  "badge/statusBadge.module.css",
  "dialog/dialog.module.css",
  "empty-state/emptyState.module.css",
  "toast/toast.module.css",
  "skeleton/skeleton.module.css",
  "select/PortalSelect.module.css",
  "LogoutConfirmDialog.module.css",
  "error-state/errorState.module.css",
];

/** Layout hooks callers may set; they are not theme values. */
const ALLOWED_LOCAL_VARS = new Set(["--select-max-width", "--z-index-popover"]);

function read(rel: string): string {
  return readFileSync(path.join(UI, rel), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Removes every @media block whose query matches, keeping the rest. */
function withoutMedia(css: string, query: RegExp): string {
  let out = "";
  let i = 0;
  while (i < css.length) {
    const at = css.indexOf("@media", i);
    if (at < 0) {
      out += css.slice(i);
      break;
    }
    const open = css.indexOf("{", at);
    const header = css.slice(at, open);
    let depth = 1;
    let j = open + 1;
    while (depth > 0 && j < css.length) {
      if (css[j] === "{") depth += 1;
      else if (css[j] === "}") depth -= 1;
      j += 1;
    }
    out += css.slice(i, at);
    if (!query.test(header)) out += css.slice(at, j);
    i = j;
  }
  return out;
}

function listModules(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listModules(full));
    else if (entry.name.endsWith(".module.css")) out.push(full);
  }
  return out;
}

describe("shared component styles", () => {
  it.each(SHARED_MODULES)("%s reads only --tp-* tokens", (rel) => {
    const css = read(rel);
    const vars = [...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]);
    const offenders = vars.filter((v) => !v.startsWith("--tp-") && !ALLOWED_LOCAL_VARS.has(v));
    expect(offenders).toEqual([]);
  });

  it.each(SHARED_MODULES)("%s never uses transition: all", (rel) => {
    expect(read(rel)).not.toMatch(/transition(-property)?:\s*all\b/);
  });

  it.each(SHARED_MODULES)("%s gates hover behind a fine pointer", (rel) => {
    const outside = withoutMedia(read(rel), /\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)/);
    expect(outside).not.toMatch(/:hover/);
  });

  it.each(SHARED_MODULES.filter((rel) => /transform|animation/.test(read(rel))))(
    "%s has a reduced motion rule",
    (rel) => {
      expect(read(rel)).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    },
  );

  it("presses buttons to 0.97 with the theme press duration and ease out", () => {
    const css = read("button/button.module.css");
    expect(css).toMatch(/:active[^{]*\{\s*transform: scale\(0\.97\)/);
    expect(css).toContain("var(--tp-motion-duration-press) var(--tp-motion-ease-out)");
    for (const variant of ["primary", "secondary", "ghost", "danger"]) {
      expect(css).toMatch(new RegExp(`\\.${variant} \\{`));
    }
  });

  it("keeps every button variant, small included, at the 40 px control target", () => {
    const css = read("button/button.module.css");
    expect(css).toMatch(/\.button \{[^}]*min-height: var\(--tp-size-control\)/);
    expect(css).toMatch(/\.small \{[^}]*min-height: var\(--tp-size-control\)/);
    expect(css).not.toMatch(/min-height: calc\(var\(--tp-size-control\) -/);
  });

  it("keeps the order date toggles and the filter close control at 40 px", () => {
    const orders = readFileSync(
      path.join(SRC, "features/orders/presentation/OrdersFilterPopover.module.css"),
      "utf8",
    );
    expect(orders).toMatch(/\.dateToggle \{[^}]*min-height: var\(--tp-size-control\)/);
    const products = readFileSync(
      path.join(SRC, "features/products/presentation/ProductsFilterPopover.module.css"),
      "utf8",
    );
    expect(products).toMatch(/\.closeBtn \{[^}]*width: var\(--tp-size-control\)/);
  });

  it("gives inputs the 44 px size, the input border and the focus ring", () => {
    const css = read("field/field.module.css");
    expect(css).toContain("min-height: var(--tp-size-input)");
    expect(css).toContain("border: 1px solid var(--tp-color-border-input)");
    expect(css).toMatch(/:focus[^{]*\{[^}]*var\(--tp-color-focus\)/);
  });

  it("draws cards on the raised surface with the dark mode edge highlight", () => {
    const css = read("card/card.module.css");
    expect(css).toContain("var(--tp-color-surface-raised)");
    expect(css).toContain("var(--tp-color-border-default)");
    expect(css).toContain("var(--tp-effect-edge-highlight)");
  });

  it("uses row heights and end aligned tabular figures in tables", () => {
    const css = read("table/table.module.css");
    expect(css).toContain("height: var(--tp-size-row)");
    expect(css).toContain("height: var(--tp-size-row-compact)");
    expect(css).toMatch(/\.numeric \{[^}]*text-align: end;[^}]*tabular-nums/);
  });

  it("does not animate tab switches and marks the active tab with the line token", () => {
    const css = read("tabs/tabs.module.css");
    expect(css).toContain("transition: none");
    expect(css).toMatch(/\.tabActive \{[^}]*border-bottom-color: var\(--tp-color-line\)/);
  });

  it("scales dialogs from 0.96 behind the scrim and closes faster", () => {
    const css = read("dialog/dialog.module.css");
    expect(css).toContain("scale(0.96)");
    expect(css).toContain("var(--tp-color-scrim)");
    expect(css).toMatch(/\[data-state="closed"\] \{[^}]*var\(--tp-motion-duration-exit\)/);
  });

  it("slides toasts from the bottom end edge and exits faster", () => {
    const css = read("toast/toast.module.css");
    expect(css).toContain("inset-inline-end");
    expect(css).toContain("inset-block-end");
    expect(css).toMatch(/translateY\(calc\(100% \+/);
    expect(css).toMatch(/\[data-state="closed"\] \{[^}]*var\(--tp-motion-duration-exit\)/);
  });

  it("runs the shimmer at 1.4 s linear, reverses it in RTL and stops it under reduced motion", () => {
    const css = read("skeleton/skeleton.module.css");
    expect(css).toContain("var(--tp-color-skeleton-base)");
    expect(css).toContain("var(--tp-color-skeleton-shimmer)");
    expect(css).toContain("1.4s linear infinite");
    expect(css).toMatch(/\[dir="rtl"\] \.shimmer::after \{\s*animation-name: skeletonShimmerRtl/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\s*\.shimmer::after \{\s*animation: none/);
  });

  it("colours chart series with the chart tokens", () => {
    const css = readFileSync(
      path.join(SRC, "features/provider-dashboard/presentation/providerDashboard.module.css"),
      "utf8",
    );
    expect(css).toContain("var(--tp-color-chart-current)");
    expect(css).toContain("var(--tp-color-chart-other)");
  });
});

describe("composes across modules", () => {
  it("points every composes at an existing file and class", () => {
    const problems: string[] = [];
    for (const file of listModules(SRC)) {
      const css = readFileSync(file, "utf8");
      for (const match of css.matchAll(/composes:\s*([\w\s-]+?)(?:\s+from\s+"([^"]+)")?;/g)) {
        const classes = match[1].trim().split(/\s+/);
        const target = match[2] ? path.resolve(path.dirname(file), match[2]) : file;
        if (!existsSync(target)) {
          problems.push(`${path.relative(SRC, file)}: missing ${match[2]}`);
          continue;
        }
        const targetCss = readFileSync(target, "utf8");
        for (const name of classes) {
          if (!new RegExp(`\\.${name}\\s*\\{`).test(targetCss)) {
            problems.push(`${path.relative(SRC, file)}: ${name} not in ${path.relative(SRC, target)}`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("never chains a local composes to a class that composes from another file", () => {
    const problems: string[] = [];
    for (const file of listModules(SRC)) {
      const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      for (const match of css.matchAll(/composes:\s*([\w\s-]+?);/g)) {
        for (const name of match[1].trim().split(/\s+/)) {
          const rule = new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`).exec(css);
          if (rule && /composes:[^;]*\bfrom\b/.test(rule[1])) {
            problems.push(`${path.relative(SRC, file)}: ${name}`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("puts composes first in its rule", () => {
    const problems: string[] = [];
    for (const file of listModules(SRC)) {
      const css = readFileSync(file, "utf8");
      for (const match of css.matchAll(/\{([^{}]*composes:[^{}]*)\}/g)) {
        const firstDecl = match[1].trim().split(";")[0]?.trim() ?? "";
        if (!firstDecl.startsWith("composes:")) problems.push(path.relative(SRC, file));
      }
    }
    expect(problems).toEqual([]);
  });
});
