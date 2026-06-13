import { isProduction } from "@/lib/env.server";

export const SESSION_COOKIE_NAME = "__session";

/** 14 days in milliseconds (Firebase session cookie max). */
export const SESSION_COOKIE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_MS / 1000,
  };
}

export function getSessionCookieClearOptions() {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
