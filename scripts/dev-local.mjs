#!/usr/bin/env node
/**
 * `npm run dev:local`: start the Firebase emulators with the demo seed data,
 * then `next dev` with the values in `.env.local`.
 *
 * Refuses to start when `.env.local` is missing, or when the env Next.js would
 * end up with (shell plus .env files) has any value naming the production
 * project, a project id that is not demo-, a missing emulator host or service
 * account credentials. Problems are printed by variable name only.
 *
 * Optional env: PORT (portal port, default 3000), PANEL_FUNCTIONS_DIR (the
 * folder with the emulator config and `npm run seed:demo`, default
 * ../tinderpaws_panel/functions). Emulators already listening are reused.
 */
import { spawn, spawnSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { checkLocalEnv, CREDENTIAL_KEYS, emulatorPortsFromEnv } from "./dev-demo-env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");

const logDir = path.join(os.tmpdir(), "tenderpaws-dev-local");
const say = (message) => console.log(`[dev:local] ${message}`);
function refuse(lines) {
  console.error("[dev:local] refused to start:");
  for (const line of [].concat(lines)) console.error(`  - ${line}`);
  process.exit(1);
}

// 1. Safety check on the env Next.js will load.
if (!existsSync(path.join(root, ".env.local"))) {
  refuse(".env.local is missing. Copy emulator.env.example to .env.local (see docs).");
}
const silent = { info() {}, error() {} };
const { combinedEnv } = loadEnvConfig(root, true, silent, true);
const problems = checkLocalEnv(combinedEnv);
if (problems.length > 0) refuse(problems);

const projectId = combinedEnv.FIREBASE_PROJECT_ID.trim();
const childEnv = { ...combinedEnv };
delete childEnv.__NEXT_PROCESSED_ENV;
for (const key of CREDENTIAL_KEYS) childEnv[key] = "";

function isListening(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

const children = [];
function stopAll(signal = "SIGINT") {
  for (const child of children.reverse()) {
    if (child.exitCode === null) child.kill(signal);
  }
}
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    stopAll(sig);
    setTimeout(() => process.exit(130), 3000).unref();
  });
}

async function main() {
  const portalPort = Number(process.env.PORT || 3000);
  if (await isListening(portalPort)) {
    refuse(`port ${portalPort} is in use. Stop the other dev server, or set PORT.`);
  }

  // 2. Emulators: reuse a running suite, otherwise start one.
  const ports = emulatorPortsFromEnv(combinedEnv);
  const up = await Promise.all(ports.map(isListening));
  const functionsDir = path.resolve(
    root,
    process.env.PANEL_FUNCTIONS_DIR || "../tinderpaws_panel/functions",
  );
  if (!existsSync(path.join(functionsDir, "package.json"))) {
    refuse("PANEL_FUNCTIONS_DIR does not point at the functions folder with seed:demo.");
  }
  mkdirSync(logDir, { recursive: true });

  if (up.every(Boolean)) {
    say("emulators already running, reusing them.");
  } else if (up.some(Boolean)) {
    refuse("some emulator ports are in use but not all. Stop the other emulator suite first.");
  } else {
    const logPath = path.join(logDir, "emulators.log");
    say(`starting the emulators (project ${projectId}). Log: ${logPath}`);
    const log = createWriteStream(logPath);
    const emulators = spawn(
      "firebase",
      ["emulators:start", "--project", projectId, "--only", "auth,firestore,functions,storage"],
      { cwd: functionsDir, env: childEnv, stdio: ["ignore", "pipe", "pipe"] },
    );
    children.push(emulators);
    emulators.stdout.pipe(log);
    emulators.stderr.pipe(log);
    const ready = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), 180_000);
      emulators.stdout.on("data", (chunk) => {
        if (String(chunk).includes("All emulators ready")) {
          clearTimeout(timer);
          resolve(true);
        }
      });
      emulators.once("exit", () => {
        clearTimeout(timer);
        resolve(false);
      });
    });
    if (!ready) {
      stopAll();
      refuse(`the emulators did not start. See ${logPath}`);
    }
  }

  // 3. Seed (idempotent).
  say("seeding demo data.");
  const seed = spawnSync("npm", ["run", "seed:demo", "--", "--project", projectId], {
    cwd: functionsDir,
    env: { ...childEnv, GCLOUD_PROJECT: projectId },
    encoding: "utf8",
  });
  if (seed.status !== 0) {
    stopAll();
    refuse("seeding failed. Run npm run seed:demo in the functions folder to see why.");
  }

  // 4. Portal.
  say(`starting next dev on http://localhost:${portalPort} with .env.local.`);
  const nextBin = require.resolve("next/dist/bin/next");
  const portal = spawn(process.execPath, [nextBin, "dev", "-p", String(portalPort)], {
    cwd: root,
    env: childEnv,
    stdio: "inherit",
  });
  children.push(portal);
  portal.on("exit", (code) => {
    stopAll();
    process.exit(code ?? 0);
  });
}

main().catch(() => {
  stopAll();
  refuse("unexpected error while starting.");
});
