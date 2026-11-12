import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const SRC_DIR = path.resolve(__dirname, "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(name) || /\.test\.(ts|tsx)$/.test(name)) return [];
    return [full];
  });
}

function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const files = sourceFiles(SRC_DIR).map((file) => ({
  file: path.relative(SRC_DIR, file),
  code: stripComments(readFileSync(file, "utf8")),
}));

/**
 * Next.js only inlines `process.env.NEXT_PUBLIC_*` written as a literal member
 * expression. These checks fail on any read that would not be inlined.
 */
describe("static NEXT_PUBLIC env access", () => {
  it("scans the source tree", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("has no dynamic process.env[...] read outside server-only modules", () => {
    const offenders = files
      .filter(({ code }) => /process\.env\s*\[/.test(code))
      .filter(({ code }) => !/^import\s+["']server-only["'];?$/m.test(code))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("never passes a NEXT_PUBLIC variable name as a string", () => {
    const offenders = files
      .filter(({ code }) => /["'`]NEXT_PUBLIC_[A-Z0-9_]+["'`]/.test(code))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("never destructures or copies process.env", () => {
    const offenders = files
      .filter(({ code }) => /=\s*process\.env\s*[;,)\n]|\.\.\.process\.env/.test(code))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("reads every data-source flag with a literal expression", () => {
    const flags = files.find(({ file }) => file === path.join("lib", "vendor-data-source.ts"));
    expect(flags).toBeDefined();
    for (const name of [
      "NEXT_PUBLIC_VENDOR_PRODUCTS_DATA_SOURCE",
      "NEXT_PUBLIC_VENDOR_ORDERS_DATA_SOURCE",
      "NEXT_PUBLIC_VENDOR_NOTIFICATIONS_DATA_SOURCE",
      "NEXT_PUBLIC_VENDOR_SETTINGS_DATA_SOURCE",
      "NEXT_PUBLIC_VENDOR_PROFILE_DATA_SOURCE",
      "NEXT_PUBLIC_VENDOR_EARNINGS_DATA_SOURCE",
    ]) {
      expect(flags!.code).toContain(`process.env.${name}`);
    }
  });
});
