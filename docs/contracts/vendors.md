# Contract: vendors

Locked shapes from code (state report Part E). Suspension modes (hidden / view_only) stay proposed until S1.2; they depend on O5 for Auth policy on permanent suspend.

## Collection: vendors/{vendorId}

| Field | Type | Source |
|---|---|---|
| ownerUid | string | signup approve, suspend, ban |
| status | "active" \| "suspended" | approve writes active; suspend/ban write suspended |
| approvalStatus | "approved" | written on approve |
| isBanned | boolean | ban sets true |
| banReason, banExpiresAt | string, timestamp | ban |
| suspendReason, suspendExpiresAt | string, timestamp | suspend |
| storeName, contactEmail, ownerName, email, logoUrl | string | profile / signup |
| vendorType | "store" \| "clinic" \| "groomer" | proposed, default store. Not written yet |
| suspension.mode | "hidden" \| "view_only" | proposed for S1.2. Not written yet |
| deliveryCoverage | object | S1.3 writable via `vendors-setVendorDeliveryCoverage` |

## Collection: users/{uid}

| Field | Type | Notes |
|---|---|---|
| role | string | "vendor", "admin", or buyer role |
| accountStatus | "active" \| "suspended" | ban and suspend both write suspended |
| vendorId | string | set on approve |
| is_banned, ban_reason, ban_expires_at | mixed | snake_case on user doc |
| suspend_reason, suspend_expires_at | mixed | snake_case on user doc |

## Live endpoints (PANEL functions)

| Name | Caller | Request | Response | Auth |
|---|---|---|---|---|
| vendors-suspendVendor | Admin | vendorId, shouldSuspend, durationDays?, reason? | status payload | admin / superAdmin / initial admin uid |
| vendors-banVendor | Admin | vendorId, shouldBan, durationDays?, reason? | status payload | admin / superAdmin / initial admin uid |
| vendors-deleteVendor | Admin | vendorId | ok | superAdmin / initial admin |
| vendors-syncVendorAccess | Signed-in vendor | {} | access sync result | auth.uid |
| vendors-setVendorCommission | Admin | vendorId, percent | commissionConfig/main update | admin |
| vendors-liftExpiredVendorRestrictions | System | schedule every 60 minutes | lifts | scheduled |
| vendors-reviewVendorProfileChange | Admin | requestId, decision, note? | ok | admin |

## Planned

| Name | Ticket | Notes |
|---|---|---|
| suspendVendor extended with mode | S1.2 | holds + hold case. Blocked by O5 for Auth on permanent suspend |
| unsuspendVendor | A2.1 | today reactivation is shouldSuspend false |

## Rules needed

- Vendor may read own vendors/{vendorId} when ownerUid == auth.uid or doc id == auth.uid.
- Admin writes only through functions.
- vendorAdminSettings never readable by the vendor (when introduced).
