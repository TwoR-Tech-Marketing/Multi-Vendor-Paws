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
| Portal BFF GET/POST/PATCH/DELETE `/api/vendor/products` | Portal | Live. Default via `NEXT_PUBLIC_VENDOR_PRODUCTS_DATA_SOURCE=bff` |
| Shared product callables | Portal + vendor app | S1.4 live in functions |

### Shared callables (S1.4)

| Callable | Purpose |
|---|---|
| `vendor_products-listVendorProducts` | Paged list for owning vendor |
| `vendor_products-getVendorProduct` | One product |
| `vendor_products-createVendorProduct` | Create (no Halo) |
| `vendor_products-updateVendorProduct` | Update |
| `vendor_products-archiveVendorProduct` | Archive |
| `vendor_products-setVendorProductStatus` | Status change |

Request: name, pricePiastres, status, categoryIds, stock, imageUrls. vendorId from auth session only.
Errors: unauthenticated, permission-denied (pending vendor), invalid-argument, not-found.
Auth: active vendor for mutations. Pending locked (BR-2.7). Portal flag `callable` switches clients off the BFF.

## Rules needed

- Vendor read/write own products where vendorId matches session vendorId.
- Buyers read active products only through eligibility (S2.2 / S2.11).
- Halo items: vendorId platformVendor, admin-only write.
