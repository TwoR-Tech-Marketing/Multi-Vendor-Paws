import type { VendorSessionDto } from "@/features/auth/domain/session-dto";
import { Strings } from "@/constants/strings";

export type ApiErrorBody = {
  error: string;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | ApiErrorBody;

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "error" in data && typeof data.error === "string"
        ? data.error
        : Strings.errors.generic;
    throw new ApiClientError(message, response.status);
  }

  return data as T;
}

export async function createServerSession(idToken: string): Promise<VendorSessionDto> {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
    credentials: "same-origin",
  });

  const data = await parseJson<{ session: VendorSessionDto }>(response);
  return data.session;
}

export async function fetchCurrentSession(): Promise<VendorSessionDto | null> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  const data = await parseJson<{ session: VendorSessionDto }>(response);
  return data.session;
}

export async function logoutServerSession(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new ApiClientError(Strings.errors.generic, response.status);
  }
}

export async function vendorApiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  return parseJson<T>(response);
}

export async function vendorApiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });

  return parseJson<T>(response);
}

export async function vendorApiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });

  return parseJson<T>(response);
}

export async function vendorApiDelete<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    method: "DELETE",
    credentials: "same-origin",
  });

  return parseJson<T>(response);
}
