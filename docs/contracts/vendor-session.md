# Contract: vendor-session

Locked by T0.5 (2026-11-06). Both vendor clients use the same callable (D15).

## Endpoint: vendor_session-resolveVendorSession

| Field | Value |
|---|---|
| Type | Callable (v2 onCall), region us-central1 |
| Caller | Portal and vendor app after Firebase Auth sign-in |
| Ticket | T0.6b implements. S1.1 may extend gates |
| Auth | Signed-in user required. `request.auth.uid` is the only identity |

### Request

Empty object `{}`. No client-supplied vendorId.

### Response

```
{
  kind: "active" | "pending" | "suspended" | "mobile_app_account" | "wrong_sign_in_email" | "not_vendor",
  profile: null | {
    vendorId: string,
    ownerName: string,
    email: string,
    storeName: string,
    status: "pending" | "active" | "suspended",
    approvalStatus: string | null,
    logoUrl: string | null,
    isBanned: boolean,
    restrictionType: "ban" | "suspend" | null,
    restrictionReason: string | null,
    restrictionExpiresAt: string | null,  // ISO-8601 or null
    isPermanentRestriction: boolean
  },
  allowedPortalAccess: boolean
}
```

Field names in the response use the portal session shape today (camelCase JSON). Firestore documents keep the mixed styles already in production (state report Part E).

### Kind mapping (from portal resolver)

Evidence: `src/features/auth/infrastructure/resolve-vendor-session.server.ts`.

| kind | When |
|---|---|
| active | vendors.status is active and not currently restricted |
| pending | Pending signup request, or vendor user who is neither active nor restricted |
| suspended | Ban or suspend that has not expired. Ban is `isBanned` / `is_banned` with status still suspended |
| mobile_app_account | users.role is not vendor (buyer or other) |
| wrong_sign_in_email | Signed-in email does not match the vendor contact path used by the resolver |
| not_vendor | No matching vendor, signup, or usable user role |

`allowedPortalAccess` is true for active, pending, and suspended.

### Errors

| Code | When |
|---|---|
| unauthenticated | No auth |
| internal | Unexpected read failure. Map to Strings.errors.generic in clients |

### Collections touched (read)

- users/{uid}
- vendors/{uid} or vendors/{vendorId from user}
- vendor_signup_requests where authUid == uid or email matches

### Rules needed

Callable uses Admin SDK. Clients do not need direct reads of signup requests for this endpoint. Pending/rejected direct-read rules remain for S1.1 if a client path still needs them.

### Port note

Ports the portal server resolver. PANEL implements the callable. Portal may keep the BFF session route until the ticket that moves it (D15).
