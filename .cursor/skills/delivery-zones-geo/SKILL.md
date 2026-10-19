---
name: delivery-zones-geo
description: Use when building or changing delivery coverage, buyer location, governorate handling, delivery fees or item eligibility by location.
---
# Delivery zones and governorates

## Scope
- Delivery applies to store vendors only. Hotels, clinics, groomers and trainers have no delivery coverage.
- Halo items (sold by the platform) are a separate thing, see halo-and-platform-vendor.

## Vendor coverage (one mode only, no combined mode)
- mode zone: a point on the map plus a radius. Zone is the basic mode.
- mode governorates: a list of governorate IDs.
- The vendor chooses and edits this in the portal. The admin does not pick vendor locations.
- Proposed shape (CONFIRM): deliveryCoverage { mode, zone { lat, lng, radiusMeters }, governorateIds[] }

## Halo
- Keeps the existing rule: category to governorate (category_governorates), by governorate ID, fail closed.

## Buyer location
- Comes from the device location service (lat and lng). If permission is denied, the buyer picks a location by hand on the map picker.
- Browse must use it, not only checkout.

## Governorates
- One canonical list with a stable ID, an English name and an Arabic name.
- Never match by name. Vendor coverage, Halo categories, fees and orders reference the governorate ID.
- Resolve the buyer governorate from lat and lng using boundary data, with a name alias table only as a fallback.
- Name keyed data (for example fee keys like cairo and giza) needs a one time migration to IDs.

## Eligibility
- Computed on the server. Checkout re-checks on the server, because buyers move and vendors change coverage or status.
- Only active vendors are eligible. Suspension follows vendor-suspension-modes.

## Delivery fee
- Optional, per vendor, belongs to the vendor, added to the order total.
- Set by the admin only. It is not shown or editable in the vendor portal.
- The platform takes its fee on orders from the vendor, it does not take the delivery fee as its own.
- Halo keeps its existing governorate based fees.

## OPEN
- Eligible vendor IDs then query products, or copy coverage data onto each product
- What a buyer sees before a location is chosen
- What happens to a cart when the buyer location changes
- Official governorate list, boundary data source and its licence
- Does the commission base include the delivery fee?
