---
name: reviews-and-tags
description: Use when building post-visit review prompts, ratings, tags, rating aggregates or admin review deletion.
---
# Reviews and tags

## Spec
- After the visit the user is notified: did you complete the visit or not.
- Review 1 to 5 on: Cleanliness, Waiting time, Doctor efficiency.
- Tags: Friendly doctor, Clean clinic, Long waiting time, Clear explanation, Good with nervous pets.
- Dashboard shows overall rating (1 to 5) plus per category.
- TenderPaws can delete a review from the admin side.

## Rules
- Only for appointments in `completed`. One review per appointment.
- Aggregates are updated server side, never computed from client writes.
- Providers cannot edit or delete reviews.
- Category and tag labels come from provider type config, via i18n strings.

## OPEN
- Groomer categories and tags (the clinic set does not fit)
- Can providers reply to reviews?
- Can users edit a review after submitting?
