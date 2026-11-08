---
name: points-and-coupons
description: Use when building loyalty points, coupons at checkout or points earned on extra invoices.
---
# Points and coupons

## Spec (D23, D24)
- Points: TenderPaws program, not per vendor. 1 point per EGP paid (`floor(paidPiastres / 100)`). Each point expires 12 months after it is earned. Reversed on refund. Redemption out of this release.
- Coupons: admin coupons funded by TenderPaws (vendor paid on the full price). Vendor coupons funded by the vendor (fees on the discounted price). One coupon per checkout; expiry and per-user limit. Vendors create coupons in the portal and the vendor app.

## Rules
- Use an append-only `pointsLedger` (entries, never a single editable counter).
- Server side only. Clients cannot write points.
- A refund must reverse the matching points entry.
