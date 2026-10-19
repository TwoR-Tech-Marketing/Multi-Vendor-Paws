---
name: admin-panel-contract
description: Use when a portal feature depends on something the Flutter admin panel (tinderpaws_panel) must provide.
---
# Admin panel contract

The portal is vendor-only. These need work in `tinderpaws_panel` (Flutter web):

- [ ] Approve or decline provider applications (with decline reason)
- [ ] Set deal per provider: fixed, percentage or both, plus values
- [ ] View appointment requests and statuses
- [ ] Delete reviews
- [ ] Manage coupons
- [ ] View subscription status and payments
- [ ] Suspend with two modes (hidden or view only)
- [ ] Admin ticket queue for held orders and appointments
- [ ] Per vendor optional delivery fee, admin only, not shown in the vendor portal
- [ ] Halo item management that stamps seller id platformVendor
- [ ] Manage the canonical governorate list with stable IDs and category assignments by ID

## Rules
- Admin writes the same Firestore documents the portal reads. Agree field names here before building either side.
- Providers never self-approve or self-set deals.
