import {NextResponse} from "next/server";

import {requireVerifiedSession} from "@/lib/auth/session.server";
import {getAdminFirestore} from "@/lib/firebase-admin";

export async function GET() {
  try {
    const session = await requireVerifiedSession();
    const snap = await getAdminFirestore()
      .collection("vendorDocuments")
      .where("vendorId", "==", session.uid)
      .get();
    const documents = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        documentId: doc.id,
        requirementId: data.requirementId,
        status: data.status,
        rejectionReason: data.rejectionReason ?? null,
        storagePath: data.storagePath ?? null,
      };
    });
    return NextResponse.json({documents});
  } catch {
    return NextResponse.json({error: "unauthorized"}, {status: 401});
  }
}
