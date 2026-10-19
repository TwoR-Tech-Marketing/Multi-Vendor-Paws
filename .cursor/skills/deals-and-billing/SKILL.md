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

## DECIDED
The percentage is taken on the amount after the coupon. Payments run in the mobile app: Apple in-app purchase for digital goods, Fawaterak webview for the rest. Refunds are handled manually through support. Taxes depend on the payment method and are handled with the payment integration. The platform takes its fee on orders from the vendor. Delivery fee is optional, per vendor, set by the admin only, and belongs to the vendor.

## OPEN (blocks building)
- Who collects the patient payment: TenderPaws or the clinic?
- Payout schedule and method
- How the fixed fee is collected and what happens after the grace period
- Refund effect on balance
- Does the percentage base include the delivery fee?
- Who pays the Fawaterak gateway fees?
