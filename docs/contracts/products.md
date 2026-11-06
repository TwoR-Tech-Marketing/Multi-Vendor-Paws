# Contract: products

## Collection: products/{productId}

Fields used today (portal + panel + buyer):

| Field | Type | Notes |
|---|---|---|
| vendorId | string | Buyer filters Halo by platformVendor. Admin create currently omits it (AB-10, BR-5.4 bug) |
| name | string | |
| pricePiastres | number | integer piastres |
| status | "active" \| "inactive" \| "out_of_stock" \| "archived" | portal ProductStatus |
| categoryIds | string[] | |
| stock | number | |
| images | string[] | when present |
| isHalo | boolean | mapped by buyer; no write found (AB-11) |
| createdBy, updatedBy | string | admin hardcodes username today (AB-15) |

## Endpoints

| Name | Caller | Status |
|---|---|---|
| Portal BFF GET/POST/PATCH/DELETE `/api/vendor/products` | Portal | Live. Moves to shared callables in S1.4 (D15) |
| Shared product create/update/archive callables | Portal + vendor app | S1.4 |

### Shared callable shape (S1.4 target)

Request: name, pricePiastres, status, categoryIds, stock, image paths. vendorId from auth session only.
Errors: unauthenticated, permission-denied (pending vendor), invalid-argument, not-found.
Auth: vendor session kind active for mutations. Pending locked (BR-2.7).

## Rules needed

- Vendor read/write own products where vendorId matches session vendorId.
- Buyers read active products only through eligibility (S2.2 / S2.11).
- Halo items: vendorId platformVendor, admin-only write.
