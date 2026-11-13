import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const SRC = path.resolve(__dirname, "../..");

function modules(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...modules(full));
    else if (entry.name.endsWith(".module.css")) out.push(full);
  }
  return out;
}

function strip(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** True when the module animates movement or runs a keyframe animation. */
function moves(css: string): boolean {
  const keyframes = /animation:\s*(?!none)[a-zA-Z]/.test(css) || /animation-name:/.test(css);
  const transformTransition = /transition:[^;]*transform/.test(css);
  return keyframes || transformTransition;
}

const files = modules(SRC).filter((file) => moves(strip(readFileSync(file, "utf8"))));

describe("reduced motion", () => {
  it("finds modules with motion to check", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files.map((file) => path.relative(SRC, file)))(
    "%s removes movement under prefers-reduced-motion",
    (rel) => {
      const css = strip(readFileSync(path.join(SRC, rel), "utf8"));
      expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    },
  );

  it("keeps durations on theme tokens in the portal chrome and core screens", () => {
    const core = [
      "features/vendor/presentation/portal.module.css",
      "features/vendor/presentation/sidebar.module.css",
      "features/vendor/presentation/dashboard.module.css",
      "features/orders/presentation/orders.module.css",
      "features/notifications/presentation/notifications.module.css",
      "components/ui/error-state/errorState.module.css",
    ];
    for (const rel of core) {
      const css = strip(readFileSync(path.join(SRC, rel), "utf8"));
      expect(css, rel).not.toMatch(/(transition|animation):[^;]*\b(0\.\d+|[1-9]\d*(\.\d+)?)m?s\b/);
    }
  });
});
