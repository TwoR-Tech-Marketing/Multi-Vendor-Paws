# Contracts

Locked by T0.5 (2026-11-06). One file per domain. Section 5 of docs/SOURCE_OF_TRUTH.md points here.

Both vendor clients call the same Cloud Function for a business rule (D15).

| File | Domain |
|---|---|
| vendor-session.md | Session resolve callable |
| vendors.md | Vendor documents and admin vendor callables |
| products.md | Catalog |
| orders.md | Orders and vendorOrders (single-vendor cart, D20) |
| earnings.md | Ledger and commission (items-only fees, D22) |
| deals.md | Stub until DL-1 |
| payouts.md | Stub until PAY-1 |
| coupons.md | Stub until VC-1 |
| points.md | Stub until PTS-1 |
| documents.md | Stub until DOC-1 |
| telehealth.md | Stub until TH-1 / TH-2 |
| notifications.md | Inbox and FCM registration |
| coverage-eligibility.md | Delivery coverage and resolveBuyerEligibility |
| suspension-holds.md | Suspend modes and hold cases |
| governorates.md | Governorate list |
| signup.md | PC-1 signup |
| profile-change-requests.md | PC-2 profile changes |
| settings.md | PC-3 settings |

2026-11-08 (BM-3): earnings.md and orders.md updated for D20 to D22. Stubs for deals, payouts, coupons, points, documents and telehealth are marked locked in their ticket.

Shapes that depend on an owner detail still open in section 4 are listed as open inside the file with the ticket they block. They are not treated as decided.
