---
name: points-and-coupons
description: Use when building loyalty points, coupons at checkout or points earned on extra invoices.
---
# Points and coupons

## Spec
- 1 point per 1 EGP paid. In piastres: `floor(paidPiastres / 100)`.
- Points are earned on checkout and on extra-service invoices paid on the spot.
- Optional coupon discount at checkout.

## Rules
- Use an append-only `pointsLedger` (entries, never a single editable counter).
- Server side only. Clients cannot write points.
- A refund must reverse the matching points entry.

## OPEN
- Points base: before or after coupon discount?
- Expiry and redemption rules (what are points worth?)
- Who funds coupon discounts: TenderPaws or the provider?
- Coupon limits: per user, per provider, usage caps
