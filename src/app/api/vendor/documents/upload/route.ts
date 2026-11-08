import {NextRequest, NextResponse} from "next/server";

import {requireVerifiedSession} from "@/lib/auth/session.server";
import {getAdminFirestore, getAdminStorage} from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const session = await requireVerifiedSession();
    const form = await request.formData();
    const file = form.get("file");
    const requirementId = String(form.get("requirementId") || "");
    const vendorType = String(form.get("vendorType") || "store");

    if (!requirementId || !(file instanceof File)) {
      return NextResponse.json({error: "invalid"}, {status: 400});
    }

    const db = getAdminFirestore();
    const reqDoc = await db
      .collection("vendorDocumentRequirements")
      .doc(vendorType)
      .get();
    const requirements = (reqDoc.data()?.requirements as Array<{id: string}>) || [];
    if (!requirements.some((row) => row.id === requirementId)) {
      return NextResponse.json({error: "unknown_requirement"}, {status: 400});
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `vendor_documents/${session.uid}/${requirementId}/${safeName}`;
    const bucket = getAdminStorage().bucket();
    const object = bucket.file(storagePath);
    await object.save(bytes, {
      contentType: file.type || "application/octet-stream",
      resumable: false,
    });

    const documentId = `${session.uid}_${requirementId}`;
    await db.collection("vendorDocuments").doc(documentId).set(
      {
        vendorId: session.uid,
        requirementId,
        vendorType,
        storagePath,
        contentType: file.type || null,
        status: "pending",
        rejectionReason: null,
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
      },
      {merge: true},
    );

    return NextResponse.json({success: true, documentId, storagePath});
  } catch {
    return NextResponse.json({error: "unauthorized"}, {status: 401});
  }
}
