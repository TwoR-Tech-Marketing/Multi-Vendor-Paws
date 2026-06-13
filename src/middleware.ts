import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { Routes } from "@/constants/routes";
import { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";

const PORTAL_PATHS = [
  Routes.vendor.dashboard,
  Routes.vendor.profile,
  Routes.vendor.products,
  Routes.vendor.orders,
  Routes.vendor.earnings,
  Routes.vendor.settings,
  Routes.vendor.notifications,
] as const;

const AUTH_PATHS = [
  Routes.auth.login,
  Routes.auth.register,
  Routes.auth.forgotPassword,
] as const;

function isPortalPath(pathname: string): boolean {
  return PORTAL_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (isPortalPath(pathname) && !hasSession) {
    const loginUrl = new URL(Routes.auth.login, request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath(pathname) && hasSession) {
    const dashboardUrl = new URL(Routes.vendor.dashboard, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/products/:path*",
    "/orders/:path*",
    "/earnings/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
