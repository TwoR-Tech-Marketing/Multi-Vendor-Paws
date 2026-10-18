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

## Rules
- Admin writes the same Firestore documents the portal reads. Agree field names here before building either side.
- Providers never self-approve or self-set deals.
