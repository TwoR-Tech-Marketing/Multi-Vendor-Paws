# Contract: orders

## Collections

### orders/{orderId}

Buyer-created today (AB-12). Fields seen: deliveryFee (float EGP), deliveryLocation.governorate (name), payment fields, line items.

2026-11-08 (BM-3, D20): single-vendor cart. An order holds items from one store only. Halo is TenderPaws' own store. createOrder rejects mixed carts. orders_split remains only for old app versions until the forced update.

### vendorOrders/{orderId}_{vendorId}

Created by orders_split. Fields: subtotalPiastres, deliveryFeePiastres, discountPiastres, totalPiastres, commissionPiastres, netPiastres, status.

### Proposed additions (S1.5 / S2.11 / CART-1)

| Field | Notes |
|---|---|
| governorateId | stable id, not name |
| holdState | when suspension holds the order |
| money | all piastres |
| vendorId | single vendor for the order (D20) |

## Endpoints

| Name | Caller | Status |
|---|---|---|
| orders_split.splitOrderOnCreate | System | Live Firestore onCreate (legacy until forced update) |
| orders_split.splitOrderById | Admin/system | Live callable |
| Portal BFF `/api/vendor/orders` | Portal | Live. Default via `NEXT_PUBLIC_VENDOR_ORDERS_DATA_SOURCE=bff` |
| Shared order callables | Portal + vendor app | S1.5 |
| createOrder | Buyer | Planned S2.11, CART-1. Single-vendor check on the server |

### Shared callables (S1.5)

| Callable | Purpose |
|---|---|
| `vendor_orders-listVendorOrders` | Paged list; optional status filter |
| `vendor_orders-getVendorOrder` | One vendorOrder |
| `vendor_orders-updateVendorOrderStatus` | Allowed transitions; rejects `holdState: held` |

Request: vendorOrderId, nextStatus. Auth: active vendor owning the vendorOrder. Held orders cannot be changed by the vendor. Fee/net prefer DL-1 fields (`platformFeePiastres`, `vendorNetPiastres`) when present.

## Rules needed

- After S2.11 forced update: deny client order create.
- Vendor reads own vendorOrders only.
- Hold state writable only by functions.
