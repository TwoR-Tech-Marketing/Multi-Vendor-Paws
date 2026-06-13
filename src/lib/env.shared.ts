/** Edge-safe env helpers (no Node.js APIs). */

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
