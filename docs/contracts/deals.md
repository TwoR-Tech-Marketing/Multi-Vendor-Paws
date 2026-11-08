# Contract: deals (DL-1)

Status: locked in DL-1 (2026-11-08). D22, D23, D28.

## Collection: vendorDeals/{vendorId}

```
{
  vendorId: string,
  type: "fixed" | "percentage" | "both",
  fixedFeePerOrderPiastres: number,   // integer >= 0; used when type is fixed or both
  percentage: number,                 // 0..100; used when type is percentage or both
  applyToAllBranches: boolean,        // true = ignore branchOverrides for fee calc
  branchOverrides: {                  // optional map; used when applyToAllBranches is false
    [branchId: string]: {
      type: "fixed" | "percentage" | "both",
      fixedFeePerOrderPiastres: number,
      percentage: number
    }
  },
  effectiveFrom: timestamp,           // deal values apply to orders placed at/after this time
  updatedAt: timestamp,
  updatedBy: string                   // admin uid
}
```

Vendors without a deal document use `commissionConfig/main.defaultCommissionPercent` (default 10). Legacy `vendorOverrides` remain for old `orders_split` behavior until cutover; after cutover, a deal document wins over overrides for that vendor.

## Cutover setting

`commissionConfig/main.itemsOnlyFrom` (timestamp | null).

- Unset / null: `orders_split` keeps the pre-DL-1 formula (commission on total including delivery, after discount).
- Set: only orders with `placedAt >= itemsOnlyFrom` use the shared items-only fee module. Existing vendorOrders are never recomputed.

## Fee calculation (shared module)

All money integer piastres. Percentage rounding: half up (D28).

Inputs per vendor order slice:

| Input | Meaning |
|---|---|
| itemsPiastres | Sum of line totals at list/unit price |
| deliveryFeePiastres | Delivery for this vendor slice (100 percent to vendor) |
| discountPiastres | Coupon discount allocated to this slice |
| couponFunding | `none` \| `admin` \| `vendor` (D23) |
| deal | Resolved deal for vendor/branch, or null |

Fee base for the percentage part:

- `admin` or `none`: `itemsPiastres` (vendor paid on full price for admin coupons)
- `vendor`: `max(0, itemsPiastres - discountPiastres)`

TenderPaws fee (`platformFeePiastres`):

- no deal: `halfUp(feeBase * defaultPercent / 100)` (default 10)
- `fixed`: `fixedFeePerOrderPiastres`
- `percentage`: `halfUp(feeBase * percentage / 100)`
- `both`: fixed + percentage
- Cap [DECIDED, best practice, Gate C]: after the sum above, `platformFeePiastres = min(platformFeePiastres, feeBasePiastres)`. TenderPaws fee never exceeds the item value used as the fee base, so vendor net is never below the delivery fee. Example: fixed 1500 on items 1000 with no delivery → fee 1000, net 0.

Vendor net (`vendorNetPiastres`):

- `admin` or `none`: `itemsPiastres - platformFeePiastres + deliveryFeePiastres`
- `vendor`: `max(0, itemsPiastres - discountPiastres) - platformFeePiastres + deliveryFeePiastres`

Gateway fee is absorbed inside TenderPaws' fee (not a separate line on the vendor order).

Admin coupons (D23): TenderPaws may earn zero or less on an order after funding the buyer discount while still paying the vendor on full item price. That outcome is intended.

## Ledger (sale entries after cutover)

When the cutover applies, sale ledger rows store at least:

- `itemsPiastres`, `deliveryFeePiastres`, `discountPiastres`, `couponFunding`
- `platformFeePiastres`, `vendorNetPiastres`
- `dealType`, `fixedFeePerOrderPiastres`, `percentage` (or default percent)
- Keep legacy `commissionPiastres` / `netPiastres` mirrored to the new fee/net for old readers until S1.6/S1.13.

## Endpoints

| Name | Caller | Auth |
|---|---|---|
| `vendors-setVendorDeal` | Admin | Shared admin check (`admin_auth.js`) |

Request: `{ vendorId, type, fixedFeePerOrderPiastres?, percentage?, applyToAllBranches, branchOverrides?, effectiveFrom? }`.
Response: `{ ok: true, deal: <vendorDeals doc> }`.

History: each write may append to `vendorDeals/{vendorId}/history/{autoId}` with previous values + `updatedBy` + `updatedAt` (best practice for the panel history list).

## Client surfaces

- Panel: deal editor on vendor detail (type, values, apply to all branches, history).
- Portal / vendor app read view: S1.13 (not required to block DL-1 fee cutover).
- `orders_split`: switches to the shared module only after `itemsOnlyFrom` (Gate C required before that wiring).

## Rules needed (not deployed in DL-1)

- `vendorDeals/{vendorId}`: admin write; vendor read own; functions Admin SDK.
- History subcollection: admin read/write; vendor read own.
