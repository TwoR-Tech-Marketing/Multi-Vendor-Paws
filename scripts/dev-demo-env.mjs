/**
 * Pure helpers for `npm run dev:demo`. No file system, no process access, so
 * they are easy to test. Problems are reported by variable name only, never
 * with values.
 */

export const PRODUCTION_PROJECT_MARKER = "pets-acd3f";

export const REQUIRED_PROJECT_ID_KEYS = ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", "FIREBASE_PROJECT_ID"];

export const OPTIONAL_PROJECT_ID_KEYS = ["GCLOUD_PROJECT", "GOOGLE_CLOUD_PROJECT"];

export const REQUIRED_EMULATOR_HOST_KEYS = [
  "FIRESTORE_EMULATOR_HOST",
  "FIREBASE_AUTH_EMULATOR_HOST",
  "FIREBASE_STORAGE_EMULATOR_HOST",
  "FIREBASE_FUNCTIONS_EMULATOR_HOST",
  "NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST",
  "NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST",
  "NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST",
  "NEXT_PUBLIC_STORAGE_EMULATOR_HOST",
];

/** Always forced to an empty string in the child env so no .env file can supply them. */
export const CREDENTIAL_KEYS = [
  "GOOGLE_APPLICATION_CREDENTIALS",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

/** Minimal KEY=VALUE parser for the template: comments, blank lines, optional quotes. */
export function parseEnvText(text) {
  const result = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    const quoted = /^(['"])(.*)\1$/.exec(value);
    if (quoted) value = quoted[2];
    result[match[1]] = value;
  }
  return result;
}

/**
 * The env the `next dev` child starts with: the parent env, then the template
 * (template wins), then every credential key forced to "". Next.js never lets a
 * .env file override a key that already exists in the process env, even an
 * empty one, so these blanks keep .env.local credentials out.
 */
export function buildDemoChildEnv(parentEnv, templateEnv) {
  const env = { ...parentEnv, ...templateEnv };
  for (const key of CREDENTIAL_KEYS) env[key] = "";
  delete env.__NEXT_PROCESSED_ENV;
  return env;
}

function value(env, key) {
  const raw = env[key];
  return typeof raw === "string" ? raw.trim() : "";
}

/** Returns the list of problems (by variable name) that must stop the demo. Empty means safe. */
export function checkDemoEnv(env) {
  const problems = [];

  for (const key of Object.keys(env).sort()) {
    if (value(env, key).includes(PRODUCTION_PROJECT_MARKER)) {
      problems.push(`${key} points at the production project`);
    }
  }

  for (const key of REQUIRED_PROJECT_ID_KEYS) {
    if (!value(env, key).startsWith("demo-")) {
      problems.push(`${key} must be set to a project id starting with demo-`);
    }
  }
  for (const key of OPTIONAL_PROJECT_ID_KEYS) {
    const current = value(env, key);
    if (current && !current.startsWith("demo-")) {
      problems.push(`${key} must start with demo- when set`);
    }
  }

  for (const key of REQUIRED_EMULATOR_HOST_KEYS) {
    if (!value(env, key)) problems.push(`${key} is missing`);
  }

  for (const key of CREDENTIAL_KEYS) {
    if (value(env, key)) problems.push(`${key} must be empty in demo mode`);
  }

  return problems;
}
