# Tender Paws Multi-Vendor: Source of Truth

Location: docs/SOURCE_OF_TRUTH.md in Multi-Vendor-Paws, branch dev.
Created: 2026-10-28. Last updated: 2026-11-03.

Contents: 0 How this file works, 1 Architecture, 2 Glossary, 3 Business requirements, 4 Decisions log, 5 Data contracts, 6 Endpoint registry, 7 Tickets, 8 Risks and known issues, 9 Changelog.

---

## 0. How this file works

Purpose: one source for the business rules, architecture decisions, data contracts, endpoints and tickets of the whole multi-vendor project, across every repo. Everything is run from the Multi-Vendor-Paws workspace.

Rules for people and agents

1. If code, skills, docs or chat disagree with this file, this file wins. If this file looks wrong, stop and ask. Never change a business rule silently.
2. Every prompt names one ticket id. The agent reads this file first, works only on that ticket, and does not touch other tickets.
3. Items marked [OPEN] or [CONFIRM] are not decided. Never resolve them. Ask.
4. When a ticket is finished, or stopped, update this file in the same branch: ticket status, acceptance checklist, data contracts, endpoint registry, new decisions or open questions, and a changelog line. Never delete history.
5. Do not mark a ticket DONE unless every acceptance item is verified and the evidence is listed (commands, test names, file paths).
6. Status values: TODO, READY (prompt written), IN PROGRESS, REVIEW, DONE, BLOCKED, WAITING (waiting on the owner or a decision).
7. Words: a ticket is a work item in this file. A hold case is the admin case created when the orders or appointments of a suspended vendor are put on hold (earlier notes called it a ticket).

Standard ticket prompt (copy it, replace the id and the repo list)

```
Work on ticket <ID> from docs/SOURCE_OF_TRUTH.md.
Working repo: Multi-Vendor-Paws (open in this workspace). Repos you may edit: <list from the ticket>. Every other repo is read only.
1. Read docs/SOURCE_OF_TRUTH.md fully (sections 0 to 7), the skills named in the ticket, and the AGENTS.md of each repo you edit.
2. Restate the ticket in 5 lines. List anything unclear and every [OPEN] or [CONFIRM] item that blocks it. If blocked, stop and ask.
3. Implement only this ticket on branch feature/<id>-<slug>, created from dev in each repo you edit. Follow the commit rules.
4. Verify every acceptance item and the definition of done.
5. Update docs/SOURCE_OF_TRUTH.md (status, acceptance checklist, contracts, endpoint registry, decisions, changelog) on the same branch.
6. Report: files changed per repo, acceptance evidence, deviations, new open questions, and git log --oneline for the new commits.
No push, no deploy, no writes to Firebase production. No em dashes.
```

Definition of done (every ticket)

- Analyzer or linter clean, tests added or updated and passing.
- User-facing text in English and Arabic, right-to-left checked, loading as shimmer skeletons.
- Money as integer piastres (1 EGP = 100).
- No secrets, keys or personal data in code, logs or commits.
- Contracts and endpoint registry updated. This file updated.
- Conventional commits, one logical change each.

Commit rules (every repo)

- Conventional Commits: type(scope): subject. Types feat, fix, test, build, ci, docs, chore, refactor. Subject imperative, lower case, no period, 72 characters or fewer. Body for non-trivial commits.
- One logical change per commit. Tests go with the code they cover. Every commit leaves analyze and tests passing.
- Stage explicit paths. Never commit secrets, keystores, google-services files, build output or local tool folders. No amend or history rewrite unless asked. No --no-verify.

---

## 1. Architecture

### 1.1 Platform

- One Firebase project, pets-acd3f, which is production. Firestore, Auth, Storage, Cloud Messaging, Crashlytics and Cloud Functions. Every app is built on it.
- Backend pattern [DECIDED 2026-10-28]: clients read and stream Firestore directly where the security rules allow. Specific functionality is a Cloud Function used as an endpoint (callable preferred), the same way the buyer app already fetches pets. Business rules that must be enforced (eligibility, orders, fees, suspension, appointments, points) live in functions, not in clients.
- Callable functions carry the signed-in user's token automatically. HTTPS functions are used only when a callable cannot be.
- Function code lives in tinderpaws_panel/functions [CONFIRM]. Existing: vendor_signup.js, vendors.js, orders_split.js, service_request.js, services.js. Endpoint contracts are kept in section 6.
- The portal's Next.js BFF (/api/vendor/*, Admin SDK) keeps serving existing features. New features that carry business rules call the shared functions, so the portal and the vendor app share one implementation [CONFIRM].
- Money: integer piastres everywhere. The buyer app uses float EGP today. Convert at the boundary and migrate (S2.3).
- Environments [OPEN, D-ENV]: there is a single production project. Until decided, tickets test functions and rules with the Firebase emulator suite and never write to production.

### 1.2 Repositories

All are siblings under /Users/ahmedhany/Documents/studioProjects/TWOR/TenderPaws.

| Key | Folder | What it is | Default access |
|---|---|---|---|
| WEB (home) | Multi-Vendor-Paws | Next.js vendor web portal. Holds this file, contracts and the parity table | Editable |
| BUYER | tinder_paws | Flutter buyer mobile app | Read only unless the ticket says so. Never switch branches or stash there |
| PANEL | tinderpaws_panel | Flutter web admin panel plus Cloud Functions (functions/) | Read only unless the ticket says so |
| VENDOR APP | tender_paws_partner | Flutter vendor mobile app (base from T0.6) | Editable once created |

### 1.3 Branching and release

- main is production. Never commit to main, never push main. dev is the base for this whole project. Feature branches are feature/<ticket>-<slug>, created from dev and merged into dev. dev merges into main only when every Phase 1 to 3 ticket is DONE and signed off.
- main keeps receiving unrelated patches (store releases, Shorebird). Merge main into dev regularly and log it in the changelog.
- Old installed app versions keep working until the release. Every change to shared data is additive until the forced update (BR-14).
- Deploy order: indexes, rules, functions, then apps. Nothing is deployed unless a ticket says so.

### 1.4 Vendor app structure

Mirrors tinder_paws: feature-first folders, a local package user_repository with a stream of the signed-in vendor, flutter_bloc, get_it, go_router, easy_localization (English and Arabic, right-to-left), colors from the portal tokens through a ThemeExtension. It does not copy the known tinder_paws defects (several repository instances, unstored subscriptions, global theme flag, prints, keys in source). Details are in the base app ticket T0.6.

---

## 2. Glossary

- Store vendor: sells products, has delivery. Clinic, groomer: provider vendors that sell appointments. Later: hotel, trainer, walker, services store.
- Halo: items sold by the platform itself under seller id platformVendor, store name Tender Paws. Separate from vendor items.
- Coverage: where a store vendor delivers. One mode only: zone or governorates.
- Zone: a map point plus a radius in meters. Governorate: an Egyptian governorate referenced by a stable id.
- Eligible: a buyer at a given location may see and order a vendor's items.
- Hidden, view_only: the two suspension modes (BR-9).
- Hold case: the admin case listing the orders or appointments put on hold by a suspension.
- Vendor status: pending, rejected, active, suspended, banned.

---

## 3. Business requirements

