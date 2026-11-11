# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: owners and front-desk staff of pet businesses in Egypt, working on a desktop or laptop at the store counter, clinic reception or grooming salon. They use the portal between customers to run their business on the marketplace.

Business types (one portal, `vendorType` per account):
- **Store**: pet shops selling products (food, pharmacy, grooming supplies, litter). Live today.
- **Clinic**: vet clinics taking paid appointments, optionally with several branches and home visits.
- **Groomer**: grooming salons on the same booking flow as clinics.
- Later: trainer, walker, pet host (not yet specified).

Their jobs: get approved, keep the listing accurate (profile, branches, services, prices, availability, products, stock), handle incoming orders and appointments, deal with no-shows and extra invoices during a visit, watch ratings, and track earnings and subscription status.

Pet owners (buyers) do not use this portal. They book and shop in the Flutter mobile app. TenderPaws admins use a separate Flutter admin panel.

## Product Purpose

The vendor and provider portal for the TenderPaws marketplace. It lets approved pet businesses list, sell and get booked through the TenderPaws mobile app, and see what they earn. Success means a provider can run their day in the portal without calling TenderPaws support: requests arrive, get handled, get paid, and get reviewed.

## Positioning

- **One app for pet owners** covering shopping and services (clinics, grooming, and later training, walking, hosting). Providers gain customers who are already in the app for other pet needs.
- **Vetted providers**: every store, clinic and groomer is reviewed and approved by TenderPaws before going live.
- **Paid upfront**: bookings are paid in the app at checkout, and providers have no-show protection (flag after the appointment time plus 120 minutes, user is asked to confirm).
- **Loyalty built in**: users earn 1 point per EGP, including on extra invoices raised during a visit, and can apply coupons.
- **Built for Egypt**: Arabic and English with full RTL, money in EGP, times in Cairo.

## Operating Context

- Used at a work desk during business hours, often interrupted by walk-in customers and phone calls. Screens must be scannable and resumable mid-task.
- Clinic and groomer flow (source: TenderPaws Services Marketplace Spec): onboarding (name, branches with their own services and prices, phone, address, location, tax registration and license documents for clinics, services and prices, optional photos, optional education and experience for clinics, available appointments, home visit option) → TenderPaws approves or declines → user books, pays, earns points → visit → optional extra-services invoice paid in app → completion prompt → review.
- Request statuses: Paid, Completed, Cancelled by user, Cancelled by clinic, Rescheduled, No-show, Refund pending, Refunded.
- No-show answers from the user: Yes, I did not attend / No, I attended / I arrived late / Report an issue.
- Reviews: 1 to 5 on Cleanliness, Waiting time, Doctor efficiency; tags Friendly doctor, Clean clinic, Long waiting time, Clear explanation, Good with nervous pets. TenderPaws can delete reviews.
- Provider dashboard: number of visits, share of each service (chart), new patients, overall rating with per-category detail.
- Deals per provider: fixed subscription, percentage, or both. Percentage balances update at each payment. Subscription shows amount (monthly or annual), start date, renewal date, payment status, grace period.
- Store flow (live): products, categories, stock, import/export, vendor orders (pending, confirmed, shipped, delivered, cancelled), earnings ledger.
- Account states for every type: pending, active, suspended.

## Capabilities and Constraints

- Next.js App Router portal sharing the Firebase project with the mobile app and admin panel. Data only through the portal's own server API; vendor isolation is enforced server-side.
- Every user-facing string exists in English and Arabic. RTL layouts mirror fully.
- All money is stored as integer piastres and shown in EGP.
- Loading states are shimmer skeletons that mirror the real layout; spinners only inside buttons.
- Light and dark themes are both supported.
- Approval, suspension and review deletion happen in the admin panel, not here.

Open, not decided (from the spec's "Points to confirm with the owner"; do not design as if resolved):
- Whether groomers are identical to clinics; which documents and review categories/tags apply to groomers ("Doctor efficiency" and doctor tags do not fit).
- Whether Telehealth 24/7 (price 200, currency unstated; checkout then chat with a doctor) is in this build, and everything about how it works.
- Decline reasons and re-applying; slot length; patients per slot; booking notice and advance window; home visit pricing and area limits; reschedule rules; cancellation windows.
- No-show: what each user answer triggers, whether "I arrived late" reopens the appointment, what "Report an issue" creates, what happens if the user never answers.
- Reviews: provider replies and user edits.
- Money: who funds coupons, gateway fees, payout timing, fixed-fee collection and grace period end, deal per provider or per branch, point value and expiry, coupon limits.
- Which dashboard parts are provider-facing versus admin-only.
- Dog training, dog walking, pet hosting and the services-side store have headings only.

## Brand Commitments

- Brand presented in the portal: **Pawlio**. Logo: `public/pawlio-logo.png` (full color; never invert or recolor).
- Note: current UI copy still says "Tender Paws" (`src/constants/strings.ts`, `brandName` and help/empty-state text). Whether to rename that copy is not decided yet.
- Portal chrome follows the existing DineNorder POS-style sidebar pattern used in this repo.
- Voice: production-ready product copy. Never mention internal systems, unfinished features or technical errors to users.

## Evidence on Hand

- Spec: `TenderPaws Services Marketplace Spec.docx` (services overview, clinic flow in full, grooming, open questions).
- Repo docs: `docs/production-security.md`, static client-approval prototype in `docs/prototype/`.
- Assets: Pawlio logo, sidebar nav icons in `public/portal-nav/`, product image placeholder.
- No testimonials, provider counts, ratings data, press or pricing figures exist. Do not fabricate them.

## Product Principles

1. **The front desk is busy.** Today's appointments, orders and anything needing action come first; every screen should be readable at a glance and safe to leave mid-task.
2. **One engine, many provider types.** Clinics, groomers and future types share one set of screens that differ by configuration, so a new type never needs a new design language.
3. **Money is always clear.** Every amount, commission, balance and subscription state is shown exactly and in EGP; providers should never have to guess what they earned or owe.
4. **Fair to both sides.** No-show, cancellation and review flows show the provider what the user was told and what happens next, without blame.
5. **Arabic is a first-class language.** Every layout is designed to work equally in Arabic RTL and English LTR.

## Accessibility & Inclusion

- Full RTL support for Arabic; times in Africa/Cairo.
- Status (orders, appointments, account) is never conveyed by color alone; always paired with a text label.
- Keyboard-reachable controls, labeled form fields, and focus-managed dialogs throughout.
