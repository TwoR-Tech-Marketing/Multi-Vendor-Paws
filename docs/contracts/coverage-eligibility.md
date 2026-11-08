# Contract: coverage-eligibility

Store vendors only (BR-4). Locked by S1.2 (2026-11-08). Gate B boundary source: geoBoundaries gbOpen Egypt ADM1 (O16 closed).

## Vendor deliveryCoverage (on vendors/{id})

```
deliveryCoverage: {
  mode: "zone" | "governorates",
  zone: { lat: number, lng: number, radiusMeters: number } | null,
  governorateIds: string[]
}
```

Additive. Coverage is required before a **new** store vendor can become active; existing active vendors are listed for the admin, not blocked (S1.2).

### Writable callables (S1.3)

| Name | Auth | Notes |
|---|---|---|
| `vendors-setVendorDeliveryCoverage` | Owning vendor | Validates mode; zone radius 500–100000 m; governorates ≥1 existing id. Writes `vendors/{uid}` or pending signup request. |
| `vendors-getVendorDeliveryCoverage` | Owning vendor | Returns coverage + vendorType |
| `vendors-listGovernoratesForCoverage` | Signed-in vendor | Active governorates `{id,nameEn,nameAr}` |

Store approve (`vendor_signup-reviewVendorSignupRequest`) fails if store coverage missing. Clinics/groomers/doctors never see the coverage UI.

## Endpoint: resolveBuyerEligibility

| Field | Value |
|---|---|
| Type | Callable `eligibility-resolveBuyerEligibility` |
| Caller | Buyer (not wired in the live buyer app yet) |
| Ticket | S1.2, S2.2 |
| Auth | Signed-in buyer |
| Request | `{ lat: number, lng: number }` |

### Response

```
{
  governorateId: string,
  nameEn: string,
  nameAr: string,
  resolution: "inside" | "nearest",
  distanceMeters: number | null,
  vendors: [{ vendorId: string, orderable: boolean }],
  haloRule: {
    governorateId: string,
    categoryIds: string[],
    failClosed: true
  }
}
```

- `orderable` is false for `view_only` suspended vendors. `hidden` vendors are omitted.
- Only `vendorType` store (default) with covering `deliveryCoverage` are returned.
- Active vendors and view_only suspended vendors that cover the point are included.
- Halo: categories from `category_governorates` for this governorate id only (fail closed).

### Governorate resolution (Gate B)

1. Point-in-polygon against full `geoBoundaries-EGY-ADM1.geojson` (functions/data, ODbL 1.0).
2. If no polygon contains the point, nearest governorate only if distance ≤ 2 km; else fail closed (`failed-precondition`).
3. Alias table maps all 27 `shapeName` and `shapeISO` values to `governorates/{id}`.
4. Zone mode matching uses haversine only (unaffected by boundary file).

`nameEn` / `nameAr` are returned so S2.1 can show "Delivering to: {governorate}" and let the buyer move the pin.

### Errors

| Code | When |
|---|---|
| unauthenticated | No auth |
| invalid-argument | Missing/non-numeric lat/lng |
| failed-precondition | Outside boundaries beyond 2 km |
| internal | Unexpected |

## Rules needed

- coverage fields writable by the owning vendor through the validated callables above (not client Firestore writes).
- Eligibility never trusted from the client at checkout (`createOrder` re-checks).
