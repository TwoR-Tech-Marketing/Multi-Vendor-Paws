---
name: deals-and-billing
description: Use when building per-provider deals (fixed fee per order, percentage, both), live balances, statements or payouts for vendors and service providers.
---
# Deals and billing

## Spec
- Deals are set per branch, with an apply-to-all-branches option. Vendors without branches have one deal (D22).
- Types: fixed fee per order (same amount whatever the order size), percentage of item value, or both. Admin enters the agreed values.
- No vendor subscription product (D21). S1.13 is deals view and statement only.
- Fees apply to items only, never to delivery. Delivery fee goes 100 percent to the vendor. Gateway fee is absorbed inside TenderPaws' fee. Default 10 percent when no deal (D22).
- Every buyer payment goes to TenderPaws. Vendors are paid net on a weekly or monthly cycle set per vendor by the admin. Payouts are manual ledger entries. Vendors see a statement (D21).

## Rules
- Service providers and stores use deal documents (see docs/contracts/deals.md in the workspace repo). commissionConfig/main stays as the 10 percent default when no deal is set.
- All money in integer piastres. Percentage rounding is half up (D28 / O17).
- Balance changes go through the earnings ledger (`sale | refund | adjustment | payout`), never direct overwrites.
- Admin sets deals. Providers see them read only (S1.13).

## DECIDED
The percentage is taken on the amount after the coupon for vendor-funded coupons; admin coupons fund the discount and the vendor is paid on the full price (D23). Payments: Apple in-app purchase for digital goods, Fawaterak for physical, appointments and telehealth, Android remote switch for digital goods (D26). Refunds are handled manually through support.
