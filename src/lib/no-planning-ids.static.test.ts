import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Comments, examples and test names in this public repo use plain words.
 * Internal planning labels and references to private documents stay out.
 */

const ROOT = path.resolve(__dirname, "../..");
const SCAN_DIRS = ["src", "docs"];
const SCAN_FILES = ["firestore.rules", "storage.rules", ".env.example"];
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", ".cursor"]);
const SKIP_FILES = new Set(["package-lock.json", "AGENTS.md", "CLAUDE.md"]);
const BINARY_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg", ".avif",
  ".woff", ".woff2", ".ttf", ".otf", ".eot", ".pdf",
]);

const ID_PATTERN = new RegExp(
  [
    "\\b(",
    "S\\d+\\.\\d+[a-z]?",
    "|PC-\\d+[a-z]?",
    "|DL-\\d|VC-\\d|PAY-\\d|DOC-\\d",
    "|W\\d-[A-Z0-9]+",
    "|T0\\.\\d+",
    "|BR-\\d+(\\.\\d+)?",
    "|D\\d\\d",
    "|SEC-\\d",
    ")\\b",
  ].join(""),
);
// Built from parts so this file does not match itself.
const PHRASE_PATTERN = new RegExp(["source", "of", "truth"].join(" "), "i");

function collect(dir: string, out: string[]): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(name)) collect(full, out);
    } else if (!SKIP_FILES.has(name) && !BINARY_EXT.has(path.extname(name).toLowerCase())) {
      out.push(full);
    }
  }
}

function scannedFiles(): string[] {
  const files: string[] = [];
  for (const dir of SCAN_DIRS) collect(path.join(ROOT, dir), files);
  for (const file of SCAN_FILES) {
    const full = path.join(ROOT, file);
    if (existsSync(full)) files.push(full);
  }
  return files;
}

function findHits(text: string): string[] {
  const hits: string[] = [];
  text.split("\n").forEach((line, index) => {
    if (ID_PATTERN.test(line) || PHRASE_PATTERN.test(line)) {
      hits.push(`${index + 1}: ${line.trim()}`);
    }
  });
  return hits;
}

describe("public repo text", () => {
  it("detects planning labels and the private document phrase", () => {
    expect(findHits(["// see S1", "7"].join("."))).toHaveLength(1);
    expect(findHits(["// PC", "2b photos"].join("-"))).toHaveLength(1);
    expect(findHits(["# ", "Source", " of ", "Truth"].join(""))).toHaveLength(1);
    expect(findHits("const orderId = \"O1\"; // plain words")).toHaveLength(0);
  });

  it("keeps planning labels out of source, rules, examples and docs", () => {
    const files = scannedFiles();
    expect(files.length).toBeGreaterThan(0);
    const offenders: string[] = [];
    for (const file of files) {
      for (const hit of findHits(readFileSync(file, "utf8"))) {
        offenders.push(`${path.relative(ROOT, file)}:${hit}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