Marks: [DECIDED] agreed, [RECOMMENDED] proposed and waiting for confirmation, [OPEN] not decided.

### BR-1 Marketplace and actors
- 1.1 [DECIDED] Tender Paws is a marketplace of approved vendors plus the platform's own Halo items.
- 1.2 [DECIDED] Buyers use the Flutter buyer app (tinder_paws).
- 1.3 [DECIDED] Vendors use the web portal and the vendor mobile app. The mobile app mirrors the portal.
- 1.4 [DECIDED] Admins use the Flutter web admin panel (tinderpaws_panel).
- 1.5 [CONFIRM] No admin mobile app. The old planning document mentions an admin mobile app, assumed to mean the vendor app.
- 1.6 [DECIDED] Vendor types now: store, clinic, groomer. Later: hotel, trainer, walker, services store.

### BR-2 Vendor lifecycle and validation
- 2.1 [DECIDED, from code] Signup creates an enabled Auth user and a vendor_signup_requests document (pending). The vendors/{uid} document is created on approval.
- 2.2 [DECIDED, from code] The admin approves, rejects, suspends and bans through functions (vendor_signup-reviewVendorSignupRequest, vendors-suspendVendor, vendors-banVendor).
- 2.3 [DECIDED] Admin validation protects buyers. Store vendors need no documents (confirmed with the owner).
- 2.4 [OPEN] Do clinics and groomers upload documents? The old planning document requires a tax registration and a license.
- 2.5 [DECIDED] Account gates in both vendor clients: active, pending, rejected, suspended, banned, not a vendor.
- 2.6 [RECOMMENDED] A suspension, temporary or permanent, keeps the Auth account enabled so the vendor sees the status and the reason. Only a ban disables it. Today a permanent suspend disables Auth.
- 2.7 [DECIDED] Pending vendors cannot use products, orders or earnings.

### BR-3 Store catalog and orders
- 3.1 [DECIDED, from code] Vendor products live in top-level products/{id} with vendorId. The legacy store path is still read by older app versions.
- 3.2 [DECIDED, from code] Product status: active, inactive, out_of_stock, archived.
- 3.3 [DECIDED] Vendors cannot create Halo items. The admin creates them in the admin panel.
- 3.4 [DECIDED, from code] Buyer orders are split into one vendor order per vendor.
- 3.5 [DECIDED] The platform takes its fee on orders from the vendor. [OPEN] Whether the commission base includes the vendor's delivery fee.

### BR-4 Delivery coverage (store vendors only)
- 4.1 [DECIDED] Delivery applies to store vendors only. Hotels, clinics, groomers and trainers have no delivery zones.
- 4.2 [DECIDED] The buyer location comes from the device location service (lat, lng), with a manual map picker if permission is denied. The app needs it before browsing.
- 4.3 [DECIDED] A vendor chooses exactly one coverage mode: a zone {lat, lng, radiusMeters} or a list of governorate ids. Zone is the basic mode. No combined mode.
- 4.4 [DECIDED] Buyers only see the vendor items they are eligible for. Eligibility is computed on the server and checked again at checkout.
- 4.5 [DECIDED] Halo keeps the rule category to governorate, by id, fail closed. It applies to Halo only.
- 4.6 [DECIDED] Governorates are referenced by a stable id, never by name. One canonical list with nameEn and nameAr. The buyer's governorate is resolved from lat and lng with boundary data, name aliases only as a fallback. [OPEN] Official list, boundary data source and its licence.
- 4.7 [DECIDED] Delivery fee: optional, per vendor, set by the admin only, hidden from the vendor portal and vendor app, added to the order total, and it belongs to the vendor. Halo keeps its governorate based fees.
- 4.8 [OPEN] What a buyer sees before choosing a location, and what happens to the cart when the location changes.
- 4.9 [RECOMMENDED] Eligibility: a function returns the eligible vendor ids for the buyer location, then the app queries those vendors plus Halo. Coverage is not copied onto products.

### BR-5 Halo
- 5.1 [DECIDED] Halo items are sold by the platform under seller id platformVendor. They are separate from vendor items.
- 5.2 [DECIDED] Halo items are created only in the admin panel and are not affected by vendor suspension.
- 5.3 [RECOMMENDED] Halo is defined only by seller id platformVendor, which is what the buyer app uses. The isHalo field is no longer written or read, and kept in documents for compatibility.
- 5.4 [DECIDED, bug] The admin panel add product must stamp vendorId platformVendor.

### BR-6 Services engine (clinic and groomer)
- 6.1 [DECIDED] One engine. The groomer is configuration of the clinic engine.
- 6.2 [DECIDED] A provider enters: name, branches (each with its own services and prices, with a duplicate option), phone, address, map location, services and prices, optional photos, available appointments (editable later), and a home visit option. Clinics may also enter education and experience (optional).
- 6.3 [DECIDED] The admin approves before a provider is listed.
- 6.4 [DECIDED] Availability belongs to a branch. Times are stored in UTC and shown in Africa/Cairo. Booking must be race safe. Editing availability never silently cancels booked appointments.
- 6.5 [DECIDED] The buyer picks a provider and services, pays in the app, earns 1 point per EGP (floor(paidPiastres / 100)), and can add a coupon.
- 6.6 [DECIDED] Extra services during a visit: the provider creates an invoice, the buyer pays in the app on the spot and earns points.
- 6.7 [DECIDED] Appointment statuses: paid, completed, cancelled_by_user, cancelled_by_clinic, rescheduled, no_show, refund_pending, refunded. [CONFIRM] Transitions: paid to completed, cancelled_by_user, cancelled_by_clinic, rescheduled or no_show; cancelled to refund_pending to refunded. Every change appends to statusHistory.
- 6.8 [DECIDED] No-show: the provider may flag only after the appointment time plus 120 minutes (server enforced). The buyer then answers: did not attend, I attended, arrived late, report an issue. [OPEN] What each answer does, what happens if the buyer never answers.
- 6.9 [DECIDED] Reviews: 1 to 5 on cleanliness, waiting time and doctor efficiency, plus tags (friendly doctor, clean clinic, long waiting time, clear explanation, good with nervous pets). Only for completed appointments, one per appointment. The admin can delete a review. [OPEN] Groomer categories and tags, provider replies, review editing.
- 6.10 [OPEN] Slot length (fixed or per service), capacity per slot, minimum notice, booking window, home visit price and area, cancellation windows, who may reschedule and how often, decline reason and reapply, whether one account can hold two vendor types.
- 6.11 [OPEN] Services need a location for discovery. Whether to sort or filter by distance.

### BR-7 Deals and billing
- 7.1 [DECIDED] Per provider the admin sets a deal: fixed subscription, percentage, or both.
- 7.2 [DECIDED] The percentage is taken after the coupon. The balance is live, through an append-only earnings ledger (sale, refund, adjustment, payout).
- 7.3 [DECIDED] Subscription shows amount, start date, renewal date, payment status and grace period.
- 7.4 [OPEN] Who collects the patient payment, payout schedule and method, how the fixed fee is collected and what happens after the grace period, whether a deal applies per provider or per branch.

