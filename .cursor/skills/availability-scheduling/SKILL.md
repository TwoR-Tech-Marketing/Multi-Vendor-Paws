---
name: availability-scheduling
description: Use when building slots, branch hours, home visit availability, booking conflicts or the availability editor and calendar.
---
# Availability and scheduling

## Rules
- Availability belongs to a branch and is editable later.
- Store timestamps in UTC, render in Africa/Cairo.
- Booking must be race safe: reserve the slot in a Firestore transaction so two users cannot take the same slot.
- Editing availability must never silently cancel existing appointments. Show conflicts and let the provider resolve them.
- Home visit is a separate availability and pricing concern from in-branch visits.
- Calendar and editor must work in RTL (see i18n-rtl).

## Design notes
- This is the screen providers touch daily and the easiest to make clumsy. Spend design effort here (use the design skills).

## OPEN
- Slot duration: per service or fixed?
- Capacity per slot (one patient or several)?
- Minimum notice and maximum advance booking window?
- Home visit pricing and area limits?
