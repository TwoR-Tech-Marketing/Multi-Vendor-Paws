import "server-only";

import {
  mapProfile,
  type CallableSessionProfile,
} from "@/features/auth/infrastructure/session-profile.mapper";
import { mapSessionPreferences } from "@/shared/preferences/domain/session-preferences";
import type {
  VendorSessionKind,
  VendorSessionResolution,
} from "@/features/auth/infrastructure/resolve-vendor-session";

type CallableSessionResponse = {
  result?: {
    kind: VendorSessionKind;
    profile: CallableSessionProfile | null;
    allowedPortalAccess?: boolean;
    preferences?: unknown;
    preferencesScope?: unknown;
    preferencesSet?: unknown;
  };
  error?: { message?: string; status?: string };
};

function projectId(): string {
  return (
    process.env.GCLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "pets-acd3f"
  );
}

function callableUrl(): string {
  const host = process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST;
  const id = projectId();
  if (host) {
    return `http://${host}/${id}/us-central1/vendor_session-resolveVendorSession`;
  }
  return `https://us-central1-${id}.cloudfunctions.net/vendor_session-resolveVendorSession`;
}

/**
 * Calls the shared vendor_session-resolveVendorSession callable.
 */
export async function resolveVendorSessionViaCallable(
  idToken: string,
): Promise<VendorSessionResolution> {
  const response = await fetch(callableUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ data: {} }),
    cache: "no-store",
  });

  const body = (await response.json()) as CallableSessionResponse;

  if (!response.ok || !body.result?.kind) {
    throw new Error(
      body.error?.message || "Failed to resolve vendor session via callable.",
    );
  }

  return {
    kind: body.result.kind,
    profile: mapProfile(body.result.profile),
    message: "",
    sessionPreferences: mapSessionPreferences(body.result),
  };
}

/**
 * Mint an ID token for a uid (session cookie refresh path) then call the shared callable.
 */
export async function resolveVendorSessionViaCallableForUid(
  uid: string,
): Promise<VendorSessionResolution> {
  const { getAdminAuth } = await import("@/lib/firebase-admin");
  const customToken = await getAdminAuth().createCustomToken(uid);
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is required for session refresh.");
  }

  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const exchangeUrl = authHost
    ? `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`
    : `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;

  const exchange = await fetch(exchangeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    cache: "no-store",
  });

  const exchanged = (await exchange.json()) as { idToken?: string; error?: unknown };
  if (!exchange.ok || !exchanged.idToken) {
    throw new Error("Failed to exchange custom token for session resolve.");
  }

  return resolveVendorSessionViaCallable(exchanged.idToken);
}
