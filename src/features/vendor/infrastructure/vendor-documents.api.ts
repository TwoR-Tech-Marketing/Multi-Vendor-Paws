export type VendorDocumentRequirement = {
  id: string;
  nameEn: string;
  nameAr: string;
  required: boolean;
  acceptedTypes: string[];
  maxSizeMb: number;
};

export type VendorDocumentRow = {
  documentId: string;
  requirementId: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  storagePath?: string | null;
};

export async function fetchVendorDocumentRequirements(
  vendorType = "store",
): Promise<VendorDocumentRequirement[]> {
  const response = await fetch(
    `/api/vendor/documents/requirements?vendorType=${encodeURIComponent(vendorType)}`,
    {cache: "no-store"},
  );
  if (!response.ok) {
    throw new Error("Failed to load document requirements.");
  }
  const body = (await response.json()) as {requirements?: VendorDocumentRequirement[]};
  return body.requirements ?? [];
}

export async function fetchMyVendorDocuments(): Promise<VendorDocumentRow[]> {
  const response = await fetch("/api/vendor/documents", {cache: "no-store"});
  if (!response.ok) {
    throw new Error("Failed to load documents.");
  }
  const body = (await response.json()) as {documents?: VendorDocumentRow[]};
  return body.documents ?? [];
}

export async function submitVendorDocumentMetadata(input: {
  requirementId: string;
  storagePath: string;
  contentType?: string;
  vendorType?: string;
}): Promise<void> {
  const response = await fetch("/api/vendor/documents/submit", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("Failed to submit document.");
  }
}
