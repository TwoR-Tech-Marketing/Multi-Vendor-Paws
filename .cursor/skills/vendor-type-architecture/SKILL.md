---
name: vendor-type-architecture
description: Use when adding or changing anything that depends on vendor type (store, clinic, groomer) in the Multi-Vendor-Paws portal: sidebar, routes, guards, onboarding, review labels.
---
# Vendor type architecture

## Rules
- Add `vendorType` on `vendors/{id}`: `store | clinic | groomer` (later: trainer, walker, host).
- Missing `vendorType` means `store`. Existing store vendors must keep working untouched.
- ONE service-provider engine. Clinic and groomer differ by config, never by forked code.
- Read type config through a single `getProviderConfig(type)` in `domain/`. No scattered `if (type === ...)` in UI.
- Config per type covers: label strings, required onboarding fields, review category labels, home visit support, sidebar items.
- `ActiveVendorGuard` and account status (pending, active, suspended) apply to every type.
- Follow the repo layers: presentation, application, domain, infrastructure. Firebase only in infrastructure or src/lib.

## Sidebar by type
- store: Dashboard, Products, Orders, Earnings, Settings
- service providers: Dashboard, Appointments, Services, Branches, Availability, Reviews, Earnings, Settings
- Routes come from `src/constants/routes.ts` only.

## OPEN
- Does groomer use the exact same review categories as clinic ("Doctor efficiency" does not fit a groomer)?
- Does a single account ever have more than one type?
