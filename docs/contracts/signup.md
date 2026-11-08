# Contract: signup (PC-1 / S1.1)

## Endpoint: vendor_signup-submitVendorSignupRequest

| Field | Value |
|---|---|
| Type | Callable |
| Caller | Unauthenticated signup form (portal today, vendor app in PC-1) |
| Live | Yes |

### Request (from live function)

email, password, storeName, ownerName, contact fields as accepted by vendor_signup.js today.

### Response

pending request id / status pending.

### Side effects

Creates Auth user disabled:false. Creates vendor_signup_requests/{id} with status pending. Does not create vendors/{uid}.

## Endpoint: vendor_signup-reviewVendorSignupRequest

Caller: Admin. Approve creates vendors/{uid}, sets claims, users.accountStatus active.

### Reject (S1.1 / D28)

- Keeps the Auth user (enabled). Does **not** delete Auth.
- Requires a reason. Request field: `notes` (string). If the live panel sends no reason, store the default `"No reason provided."` and still succeed (backward compatible).
- Writes on the signup request: `status: "rejected"`, `rejectionReason`, `rejectedAt`, `reviewedAt`, `reviewedBy`, `reviewNotes` (same text as reason for compatibility), and appends to `history[]`.
- Panel UI (S1.1): reject dialog must require a non-empty reason before calling.

### Approve

Unchanged: enables Auth if needed, creates users/{uid} + vendors/{uid}, sets request approved.

## Endpoint: vendor_signup-reapplyVendorSignupRequest

See docs/contracts/vendor-session.md (S1.1). Rejected applicant edits fields and returns the request to pending.

## PC-1 vendor app

Same submit callable. Signup status screen reads through resolveVendorSession (pending / rejected) without a second schema.

## Rules needed

- Signup request create through callable only preferred.
- Pending and rejected vendor session via resolveVendorSession (Admin SDK).
