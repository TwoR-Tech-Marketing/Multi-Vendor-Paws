---
name: vendor-type-architecture
description: Use when adding or changing anything that depends on vendor type (store, clinic, groomer, doctor) in the Multi-Vendor-Paws portal: sidebar, routes, guards, onboarding, review labels.
---
# Vendor type architecture

## Rules
- Add `vendorType` on `vendors/{id}`: `store | clinic | groomer | doctor` (later: hotel, trainer, walker, services store). BR-1.6, D27.
- Missing `vendorType` means `store`. Existing store vendors must keep working untouched.
- ONE service-provider engine. Clinic, groomer and doctor differ by config, never by forked code.
- One vendor type per account (D28).
- Read type config through a single `getProviderConfig(type)` in `domain/`. No scattered `if (type === ...)` in UI.
- Config per type covers: label strings, required onboarding fields (documents per D25 / DOC-1), review category labels, home visit support, sidebar items.
- `ActiveVendorGuard` and account status (pending, rejected, active, suspended, banned, not a vendor) apply to every type. BR-2.5. Reject keeps the account (D28 / S1.1).
- Follow the repo layers: presentation, application, domain, infrastructure. Firebase only in infrastructure or src/lib.

## Sidebar by type
- store: Dashboard, Products, Orders, Earnings, Settings
- service providers: Dashboard, Appointments, Services, Branches, Availability, Reviews, Earnings, Settings
- doctor: Dashboard, Telehealth inbox, Earnings, Settings (TH-1)
- Routes come from `src/constants/routes.ts` only.

## DECIDED (D28)
- Groomers use grooming quality, pet handling, punctuality with their own tags (answered O14).

## Capabilities by type
Delivery coverage exists only for the store type (see delivery-zones-geo). Suspension applies to every type (see vendor-suspension-modes). Hotels, groomers, clinics, doctors and trainers have no delivery.
