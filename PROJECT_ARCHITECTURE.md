# Tender Paws Multi-Vendor Architecture

This document defines the target architecture for Phase 3 implementation in `Multi-Vendor-Paws`.

## 1) Architecture Style

- Feature-first architecture with clear domain boundaries.
- Next.js App Router (`src/app`) for route composition only.
- Layered responsibilities per feature:
  - `presentation`: pages, sections, UI components.
  - `application`: use-cases, orchestration, actions.
  - `domain`: entities, types, business rules.
  - `infrastructure`: Firebase, API clients, repositories.

## 2) Proposed Folder Structure

```txt
src/
  app/
    (public)/
      login/page.tsx
    (vendor)/
      dashboard/page.tsx
      products/page.tsx
      orders/page.tsx
      store/page.tsx
      earnings/page.tsx
    (admin)/
      vendors/page.tsx
      orders/page.tsx
      products/page.tsx
    api/
      vendor/
      admin/
      webhooks/
  features/
    auth/
      presentation/
      application/
      domain/
      infrastructure/
    vendor-onboarding/
    vendor-profile/
    vendor-products/
    vendor-orders/
    marketplace/
    admin-governance/
    finance/
    access-control/
  lib/
    firebase.ts
    auth.ts
    env.ts
  shared/
    ui/
    hooks/
    utils/
    types/
```

## 3) Route Groups and Responsibilities

- `(public)`: unauthenticated pages (login, forgot password).
- `(vendor)`: vendor-only console (store setup, products, orders, earnings).
- `(admin)`: admin-only governance and monitoring.
- `api/*`: server-only endpoints/actions for privileged operations.

## 4) Identity and Access Control

- Firebase Authentication for identity.
- App-level role model:
  - `admin`
  - `vendor`
- Role resolution from `users/{uid}` profile in Firestore.
- Route protection:
  - Public routes accessible by all.
  - Vendor routes require `role=vendor`.
  - Admin routes require `role=admin`.
- Vendor data isolation:
  - All vendor data keyed by `vendorId`.
  - Queries always filtered by current vendor identity.

## 5) Core Domain Modules (Phase 3)

- `vendor-onboarding`: registration, approval, activation.
- `vendor-profile`: store details and status.
- `vendor-products`: CRUD, inventory, product status.
- `vendor-orders`: order inbox and status updates.
- `marketplace`: read-side feeds for mobile app consumption.
- `admin-governance`: vendor/product/order oversight.
- `finance`: commission-ready ledger foundation and earnings summaries.
- `access-control`: authorization guards and audit events.

## 6) Data Model (High-Level)

- `users/{uid}`: identity + role + account status.
- `vendors/{vendorId}`: store profile, approval state, operational status.
- `products/{productId}`: vendor-owned product catalog records.
- `orders/{orderId}`: includes `vendorId`, buyer refs, totals, status timeline.
- `vendorEarnings/{vendorId}/entries/{entryId}`: payout-ready earning rows.
- `auditLogs/{logId}`: major admin/vendor actions.

## 7) Integration Notes with Existing Tender Paws Apps

- Keep marketplace buyer UX on mobile app (`tinder_paws`) as source of truth.
- Reuse the same Firebase project (`pets-acd3f`) and role strategy.
- Expose stable read/write contracts that admin panel (`tinderpaws_panel`) can share.

## 8) Non-Functional Baselines

- Type-safe domain models and DTOs.
- Consistent error mapping for user-friendly messages.
- Audit-friendly action logging for approvals/suspensions/status changes.
- Keep secrets and privileged logic server-side only.
