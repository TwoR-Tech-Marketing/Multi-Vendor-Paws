# Contract: deals

Status: stub. Locked in ticket DL-1.

## Model (BM-3, D22)

- Deals are set per branch, with an apply-to-all-branches option. Vendors without branches have one deal.
- Types: fixed fee per order (same amount whatever the order size), percentage of item value, or both.
- Fees apply to items only, never to delivery.
- Default when no deal: 10 percent (commissionConfig/main).
- Gateway fee is absorbed inside TenderPaws' fee.

## Collections (proposed)

vendorDeals / branch-scoped deal documents. Exact shape locked in DL-1.

## Endpoints

| Name | Caller | Status |
|---|---|---|
| setVendorDeal | Admin | Planned DL-1, A2.5 |
