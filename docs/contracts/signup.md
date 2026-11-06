# Contract: signup (PC-1)

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

Caller: Admin. Approve creates vendors/{uid}, sets claims, users.accountStatus active. Reject sets request rejected and deletes Auth user (AB-2).

## PC-1 vendor app

Same submit callable. Signup status screen reads through resolveVendorSession (pending) or a thin status read agreed in PC-1 without a second schema.

## Rules needed

- Signup request create through callable only preferred.
- Pending vendor session via resolveVendorSession (Admin SDK).
