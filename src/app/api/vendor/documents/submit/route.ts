import {NextRequest, NextResponse} from "next/server";

import {requireVerifiedSession} from "@/lib/auth/session.server";
import {getAdminAuth} from "@/lib/firebase-admin";

function callableUrl(): string {
  const project =
    process.env.GCLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "pets-acd3f";
  const host = process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST;
  if (host) {
    return `http://${host}/${project}/us-central1/vendor_documents-submitVendorDocument`;
  }
  return `https://us-central1-${project}.cloudfunctions.net/vendor_documents-submitVendorDocument`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireVerifiedSession();
    const body = (await request.json()) as {
      requirementId?: string;
      storagePath?: string;
      contentType?: string;
      vendorType?: string;
    };

    const customToken = await getAdminAuth().createCustomToken(session.uid);
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({error: "misconfigured"}, {status: 500});
    }

    const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
    const exchangeUrl = authHost
      ? `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`
      : `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;

    const exchange = await fetch(exchangeUrl, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({token: customToken, returnSecureToken: true}),
      cache: "no-store",
    });
    const exchanged = (await exchange.json()) as {idToken?: string};
    if (!exchange.ok || !exchanged.idToken) {
      return NextResponse.json({error: "auth_exchange_failed"}, {status: 500});
    }

    const response = await fetch(callableUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${exchanged.idToken}`,
      },
      body: JSON.stringify({
        data: {
          requirementId: body.requirementId,
          storagePath: body.storagePath,
          contentType: body.contentType,
          vendorType: body.vendorType || "store",
        },
      }),
      cache: "no-store",
    });

    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json(payload, {status: response.status});
    }
    return NextResponse.json(payload.result ?? payload);
  } catch {
    return NextResponse.json({error: "unauthorized"}, {status: 401});
  }
}
