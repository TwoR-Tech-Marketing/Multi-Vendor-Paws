---
name: appointments-domain
description: Use when touching appointment statuses, transitions, history, cancellation, rescheduling or the appointments inbox.
---
# Appointments domain

## Statuses (from the spec)
`paid`, `completed`, `cancelled_by_user`, `cancelled_by_clinic`, `rescheduled`, `no_show`, `refund_pending`, `refunded`

The spec starts at `paid` because the user pays at checkout.

## Proposed transitions (CONFIRM)
- paid -> completed | cancelled_by_user | cancelled_by_clinic | rescheduled | no_show
- cancelled_by_user | cancelled_by_clinic -> refund_pending -> refunded (policy OPEN)
- no_show -> refund outcome OPEN

## Rules
- Transition rules live in `domain/` only. The BFF enforces them server side. The UI never decides.
- Every change appends to `statusHistory`: `{ status, at, byUid, byRole, note? }`.
- Appointments are top level with `vendorId`, `branchId`, `userUid`, `serviceIds`, `totalPiastres`.
- Extra services added during a visit are an invoice linked to the appointment, paid in app on the spot.

## OPEN
- Cancellation windows and who gets refunded what
- Reschedule rules (who can, how many times)
