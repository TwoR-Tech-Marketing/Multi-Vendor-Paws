import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  buildDemoChildEnv,
  checkDemoEnv,
  CREDENTIAL_KEYS,
  parseEnvText,
  REQUIRED_EMULATOR_HOST_KEYS,
} from "./dev-demo-env.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const template = parseEnvText(readFileSync(path.join(root, "emulator.env.example"), "utf8"));
const PROD = ["pets", "acd3f"].join("-");

function demoEnv(overrides = {}) {
  return { ...buildDemoChildEnv({ PATH: "/usr/bin" }, template), ...overrides };
}

describe("parseEnvText", () => {
  it("reads keys, skips comments and strips quotes", () => {
    expect(parseEnvText("# note\nA=1\n\nexport B='two'\nC=\"three\"\nD=\nbad line")).toEqual({
      A: "1",
      B: "two",
      C: "three",
      D: "",
    });
  });
});

describe("emulator.env.example", () => {
  it("passes the safety check on its own", () => {
    expect(checkDemoEnv(demoEnv())).toEqual([]);
  });

  it("sets every emulator host and only demo values", () => {
    for (const key of REQUIRED_EMULATOR_HOST_KEYS) {
      expect(template[key]).toMatch(/^127\.0\.0\.1:\d+$/);
    }
    expect(template.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBe("demo-tenderpaws");
    expect(template.FIREBASE_PROJECT_ID).toBe("demo-tenderpaws");
    expect(template.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET).toBe("demo-tenderpaws.appspot.com");
    expect(Object.keys(template).some((key) => key.includes("MAPS"))).toBe(false);
    expect(Object.keys(template).some((key) => key.includes("DATA_SOURCE"))).toBe(false);
  });
});

describe("buildDemoChildEnv", () => {
  it("lets the template win and blanks every credential key", () => {
    const env = buildDemoChildEnv(
      {
        FIREBASE_PROJECT_ID: "real-project",
        GOOGLE_APPLICATION_CREDENTIALS: "./key.json",
        FIREBASE_PRIVATE_KEY: "secret",
        __NEXT_PROCESSED_ENV: "true",
      },
      template,
    );
    expect(env.FIREBASE_PROJECT_ID).toBe("demo-tenderpaws");
    for (const key of CREDENTIAL_KEYS) expect(env[key]).toBe("");
    expect(env.__NEXT_PROCESSED_ENV).toBeUndefined();
  });
});

describe("checkDemoEnv", () => {
  it("refuses any value that mentions the production project, by name only", () => {
    const problems = checkDemoEnv(demoEnv({ SOME_URL: `https://${PROD}.example` }));
    expect(problems).toEqual(["SOME_URL points at the production project"]);
    expect(problems.join(" ")).not.toContain(PROD);
  });

  it("refuses project ids that are not demo-", () => {
    expect(checkDemoEnv(demoEnv({ FIREBASE_PROJECT_ID: "other" }))).toEqual([
      "FIREBASE_PROJECT_ID must be set to a project id starting with demo-",
    ]);
    expect(checkDemoEnv(demoEnv({ NEXT_PUBLIC_FIREBASE_PROJECT_ID: "" }))).toEqual([
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID must be set to a project id starting with demo-",
    ]);
    expect(checkDemoEnv(demoEnv({ GCLOUD_PROJECT: "other" }))).toEqual([
      "GCLOUD_PROJECT must start with demo- when set",
    ]);
    expect(checkDemoEnv(demoEnv({ GCLOUD_PROJECT: "" }))).toEqual([]);
  });

  it("refuses a missing emulator host", () => {
    expect(checkDemoEnv(demoEnv({ NEXT_PUBLIC_STORAGE_EMULATOR_HOST: " " }))).toEqual([
      "NEXT_PUBLIC_STORAGE_EMULATOR_HOST is missing",
    ]);
  });

  it("refuses service account credentials without printing them", () => {
    const problems = checkDemoEnv(demoEnv({ FIREBASE_PRIVATE_KEY: "very-secret" }));
    expect(problems).toEqual(["FIREBASE_PRIVATE_KEY must be empty in demo mode"]);
    expect(problems.join(" ")).not.toContain("very-secret");
  });
});

describe("Next.js env loading with a developer .env.local", () => {
  it("keeps .env.local credentials and project ids out of the final env", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "dev-demo-"));
    try {
      writeFileSync(
        path.join(dir, ".env.local"),
        [
          "FIREBASE_PROJECT_ID=real-project",
          "GOOGLE_APPLICATION_CREDENTIALS=./key.json",
          "FIREBASE_CLIENT_EMAIL=svc@example.test",
          "FIREBASE_PRIVATE_KEY=secret",
          "EXTRA_FROM_LOCAL=kept",
        ].join("\n"),
      );
      const nextEnvPath = createRequire(import.meta.url).resolve("@next/env");
      const script = `
        const { loadEnvConfig } = require(${JSON.stringify(nextEnvPath)});
        const silent = { info() {}, error() {} };
        const { combinedEnv } = loadEnvConfig(${JSON.stringify(dir)}, true, silent, true);
        process.stdout.write(JSON.stringify(combinedEnv));
      `;
      const child = spawnSync(process.execPath, ["-e", script], {
        env: demoEnv({ PATH: process.env.PATH ?? "" }),
        encoding: "utf8",
      });
      expect(child.status).toBe(0);
      const combined = JSON.parse(child.stdout);
      expect(combined.FIREBASE_PROJECT_ID).toBe("demo-tenderpaws");
      for (const key of CREDENTIAL_KEYS) expect(combined[key]).toBe("");
      expect(combined.EXTRA_FROM_LOCAL).toBe("kept");
      expect(checkDemoEnv(combined)).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
