# Tender Paws Multi-Vendor Phase 3 TODO

Source: `tenderpaws_phase3.pdf` (Client-approved scope).

## Delivery Milestones

## Milestone 1 - Foundation and Identity
- [x] Connect Next.js app to Tender Paws Firebase project.
- [x] Add base email/password login flow.
- [ ] Add Firestore user profile bootstrap (`users/{uid}`).
- [ ] Add role claims/profile (`admin` / `vendor`).
- [ ] Implement route guards for public/vendor/admin route groups.
- [ ] Add account status checks (`active` / `suspended`) at login and protected routes.

## Milestone 2 - Vendor Onboarding and Store Setup
- [ ] Vendor registration flow.
- [ ] Vendor profile setup form (store name, logo, description, contacts).
- [ ] Admin approval workflow for store activation.
- [ ] Admin suspend/reactivate vendor account.
- [ ] Audit log entries for approve/reject/suspend actions.

## Milestone 3 - Vendor Product Management
- [ ] Product create form with fields: name, description, images, price, stock, category.
- [ ] Vendor-owned product list with pagination/filter/search.
- [ ] Product update and delete (vendor can only manage own products).
- [ ] Product status toggle (`active` / `inactive`).
- [ ] Inventory update actions and stock validation.
- [ ] Firestore security rules for vendor product isolation.

## Milestone 4 - Marketplace Flow Integration (Buyer Side Data)
- [ ] Prepare multi-vendor product query API for mobile app consumption.
- [ ] Add store identity fields in product payload.
- [ ] Add "Halo" labeling flag in product data model.
- [ ] Add vendor storefront query endpoints (store info + store products).
- [ ] Add multi-vendor filtering support data contracts.

## Milestone 5 - Orders (Vendor/Admin)
- [ ] Vendor order inbox (vendor sees own orders only).
- [ ] Vendor order details with status timeline.
- [ ] Vendor status update flow based on approved order lifecycle.
- [ ] Admin cross-vendor order monitoring page.
- [ ] Operational intervention actions from admin side.
- [ ] Audit log for critical order status changes.

## Milestone 6 - Admin Governance
- [ ] Vendor list management page (search/filter/status).
- [ ] Approve/reject/suspend account controls.
- [ ] Central products visibility page for admin.
- [ ] Central orders visibility page for admin.
- [ ] Manual intervention tools for exceptional operations.

## Milestone 7 - Financial Foundation
- [ ] Commission-ready order ledger schema.
- [ ] Vendor earnings summary view.
- [ ] Payout-ready entries (settlement preparation records).
- [ ] Admin financial oversight baseline (read-only at phase scope).

## Milestone 8 - Security and Access Control
- [ ] Finalize role-based permissions matrix (vendor/admin).
- [ ] Enforce vendor data isolation in backend access patterns.
- [ ] Firestore security rules and validation pass.
- [ ] Add audit-friendly flow for major management actions.
- [ ] Security regression test checklist before release.

## Cross-Cutting Technical TODO
- [ ] Add shared types for users/vendors/products/orders/earnings/audit.
- [ ] Add feature-first folders and module boundaries under `src/features`.
- [ ] Add standardized repository/service layer for Firestore access.
- [ ] Add loading/error/empty states across primary pages.
- [ ] Add smoke test scripts for auth, product CRUD, order flow.
- [ ] Add deployment checklist and production env documentation.