### BR-8 Payments and refunds
- 8.1 [DECIDED] Payments run in the mobile app: Apple in-app purchase for digital goods (for example subscription plans), the Fawaterak webview for everything else.
- 8.2 [DECIDED] Refunds are manual through support. The admin marks refunded, which writes a ledger refund entry and reverses points.
- 8.3 [DECIDED] Taxes depend on the payment method and are handled with the payment integration. Store gross, discount, paid amount, fee, net, method and gateway reference on every payment so taxes can be added later.
- 8.4 [OPEN] Who pays the Fawaterak gateway fee. Whether the telehealth chat counts as a digital good for Apple (not verified).

### BR-9 Suspension and holds
- 9.1 [DECIDED] The admin chooses when suspending: hidden (the vendor's items are not shown anywhere) or view_only (items shown as unavailable, ordering blocked in the UI and enforced at checkout on the server).
- 9.2 [DECIDED] The mode is stored on the vendor, not on each product, so lifting a suspension restores everything with no product writes.
- 9.3 [DECIDED] Open orders go on hold and a hold case with them goes to the admin. Clinics and groomers behave the same way with appointments.
- 9.4 [OPEN] How a hold case is resolved (cancel, refund through support, reassign), what the buyer is told, the default mode for a ban.

### BR-10 Telehealth
- 10.1 [OPEN] Spec only: price 200 (currency assumed EGP), checkout, then a chat with a doctor account. Scope not decided. Open: who the doctors are, what the payment buys, how 24/7 is covered, doctor pay, photos and videos.

### BR-11 Other services
- 11.1 [OPEN] Dog training, dog walking, pet hosting and the services store are not specified.

### BR-12 Vendor mobile app
- 12.1 [DECIDED] A Flutter app, mirroring the tinder_paws structure and the portal's features and look, English and Arabic with right-to-left.
- 12.2 [DECIDED] Every change to the portal is applied to the vendor app through the same ticket.
- 12.3 [DECIDED] Data access follows 1.1: Firestore streams for own data where rules allow, Cloud Functions for specific functionality.
- 12.4 [DECIDED] A subset of the portal: no spreadsheet import or export on mobile. Vendors receive push notifications.

### BR-13 Notifications
- 13.1 [OPEN] Vendor push events (new order, new appointment, status changes) and buyer prompts (no-show answers, review request). Exact list and wording.

### BR-14 Compatibility and release
- 14.1 [DECIDED] Production stays on main until everything is done. Changes to shared data are additive until the forced update.
- 14.2 [RECOMMENDED] Force an update after the new version is live in both stores, using the existing version/config switch and a remote flag. The current check hard-blocks when the latest major is higher or the minor or patch is more than 1 ahead.
- 14.3 [RECOMMENDED] After the forced update, rules deny direct client order creation and orders are created by a function (S2.11).
- 14.4 [DECIDED] Migrations are idempotent scripts, rehearsed on a copy of production data.

### BR-15 Quality and security
- 15.1 [DECIDED] No keys, tokens or personal data in source or logs.
- 15.2 [OPEN] Verify the live Firestore and Storage rules in the Firebase console. The repo rules look wide open and may not be deployed.
- 15.3 [DECIDED] Remove the hardcoded device push token in tinderpaws_panel/functions/services.js (A2.7).

---

## 4. Decisions log

Decided

| Id | Date | Decision |
|---|---|---|
| D1 | 2026-10-28 | Cloud Functions are the endpoints for specific functionality, Firestore is read directly where rules allow (see 1.1). |
| D2 | 2026-10 | Delivery is for store vendors only. Services have no delivery zones. |
| D3 | 2026-10 | A vendor picks one coverage mode: zone or governorates. Zone is the basic mode. |
| D4 | 2026-10 | Halo and vendor items are separate. Halo keeps category to governorate. |
| D5 | 2026-10 | Governorates are referenced by stable id, not by name. |
| D6 | 2026-10 | Suspension has two modes chosen by the admin: hidden or view_only. Orders and appointments go on hold with a hold case for the admin. Same for clinics and groomers. |
| D7 | 2026-10 | Delivery fee is optional, per vendor, set by the admin only, added to the total and belongs to the vendor. The platform takes its fee on vendor orders. |
| D8 | 2026-10 | Payments: Apple in-app purchase for digital goods, Fawaterak webview for the rest. Refunds through support. The percentage is taken after the coupon. Taxes with the payment integration. |
| D9 | 2026-10 | Store vendors need no documents. |
| D10 | 2026-10 | Branch policy: production on main, all work on dev, merge at the end. No early fixes. |
| D11 | 2026-10 | Phases: 0 setup, 1 portal and vendor app together, 2 buyer app and admin panel, 3 testing and release. |
| D12 | 2026-10 | The vendor app mirrors tinder_paws structure, including the user repository with a stream. It is built first as a base, then authentication. |
| D13 | 2026-10 | The buyer location comes from the device location service. |

Open, with a recommendation where one exists

| Id | Question | Recommendation |
|---|---|---|
| O1 | What isHalo means | Halo is platformVendor only, isHalo ignored (5.3) |
| O2 | Old versions | Force an update after both stores have the new version (14.2) |
| O3 | Eligibility approach | Function returns eligible vendor ids (4.9) |
| O4 | Clinic and groomer documents | Ask the owner |
| O5 | Suspension and the Auth account | Keep Auth enabled on suspend, disable only on ban (2.6) |
| O6 | Scope against the planning document, including the admin mobile app and the phase split | Ask the owner |
| O7 (D-ENV) | Environment: emulator suite only, or a second staging Firebase project | Emulators first, staging project if the budget allows |
| O8 | Does the commission base include the delivery fee | Ask the owner |
| O9 | Who pays the Fawaterak fee | Ask the owner |
| O10 | Hold case resolution and buyer messaging | Open |
| O11 | Telehealth scope and Apple treatment | Open |
| O12 | Slots, capacity, notice, cancellation, reschedule, home visit price | Open |
| O13 | Points base, expiry, redemption value, who funds coupons, coupon limits | Open |
| O14 | Groomer review labels and tags | Open |
| O15 | Buyer view before a location is chosen, cart on location change | Open |
| O16 | Official governorate list, boundary data and licence | Open |
| O17 | Percentage rounding mode, calendar week start day, Arabic numerals | Can default: half up, Saturday, Western |
| O18 | Which data the vendor app streams from Firestore and which goes through functions | Streams for own vendor document, notifications and lists once rules are hardened, functions for everything with rules |

---

## 5. Data contracts

Every shape here is a proposal [CONFIRM] until ticket T0.5 locks it. Field names are snake_case in Firestore unless the existing collection already uses another style. Money is integer piastres.

- vendors/{uid} (existing): add vendorType (store, clinic, groomer, default store), suspension { mode (hidden, view_only), reason, at, expiresAt }, deliveryCoverage { mode (zone, governorates), zone { lat, lng, radiusMeters }, governorateIds[] }. Existing fields stay (status, approvalStatus, store profile, restrictions).
- vendor_signup_requests/{id} (existing): status pending, approved, rejected.
- vendorAdminSettings/{vendorId} (new, admin and functions only, never readable by the vendor): deliveryFeePiastres.
- vendorDeals/{vendorId} (new, readable by the vendor, written by admin functions): type, subscription amounts and dates, percentage, grace period, payment status.
- governorates/{id} (existing collection): add nameEn, nameAr, code. The document id is the stable id. category_governorates keeps pointing at ids.
- products/{id} (existing): unchanged shape. Halo is vendorId platformVendor.
- orders and vendorOrders (existing): add deliveryFeePiastres, governorateId, holdState, and piastres amounts. Orders are created by a function after S2.11.
- vendors/{id}/branches/{branchId} (new): name, address, location, phone, services[], availability, homeVisit.
- appointments/{id} (new): vendorId, branchId, userUid, serviceIds, totalPiastres, status, statusHistory[{status, at, byUid, byRole, note}], times in UTC.
- appointmentReviews/{id} (new): appointmentId, ratings (3), tags, createdAt.
- pointsLedger/{id} (new, append only): userUid, delta, reason, refId.
- holdCases/{id} (new, admin): vendorId, mode, orderIds[], appointmentIds[], status, createdAt.
- earnings ledger (existing): sale, refund, adjustment, payout entries.

---

## 6. Endpoint registry (Cloud Functions)

Existing in tinderpaws_panel/functions: vendor_signup-reviewVendorSignupRequest, vendors-suspendVendor (extend with mode), vendors-banVendor, orders_split, service_request, services. Planned endpoints below. Type is callable unless noted. Status values as in section 0.

| Name | Caller | Purpose | Ticket | Status |
|---|---|---|---|---|
| resolveBuyerEligibility | Buyer | From lat and lng return the governorate id, eligible vendor ids with orderable flags, and the Halo rule | S1.2, S2.2 | TODO |
| createOrder | Buyer | Create an order with eligibility, fees, coupon and piastres checked on the server | S2.11 | TODO |
| suspendVendor (extended) | Admin | Suspend with mode, hold open orders and appointments, create a hold case | S1.2, A2.1 | TODO |
| unsuspendVendor | Admin | Lift a suspension and release holds | A2.1 | TODO |
| setVendorDeliveryFee | Admin | Set the admin-only delivery fee | A2.2 | TODO |
| setVendorDeal | Admin | Set the deal for a provider | A2.5 | TODO |
| registerVendorFcmToken | Vendor | Register the push token of a vendor device | S1.6 | TODO |
| bookAppointment | Buyer | Race-safe booking with pricing and coupon | S2.5 | TODO |
| cancelAppointment, rescheduleAppointment | Buyer, provider | Status transitions with history | S1.10, S2.5 | TODO |
| flagNoShow | Provider | Enforce the 120 minute rule, notify the buyer | S1.11 | TODO |
| answerNoShow | Buyer | Record the buyer's answer | S2.7 | TODO |
| createExtraInvoice | Provider | Invoice for extra services | S1.11 | TODO |
| submitReview | Buyer | Create a review for a completed appointment | S2.7 | TODO |
| deleteReview | Admin | Moderation | A2.5 | TODO |
| markRefunded | Admin | Refund entry, points reversal | A2.5 | TODO |
| awardPoints (trigger) | System | Write the points ledger after a payment | S2.6 | TODO |

---

## 7. Tickets

Estimates are focused hours for one developer using Cursor, roughly plus or minus 35 percent. Total about 530 to 730 hours. The vendor app is about a quarter. Telehealth and the unspecified services are not included.

### Index

Phase 0: setup

| Id | Title | Repos | Est (h) | Status |
|---|---|---|---|---|
| T0.0 | Install this file and its rule in the portal | WEB | 1 to 2 | DONE |
| T0.1 | Create dev branches in the three existing repos | WEB, BUYER, PANEL | 0.5 | DONE |
| T0.1b | Workspace context rule in the portal | WEB | 0.5 | DONE |
| T0.2 | Impeccable design skill in the portal | WEB | 1 | DONE (to verify) |
| T0.3 | Domain skills in the portal | WEB | 2 | DONE |
| T0.4 | Close the open business questions with the owner | none | 4 to 6 | WAITING |
| T0.5 | Lock the data contracts (section 5) and endpoint shapes (section 6) | WEB | 8 to 10 | TODO |
| T0.6p | Preflight check | read only | 1 | DONE |
| T0.6v | Setup verification before the base app | read only | 0.5 | BLOCKED (fvm 3.44.2 shows Need setup) |
| T0.6c | Alignment and readiness check | read only | 1 | DONE (first run) |
| T0.6 | Create the vendor app base | VENDOR APP | 5 to 8 | DONE |
| T0.6f | Vendor app base polish | VENDOR APP | 1 to 2 | DONE |
| T0.6b | Vendor user repository, authentication, route gates, login screens | VENDOR APP | 5 to 6 | TODO |
| T0.7 | Buyer app location and catalog report | read only | 1 | DONE |
| T0.8 | Events branches decision | none | 0.5 | Likely resolved |
| T0.9 | Update stale docs | WEB | 1 to 2 | TODO |
| T0.10 | Decide and set up the test environment (emulator suite or staging project) | WEB, PANEL | 3 to 6 | TODO |
| T0.11 | Reconcile the skills with this file | WEB | 1 to 2 | TODO |

Phase 1: portal and vendor app together (every ticket is done in both)

| Id | Title | Repos | Est (h) | Status |
|---|---|---|---|---|
| S1.1 | Vendor session and account gates | WEB, VENDOR APP, PANEL | 20 to 25 | TODO |
| S1.2 | Governorate list, coverage model, eligibility and suspension functions | PANEL | 20 to 28 | TODO |
| S1.3 | Coverage picker | WEB, VENDOR APP | 16 to 20 | TODO |
| S1.4 | Products | WEB, VENDOR APP | 16 to 22 | TODO |
| S1.5 | Orders including the hold state | WEB, VENDOR APP | 11 to 14 | TODO |
| S1.6 | Earnings, notifications and push | WEB, VENDOR APP, PANEL | 13 to 16 | TODO |
| S1.7 | Vendor type and clinic or groomer onboarding | WEB, VENDOR APP | 12 to 16 | TODO |
| S1.8 | Branches and services | WEB, VENDOR APP | 16 to 22 | TODO |
| S1.9 | Availability editor | WEB, VENDOR APP | 27 to 37 | TODO |
| S1.10 | Appointments inbox and status machine | WEB, VENDOR APP, PANEL | 14 to 18 | TODO |
| S1.11 | No-show and extra service invoices | WEB, VENDOR APP, PANEL | 12 to 15 | TODO |
| S1.12 | Reviews and dashboard | WEB, VENDOR APP | 16 to 20 | TODO |
| S1.13 | Deals and subscription status | WEB, VENDOR APP | 13 to 17 | TODO |
| S1.14 | Suspension states on the vendor side | WEB, VENDOR APP | included in S1.2 and S1.5 | TODO |

Phase 2: buyer app and admin panel

| Id | Title | Repos | Est (h) | Status |
|---|---|---|---|---|
| S2.1 | Location-first browsing | BUYER | 14 to 18 | TODO |
| S2.2 | Eligibility with hidden and view-only vendors | BUYER | 14 to 18 | TODO |
| S2.3 | Governorate ids, piastres and per vendor delivery fee at checkout | BUYER | 8 to 12 | TODO |
| S2.5 | Service discovery and booking | BUYER | 25 to 33 | TODO |
| S2.6 | Fawaterak for appointments, points and coupons | BUYER | 15 to 22 | TODO |
| S2.7 | Reviews and no-show prompts | BUYER | 12 to 16 | TODO |
| S2.8 | Halo fix and badge | BUYER, PANEL | 4 to 6 | TODO |
| S2.9 | Old version compatibility | BUYER | 6 to 8 | TODO |
| S2.10 | Subscription plans through Apple in-app purchase | BUYER | 20 to 30 | TODO |
| S2.11 | Server-side order creation and rules hardening | BUYER, PANEL | 25 to 40 | TODO |
| A2.1 | Suspension modes and hold case queue | PANEL | 14 to 20 | TODO |
| A2.2 | Per vendor delivery fee, admin only | PANEL | 5 to 7 | TODO |
| A2.3 | Halo stamping and management | PANEL | 5 to 7 | TODO |
| A2.4 | Governorate list management and migration | PANEL | 10 to 14 | TODO |
| A2.5 | Provider approval, deals, review moderation, coupons, refunds | PANEL | 16 to 22 | TODO |
| A2.6 | Functions: timers, balances, points | PANEL | 20 to 28 | TODO |
| A2.7 | Remove the hardcoded push token | PANEL | 1 to 2 | TODO |

Phase 3: testing and release

| Id | Title | Est (h) | Status |
|---|---|---|---|
| T3.1 | Integration testing across all clients | 25 to 35 | TODO |
| T3.2 | Migration rehearsal on a copy of production data | 10 to 14 | TODO |
| T3.3 | Old-version compatibility tests | 6 to 8 | TODO |
| T3.4 | Bug-fix buffer | 25 to 40 | TODO |
| T3.5 | Store submissions and staged rollout | 8 to 12 | TODO |
| T3.6 | Merge dev into main | 3 to 4 | TODO |

### Phase 0 details

**T0.0 Install this file and its rule.** Repo WEB on dev. Prompt: see the install prompt in the project chat. Acceptance:
- [x] docs/SOURCE_OF_TRUTH.md exists on dev, byte for byte.
  Evidence: copied from /Users/ahmedhany/Downloads/SOURCE_OF_TRUTH.md. cmp matched. 520 lines. Sections 0 to 9 present. Commit 520714f5354d9304acf7730d85c94641feadff4c.
- [x] .cursor/rules/source-of-truth.mdc exists (alwaysApply) and AGENTS.md points to this file.
  Evidence: .cursor/rules/source-of-truth.mdc and the Source of truth section in AGENTS.md. Commit 173631521d145964ab435b734e46111980297789.
- [x] A report lists conflicts between this file and the skills, AGENTS.md and docs/phase-3-foundation.md (report only).
  Evidence: report written in this run and listed under T0.11. No files were edited for the report.
- [x] Two commits, nothing pushed.
  Evidence: 520714f5354d9304acf7730d85c94641feadff4c and 173631521d145964ab435b734e46111980297789. dev has no upstream and origin/dev does not exist.

**T0.1 dev branches.** Acceptance:
- [x] dev exists in WEB, BUYER and PANEL, created from the tip of the local default branch, even if the working tree is dirty.
  Evidence: WEB dev created from local main 95d6f46998b9d12f36bed6ad8b64413428f8b05f. BUYER dev created from local main 505f61f2eb1fcdce201a93fd7d7997f881d9af33 while ios/Flutter/AppFrameworkInfo.plist was modified. PANEL dev created from local master 5250bf335a759543c82f12f976449c66537b964a while .firebase/hosting.YnVpbGQvd2Vi.cache was modified. git branch was used. No checkout in BUYER or PANEL.
- [x] Only WEB is checked out on dev. BUYER and PANEL keep their current branch.
  Evidence: WEB checked out dev. BUYER stayed on main. PANEL stayed on master.
- [x] Nothing pushed. Unmerged branches and their push status are listed.
  Evidence: no push. WEB had no local branches not merged into main. PANEL had no local branches not merged into master. BUYER branches not merged into main, each with no upstream and no local origin ref: backup/notifications-redesign-v2-old bc268897, feat/events-checked-in-delete-guard 7a7a008a, feature/all-announcement-redirect bc268897, feature/notifications-redesign e3cdca09, fix/ios27-ipad-launch-crash b204b76e.

**T0.1b Workspace rule.** Acceptance:
- [x] .cursor/rules/workspace-context.mdc exists on dev with the repo map (1.2) and the safety rules: every task names its working repo and editable repos, print path and branch before git commands, never commit to main, never push, never deploy or write to Firebase, read skills and AGENTS.md before editing, never resolve OPEN items, no em dashes.
  Evidence: .cursor/rules/workspace-context.mdc on dev, alwaysApply. Commit 8a8bf469d41bfec0b7eea0a4eeddc7c749b0fe15.

**T0.6v Setup verification before the base app.** Read only. Result: NO-GO for T0.6. Acceptance:
- [x] WEB is on dev, and dev exists in WEB, BUYER and PANEL.
  Evidence: WEB branch dev at 8a8bf469d41bfec0b7eea0a4eeddc7c749b0fe15, 3 commits ahead of local main 95d6f46998b9d12f36bed6ad8b64413428f8b05f and 0 behind. BUYER dev 505f61f2eb1fcdce201a93fd7d7997f881d9af33 equals local main, branch stayed main, status M ios/Flutter/AppFrameworkInfo.plist. PANEL dev 5250bf335a759543c82f12f976449c66537b964a equals local master, branch stayed master, status M .firebase/hosting.YnVpbGQvd2Vi.cache.
- [x] Both rules are committed. The named skills exist. AGENTS.md has Project skills and Source of truth.
  Evidence: rules in commits 173631521d145964ab435b734e46111980297789 and 8a8bf469d41bfec0b7eea0a4eeddc7c749b0fe15. Skills present: vendor-type-architecture, vendor-suspension-modes, delivery-zones-geo, provider-onboarding, appointments-domain, availability-scheduling, no-show-flow, reviews-and-tags, deals-and-billing, money-piastres, single-release-rollout. AGENTS.md headings at lines 9 and 33.
- [x] Copy source on local BUYER main is recorded.
  Evidence: local main 505f61f2eb1fcdce201a93fd7d7997f881d9af33, subject "test(home): cover rewind stack and like undo cubit flows", 2026-10-27 10:01:06 +0300. It does not equal origin/main a6087431d9620f7c2a486bfde28caff90d582cbe. Local main is 28 commits ahead and 0 behind. .fvmrc flutter 3.44.2. pubspec.yaml version 1.0.16+24. Recommended copy commit: 505f61f2eb1fcdce201a93fd7d7997f881d9af33. Unmerged branches that touch pubspec.yaml only: feature/notifications-redesign and fix/ios27-ipad-launch-crash, commit b204b76ee3e8a494fce2168423433a0712c785cc. No unmerged branch changes lib/core/widgets, lib/core/theme, lib/core/utils/extensions.dart, lib/foundation, analysis_options.yaml or .fvmrc.
- [ ] fvm list shows 3.44.2 installed with no Need setup.
  Evidence: fvm list shows 3.44.2 global, Flutter version column "Need setup", Dart 3.12.2. flutter doctor still reports Flutter 3.44.2. Not fixed in this run.
- [x] Toolchain state was read and not changed.
  Evidence: Android licenses not accepted. Android SDK 36.0.0. Xcode 27.0. CocoaPods 1.16.2. Java reported by flutter doctor is OpenJDK 21.0.8, not 17. node v24.3.0. npx 11.4.2. git user.name set. git user.email set. TenderPaws volume has 43Gi free (91% used). pub.dev HTTP 200. github.com HTTP 200. firebase and flutterfire binaries are on PATH and were not executed.
- [x] tender_paws_partner does not exist, and the TenderPaws folder is not inside a git repository.
  Evidence: /Users/ahmedhany/Documents/studioProjects/TWOR/TenderPaws/tender_paws_partner is absent. git -C on the TenderPaws folder reports it is not a git repository. No .git directory there.

**T0.4 Owner questions.** Owner answers needed for O4, O6, O8, O9 and the telehealth scope (O11). Update section 3 and 4 when answered.

**T0.5 Lock contracts.** Acceptance:
- [ ] Section 5 shapes are final, every [CONFIRM] there is resolved or listed as open.
- [ ] Section 6 lists request and response fields, errors and permissions for each endpoint of Phase 1.
- [ ] Firestore rules needs per collection are listed.

**T0.6 Vendor app base.** Repo VENDOR APP at /Users/ahmedhany/Documents/studioProjects/TWOR/TenderPaws/tender_paws_partner. Skills: vendor-type-architecture, money-piastres, i18n-rtl. Status: DONE. Spec summary (the full prompt is in the prompt library):
- Name Tender Paws Partner, package tender_paws_partner. Pinned Flutter 3.44.2 through FVM. Android and iOS only.
- Mirror tinder_paws: feature-first folders, flutter_bloc 8.1.6, get_it 8.3.0, go_router 14.8.1, easy_localization 3.0.8 with English and Arabic JSON, dartz, shared_preferences through one AppCacheHelper, cloud_functions through one FunctionsClient (callable, region and emulator host from config, error codes mapped to localized messages).
- Colors from the portal tokens through a ThemeExtension in light and dark. Arabic font chosen by locale. Generic widgets copied from a confirmed tinder_paws commit with docs/ORIGIN.md. New primitives: snackbar, empty state, error state, skeleton, card.
- Boot as in tinder_paws (cache, language, localization, locator, notifications, Firebase Core, Crashlytics, FCM last). Debug builds run without Firebase files. Release builds fail loudly.
- Placeholder shell with tabs from a config object, settings with theme and language. No auth yet.
- Acceptance:
  - [x] flutter analyze clean, flutter test passing (cache, app cubit, functions client, translation parity, theme tokens, shell and settings widgets).
    Evidence: `fvm flutter analyze` → No issues found. `fvm flutter test` → 15 tests passed (test/core/*, test/ui/*). Partner tip on `dev`: see `git -C ../tender_paws_partner log --oneline`.
  - [x] Builds for Android debug (and iOS without codesign if possible) and runs to the shell without Firebase files in debug.
    Evidence: `fvm flutter build apk --debug` → `✓ Built build/app/outputs/flutter-apk/app-debug.apk`. `fvm flutter build ios --debug --no-codesign` → `✓ Built build/ios/iphoneos/Runner.app` (after `pod install` + CocoaPods xcconfig includes). Debug Firebase files remain gitignored; placeholder `firebase_options.dart` until flutterfire configure.
  - [x] Theme and language switch and persist, right-to-left in Arabic.
    Evidence: `AppCubit` + `AppCacheHelper` unit tests; `test/ui/settings_test.dart` taps Dark and Arabic and asserts RTL.
  - [x] No print, no keys, no static theme flag, no manual rebuild walk.
    Evidence: `avoid_print` on; `AppColorTokens` ThemeExtension (includes vendorRejected / vendorBanned); language via EasyLocalization `setLocale` + `BlocBuilder` in `lib/app.dart`; `lib/firebase_options.dart` placeholder throws until flutterfire configure.
  - [x] 16 planned conventional commits on `dev`, `main` has only the first commit.
    Evidence: partner `main` = `e98d8d2` (README/.gitignore only). `dev` has the 16 planned commits plus follow-up Android/iOS build fixes on the same branch. Nothing pushed.
  - [x] Manual steps listed: Firebase app registration, flutterfire configure, config files, keystore, Apple capabilities.
    Evidence: `tender_paws_partner/README.md` and the T0.6 report.
- Confirmed gates: Android `com.twor2.tenderpawspartner`, iOS `com.paws.tenderpawspartner`, fonts Inter / Plus Jakarta Sans / Cairo (OFL from google/fonts), source commit `505f61f2eb1fcdce201a93fd7d7997f881d9af33`.

**T0.6f Vendor app base polish.** Repo VENDOR APP at /Users/ahmedhany/Documents/studioProjects/TWOR/TenderPaws/tender_paws_partner on branch `dev`. Status: DONE. Acceptance:
- [x] Font provenance recorded in `docs/ORIGIN.md` (Fonts section): official google/fonts URLs, versions, sha256; all three TTFs match google/fonts main (no silent replace).
  Evidence: downloaded to `/tmp/t0.6f-fonts-*` and `cmp` matched Inter, PlusJakartaSans, Cairo. Partner commits `9dadc99` (fonts) and `1e47aa4` (SPM note).
- [x] Display font: `AppFonts.displayForLocale` on ThemeData display/headline styles and `AppTextStyle` h1 to h3 plus display; body stays Inter (en) / Cairo (ar).
  Evidence: `lib/core/theme/app_theme.dart`, `app_text_style.dart`, `lib/app.dart`. Tests in `test/core/app_fonts_test.dart`. Commit `2acb662`.
- [x] Design skills copied from `../tinder_paws/.agents` (and `skills-lock.json`) into the partner repo; listed in `.git/info/exclude` (local only, no tracked change).
  Evidence: skills present under `.agents/skills/`: animate, animate-expo, animation-performance, animation-vocabulary, apple-design, ask-sonner, break-ui, design-taste-frontend, emil-design-eng, find-animation-opportunities, impeccable, improve-animations, mobile-native, pick-ui-library, prototype, review-animations, write-swift.
- [x] AppCubit language persistence test and FunctionsClient emulator host parsing test.
  Evidence: `test/core/app_cubit_test.dart` (`setLanguage writes the cache and emits the new locale`), `test/core/functions_client_test.dart` (`parseEmulatorHost...`). Commit `78459b5`.
- [x] `docs/ORIGIN.md` notes that iOS `Package.resolved` files are tracked on purpose. Long commit subject left unchanged.
  Evidence: commit `1e47aa4`. Pre-existing long subject `3b95715` left as-is.
- [x] `fvm flutter analyze` clean and `fvm flutter test` passing.
  Evidence: analyze `No issues found!`; test `All tests passed!` (21 tests). Four partner commits on `dev`: `9dadc99`, `2acb662`, `78459b5`, `1e47aa4`. Nothing pushed.

**T0.6b Vendor user repository and authentication.** Repo VENDOR APP. Depends on T0.6, T0.5 and decisions O5. Acceptance:
- [ ] One repository instance with stored subscriptions, a stream that replays the latest value, disposal, no persisted cache.
- [ ] Vendor model with snake_case fields, status pending, rejected, active, suspended, banned and an is-vendor flag. Pending and rejected vendors may have no vendors document, so the gate also reads the signup request.
- [ ] One authentication bloc, a pure accountGateOf, localized error messages.
- [ ] Router redirects driven by auth state, a pure resolveRedirect with tests including the redirect parameter safety.
- [ ] Splash, login, forgot password and account status screens, logout with confirmation.
- [ ] Tests for the repository, bloc, redirects and screens.

**T0.9 Stale docs.** docs/phase-3-foundation.md says the mobile app is 1.0.10+15 and the portal products API is unbuilt. The old planning document disagrees with this file. Mark them superseded or update them.

**T0.10 Test environment.** Decide O7. Acceptance: the Firebase emulator suite (Firestore, Auth, Functions) runs for the portal and panel functions, with seed data, and the vendor and buyer apps can point to it through config. No ticket tests against production.

**T0.11 Reconcile skills.** Make each skill in .cursor/skills consistent with this file, or reduce it to a pointer. If a skill and this file disagree, this file wins.

Consistency findings from the 2026-10-29 setup run. Report only. Nothing here was edited.
- [ ] .cursor/skills/appointments-domain/SKILL.md:18 says the BFF enforces appointment transitions. Section 1.1 and S1.10 say Cloud Functions enforce them.
- [ ] .cursor/skills/appointments-domain/SKILL.md:28 calls the admin hold record a ticket. Section 0 and BR-9.3 call it a hold case.
- [ ] .cursor/skills/vendor-suspension-modes/SKILL.md:14 uses ticket for the hold record, and marks clinic and groomer appointment holds as CONFIRM. BR-9.3 decided that clinics and groomers follow the same hold rule.
- [ ] .cursor/skills/vendor-suspension-modes/SKILL.md:18 says "Ticket contents" for the hold case.
- [ ] .cursor/skills/no-show-flow/SKILL.md:13 says the 120 minute check is enforced by the BFF and a Cloud Function. BR-6.8 and S1.11 say flagNoShow enforces it.
- [ ] .cursor/skills/cloud-functions-rules/SKILL.md:7 lists existing functions as vendor_signup.js and vendors.js only. Section 1.1 also lists orders_split.js, service_request.js and services.js.
- [ ] .cursor/skills/cloud-functions-rules/SKILL.md:13 says suspension handling opens an admin ticket. BR-9.3 says a hold case.
- [ ] .cursor/skills/admin-panel-contract/SKILL.md:17 says "Admin ticket queue". A2.1 says a hold case queue.
- [ ] .cursor/skills/vendor-type-architecture/SKILL.md:9 lists later types as trainer, walker, host. BR-1.6 lists hotel, trainer, walker, services store.
- [ ] .cursor/skills/vendor-type-architecture/SKILL.md:13 lists account status as pending, active, suspended. BR-2.5 also includes rejected, banned and not a vendor.
- [ ] .cursor/skills/single-release-rollout/SKILL.md:8 ends the deploy order with mobile. Section 1.3 says then apps.
- [ ] .cursor/skills/single-release-rollout/SKILL.md:14 leaves backward compatibility or a forced update open. BR-14.1 decided that shared data changes stay additive until the forced update.
- [ ] .cursor/skills/money-piastres/SKILL.md:7 says never store or compute float EGP. Section 1.1 says the buyer app uses float EGP today and converts at the boundary (S2.3).
- [ ] AGENTS.md:56 lists admin order monitoring as a portal feature. BR-1.4 says admins use tinderpaws_panel, and AGENTS.md:550 says this app is vendor-only.
- [ ] AGENTS.md:57 lists marketplace browse as a feature of this repo. BR-1.2 says buyers use the Flutter app.
- [ ] AGENTS.md:553, AGENTS.md:658 and AGENTS.md:686 say vendor data comes only from the BFF and presentation never reads Firestore. Section 1.1 says clients read Firestore where the rules allow, the portal BFF keeps existing features, and new business rules call the shared functions.
- [ ] APP_CONTEXT.txt:18 calls this work Phase 3. D11 says phase 3 is testing and release.
- [ ] APP_CONTEXT.txt:56 says presentation never talks to Firestore and uses the BFF only. Same conflict as AGENTS.md:553.
- [ ] APP_CONTEXT.txt:266 says isHalo is an admin trust badge. BR-5.1 and D4 say Halo is seller id platformVendor. BR-5.3 recommends that isHalo is no longer written or read. O1 stays open.
- [ ] APP_CONTEXT.txt:289 says the order-split function is planned. Section 1.1 lists orders_split.js as existing.
- [ ] docs/phase-3-foundation.md:17 says production data is a single-seller catalog, and line 18 says the live app is tinder_paws v1.0.10+15 with no vendor identity. BR-3.1 says products live in products/{id} with vendorId. Local buyer main pubspec is 1.0.16+24. T0.9 already calls this document stale.
- [ ] docs/phase-3-foundation.md:35 shows the mobile app writing orders as the target. Section 5 says orders are created by a function after S2.11.
- [ ] docs/phase-3-foundation.md:107 says vendorId is the owning auth uid. Section 5 and BR-5.1 say Halo uses vendorId platformVendor.
- [ ] docs/phase-3-foundation.md:121 says isHalo is a trust badge written by the server. BR-5.1 decided Halo is the platform seller. BR-5.3 recommends the field is no longer written or read.
- [ ] docs/phase-3-foundation.md:325 writes isHalo false in the backfill. BR-5.3 recommends the field is no longer written.
- [ ] docs/phase-3-foundation.md:329 says the products UI is not built, and lines 330 to 332 say the products BFF returns empty arrays. T0.9 says that claim is stale.
- [ ] docs/phase-3-foundation.md:404 to 405 leaves the delivery fee model open. BR-4.7 and D7 decided it is optional, per vendor, and set by the admin only.
- [ ] docs/phase-3-foundation.md:406 to 408 leaves Halo as an open trust-badge policy. BR-5.1 decided Halo items are platformVendor. O1 stays open for the isHalo field only.

### Phase 1 details

All Phase 1 tickets: change the portal and the vendor app in the same ticket, from one contract file, with the same rules, states and strings. Update docs/parity.md.

**S1.1 Vendor session and account gates.** Skills: vendor-type-architecture, vendor-suspension-modes. Acceptance:
- [ ] The portal and the vendor app resolve the same gate for the same account: active, pending, rejected, suspended, banned, not a vendor.
- [ ] Suspension reason and expiry are shown.
- [ ] Rules or an endpoint let a pending or rejected vendor read what the gate needs. The result is recorded in sections 5 and 6.
- [ ] Gate mapping tests in both clients.

**S1.2 Governorate list, coverage model, eligibility and suspension functions.** Repo PANEL (functions). Skills: delivery-zones-geo, vendor-suspension-modes, cloud-functions-rules. Acceptance:
- [ ] Canonical governorates with ids, nameEn, nameAr, and an idempotent migration script with a dry run for name-keyed data.
- [ ] resolveBuyerEligibility returns the governorate id and the eligible vendor ids, for zone and governorate modes, active vendors only, with orderable flags for view_only, plus the Halo rule.
- [ ] The suspension function takes a mode, sets the suspension on the vendor, puts open orders on hold and creates a hold case. Lifting restores everything.
- [ ] Permanent suspension keeps Auth enabled if O5 is confirmed.
- [ ] Emulator tests. Nothing deployed.

**S1.3 Coverage picker.** Skills: delivery-zones-geo. Acceptance: the vendor chooses zone (map point and radius) or governorates, saved in the agreed shape, validated, English and Arabic, same in the portal and the app.

**S1.4 Products.** Acceptance: create, edit, archive, status, images, filters in piastres; pending vendors locked; the app has no spreadsheet import or export.

**S1.5 Orders including the hold state.** Acceptance: inbox, detail, status updates; held orders show the hold and cannot be changed by the vendor.

**S1.6 Earnings, notifications and push.** Acceptance: earnings summary and entries, notification inbox, registerVendorFcmToken, push for a new order, token cleanup on logout.

**S1.7 Vendor type and onboarding.** Skills: provider-onboarding, vendor-type-architecture. Acceptance: vendorType drives navigation and labels from one config; provider fields from 6.2; approval status; changes to live data go through change requests; no documents unless O4 says so.

**S1.8 Branches and services.** Acceptance: branches, services and prices (piastres), duplicate services between branches, optional photos.

**S1.9 Availability editor.** Skills: availability-scheduling. Acceptance: weekly hours and exceptions per branch, home visit option, conflict detection with booked appointments, Africa/Cairo handling, right-to-left calendar, the race-safe booking rule recorded in the contract. Open items O12 resolved or defaulted before this ticket.

**S1.10 Appointments inbox and status machine.** Skills: appointments-domain. Acceptance: statuses and transitions enforced by functions, statusHistory, provider actions, inbox filters.

**S1.11 No-show and extra service invoices.** Skills: no-show-flow. Acceptance: flagNoShow enforces the 120 minute rule on the server, buyer notification with four answers, createExtraInvoice. Blocked by the open no-show outcomes in 6.8.

**S1.12 Reviews and dashboard.** Skills: reviews-and-tags. Acceptance: reviews list, aggregates computed on the server, dashboard with visits, services chart, new patients and ratings.

**S1.13 Deals and subscription status.** Skills: deals-and-billing. Acceptance: read-only view of the deal, live balance and subscription fields. Blocked by the open items in 7.4.

**S1.14 Suspension states on the vendor side.** Covered by S1.1, S1.2 and S1.5: banners, reasons, blocked operational routes, held items.

### Phase 2 details

**S2.1 Location-first browsing.** Acceptance: permission flow with manual picker fallback, location stored as lat, lng and governorate id, shown before the catalog, the picker's key moved out of source.

**S2.2 Eligibility with hidden and view-only vendors.** Acceptance: the catalog uses resolveBuyerEligibility, shows eligible vendors plus Halo; view_only items are marked unavailable and cannot be added to the cart; hidden vendors never appear.

**S2.3 Governorate ids, piastres and delivery fee.** Acceptance: orders store governorate ids, name matching and unused fee helpers removed, per vendor admin-set fee at checkout, Halo governorate fees kept, money in piastres at the boundaries, the silent 70 fallback replaced by an explicit behavior [OPEN default].

**S2.5 Service discovery and booking.** Acceptance: providers, branches, services, availability, booking, home visit, statuses visible to the buyer.

**S2.6 Fawaterak, points and coupons.** Acceptance: appointment checkout through Fawaterak, points ledger entries, coupon at checkout, extra invoice payment.

**S2.7 Reviews and no-show prompts.** Acceptance: post-visit prompt, review with three ratings and tags, no-show answers.

**S2.8 Halo fix and badge.** Acceptance: Halo defined by platformVendor only, no reliance on isHalo, admin-created items stamped.

**S2.9 Old version compatibility.** Acceptance: every change is additive, the current store build is tested against new data, the forced update plan and flag exist.

**S2.10 Subscription plans through Apple in-app purchase.** Acceptance: plans purchased through in-app purchase with server verification and restore, Fawaterak no longer used for the plans, Apple guideline check done.

**S2.11 Server-side orders and rules hardening.** Acceptance: createOrder validates eligibility, fees and coupons; after the forced update the rules deny client order creation; live rules verified in the console (BR-15).

**A2.1 to A2.7.** Acceptance follows the titles: suspension modes with a hold case queue (A2.1); admin-only delivery fee in vendorAdminSettings (A2.2); Halo stamping with platformVendor (A2.3); governorate list management and migration (A2.4); provider approval, deals, review moderation, coupons and refunds (A2.5); timers, balances and points functions (A2.6); the hardcoded push token removed and rotated (A2.7).

### Phase 3 details

**T3.1 to T3.6.** Integration testing of all clients against the emulator and a production copy, migration rehearsal, old-version tests, bug-fix buffer, store submissions with Apple review time, then the merge of dev into main only after sign-off.

---

## 8. Risks and known issues

- Production Firestore rules look wide open and may not be deployed (store documents readable and writable, promo codes writable). Verify in the console.
- Orders are written by the buyer app, so eligibility cannot be enforced yet.
- Buyer checkout uses float EGP. The portal uses integer piastres.
- The delivery fee falls back to 70 when its document fails to load. An unused function reads a second fee store by governorate name.
- Governorates are matched by the geocoded name with equality or substring matching.
- Suspending a vendor does not change what buyers see, and no function holds orders or creates a hold case.
- A permanent suspend disables the Auth user, so the vendor cannot see why.
- Subscription plans are charged through Fawaterak, which conflicts with Apple's in-app purchase rule for digital subscriptions.
- A hardcoded device push token sits in tinderpaws_panel/functions/services.js.
- docs/phase-3-foundation.md is stale. The old planning document conflicts with this file.
- There is one production Firebase project and no staging project.
- main keeps changing with store releases while dev is built.
- The preflight found: unpushed commits on the portal main (8) and panel master (16), three unpushed buyer-app branches, a broken firebase CLI, unaccepted Android licenses.

---

## 9. Changelog

- 2026-10-28: File created from the project chat. Contains the business requirements and decisions agreed so far, the architecture decision that Cloud Functions are the endpoints (D1), the data contract proposals, the endpoint registry, and all tickets with estimates and acceptance criteria. Added tickets T0.0, T0.10, T0.11, S2.10, S2.11, A2.7 and T0.9 from the alignment report.
- 2026-10-29: Setup run on dev. T0.0, T0.1 and T0.1b are done. T0.6v is blocked because fvm 3.44.2 shows Need setup. Consistency findings are listed under T0.11. Nothing pushed.
- 2026-11-01: T0.6 vendor app base created at ../tender_paws_partner on branch dev (16 conventional commits after main seed). Analyze and tests green. Ticket moved to REVIEW. Nothing pushed.
- 2026-11-03: T0.6 Android debug APK and iOS no-codesign Runner.app built successfully. Partner `dev` got Android signing-guard and iOS CocoaPods sync fixes. Ticket T0.6 marked DONE. Nothing pushed.
- 2026-11-03: T0.6f vendor app base polish on partner `dev` (font provenance, display font for headings, design skills local copy, language and emulator host tests, SPM lockfile note). Analyze and 21 tests green. Ticket T0.6f marked DONE. Nothing pushed.
