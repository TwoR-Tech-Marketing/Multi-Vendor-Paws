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

## Live endpoints (HTTPS onRequest, auth not verified today)

governorates-getAllGovernorates, createGovernorate, updateGovernorate, deleteGovernorate, assignCategoryGovernorates, getCategoryGovernorates, validateOrderDelivery.

Risk recorded in section 8. Hardening is a later ticket. T0.5 does not lock open HTTPS without auth as desired end state.

## Planned

Idempotent migration from name-keyed data to ids (S1.2). Dry run required.

## Open

O16 official list, boundary data, licence.
