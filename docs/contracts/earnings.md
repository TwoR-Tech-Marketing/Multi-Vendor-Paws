# Contract: earnings

## Collections

Append-only ledger entries (existing portal financials feature). Entry kinds: sale, refund, adjustment, payout.

commissionConfig/main (AB-14):

| Field | Type |
|---|---|
| defaultCommissionPercent | number, default 10 |
| vendorOverrides | map vendorId -> percent |

Relation of this percent model to BR-7.1 deals is O19. Not locked as the deal document.

## Endpoints

| Name | Caller | Status |
|---|---|---|
| Portal BFF earnings routes | Portal | Live. Move in S1.6 (D15) |
| vendors-setVendorCommission | Admin | Live |
| setVendorDeal | Admin | Planned A2.5 / S1.13. Blocked by O19 clarity |

## Rules needed

- Vendor may read own ledger entries and own deal document when introduced.
- commissionConfig/main readable by admin and functions only for writes; vendor may read own override percent through a callable if needed.
