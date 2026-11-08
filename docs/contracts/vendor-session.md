# Contract: vendor-session

Locked by T0.5 (2026-11-06). Extended by S1.1 (2026-11-08). Both vendor clients use the same callable (D15).

## Endpoint: vendor_session-resolveVendorSession

| Field | Value |
|---|---|
| Type | Callable (v2 onCall), region us-central1 |
| Caller | Portal and vendor app after Firebase Auth sign-in |
| Ticket | T0.6b implements. S1.1 adds banned and rejected |
| Auth | Signed-in user required. `request.auth.uid` is the only identity |

### Request

Empty object `{}`. No client-supplied vendorId.

### Response

```
{
  kind: "active" | "pending" | "rejected" | "suspended" | "banned" | "mobile_app_account" | "wrong_sign_in_email" | "not_vendor",
  profile: null | {
    vendorId: string,
    ownerName: string,
    email: string,
    storeName: string,
    status: "pending" | "rejected" | "active" | "suspended",
    approvalStatus: string | null,
    logoUrl: string | null,
    isBanned: boolean,
    restrictionType: "ban" | "suspend" | null,
    restrictionReason: string | null,
    restrictionExpiresAt: string | null,  // ISO-8601 or null
    isPermanentRestriction: boolean,
    rejectionReason: string | null,
    rejectedAt: string | null,  // ISO-8601 or null
    signupRequestId: string | null
  },
  allowedPortalAccess: boolean
}
```

Field names in the response use the portal session shape today (camelCase JSON). Firestore documents keep the mixed styles already in production (state report Part E).

### Kind mapping

| kind | When |
|---|---|
| active | vendors.status is active and not currently restricted |
| pending | Pending signup request, or vendor user who is neither active nor restricted |
| rejected | Signup request status is rejected and the Auth login still exists (D28 / S1.1). Profile carries rejectionReason |
| suspended | Active suspend that has not expired (not a ban) |
| banned | isBanned / is_banned true and not expired (own kind; AB-4) |
| mobile_app_account | users.role is not vendor (buyer or other) |
| wrong_sign_in_email | Signed-in email does not match the vendor contact path used by the resolver |
| not_vendor | No matching vendor, signup, or usable user role |

`allowedPortalAccess` is true for active, pending, rejected, suspended, and banned (status screens). False for mobile_app_account, wrong_sign_in_email, not_vendor.

Session error (callable failure) is a client gate with retry. Never invent active. Never auto-logout on session error (Gate C / T0.6b).

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

Callable uses Admin SDK. Clients do not need direct reads of signup requests for this endpoint.

### Portal transport (S1.1)

Portal session kind comes from this callable (D15). Cookie BFF routes (`POST /api/auth/session`, `GET /api/auth/me`) may still verify the cookie and assemble the DTO, but resolution of kind/profile must call this shared function (not a divergent local copy). Local `resolve-vendor-session.server.ts` is deprecated once unused; do not delete in S1.1.

## Endpoint: vendor_signup-reapplyVendorSignupRequest

| Field | Value |
|---|---|
| Type | Callable (v2 onCall), region us-central1 |
| Caller | Rejected applicant (portal and vendor app) |
| Auth | Signed-in user. Must own a rejected signup request (`authUid` == caller) |

### Request

Editable signup fields (same as submit, without password): ownerName, storeName, storeDescription, phone, contactPhone, contactEmail, contactAddress, logoUrl (optional).

### Response

```
{
  success: true,
  data: {
    requestId: string,
    status: "pending",
    reapplyCount: number
  }
}
```

### Side effects

- Updates the existing signup request fields
- Sets status to pending
- Increments reapplyCount
- Appends an entry to history[]: `{ at, action: "reapply", by: uid }`
- Clears rejectionReason / rejectedAt / reviewNotes for the new review cycle (previous values remain only inside history if recorded on reject)

### Errors

| Code | When |
|---|---|
| unauthenticated | No auth |
| failed-precondition | No rejected request for this uid |
| invalid-argument | Missing required fields |
| internal | Unexpected failure |
