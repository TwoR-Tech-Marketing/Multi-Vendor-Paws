# Contract: settings (PC-3)

## Portal settings

Route `/settings`. Panels: account overview, commission snapshot, store snapshot, shortcuts, help/legal. Data from portal settings BFF today.

## Shared approach (D15)

Settings reads that are vendor-owned preferences (theme is local) stay client-local. Server-backed settings (commission view, account overview) move to shared callables or Firestore streams per O18 inside PC-3 / S1.6.

## Endpoints

| Name | Caller | Status |
|---|---|---|
| Portal settings API | Portal | Live |
| Shared settings summary callable | Portal + app | PC-3 |
| registerVendorFcmToken | Vendor | S1.6 (also listed under notifications) |

## Rules needed

- No new collections unless PC-3 finds a gap. Prefer reading vendors/{id} and commission override through existing docs/callables.
