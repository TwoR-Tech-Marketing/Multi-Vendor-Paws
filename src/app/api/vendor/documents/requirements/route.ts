import {NextRequest, NextResponse} from "next/server";

import {requireVerifiedSession} from "@/lib/auth/session.server";
import {getAdminFirestore} from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    await requireVerifiedSession();
    const vendorType =
      request.nextUrl.searchParams.get("vendorType") || "store";
    const snap = await getAdminFirestore()
      .collection("vendorDocumentRequirements")
      .doc(vendorType)
      .get();
    const requirements = snap.exists
      ? ((snap.data()?.requirements as unknown[]) ?? [])
      : [];
    return NextResponse.json({requirements});
  } catch {
    return NextResponse.json({error: "unauthorized"}, {status: 401});
  }
}
