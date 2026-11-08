# Contract: earnings

## Collections

Append-only ledger entries (existing portal financials feature). Entry kinds: sale, refund, adjustment, payout.

commissionConfig/main (AB-14):

| Field | Type |
|---|---|
| defaultCommissionPercent | number, default 10 |
| vendorOverrides | map vendorId -> percent |

2026-11-08 (BM-3, D22): default 10 percent applies when a vendor has no deal. Deal documents supersede per-vendor overrides for branches that have a deal. Commission and deal fees apply to items only, never delivery. Delivery fee goes 100 percent to the vendor. Gateway fee is absorbed inside TenderPaws' fee (vendor net = items minus deal fees). See docs/contracts/deals.md and docs/contracts/payouts.md.

2026-11-08 (DL-1): cutover field `commissionConfig/main.itemsOnlyFrom`. When set, new sale ledger rows for orders at/after that time store `platformFeePiastres` / `vendorNetPiastres` from the shared `deal_fees` module and mirror legacy `commissionPiastres` / `netPiastres`. Unset keeps old `orders_split` behavior for all orders.

## Endpoints

| Name | Caller | Status |
|---|---|---|
| Portal BFF earnings routes | Portal | Live. Move in S1.6 (D15) |
| vendors-setVendorCommission | Admin | Live (legacy override path) |
| setVendorDeal | Admin | Planned DL-1 / A2.5 |
| Payout recording and statements | Admin, vendor | Planned PAY-1 |

## Rules needed

- Vendor may read own ledger entries and own deal document when introduced.
- commissionConfig/main readable by admin and functions only for writes; vendor may read own override percent through a callable if needed.
