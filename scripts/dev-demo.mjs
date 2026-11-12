#!/usr/bin/env node
/**
 * `npm run dev:demo`: start `next dev` against the local Firebase emulators
 * with the demo values in emulator.env.example. Refuses to start when the
 * final env could reach a real project or carries service account credentials.
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildDemoChildEnv, checkDemoEnv, parseEnvText } from "./dev-demo-env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");

const template = parseEnvText(readFileSync(path.join(root, "emulator.env.example"), "utf8"));
const childEnv = buildDemoChildEnv(process.env, template);

// Work out the env Next.js will end up with: the same loader, the same .env files.
for (const key of Object.keys(process.env)) delete process.env[key];
Object.assign(process.env, childEnv);
const silent = { info() {}, error() {} };
const { combinedEnv } = loadEnvConfig(root, true, silent, true);

const problems = checkDemoEnv(combinedEnv);
if (problems.length > 0) {
  console.error("dev:demo refused to start:");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    "Fix the variables above, or move .env.local aside, then run npm run dev:demo again.",
  );
  process.exit(1);
}

const port = String(childEnv.PORT || "3000");
const nextBin = require.resolve("next/dist/bin/next");
console.log(`dev:demo: starting next dev on port ${port} against the local emulators.`);
const child = spawn(process.execPath, [nextBin, "dev", "-p", port], {
  cwd: root,
  env: childEnv,
  stdio: "inherit",
});
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => child.kill(sig));
}
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
