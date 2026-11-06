# Contracts

Locked by T0.5 (2026-11-06). One file per domain. Section 5 of docs/SOURCE_OF_TRUTH.md points here.

Both vendor clients call the same Cloud Function for a business rule (D15).

| File | Domain |
|---|---|
| vendor-session.md | Session resolve callable |
| vendors.md | Vendor documents and admin vendor callables |
| products.md | Catalog |
| orders.md | Orders and vendorOrders |
| earnings.md | Ledger and commission |
| notifications.md | Inbox and FCM registration |
| coverage-eligibility.md | Delivery coverage and resolveBuyerEligibility |
| suspension-holds.md | Suspend modes and hold cases |
| governorates.md | Governorate list |
| signup.md | PC-1 signup |
| profile-change-requests.md | PC-2 profile changes |
| settings.md | PC-3 settings |

Shapes that depend on an [OPEN] owner item are listed as open inside the file with the ticket they block. They are not treated as decided.
