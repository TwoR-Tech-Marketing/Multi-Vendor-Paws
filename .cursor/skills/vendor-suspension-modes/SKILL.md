---
name: vendor-suspension-modes
description: Use when building suspend, ban or unsuspend behavior for vendors, clinics and groomers, or anything that hides or blocks their items and bookings.
---
# Vendor suspension modes

## The two modes (admin chooses when suspending)
- hidden: the vendor items are not shown anywhere in the buyer app (feed, search, links).
- view_only: items are shown as unavailable. Add to cart and ordering are blocked in the UI and enforced on the server at checkout.

## Rules
- Store the mode on the vendor document, not on each product. Lifting the suspension restores everything with no product writes. Proposed shape (CONFIRM): suspension { mode, reason, at, expiresAt }
- Applies to stores, clinics and groomers.
- When a vendor is suspended, their open orders go on hold and a hold case with those orders goes to the admin. Clinics and groomers follow the same rule for appointments (BR-9.3).
- Existing portal behavior stays: suspended banner with reason, operational routes blocked.

## OPEN
- Hold case contents, statuses and resolution options (cancel, refund through support, reassign)
- What buyers are told about held orders
- Default mode for a permanent ban
