# Contract: coverage-eligibility

Store vendors only (BR-4). Depends on O3 recommendation (function returns eligible vendor ids) and O16 for official governorate boundaries.

## Vendor deliveryCoverage (on vendors/{id})

Proposed shape for S1.2 / S1.3 (still marked open where noted):

```
deliveryCoverage: {
  mode: "zone" | "governorates",
  zone: { lat: number, lng: number, radiusMeters: number } | null,
  governorateIds: string[]
}
```

## Endpoint: resolveBuyerEligibility

| Field | Value |
|---|---|
| Caller | Buyer |
| Ticket | S1.2, S2.2 |
| Request | { lat: number, lng: number } |
| Response | { governorateId: string, vendors: [{ vendorId: string, orderable: boolean }], haloRule: object } |
| Auth | Signed-in buyer |
| Errors | invalid-argument, failed-precondition (no boundary data), internal |

orderable is false for view_only suspended vendors. hidden vendors are omitted.

## Rules needed

- coverage fields writable by the owning vendor through a validated callable or rules that match the schema.
- Eligibility never trusted from the client at checkout (createOrder re-checks).

## Open

- O16 official list and boundary licence block production boundary resolution.
- O15 buyer view before location is chosen.
