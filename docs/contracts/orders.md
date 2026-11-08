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
| Portal BFF `/api/vendor/orders` | Portal | Live. Moves in S1.5 (D15) |
| createOrder | Buyer | Planned S2.11, CART-1. Single-vendor check on the server |

### Vendor order status updates (S1.5)

Request: vendorOrderId, nextStatus. Auth: active vendor owning the vendorOrder. Held orders cannot be changed by the vendor.

## Rules needed

- After S2.11 forced update: deny client order create.
- Vendor reads own vendorOrders only.
- Hold state writable only by functions.
