---
name: deals-and-billing
description: Use when building per-provider deals (fixed subscription, percentage, both), live balances, subscription status or payouts for service providers.
---
# Deals and billing

## Spec
- Per provider deal type: fixed subscription, percentage, or both. Admin enters the agreed values.
- Percentage deals: each provider balance is calculated automatically, live.
- Subscription status shows: monthly or annual amount, start date, renewal date, payment status, grace period.

## Rules
- Service providers use `vendorDeals/{vendorId}`. The global `commissionConfig/main` stays for stores unless told otherwise.
- All money in integer piastres. Percentage rounding rule is defined once in the money helper.
- Balance changes go through the earnings ledger (`sale | refund | adjustment | payout`), never direct overwrites.
- Admin sets deals. Providers see them read only.

## OPEN (blocks building)
- Who collects the patient payment: TenderPaws or the clinic?
- Payout schedule and method
- How the fixed fee is collected and what happens after the grace period
- Is the percentage taken before or after coupons?
- Refund effect on balance
