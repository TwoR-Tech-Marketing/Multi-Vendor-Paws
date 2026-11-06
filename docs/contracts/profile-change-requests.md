# Contract: profile-change-requests (PC-2)

## Collection: vendor_profile_change_requests/{id}

Exists. Reviewed by vendors-reviewVendorProfileChange (live).

Fields follow the panel function and portal profile change repository. Do not invent parallel names.

## Endpoints

| Name | Caller | Status |
|---|---|---|
| vendors-reviewVendorProfileChange | Admin | Live |
| Portal profile BFF + change request create | Portal | Live. Shared create callable in PC-2 / profile ticket (D15) |
| Vendor app profile + change request | Vendor app | PC-2 |

### Shared create (target)

Request: proposed store fields. Auth: signed-in vendor (active or pending per O20). Creates a request document. Live profile fields that require review are not written directly.

## Rules needed

- Vendor reads own requests.
- Writes to live vendor profile for reviewed fields only through functions.
