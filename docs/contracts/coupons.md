# Contract: coupons

Status: stub. Locked in ticket VC-1.

## Model (BM-3, D23)

- Admin coupons funded by TenderPaws (vendor paid on the full price).
- Vendor coupons funded by the vendor (fees on the discounted price).
- One coupon per checkout.
- Every coupon has an expiry and a per-user limit.
- Vendors create their own coupons in the portal and the vendor app.

## Endpoints

| Name | Caller | Status |
|---|---|---|
| Vendor coupons create and manage | Vendor, admin | Planned VC-1 |
