# Contract: governorates

## Collection: governorates/{id}

Document id is the stable id (D5).

| Field | Type | Status |
|---|---|---|
| name | string | Live today. Match by name in buyer delivery validation (AB-9) |
| nameEn | string | Add in S1.2 |
| nameAr | string | Add in S1.2 |
| code | string | optional |
| isActive | boolean | Live |

Related collection: `category_governorates/{categoryId}_{governorateId}` with `category_id`, `governorate_id`.

## Clients (as-built, AB-18)

| Client | Access path |
|---|---|
| Admin panel (`tinderpaws_panel`) | Firestore SDK via `GovernorateRepository` (create, update, delete, assign, list, validate) |
| Buyer app (`tinder_paws`) | Firestore SDK via `DeliveryValidationService` (read + validate). Does not call governorates HTTPS |
| Vendor portal (`Multi-Vendor-Paws`) | No governorates HTTPS callers |
| Vendor app (`tender_paws_partner`) | No governorates HTTPS callers |

## HTTPS endpoints (`governorates-*` onRequest)

Auth model (GOV-1):

| Handler | Auth |
|---|---|
| `governorates-getAllGovernorates` | Open (no token). Request and response shapes unchanged |
| `governorates-getCategoryGovernorates` | Open (no token). Request and response shapes unchanged |
| `governorates-validateOrderDelivery` | Open (no token). Request and response shapes unchanged |
| `governorates-createGovernorate` | Bearer ID token required. `verifyIdToken`, then same admin check as `vendors.js` (`admin` or `superAdmin` claim, or existing initial-admin uid). 401 without a valid token, 403 without admin |
| `governorates-updateGovernorate` | Same as create |
| `governorates-deleteGovernorate` | Same as create |
| `governorates-assignCategoryGovernorates` | Same as create |

## Canonical list and migration (S1.2)

- Stable ids (`gov_cairo`, …), `nameEn`, `nameAr`, `code` (ISO like `EG-C`). Additive `name` kept.
- Idempotent script: `functions/scripts/migrate_governorates.js` (mandatory `DRY_RUN=1` first; emulator only in this ticket).
- Boundary asset: `functions/data/geoBoundaries-EGY-ADM1.geojson` (full resolution) + `SOURCE.md` (ODbL 1.0).

## O16 (closed, S1.2 / Gate B)

geoBoundaries gbOpen Egypt ADM1, full GeoJSON, ODbL 1.0. See SOT section 4 and S1.2 Gate B notes.
