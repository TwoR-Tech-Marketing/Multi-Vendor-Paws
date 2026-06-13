import { NextResponse } from "next/server";

import { Strings } from "@/constants/strings";

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function apiUnauthorized() {
  return apiError(Strings.errors.unauthorized, 401);
}

export function apiForbidden() {
  return apiError(Strings.errors.forbidden, 403);
}

export function apiGenericError(status = 500) {
  return apiError(Strings.errors.generic, status);
}

export function apiServerMisconfigured(message: string) {
  return apiError(message, 503);
}
