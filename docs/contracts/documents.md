# Contract: documents (DOC-1)

Documents are required for every vendor type, shops included (D25). The exact list per type is an owner detail entered in the panel.

## Collections

### vendorDocumentRequirements/{vendorType}

```
{
  vendorType: string,
  requirements: [{
    id: string,
    nameEn: string,
    nameAr: string,
    required: boolean,
    acceptedTypes: string[],
    maxSizeMb: number
  }],
  updatedAt: timestamp
}
```

### vendorDocuments/{vendorId}_{requirementId}

```
{
  vendorId: string,
  requirementId: string,
  vendorType: string,
  storagePath: string,  // vendor_documents/{uid}/{requirementId}/{file}
  contentType: string | null,
  status: "pending" | "approved" | "rejected",
  rejectionReason: string | null,
  submittedAt: timestamp,
  reviewedAt: timestamp | null,
  reviewedBy: string | null
}
```

### vendors/{id}.documentCompliance (existing approved vendors)

```
{
  startAt: timestamp,
  deadlineAt: timestamp,  // start + 30 days
  autoSuspend: false      // best practice: no automatic suspension
}
```

## Endpoints

| Name | Caller | Auth |
|---|---|---|
| `vendor_documents-setVendorDocumentRequirements` | Admin | Admin Bearer / callable admin |
| `vendor_documents-submitVendorDocument` | Vendor | Signed-in owner |
| `vendor_documents-reviewVendorDocument` | Admin | Admin |

Approve signup (`vendor_signup-reviewVendorSignupRequest`) fails with `failed-precondition` until all required documents for the vendor type are approved.

## Storage

Path: `vendor_documents/{uid}/{requirementId}/{file}`. Owner write; owner or admin read. Rules land in WEB `storage.rules` and PANEL `emulator-rules/storage.rules`. Do not deploy in this ticket (T0.14).

## Client surfaces

- Portal: pending applicants and active vendors upload from profile / status.
- Vendor app: same, from account status (pending) or profile (active).
- Panel: define requirements per type; review pending documents; list missing docs and 30-day deadline for existing actives.
