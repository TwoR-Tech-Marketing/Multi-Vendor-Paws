---
name: firestore-multitenant-rules
description: Use when adding collections, writing firestore.rules, storage.rules or firestore.indexes.json for the services marketplace.
---
# Firestore multi-tenant rules

## Proposed collections (CONFIRM)
- `vendors/{id}/branches/{branchId}` (services and availability under or beside it)
- `appointments/{id}`
- `appointmentReviews/{id}`
- `vendorDeals/{vendorId}`
- `pointsLedger/{id}`

## Rules
- Providers read and write only their own `vendorId` data, even if the BFF is bypassed.
- Users read only their own appointments. Status changes go through the server.
- Keep mobile compatibility with the legacy collections already protected in `firestore.rules`.
- Every new query needs its composite index in `firestore.indexes.json`.
- Deploy order: indexes, rules, functions, then mobile.
- Test rules before any deploy.
