import { NextResponse } from "next/server";
import { z } from "zod";

import { apiForbidden, apiGenericError, apiUnauthorized } from "@/lib/api/response";
import { getVendorApiContext } from "@/lib/auth/require-vendor-api";
import { getAdminAuth } from "@/lib/firebase-admin";

const bodySchema = z.object({
  ownerName: z.string().min(1),
  storeName: z.string().min(1),
  storeDescription: z.string().min(1),
  phone: z.string().min(1),
  contactPhone: z.string().min(1),
  contactEmail: z.string().email(),
  contactAddress: z.string().min(1),
  logoUrl: z.string().nullable().optional(),
});

function projectId(): string {
  return (
    process.env.GCLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "pets-acd3f"
  );
}

function reapplyCallableUrl(): string {
  const host = process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST;
  const id = projectId();
  if (host) {
    return `http://${host}/${id}/us-central1/vendor_signup-reapplyVendorSignupRequest`;
  }
  return `https://us-central1-${id}.cloudfunctions.net/vendor_signup-reapplyVendorSignupRequest`;
}

async function idTokenForUid(uid: string): Promise<string> {
  const customToken = await getAdminAuth().createCustomToken(uid);
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is required.");
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
  const body = (await exchange.json()) as { idToken?: string };
  if (!exchange.ok || !body.idToken) {
    throw new Error("Failed to exchange custom token.");
  }
  return body.idToken;
}

export async function POST(request: Request) {
  const context = await getVendorApiContext();
  if (!context) return apiUnauthorized();

  if (context.session.sessionKind !== "rejected") {
    return apiForbidden();
  }

  try {
    const payload = bodySchema.parse(await request.json());
    const idToken = await idTokenForUid(context.uid);

    const response = await fetch(reapplyCallableUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ data: payload }),
      cache: "no-store",
    });

    const body = (await response.json()) as {
      result?: { success?: boolean; data?: unknown };
      error?: { message?: string };
    };

    if (!response.ok || !body.result?.success) {
      return apiGenericError();
    }

    return NextResponse.json({ success: true, data: body.result.data });
  } catch {
    return apiGenericError();
  }
}
