---
name: provider-onboarding
description: Use when building or editing clinic or groomer signup, profile, branches, services and the approve or decline flow in the Multi-Vendor-Paws portal.
---
# Provider onboarding

## Data the provider enters (from the services spec)
- Name of the clinic (or business)
- Branches, optional. Each branch has its own services and prices, with an option to duplicate services from another branch
- Phone, address, map location
- Tax registration document and license document (spec wording: "Segel Darebe" and "Tarkhes", read as these two. CONFIRM with client)
- Services and prices
- Photos (optional)
- Education and experience (optional, clinics)
- Available appointments (editable later)
- Home visit toggle

## Flow
1. Provider submits. Account status is `pending`.
2. TenderPaws approves or declines in the admin panel. Only approved providers are listed to buyers.
3. After approval, edits to live public info go through `vendor_profile_change_requests`.

## Rules
- vendorId comes from the verified session, never from client input.
- Uploads use `vendors/{vendorId}/...` storage paths from `src/lib/storage-paths.ts`.
- Money in integer piastres. UI copy via `useStrings()`.

## OPEN
- Decline reason: required text? Can the provider reapply?
- Which documents are mandatory for groomers?
