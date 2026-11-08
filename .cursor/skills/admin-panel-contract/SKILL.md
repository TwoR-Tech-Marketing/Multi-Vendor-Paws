---
name: admin-panel-contract
description: Use when a portal feature depends on something the Flutter admin panel (tinderpaws_panel) must provide.
---
# Admin panel contract

The portal is vendor-only. These need work in `tinderpaws_panel` (Flutter web):

- [ ] Approve or decline provider applications (with decline reason)
- [ ] Set deal per branch (apply to all option): fixed fee per order, percentage or both (D22 / DL-1)
- [ ] View appointment requests and statuses
- [ ] Delete reviews
- [ ] Manage coupons (admin-funded) and review vendor coupons (D23 / VC-1)
- [ ] Record payouts and set payout cycle per vendor (D21 / PAY-1). No vendor subscription product.
- [ ] Document list per vendor type and document review (D25 / DOC-1)
- [ ] Telehealth doctor management and price (D27 / TH-3)
- [ ] Suspend with two modes (hidden or view only)
- [ ] Hold case queue for held orders and appointments (A2.1)
- [ ] Per vendor optional delivery fee, admin only, not shown in the vendor portal
- [ ] Halo item management that stamps seller id platformVendor
- [ ] Manage the canonical governorate list with stable IDs and category assignments by ID
- [ ] GOV-1: lock governorates HTTPS endpoints to admins

## Rules
- Admin writes the same Firestore documents the portal reads. Agree field names here before building either side.
- Providers never self-approve or self-set deals.
