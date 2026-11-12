import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { Routes } from "@/constants/routes";
import { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";
import { config, middleware } from "@/middleware";

function request(path: string, withSession: boolean) {
  const req = new NextRequest(new URL(path, "https://portal.example"));
  if (withSession) req.cookies.set(SESSION_COOKIE_NAME, "session");
  return req;
}

const AUTH_MATCHERS = ["/login", "/register", "/forgot-password"];

describe("middleware", () => {
  it("sends signed out visitors of telehealth pages to login", () => {
    for (const path of [Routes.vendor.telehealth, Routes.vendor.telehealthChat("s1")]) {
      const res = middleware(request(path, false));
      expect(res.headers.get("location")).toBe(`https://portal.example${Routes.auth.login}`);
    }
  });

  it("lets signed in doctors open telehealth pages", () => {
    const res = middleware(request(Routes.vendor.telehealthChat("s1"), true));
    expect(res.headers.get("location")).toBeNull();
  });

  it("sends signed out visitors of appointment pages to login and lets providers in", () => {
    for (const path of [Routes.vendor.appointments, Routes.vendor.appointmentDetail("a1")]) {
      const res = middleware(request(path, false));
      expect(res.headers.get("location")).toBe(`https://portal.example${Routes.auth.login}`);
      expect(middleware(request(path, true)).headers.get("location")).toBeNull();
    }
  });

  it("sends signed out visitors of the reviews page to login and lets providers in", () => {
    const res = middleware(request(Routes.vendor.reviews, false));
    expect(res.headers.get("location")).toBe(`https://portal.example${Routes.auth.login}`);
    expect(middleware(request(Routes.vendor.reviews, true)).headers.get("location")).toBeNull();
  });

  it("protects every portal matcher", () => {
    expect(config.matcher).toContain("/telehealth/:path*");
    expect(config.matcher).toContain("/reviews/:path*");
    expect(config.matcher).toContain("/appointments/:path*");
    for (const matcher of config.matcher.filter((m) => !AUTH_MATCHERS.includes(m))) {
      const path = matcher.replace("/:path*", "");
      const res = middleware(request(path, false));
      expect(res.headers.get("location"), path).toBe(`https://portal.example${Routes.auth.login}`);
    }
  });
});
