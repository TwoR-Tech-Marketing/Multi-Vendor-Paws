# Contract: points

Status: stub. Locked in ticket PTS-1.

## Model (BM-3, D24)

- A TenderPaws program, not per vendor.
- 1 point per EGP paid on any purchase (floor of paid piastres / 100).
- Each point expires 12 months after it is earned.
- Reversed on refund.
- Redemption is out of this release.

## Collections (proposed)

pointsLedger/{id}. Exact shape locked in PTS-1.

## Endpoints

| Name | Caller | Status |
|---|---|---|
| Points award, expiry, reversal | System | Planned PTS-1 / A2.6 |
