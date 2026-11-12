import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const SRC = path.resolve(__dirname, "../..");

/**
 * Files that may contain colour literals. Generated token files carry the
 * theme values; brand-art.css holds the fixed colours of the landing artwork.
 */
const ALLOWLIST = new Set([
  "shared/theme/tokens.generated.css",
  "shared/theme/tokens.generated.ts",
  "shared/theme/tokens.tailwind.generated.css",
  "shared/theme/brand-art.css",
]);

const LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g;

function isTestFile(rel: string): boolean {
  return /\.test\.(ts|tsx)$/.test(rel);
}

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(full));
    } else if (/\.(css|ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function findColorLiterals(source: string): string[] {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...withoutComments.matchAll(LITERAL)].map((m) => m[0]);
}

describe("colour literal check", () => {
  it("detects hex, rgb, rgba, hsl and hsla literals", () => {
    expect(findColorLiterals("a { color: #fff; background: rgba(0, 0, 0, 0.5); }")).toEqual([
      "#fff",
      "rgba(",
    ]);
    expect(findColorLiterals("const c = 'hsl(10 20% 30%)';")).toEqual(["hsl("]);
    expect(findColorLiterals("a { color: var(--color-text); }")).toEqual([]);
  });

  it("finds no colour literal in src outside the generated files and the allowlist", () => {
    const offenders: string[] = [];
    for (const file of listSourceFiles(SRC)) {
      const rel = path.relative(SRC, file).split(path.sep).join("/");
      if (ALLOWLIST.has(rel) || isTestFile(rel)) continue;
      const found = findColorLiterals(readFileSync(file, "utf8"));
      if (found.length > 0) offenders.push(`${rel}: ${found.join(", ")}`);
    }
    expect(offenders).toEqual([]);
  });
});
