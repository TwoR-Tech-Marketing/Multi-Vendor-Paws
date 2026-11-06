# Tender Paws Multi-Vendor: Source of Truth

Location: docs/SOURCE_OF_TRUTH.md in Multi-Vendor-Paws (authoritative path). Authoritative branch: dev (D16). Local branch after T0.12e was `main`; 2026-11-06: dev is the canonical copy.
Created: 2026-10-28. Last updated: 2026-11-06.

Contents: 0 How this file works, 1 Architecture, 2 Glossary, 3 Business requirements, 3A As built register, 4 Decisions log, 5 Data contracts, 6 Endpoint registry, 7 Tickets, 8 Risks and known issues, 9 Changelog.

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
8. BM-n tickets change the business model (D17). The loop is: take the input (an owner answer, Ahmed's decision, or a code finding), update sections 3 and 4, update the affected tickets and contracts, add a changelog line, then check skills, rules and AGENTS.md for drift in the same branch.
9. [AS-BUILT] means this is what the code does today. It is not a decision. Decisions stay [DECIDED]. The register is section 3A.

GitHub policy (D19, 2026-11-06)

- Git and the gh CLI act as GitHub user ahmedhany1284. Never log in, never change accounts, and never print or copy tokens or credentials.
- Allowed pushes: dev and work branches (feature/*, fix/*, feat/*, backup/*) only.
- Never push main or master. Codemagic builds the buyer app on a push to main. Never force push, never delete remote branches, never push tags, and never open or merge pull requests.
- Before pushing a branch that already exists on origin, the remote tip must be an ancestor of the local tip. If it is not, stop and ask.

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
GitHub follows D19 (push only dev and work branches feature/*, fix/*, feat/*, backup/*; never push main or master; never force push). No deploy and no writes to Firebase production unless the ticket says so. No em dashes.
```

Definition of done (every ticket)

- Analyzer or linter clean, tests added or updated and passing.
- User-facing text in English and Arabic, right-to-left checked, loading as shimmer skeletons.
- Money as integer piastres (1 EGP = 100).
- No secrets, keys or personal data in code, logs or commits.
- Contracts and endpoint registry updated. This file updated.
- Conventional commits, one logical change each.
- Vendor-facing tickets are done in both the portal and the vendor app, from one contract, with a docs/parity.md row updated. Any difference is an exception recorded in BR-12.

Commit rules (every repo)

- Conventional Commits: type(scope): subject. Types feat, fix, test, build, ci, docs, chore, refactor. Subject imperative, lower case, no period, 72 characters or fewer. Body for non-trivial commits.
- One logical change per commit. Tests go with the code they cover. Every commit leaves analyze and tests passing.
- Stage explicit paths. Never commit secrets, keystores, google-services files, build output or local tool folders. No amend or history rewrite unless asked. No --no-verify.
- GitHub follows D19. Push only dev and work branches (feature/*, fix/*, feat/*, backup/*). Never push main or master. Never force push, never delete remote branches, never push tags, and never open or merge pull requests. If the branch already exists on origin, push only when the remote tip is an ancestor of the local tip. Otherwise stop and ask. Account ahmedhany1284. Never print tokens or credentials.

---

## 1. Architecture

### 1.1 Platform

- One Firebase project, pets-acd3f, which is production. Firestore, Auth, Storage, Cloud Messaging, Crashlytics and Cloud Functions. Every app is built on it.
- Backend pattern [DECIDED 2026-10-28]: clients read and stream Firestore directly where the security rules allow. Specific functionality is a Cloud Function used as an endpoint (callable preferred), the same way the buyer app already fetches pets. Business rules that must be enforced (eligibility, orders, fees, suspension, appointments, points) live in functions, not in clients.
- Callable functions carry the signed-in user's token automatically. HTTPS functions are used only when a callable cannot be.
- Function code lives in tinderpaws_panel/functions [DECIDED, from code]. Evidence: tinderpaws_panel/functions/index.js wires the groups (state report Part E, Endpoint check, lines 546 to 571). Files in that folder include vendor_signup.js, vendors.js, orders_split.js, service_request.js and services.js. service_request.js and services.js are in the repo and are not required by functions/index.js. Whether those two are deployed is UNKNOWN (state report Part E, lines 555 to 556). Endpoint contracts are kept in section 6.
- D15 (2026-11-06): vendor features that carry business rules are served by shared Cloud Functions in tinderpaws_panel/functions, used by both the portal and the vendor app. Existing portal BFF features (products, orders, profile, earnings) move to those shared functions inside the ticket that touches them. This replaces the earlier [CONFIRM] on the portal BFF in this section.
- Money: integer piastres everywhere. The buyer app uses float EGP today. Convert at the boundary and migrate (S2.3).
- Environments [OPEN, D-ENV]: there is a single production project. Until decided, tickets test functions and rules with the Firebase emulator suite and never write to production.

### 1.2 Repositories

All are siblings under /Users/ahmedhany/Documents/studioProjects/TWOR/TenderPaws.

| Key | Folder | What it is | Default access |
|---|---|---|---|
| WEB (home) | Multi-Vendor-Paws | Next.js vendor web portal. Holds this file, contracts and the parity table | Editable |
| BUYER | tinder_paws | Flutter buyer mobile app. Flutter 3.47.9 and Dart 3.13.7 | Read only unless the ticket says so. Never switch branches or stash there |
| PANEL | tinderpaws_panel | Flutter web admin panel plus Cloud Functions (functions/). Default branch is master, not main | Read only unless the ticket says so |
| VENDOR APP | tender_paws_partner | Flutter vendor mobile app (base from T0.6). Exists at tender_paws_partner. 2026-11-06 (T0.16): https://github.com/TwoR-Tech-Marketing/tender_paws_partner.git was not found, so the remote backup is PENDING until Ahmed creates the repo. Branches main and dev at 9c96797. Flutter 3.47.9 and Dart 3.13.7 | Editable |

### 1.3 Branching and release

- main is what is shippable and shipped: store releases, Shorebird patches and the Flutter 3.47.9 upgrade (done as its own release track, T0.12). dev is the base for the multi-vendor project in every repo. Feature branches are feature/<ticket>-<slug> from dev and merge into dev. Merge main into dev regularly and log it in the changelog. dev merges into main only when the multi-vendor release is signed off.
- Note: ticket T0.12e fast-forwarded main in WEB, BUYER and VENDOR APP on purpose; this replaced the earlier rule never to commit to main for that work. Decision D10 is amended accordingly (D14).
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

Marks: [DECIDED] agreed, [RECOMMENDED] proposed and waiting for confirmation, [OPEN] not decided, [AS-BUILT] what the code does today (not a decision, D17).

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
- 2.5 [DECIDED] Account gates in both vendor clients: active, pending, rejected, suspended, banned, not a vendor. [AS-BUILT] The code does not store those six names as statuses. Mapping from the state report Part E vendor status table (lines 471 to 478). BR-2.5 is unchanged. Code changes wait for O5.

  | Gate in BR-2.5 | What is stored | Session kind |
  |---|---|---|
  | active | vendors.status = active | active |
  | pending | Signup request status pending, or a vendor user who is neither active nor currently restricted | pending |
  | rejected | Stored only on the signup request. The Auth user is deleted, so there is no session | none |
  | suspended | vendors.status = suspended and users.accountStatus = suspended | suspended |
  | banned | Not a status string. isBanned true while status stays suspended | suspended |
  | not a vendor | No vendor session. A user document with another role is mobile_app_account | not_vendor, or mobile_app_account |
- 2.6 [RECOMMENDED] A suspension, temporary or permanent, keeps the Auth account enabled so the vendor sees the status and the reason. Only a ban disables it. Today a permanent suspend disables Auth.
- 2.7 [DECIDED] Pending vendors cannot use products, orders or earnings.

### BR-3 Store catalog and orders
- 3.1 [DECIDED, from code] Vendor products live in top-level products/{id} with vendorId. The legacy store path is still read by older app versions.
- 3.2 [DECIDED, from code] Product status: active, inactive, out_of_stock, archived.
- 3.3 [DECIDED] Vendors cannot create Halo items. The admin creates them in the admin panel.
- 3.4 [DECIDED, from code] Buyer orders are split into one vendor order per vendor.
- 3.5 [DECIDED] The platform takes its fee on orders from the vendor. [OPEN] Whether the commission base includes the vendor's delivery fee. [AS-BUILT] orders_split already includes the delivery fee in the commission base (state report Part E, orders_split.js lines 322 to 327, and Part H item 6). O8 stays open.

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
- 5.4 [DECIDED, bug] The admin panel add product must stamp vendorId platformVendor. [AS-BUILT] Admin create sets neither vendorId nor isHalo. createdBy and updatedBy are the hardcoded username ahmedhany1284 (state report Part E, store_screen.dart lines 1112 to 1143, and Part H items 10 and 15, lines 1122 and 1140).

### BR-6 Services engine (clinic and groomer)
- 6.1 [DECIDED] One engine. The groomer is configuration of the clinic engine.
- 6.2 [DECIDED] A provider enters: name, branches (each with its own services and prices, with a duplicate option), phone, address, map location, services and prices, optional photos, available appointments (editable later), and a home visit option. Clinics may also enter education and experience (optional). The services spec (section 4) lists no education field and no documents for groomers. BR-2.4 stays [OPEN].
- 6.3 [DECIDED] The admin approves before a provider is listed.
- 6.4 [DECIDED] Availability belongs to a branch. Times are stored in UTC and shown in Africa/Cairo. Booking must be race safe. Editing availability never silently cancels booked appointments.
- 6.5 [DECIDED] The buyer picks a provider and services, pays in the app, earns 1 point per EGP (floor(paidPiastres / 100)), and can add a coupon.
- 6.6 [DECIDED] Extra services during a visit: the provider creates an invoice, the buyer pays in the app on the spot and earns points.
- 6.7 [DECIDED] Appointment statuses: paid, completed, cancelled_by_user, cancelled_by_clinic, rescheduled, no_show, refund_pending, refunded. [CONFIRM] Transitions: paid to completed, cancelled_by_user, cancelled_by_clinic, rescheduled or no_show; cancelled to refund_pending to refunded. Every change appends to statusHistory.
- 6.8 [DECIDED] No-show: the provider may flag only after the appointment time plus 120 minutes (server enforced). The buyer then answers: did not attend, I attended, arrived late, report an issue. [OPEN] What each answer does, what happens if the buyer never answers. The services spec (section 2.4) notification wording is: "The clinic marked this appointment as a no-show. Is this correct?" The four answers in that spec are: Yes, I did not attend; No, I attended; I arrived late; Report an issue.
- 6.9 [DECIDED] Reviews: 1 to 5 on cleanliness, waiting time and doctor efficiency, plus tags (friendly doctor, clean clinic, long waiting time, clear explanation, good with nervous pets). Only for completed appointments, one per appointment. The admin can delete a review. [OPEN] Groomer categories and tags, provider replies, review editing.
- 6.10 [OPEN] Slot length (fixed or per service), capacity per slot, minimum notice, booking window, home visit price and area, cancellation windows, who may reschedule and how often, decline reason and reapply, whether one account can hold two vendor types.
- 6.11 [OPEN] Services need a location for discovery. Whether to sort or filter by distance.
- 6.12 [DECIDED] Provider dashboard: number of visits, a chart of each service's share, number of new patients, an overall rating from 1 to 5, and a rating per category. The admin can delete a review (services spec section 2.8). Which parts are for the provider and which are for the admin is [OPEN] (O24).

### BR-7 Deals and billing
- 7.1 [DECIDED] Per provider the admin sets a deal: fixed subscription, percentage, or both.
- 7.2 [DECIDED] The percentage is taken after the coupon. The balance is live, through an append-only earnings ledger (sale, refund, adjustment, payout).
- 7.3 [DECIDED] Subscription shows amount, start date, renewal date, payment status and grace period. The period is monthly or annual (services spec section 2.10).
- 7.5 [AS-BUILT] Default commission is 10 percent, with per-vendor overrides in commissionConfig/main written by setVendorCommission (state report Part E, vendors.js lines 707 to 756, and Part H item 14, vendors.js line 14). How this relates to the BR-7.1 deal model is [OPEN] (O19).
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
- 12.5 [DECIDED] Mobile exceptions are listed here. Today the only exception is BR-12.4 (no spreadsheet import or export).

### BR-13 Notifications
- 13.1 [OPEN] Vendor push events (new order, new appointment, status changes) and buyer prompts (no-show answers, review request). Exact list and wording. The services spec (section 2.6) requires a buyer prompt that asks whether the visit was completed, before the review. The wording of that prompt stays [OPEN].

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

## 3A. As built register

[AS-BUILT] records what the code does when the model was silent (D17). It is not a decision. Source: state report Part H, "The model is silent and the code already chooses" (lines 673 to 691), checked against Part E.

| Id | What the code does | Evidence | Linked |
|---|---|---|---|
| AB-1 | Ban is stored as vendors.status suspended plus isBanned true. users.accountStatus is suspended. | Part H item 1. Part E lines 446 to 451 | BR-2.5, O5 |
| AB-2 | Reject sets the signup request to rejected and deletes the Auth user. There is no rejected session. | Part H item 2. Part E lines 434 to 435 | BR-2.5, O5 |
| AB-3 | A permanent suspend disables Auth. A temporary suspend does not. A permanent ban disables Auth. A temporary ban does not. | Part H item 3. Part E lines 441 to 443 and 447 to 448 | BR-2.6, O5 |
| AB-4 | The portal folds ban and suspend into one session kind, suspended. | Part H item 4. Part E lines 462 and 468 | BR-2.5 |
| AB-5 | Pending vendors may open settings, profile and notifications. Products, orders, earnings and the dashboard sit behind ActiveVendorGuard. | Part H item 5. Part E line 469 | BR-2.7, O20 |
| AB-6 | Commission uses subtotal plus a split of the delivery fee, minus a split of the discount. | Part H item 6. orders_split.js lines 322 to 327 | BR-3.5, O8 |
| AB-7 | Checkout delivery fee is one global document, delivery_fees/const_fees, and falls back to 70. | Part H item 7. Part E lines 529 to 532 | BR-4.7 |
| AB-8 | A second fee table, settings/delivery_fees, is keyed by governorate name and falls back to 30. No static caller was found. | Part H item 8. Part E lines 533 to 534 | BR-4.7 |
| AB-9 | Governorates are matched by the name string. The document id is used after that match. | Part H item 9. Part E lines 494 to 495 and 534 | BR-4.6, O16 |
| AB-10 | Admin-created products do not set vendorId or isHalo. | Part H item 10. store_screen.dart lines 1112 to 1143 | BR-5.4 |
| AB-11 | The buyer Halo path filters vendorId == platformVendor and also maps isHalo onto the item. | Part H item 11. Part E lines 507 to 514 | BR-5.3, O1 |
| AB-12 | The buyer client creates orders. | Part H item 12. orders_service.dart line 126 | BR-14.3, S2.11 |
| AB-13 | Subscription plans use a Fawaterak token path. No Apple in-app purchase package was found under buyer lib. | Part H item 13. main.dart lines 18 to 26 | BR-8.1, S2.10 |
| AB-14 | Default commission is 10 percent in vendors.js line 14, with per-vendor overrides in commissionConfig/main. | Part H item 14. vendors.js lines 707 to 756 | BR-7.5, O19 |
| AB-15 | createdBy and updatedBy on admin products are the literal username ahmedhany1284. | Part H item 15. store_screen.dart lines 1122 and 1140 | BR-5.4 |
| AB-16 | Legacy service_request statuses differ from the appointment status list, and those triggers are not in functions/index.js. | Part H item 16. Part E lines 503 and 555 | BR-6.7 |
| AB-17 | The workspace rule forbade commits to main, while D14 and the git history show main was fast-forwarded in T0.12e. | Part H item 17 | D14. Wording aligned in this ticket |

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
| D14 | 2026-11-04 | D10 amended. main is what is shippable and shipped (store releases, Shorebird patches, and the Flutter 3.47.9 upgrade on its own track, T0.12). dev is the base for the multi-vendor project in every repo. Feature branches are feature/<ticket>-<slug> from dev and merge into dev. Merge main into dev regularly and log it. dev merges into main only when the multi-vendor release is signed off. T0.12e fast-forwarded main in WEB, BUYER and VENDOR APP on purpose, which replaced the earlier rule never to commit to main for that work. |
| D15 | 2026-11-06 | Vendor features that carry business rules are served by shared Cloud Functions in tinderpaws_panel/functions, used by both the portal and the vendor app. Existing portal BFF features (products, orders, profile, earnings) move to shared functions inside the ticket that touches them. This resolves the [CONFIRM] that was on the portal BFF in section 1.1. |
| D16 | 2026-11-06 | docs/SOURCE_OF_TRUTH.md on WEB dev is the only canonical business model. Any other summary is derived from it and is never edited by hand. |
| D17 | 2026-11-06 | Business model changes run as BM-n tickets. Choices the code already made without a business rule are recorded in section 3A with AB ids and the mark [AS-BUILT]. [AS-BUILT] means this is what the code does, not that it was decided. |
| D19 | 2026-11-06 | GitHub account ahmedhany1284. Git and the gh CLI are used as that user. Never log in, never change accounts, and never print or copy tokens or credentials. Allowed pushes are dev and work branches (feature/*, fix/*, feat/*, backup/*) only. Never push main or master, because Codemagic builds the buyer app on a push to main. Never force push, never delete remote branches, never push tags, and never open or merge pull requests. Before pushing a branch that already exists on origin, the remote tip must be an ancestor of the local tip. If it is not, stop and ask. |

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
| O8 | Does the commission base include the delivery fee | Ask the owner. The code already does yes (AB-6). |
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
| O19 | How the existing 10 percent commission and per-vendor overrides relate to the BR-7.1 deal model | Ask the owner. See AB-14 and BR-7.5 |
| O20 | Which screens a pending vendor may open | The portal allows settings, profile and notifications (state report Part E, lines 469 and Part H item 5). Ask before changing the guards |
| O21 | What happens on a no-show when the buyer never answers | Open. Services spec section 6 lists this as unconfirmed |
| O22 | Whether the answer "arrived late" reopens the appointment | Open. Services spec section 6 |
| O23 | What "report an issue" creates and who handles it | Open. Services spec section 6 |
| O24 | Which dashboard parts are for the provider and which are for the admin | Open. Services spec section 6. BR-6.12 records the dashboard contents |

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
| vendor_signup-submitVendorSignupRequest | Public signup | Create the pending signup request and an enabled Auth user | existing | LIVE in repo. v2 onCall in vendor_signup.js line 127. Wired by functions/index.js (state report Part E, lines 550 to 552) |
| vendors-deleteVendor | Admin | Delete Auth, the vendor document and the user document | existing | LIVE in repo. v2 onCall in vendors.js line 664. Wired (state report Part E, line 544) |
| vendors-syncVendorAccess | Signed-in vendor | Sync access for the caller | existing | LIVE in repo. v2 onCall in vendors.js line 674. Wired (state report Part E, line 544) |
| vendors-setVendorCommission | Admin | Write the percent override on commissionConfig/main | existing | LIVE in repo. v2 onCall in vendors.js line 773. Wired (state report Part E, lines 419 and 544) |
| vendors-liftExpiredVendorRestrictions | System | Lift expired bans and suspensions | existing | LIVE in repo. v2 onSchedule every 60 minutes in vendors.js line 783. Wired (state report Part E, line 544) |
| vendors-reviewVendorProfileChange | Admin | Review a vendor profile change request | existing | LIVE in repo. v2 onCall in vendors.js line 832. Wired (state report Part E, line 544) |

service_request.js and services.js are in the repo and are not required by functions/index.js. Deployment is UNKNOWN (state report Part E, lines 555 to 556).

---

## 7. Tickets

Estimates are focused hours for one developer using Cursor, roughly plus or minus 35 percent. The new tickets above add about 18 to 35 hours (T0.13 to T0.16, track E, S2.12). The Flutter modernization (T0.12) is done and was not in the original estimate. Total about 550 to 765 hours. The vendor app is about a quarter. Telehealth and the unspecified services are not included. 2026-11-06 (BM-1): T0.17, PC-1, PC-2 and PC-3 add about 22 to 34 hours (rough). S2.12 moves from 1 hour to 1 to 2 hours. Running total about 572 to 800 hours. BM-1 itself is documentation done in this session and is not added again.

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
| T0.6p | Preflight check | read only | 1 | DONE. Evidence is in chat reports, not in commits. |
| T0.6v | Setup verification before the base app | read only | 0.5 | DONE. Superseded by T0.12 (pin 3.47.9). |
| T0.6c | Alignment and readiness check | read only | 1 | DONE (first run). Evidence is in chat reports, not in commits. |
| T0.6 | Create the vendor app base | VENDOR APP | 5 to 8 | DONE |
| T0.6f | Vendor app base polish | VENDOR APP | 1 to 2 | DONE |
| T0.6b | Vendor user repository, authentication, route gates, login screens | VENDOR APP | 5 to 6 | TODO |
| T0.7 | Buyer app location and catalog report | read only | 1 | DONE. Evidence is in chat reports, not in commits. |
| T0.8 | Events branches decision | none | 0.5 | OPEN. The Events delete guard branch and the panel branch feat/events-renotify-visibility are not merged; see track E. |
| T0.9 | Update stale docs | WEB | 1 to 2 | DONE |
| T0.10 | Decide and set up the test environment (emulator suite or staging project) | WEB, PANEL | 3 to 6 | TODO |
| T0.11 | Reconcile the skills with this file | WEB | 1 to 2 | DONE |
| T0.12 | Flutter modernization epic (vendor first, then buyer) | BUYER, VENDOR APP | 1 to 2 | DONE |
| T0.12a | Install and pin the approved Flutter stable via FVM | BUYER, VENDOR APP | 1 to 2 | DONE |
| T0.12b | Migrate the vendor app to the approved Flutter | VENDOR APP | 4 to 8 | DONE |
| T0.12c | Assess and migrate the buyer app (with safety gate) | BUYER | 8 to 16 | DONE |
| T0.12d | Align Flutter or Dart pins, CI and cross-app regression | BUYER, VENDOR APP, WEB | 3 to 5 | DONE |
| T0.12e | Consolidate Flutter modernization onto local main | BUYER, VENDOR APP, WEB | 1 to 2 | DONE |
| T0.12f | Source of Truth accuracy cleanup after consolidation | WEB | 0.5 | DONE |
| T0.13 | Reconcile the source of truth with the audit and sync dev with main | WEB, BUYER, PANEL | 1 to 2 | DONE |
| T0.14 | Rules inventory and single source | WEB, BUYER, PANEL | 4 to 8 | TODO |
| T0.15 | Portal test and lint baseline | WEB | 3 to 6 | DONE |
| T0.16 | Backups | WEB, BUYER, PANEL, VENDOR APP | 1 to 2 | DONE. Vendor app remote PENDING |
| T0.17 | Register the vendor app in Firebase, Apple and Google Play | VENDOR APP | 1 to 2 rough | TODO |
| BM-1 | Reconcile the business model, parity and the workspace rule | WEB | done this session | DONE |

Phase 1: portal and vendor app together (every ticket is done in both)

| Id | Title | Repos | Est (h) | Status |
|---|---|---|---|---|
| S1.1 | Vendor session and account gates | WEB, VENDOR APP, PANEL | 20 to 25 | TODO |
| PC-1 | Vendor signup and signup status in the vendor app | WEB, VENDOR APP | 8 to 12 rough | TODO |
| PC-2 | Store profile and profile change requests in the vendor app | WEB, VENDOR APP | 8 to 12 rough | TODO |
| PC-3 | Settings and notifications inbox in the vendor app | WEB, VENDOR APP | 5 to 8 rough | TODO |
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
| S2.12 | Remove every payment token print in the buyer app, including main.dart and payment_service.dart | BUYER | 1 to 2 | TODO |
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
  2026-11-06 (BM-1, D14 and D19): the phrases "never commit to main" and "never push" in this acceptance line are the historical wording. The workspace rule now follows D14 for main and D19 for pushes. The original evidence above is unchanged.

**T0.6v Setup verification before the base app.** Read only. Status: DONE. Result: GO for current Flutter development on 3.44.2. This ticket verifies the existing FVM and Flutter install. It is not the Flutter modernization workstream (see T0.12). Flutter 3.44.2 is the current working pin, not a permanent project target.
- Acceptance (historical first run, then closed by re-investigation on 2026-11-03):
- [x] WEB is on `dev`, and `dev` exists in WEB, BUYER and PANEL.
  Evidence: first-run evidence retained from 2026-10-29 (WEB `dev` at 8a8bf469..., BUYER and PANEL `dev` refs recorded). Later work created the vendor app on its own `dev`.
- [x] Both rules are committed. The named skills exist. AGENTS.md has Project skills and Source of truth.
  Evidence: unchanged from first run (commits 1736315 and 8a8bf46; skill list as recorded).
- [x] Copy source on local BUYER main is recorded.
  Evidence: 505f61f2eb1fcdce201a93fd7d7997f881d9af33; `.fvmrc` flutter 3.44.2.
- [x] FVM and Flutter 3.44.2 are usable for development (re-investigation closed the earlier NO-GO).
  Evidence (2026-11-03, no SDK changes): FVM CLI 3.2.1. Cache `/Users/ahmedhany/fvm/versions/3.44.2`. Partner and buyer `.fvmrc` pin `3.44.2`. Symlinks `.fvm/flutter_sdk` and `.fvm/versions/3.44.2` resolve to that cache. `fvm flutter --version` reports Flutter 3.44.2 stable, Dart 3.12.2, framework `c9a6c48423`. `fvm flutter doctor -v` reports no issues. `fvm doctor` reports pinned 3.44.2 with matching IDE SDK path. T0.6f: `fvm flutter analyze` clean and 21 tests passed on the vendor app.
- [x] Root cause of `fvm list` "Need setup" is recorded (display only; not an SDK install failure).
  Evidence: `fvm list` still shows Version 3.44.2 with Flutter Version column "Need setup" and Dart 3.12.2 for both buyer and vendor (shared cache). Legacy file `$FLUTTER_ROOT/version` is absent. Official Flutter breaking change (3.35): `$FLUTTER_ROOT/version` replaced by `$FLUTTER_ROOT/bin/cache/flutter.version.json`. That JSON is present and reports flutterVersion 3.44.2. Flutter `bin/internal/shared.sh` removes the legacy root `version` file. FVM 3.2.1 still labels the list column from that missing file. Same symptom on buyer and vendor.
- [x] Toolchain state was read and not changed in the verification runs.
  Evidence: first-run toolchain notes retained. Re-investigation did not install, uninstall, or re-pin Flutter.
- [x] Distinguishes SDK verification (this ticket) from Flutter modernization (T0.12).
  Evidence: T0.12 epic and child tickets added in the same SoT update. Current pin remains 3.44.2 until T0.12 selects and lands a newer stable.

**T0.12 Flutter modernization epic (vendor first, then buyer).** Repos BUYER (`tinder_paws`) and VENDOR APP (`tender_paws_partner`). Status: **DONE** (2026-11-04). Shared mobile SDK target: Flutter **3.47.9** / Dart **3.13.7**. Sequence completed: T0.12a → T0.12b → T0.12c (accepted after post-migration native audit) → T0.12d → **T0.12e local Git consolidation onto `main`**. Rollback SDK 3.44.2 remains in FVM cache; global FVM default left at 3.44.2. Buyer local `main` HEAD **`647cd48`** (migration commit; original base **`472293c`**). Feature branch `feature/flutter-3.47.9-buyer` preserved. Local consolidation only; nothing pushed remotely for this epic unless a later ticket says so.
- Child tickets: T0.12a–f (DONE).

**T0.12a Install and pin the approved Flutter stable via FVM.** Repos BUYER and VENDOR APP. Depends on T0.12. Status: DONE.
- Acceptance:
  - [x] Latest Flutter stable at implementation start is recorded (version + Dart + release date + official source).
    Evidence: Flutter **3.47.9** stable, Dart **3.13.7**, released 2026-10-29. Confirmed via `fvm releases` (stable checkmark on 3.47.9) and Flutter announce or changelog for 3.47.9 (framework `c197ca5199`). Not beta 3.50.
  - [x] FVM has that version installed once in the shared cache. Previous SDK preserved for rollback.
    Evidence: `fvm install 3.47.9` succeeded. Cache dirs present: `/Users/ahmedhany/fvm/versions/3.47.9` and `/Users/ahmedhany/fvm/versions/3.44.2`. Global default left at 3.44.2 (`/Users/ahmedhany/fvm/default` → 3.44.2).
  - [x] Vendor app pin updated; buyer pin deferred until T0.12c (vendor-first).
    Evidence: vendor `.fvmrc` → `{"flutter":"3.47.9"}`; `.fvm/flutter_sdk` → `.../versions/3.47.9`. Buyer `.fvmrc` remains `3.44.2` so unmigrated buyer work is not forced onto 3.47.9. `fvm flutter --version` in vendor reports 3.47.9 / Dart 3.13.7. `fvm flutter doctor -v` Flutter section green for 3.47.9.
  - [x] No application source or dependency lockfile changes in this ticket.
    Evidence: partner change is `.fvmrc` only (`.fvm/` gitignored). Buyer untouched. Nothing pushed.
  - [x] `fvm list` may still show "Need setup" (known FVM 3.2.1 vs flutter.version.json display issue). Not treated as install failure.

**T0.12b Migrate the vendor app.** Repo VENDOR APP (`tender_paws_partner`) on `dev`. Depends on T0.12a. Status: DONE. Pre-migration Git tip for rollback: `bb643da` (FVM pin only). FVM rollback SDK: 3.44.2 still in cache. Buyer app not modified.
- Acceptance:
  - [x] Dependencies upgraded only as required for Flutter 3.47.9 / Dart 3.13.7. FlutterFire and plugins compatible.
    Evidence: `fvm flutter pub get` and `fvm flutter pub upgrade` (within existing constraints; no `--major-versions`). Direct pins unchanged in `pubspec.yaml`. Resolved: firebase_core 3.15.2, firebase_messaging 15.2.10, firebase_crashlytics 4.3.10, cloud_functions 5.6.2, flutter_bloc 8.1.6, go_router 14.8.1, get_it 8.3.0, easy_localization 3.0.8. Lockfile transitive refreshes only. Major FlutterFire or bloc upgrades deferred (not required for green analyze/test/build on 3.47.9).
  - [x] Dart or Flutter API breaks fixed. Analyze clean.
    Evidence: no `describeEnum` or other listed 3.44/3.47 breakages in `lib/`. `fvm flutter analyze` → No issues found (exit 0).
  - [x] Android and iOS debug builds succeed; release blocked only by missing keystore (unchanged guard).
    Evidence: `fvm flutter build apk --debug` → `✓ Built build/app/outputs/flutter-apk/app-debug.apk` (~157MB). Native: AGP 9.0.1, Gradle 9.1.0, Kotlin 2.3.20, JVM 17, compile/targetSdk 36, minSdk 24. Warning retained: `cloud_functions` still applies KGP (built-in Kotlin migration not yet available in that plugin). `fvm flutter build ios --debug --no-codesign` → `✓ Built build/ios/iphoneos/Runner.app` (~128MB). iOS 15.0; CocoaPods + SPM hybrid warning unchanged. Podfile.lock Flutter checksum updated for 3.47.9.
  - [x] Codemagic `flutter:` pin set to 3.47.9.
    Evidence: `codemagic.yaml` environment.flutter `3.47.9`.
  - [x] `fvm flutter test` passes. Functional smoke of shell, theme, language recorded.
    Evidence: 21 tests passed (shell PersistentTabView, settings Dark + Arabic RTL, theme tokens, fonts, FunctionsClient, cache/cubit, widgets). Same suite is the automated smoke for shell/theme/language.
  - [x] Issues and fixes documented. Nothing pushed.
    Evidence: this ticket entry. Remaining risks: cloud_functions KGP warning; CocoaPods vs SPM dual integration; FlutterFire major upgrades still available on pub.dev but not taken.
  - [x] Owner approval before starting T0.12c. (waiting)
    Evidence: owner approved T0.12c assessment-first on 2026-11-03. Migration stage of T0.12c still requires a separate approval.

**T0.12c Assess and migrate the buyer app (with safety gate).** Repo BUYER (`tinder_paws`). Depends on T0.12b DONE. Status: **DONE**. **T0.12c-pre COMPLETE**. Migration was executed on `feature/flutter-3.47.9-buyer` (commit **`647cd48`**, cut from base **`472293c`**). Post-migration native toolchain audit: Gradle 8.14.3 / AGP 8.11.1 / Kotlin 2.2.20 classified REQUIRED at Flutter error floors (Gradle patch among 8.14.x). Soft warn-tier 9.x not applied. Owner accepted migration after that audit (proceeded to T0.12d). **After T0.12e:** local buyer `main` fast-forwarded to **`647cd48`**; feature branch preserved; nothing pushed remotely.

### T0.12c-pre — Verified Git readiness (2026-11-04 re-check)

Path: `/Users/ahmedhany/Documents/studioProjects/TWOR/TenderPaws/tinder_paws`
- Branch: **`main`**. HEAD: **`472293c77e91a14612154e6dce65db2541c285d6`** (short `472293c`). Working tree **clean**.
- Tracking: `origin/main` … **ahead 32 / behind 0** (reconfirmed). `origin/main` tip: `a608743` (Events DiscoPawty + 1.0.15+21 PR).
- Local **`dev`** tip: `505f61f`. `main` contains all of `dev` (`main..dev` = 0). `dev..main` = **4** commits: ads rule fixes, events Coming soon layout, Switch contrast rules. Safe to cut migration branch from **`main`**, not from lagging `dev`.
- The 32 unpushed commits (high level): notifications inbox redesign + tests; home rewind / like undo; filter accordion; ads/sponsored rules; events rules and Coming soon UI; iOS 27 iPad UIScene launch fix; version bumps 1.0.15→1.0.16; lockfile tracking churn; skills/docs. Product work, not Flutter SDK migration. **Does not block** starting `feature/flutter-3.47.9-buyer` from current `main`.
- Rollback commit for migration branch: **`472293c`** (pre-migration tip at prep time; re-record if `main` moves before start). Recovery: abandon or delete feature branch; checkout `main` at recorded tip; keep FVM cache **3.44.2**; do not push migration commits. No reset/rebase/push performed in prep.

### T0.12c-pre — Engineering baseline (measured earlier; unchanged)

- Flutter **3.44.2** / Dart **3.12.2** (`.fvmrc`). Target: **3.47.9** / **3.13.7** (FVM cache present; vendor on it at partner `9c96797`).
- Analyze: **0 errors**, 58 warnings, 229 infos. Tests: **69 passed**. Builds not re-run in prep (build gate applies in implementation).
- Machine JDK: Java **17.0.12** (matches project `jvmTarget` 17). Xcode **27.0**, CocoaPods **1.16.2**.

### T0.12c-pre — Crashlytics / runtime monitoring evidence

**Integration (code + native, confirmed):**
- Dart: only in `lib/core/services/intializer_service/initializer_service.dart`. `FlutterError.onError = recordFlutterFatalError` (Flutter framework errors as **fatal**). `PlatformDispatcher.instance.onError` → `recordError(..., fatal: true)` (uncaught async as **fatal**). **No** `recordError(..., fatal: false)` call sites → intentional **non-fatal** Flutter logging is **not** used in app code.
- Native Android: `com.google.firebase.crashlytics` Gradle plugin **3.0.3** applied; google-services present. Native Android crashes expected to report when Crashlytics SDK is initialized via FlutterFire.
- Native iOS: Pod `Firebase/Crashlytics` **11.15.0**; Xcode run script `"${PODS_ROOT}/FirebaseCrashlytics/run"` for dSYM upload. Native iOS crashes expected when SDK initialized.
- Live package / app ids for console: Android **`com.twor2.tenderpaws`** → `1:137181442631:android:aafc7e698b4b86cf887762`; iOS **`com.paws.tinderpaws`** → `1:137181442631:ios:0dd0699d5942d333887762`. Same `google-services.json` also lists older Android packages (`com.paws.tinderpaws`, `com.twor.tenderpaws`, `com.twor.tinderpaws`); filter Crashlytics by the **store** app ids above.
- Not crash monitors: Meta `facebook_app_events`, Firestore `order_analytics`, passing tests. No `firebase_analytics`, `firebase_performance`, or Sentry in pubspec.

**Metrics actually retrieved:** **none** (no crash-free %, no fatal/non-fatal counts, no 7-day history numbers).

**Access attempts (all failed or unsupported for rates):**
- Firebase MCP: no Crashlytics metrics tool (project `pets-acd3f` reachable; apps listable).
- Firebase CLI: only `crashlytics:symbols:upload` / mappingfile helpers; no dashboard query.
- gcloud: no crashlytics metrics command; logging read for project failed (**token reauth required** in this environment). Credential tokens were not extracted or logged.
- Conclusion: **runtime Crashlytics baseline is inaccessible** to the agent. Historical seven-day comparison **cannot** be locked numerically without owner console export.

**Manual Crashlytics retrieval (owner):**
1. Open Firebase Console → project **TinderPaws** (`pets-acd3f`) → **Crashlytics**.
2. Select app: Android `com.twor2.tenderpaws`, then repeat for iOS `com.paws.tinderpaws`.
3. Set date range to last **7 days** (or custom equal windows).
4. Record for each platform: crash-free users %, crash-free sessions % (if shown), fatal issue count, non-fatal issue count, top 5 issues (title + event count). Note timezone (Console default).
5. Paste numbers into this ticket under “Owner Crashlytics baseline” before any production/store release comparison. Optional but recommended before TestFlight comparison; **not** required to start the engineering migration branch under the limited policy below.

### T0.12c-pre — Final safety policy (limited; no invented rates)

**Metric classes (never substitute):** (1) runtime fatal crashes (2) runtime non-fatals (3) API/network failures (unavailable as product metric) (4) test failures (5) analyzer **errors** (6) build failures.

**A. Engineering gate (locked from measured baseline; required before checkpoint):**
- Analyzer errors = **0** (baseline 0). Warning/info deltas reported; not automatic STOP unless owner tightens.
- `fvm flutter test`: all pass; count **≥ 69**. Any failure = STOP candidate.
- `fvm flutter build apk --debug` and `fvm flutter build ios --debug --no-codesign` succeed. Failure = STOP.
- Dep strategy: pin FVM 3.47.9; `pub get` then in-constraint `pub upgrade` only (mirror T0.12b). Major bumps only if required to compile; document each. Do not delete tests or features to go green.

**B. Runtime gate (explicitly LIMITED / UNAVAILABLE until console numbers exist):**
- Numeric crash-free or fatal/non-fatal **delta thresholds are not set** (no retrieved baseline). Do not fabricate %.
- When owner pastes 7-day baselines: comparison window = **equal length** (default **7 days**) after first 3.47.9 TestFlight / internal track build vs pre-window; evaluate **per platform**. Suggested interpretation once numbers exist (owner may adjust): any **sustained drop** in crash-free users/sessions, or **new top fatal** attributed to Flutter/engine/plugins post-migrate, is a STOP/REVERT candidate for release. Without pasted numbers, runtime regression monitoring remains **UNAVAILABLE**.
- Minimum sample: if post-window sessions/users are too low to judge (owner judgment from Console velocity), treat runtime comparison as **inconclusive**, not as pass. Engineering gate alone still does not clear production release.
- API/network: no crash-equivalent monitor; track only as manual smoke (login, feed, store checkout path) at checkpoint.

**C. Stop conditions (implementation / checkpoint):**
- Engineering gate fails → recommend **STOP AND REVERT**.
- Unresolved native blocker (Stripe/Syncfusion/maps/scanner/Facebook pods or AGP) after reasonable pin-first attempt → STOP and report; do not force majors without owner approval.
- Runtime inconclusive or unavailable → disclose; do **not** auto-approve store release.

**D. Rollback conditions:**
- Owner answers **STOP AND REVERT**, or engineering gate fails after attempted fixes, or production Crashlytics (once available) shows clear post-migrate fatal regression attributable to the upgrade.

**E. Manual approval checkpoint (mandatory):**
- After FVM pin, deps, Dart fixes, analyze/tests/builds green, Codemagic pin drafted on the feature branch: **STOP** and ask owner: **CONTINUE or STOP AND REVERT?** Never decide automatically. No merge to `main`, no push, no Codemagic change on `main`, no store submit until owner answers.

### T0.12c-pre — Compatibility assessment (buyer-specific)

| Area | Buyer state | vs 3.47.9 | Evidence class |
|------|-------------|-----------|----------------|
| Flutter/Dart pin | 3.44.2 / 3.12.2 | Target 3.47.9 / 3.13.7 | Confirmed target (T0.12a); buyer not yet run on it |
| FlutterFire | core 3.15.2, crashlytics 4.3.10, messaging 15.2.10, functions 5.6.2, auth 5.7.0, firestore 5.6.12, storage 12.4.10 | Same majors as vendor green build | **Assumed OK** (vendor proof for overlapping packages only) |
| flutter_bloc / go_router / get_it / easy_localization / flutter_local_notifications | Same resolved as vendor where present | Vendor green | **Assumed OK** for shared set |
| flutter_stripe 11.5.0 | Buyer-only | Unknown on 3.47.9 | **Assumption / risk** |
| syncfusion_flutter_pdfviewer 27.2.5 | Buyer-only | Unknown on 3.47.9 | **Assumption / risk** |
| google_maps_flutter 2.18.1, geolocator 13.0.4, location 8.0.1 | Buyer-only | Unknown | **Assumption / risk** |
| mobile_scanner 7.4.2 | Buyer-only | Unknown | **Assumption / risk** |
| facebook_app_events 0.30.5 | Buyer-only | Unknown | **Assumption / risk** |
| share_plus 7.2.2, file_picker 8.3.7, chewie, youtube_player | Buyer-heavy | Unknown | **Assumption / risk** |
| WillPopScope | `add_paw_profile_images.dart` | Deprecated long ago; still present; migrate if analyze/build requires | Confirmed debt |
| Radio / RadioListTile groupValue/onChanged | `app_custom_bottom_sheet_widget.dart`, `stickers_store_screen.dart`, `add_paw_screen.dart` | Deprecated since 3.35; still compile on 3.44.2; prefer `RadioGroup` if fixing | Confirmed debt (not a 3.47 removal) |
| describeEnum | none in lib | Removed in 3.47 breaking list | **Confirmed clear** |
| Android AGP 8.9.1 / Gradle 8.11.1 / Kotlin 2.1.0 / JDK 17 / SDK 36 / min 24 | Buyer files + local JDK 17 | Flutter 3.47 supports AGP 8.x; AGP 9 optional (vendor used 9). Pin-first without AGP bump | **Assumed OK**; bump only if build fails |
| iOS 15 / Swift 5.0 / CocoaPods / Crashlytics run script | Confirmed | Vendor built iOS 15 on 3.47.9 | **Assumed OK**; pod re-resolve expected |
| Codemagic `flutter: stable` | Floating | Must become `3.47.9` on migration branch | Confirmed gap |

**Known blockers to start prep:** none for engineering migration under limited policy. **Residual risks (not blockers):** buyer-only plugins; unpushed 32-commit `main`; runtime Crashlytics UNAVAILABLE; debug builds not re-verified on 3.44.2 during prep.

### T0.12c-pre — Implementation runbook (ordered; execute only after owner approval)

1. **Branch:** from buyer repo, on clean `main` at recorded tip (expect `472293c` or newer if advanced): `git switch -c feature/flutter-3.47.9-buyer`. Do not start from `dev`. Do not push unless ticket says so.
2. **Baseline capture on branch tip (3.44.2):** re-run `fvm flutter --version`, `analyze`, `test`; record counts. Optional: owner pastes Crashlytics 7-day numbers into SoT.
3. **SDK pin:** set `.fvmrc` to `3.47.9`; `fvm use 3.47.9`; confirm Dart 3.13.7. Keep 3.44.2 in cache for rollback.
4. **Deps:** `fvm flutter pub get`; if needed `fvm flutter pub upgrade` **without** `--major-versions`. Document lockfile delta. Only then consider majors for Stripe/Syncfusion/maps/scanner/Facebook if compile fails.
5. **Dart:** fix analyzer **errors** and compile breaks only. Prefer `PopScope` for WillPopScope and `RadioGroup` for Radio* if touched. Do not mass-clean warnings. Do not weaken or delete tests.
6. **Android:** keep AGP 8.9.1 / Gradle 8.11.1 / Kotlin 2.1.0 first. If build fails, escalate carefully (vendor reference: AGP 9.0.1 / Gradle 9.1 / Kotlin 2.3.20) with documented reason. `fvm flutter build apk --debug`.
7. **iOS:** `cd ios && pod install` as needed; `fvm flutter build ios --debug --no-codesign`. Preserve Crashlytics dSYM run script.
8. **CI:** on feature branch only, set Codemagic `flutter: 3.47.9` (match vendor). Do not change `main` CI until CONTINUE.
9. **Verify commands:** `fvm flutter analyze` (0 errors), `fvm flutter test` (≥69 pass), Android debug APK, iOS no-codesign.
10. **Functional smoke (manual):** cold start; login/session; home feed swipe; notifications inbox; one store/maps/scanner path if device available; Arabic RTL toggle; dark theme. Record pass/fail. These are not crash rates.
11. **Crashlytics:** confirm SDK still initializes in release/profile config; do not claim rate regression without Console data.
12. **Checkpoint:** STOP. Report deltas vs prep. Ask **CONTINUE or STOP AND REVERT?**
13. **Rollback:** if REVERT or failed gate: delete/abandon feature branch; checkout `main` @ rollback tip; `.fvmrc` back to 3.44.2; discard Codemagic draft. If CONTINUE: follow owner instructions for merge/push/store (out of scope until then).

### T0.12c readiness status (superseded by migration execution below)

- Prep marked READY 2026-11-04. Owner approved implementation. Migration executed on feature branch; ticket not DONE until CONTINUE/REVERT.

### T0.12c migration execution (2026-11-04) — safety checkpoint

Repo BUYER `tinder_paws`. Branch **`feature/flutter-3.47.9-buyer`**. Start commit **`472293c`**. Migration commit **`647cd48`**. Nothing pushed. Global FVM default still **3.44.2**. Production Crashlytics metrics remain **unavailable**; no quantitative production crash-rate comparison claimed.

**Baseline on 3.44.2 (same tip, before pin):** Flutter 3.44.2 / Dart 3.12.2; analyze 0 errors / 58 warnings / 229 infos; 69 tests passed; Android debug APK OK; iOS debug no-codesign OK.

**After migration (3.47.9):** Flutter 3.47.9 / Dart 3.13.7; analyze 0 errors / **59** warnings / 229 infos; 69 tests passed; Android debug APK OK; iOS debug no-codesign OK (after cleaning stale `ios/Pods` gRPC modulemap failure and re-running `pod install`).

**Changes (rationale):**
- `.fvmrc` + `.vscode/settings.json` → 3.47.9 (SDK pin).
- `pubspec.lock` in-constraint refresh only (e.g. mobile_scanner 7.4.2→7.5.0). No pubspec.yaml majors. No Dart source edits (WillPopScope/Radio remain deprecated infos, still compile).
- Android: Gradle **8.11.1→8.14.3**, AGP **8.9.1→8.11.1**, Kotlin **2.1.0→2.2.20** (Flutter hard minimums; demonstrated build failures until each bump). Soft warnings remain that Flutter will soon require Gradle ≥9.1.0, AGP ≥9.0.1, Kotlin ≥2.3.20.
- iOS: Podfile.lock Flutter checksum refresh; AppFrameworkInfo.plist `MinimumOSVersion` key removed by tooling (deployment target still 15.0 via Podfile/Xcode). Crashlytics dSYM run script retained.
- Codemagic: `flutter: stable` → `3.47.9`.

**Buyer-only plugins:** Stripe / Syncfusion / maps / scanner / Facebook / share_plus / file_picker compiled into debug builds; runtime device smoke not claimed.

**Rollback (as of migration, pre-T0.12e):** return to base tip `472293c`; abandon feature branch; FVM 3.44.2 remains in cache and is global default.

**Checkpoint:** Owner accepted migration after post-migration native audit (**CONTINUE** implied by authorizing T0.12d). **T0.12e** later fast-forwarded local buyer `main` to `647cd48` (feature branch preserved). Nothing pushed remotely.

- Acceptance:
  - [x] Pre-migration baseline and thresholds recorded here.
    Evidence: T0.12c assessment 2026-11-03 + T0.12c-pre 2026-11-04. Engineering thresholds locked. Runtime numeric thresholds UNAVAILABLE (limited policy).
  - [x] T0.12c-pre consolidated readiness (Git, Crashlytics access limit, safety policy, compatibility, runbook) recorded.
  - [x] Buyer migrated to the same approved Flutter or Dart as vendor. Analyze and tests addressed with evidence.
    Evidence: feature branch `feature/flutter-3.47.9-buyer` commit `647cd48`; Flutter 3.47.9 / Dart 3.13.7; analyze 0 errors; 69 tests passed.
  - [x] Android and iOS builds succeed (or blocked items listed with approval).
    Evidence: `app-debug.apk` and `Runner.app` built on 3.47.9.
  - [x] Codemagic Flutter pin is explicit and matches the approved version.
    Evidence: `codemagic.yaml` `flutter: 3.47.9` set during migration on `feature/flutter-3.47.9-buyer`; same pin is on local `main` after T0.12e FF.
  - [x] Safety-gate checkpoint completed with owner CONTINUE or REVERT decision recorded.
    Evidence: post-migration audit accepted; owner authorized T0.12d final alignment (CONTINUE). Local consolidation via T0.12e; nothing pushed remotely.
  - [x] Nothing pushed unless the ticket says so.
  - [x] Owner approval to start migration stage.
    Evidence: owner authorized T0.12c implementation under limited engineering safety policy.

**T0.12d Align pins, CI and cross-app regression.** Repos BUYER, VENDOR APP, WEB (SoT only). Depends on T0.12b and T0.12c. Status: **DONE** (2026-11-04). No application source fixes required. SoT-only documentation commit.

**Shared SDK (verified independently):** Flutter **3.47.9** / Dart **3.13.7** via each app’s `.fvmrc` and `.fvm/flutter_sdk` → `/Users/ahmedhany/fvm/versions/3.47.9`. Global FVM default remains **3.44.2** (unchanged).

**Branches / commits at T0.12d verification (historical snapshot):**
- Vendor `tender_paws_partner` `dev` @ **`9c96797`** (clean).
- Buyer `tinder_paws` `feature/flutter-3.47.9-buyer` @ **`647cd48`** (clean; base `472293c`).
- Portal `Multi-Vendor-Paws` `dev` @ SoT tip then current.

**After T0.12e local consolidation (current):**
- Vendor `main` @ **`9c96797`** (`dev` preserved at same tip).
- Buyer `main` @ **`647cd48`** (FF from feature; base `472293c` remains ancestor; feature branch preserved; ahead of `origin/main` by 33 locally).
- Portal `main` @ SoT tip including T0.12d close (`95f5601` at consolidation; later T0.12f doc cleanup may advance HEAD). `dev` preserved.

**CI:** Both active Codemagic workflows pin `flutter: 3.47.9`. No other active workflow uses floating `stable`. Buyer `shorebird.yaml` does not pin a Flutter SDK version (not treated as CI Flutter channel).

**T0.12d regression (engineering/build only; no device smoke; no production Crashlytics rates):**

| Check | Vendor (`9c96797`) | Buyer (`647cd48`) |
|-------|--------------------|-------------------|
| `fvm flutter --version` | 3.47.9 / Dart 3.13.7 | 3.47.9 / Dart 3.13.7 |
| Analyze | No issues found | 0 errors / 59 warnings / 229 infos (matches T0.12c post-migrate) |
| Test | 21 passed | 69 passed |
| Android debug APK | Passed | Passed (soft warn: Gradle/AGP/Kotlin soon-dropped toward 9.1 / 9.0.1 / 2.3.20) |
| iOS debug `--no-codesign` | Passed (CocoaPods+SPM hybrid warn) | Passed (some plugins lack SPM) |

**Intentional native differences (both compatible with 3.47.9; not forced identical):**
- Vendor Android: AGP **9.0.1**, Gradle **9.1.0**, Kotlin **2.3.20**, JDK 17, minSdk 24, compile/targetSdk 36.
- Buyer Android: AGP **8.11.1**, Gradle **8.14.3**, Kotlin **2.2.20**, JDK 17, minSdk 24, compile/targetSdk 36 (Flutter hard minima from T0.12c; warn-tier 9.x not applied).
- Both iOS: deployment **15.0**. Crashlytics wired (Dart fatal handlers; buyer also Android Crashlytics Gradle plugin + iOS dSYM run script).

**Limitations (explicit):** Production Crashlytics metrics were unavailable throughout T0.12; no quantitative production crash-rate comparison. Device runtime smoke tests were **not** performed in T0.12d. Compilation success is not device verification.

- Acceptance:
  - [x] Both apps report the same Flutter and Dart from `fvm flutter --version`.
    Evidence: both 3.47.9 / 3.13.7 on their FVM pins.
  - [x] CI pins match. Cross-app smoke and regression checks recorded.
    Evidence: both Codemagic `flutter: 3.47.9`; analyze/test/Android/iOS table above.
  - [x] This file records final Flutter, Dart, native toolchain notes if changed, and evidence. Changelog updated.
  - [x] Nothing pushed unless the ticket says so.

**T0.12e Consolidate Flutter modernization onto local main.** Repos BUYER, VENDOR APP, WEB. Status: **DONE** (2026-11-04). Fast-forward only; no push; original `dev` / feature branches preserved.
- Vendor: `main` FF from `dev` → **`9c96797`**.
- Buyer: `main` FF from `feature/flutter-3.47.9-buyer` → **`647cd48`** (32 prior local product commits on `main` retained; now 33 ahead of `origin/main` locally).
- Portal: `main` FF from `dev` → **`95f5601`** (then T0.12f doc cleanup may add a follow-up commit on `main`).
- Distinguishes **local** branch consolidation from **remote** sync: nothing pushed.

**T0.12f Source of Truth accuracy cleanup.** Repo WEB. Status: **DONE** (2026-11-04). Corrects outdated buyer “pending merge” / `main`@`472293c` current-state wording after T0.12e. Preserves historical feature-branch migration path. Nothing pushed.

**T0.4 Owner questions.** Owner answers needed for O4, O6, O8, O9, O10, O11, O12, O13, O14, O19, O20, O21, O22, O23 and O24. Update section 3 and 4 when answered. O8 already has an as-built note (AB-6): the code includes the delivery fee. It stays open.

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
    2026-11-06 (BM-1): this acceptance line is historical. T0.12e fast-forwarded vendor `main` to `9c96797` (D14). The evidence above describes the tree at the time T0.6 was closed.
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

**T0.9 Stale docs.** Status: DONE (2026-11-05). docs/phase-3-foundation.md said the mobile app is 1.0.10+15 and the portal products API is unbuilt. The old planning document disagrees with this file. Both are marked superseded. Their bodies are kept as history.
- [x] docs/phase-3-foundation.md is marked superseded by this file.
  Evidence: banner at the top of docs/phase-3-foundation.md. Buyer pubspec on local main is 1.0.16+24 (`tinder_paws/pubspec.yaml`). Products routes are implemented in `src/app/api/vendor/products/route.ts` and `src/app/api/vendor/products/[productId]/route.ts`, not empty-array stubs.
- [x] The old planning document is marked superseded by this file.
  Evidence: banner at the top of `../MULTI_VENDOR_SERVICES_PLANNING_PRICING.md` (parent folder, not a git repo). It still mentions an admin mobile app and clinic tax and license documents. Those stay [CONFIRM] and [OPEN] here (BR-1.5, BR-2.4, O6). Nothing in that file was rewritten.

**T0.10 Test environment.** Decide O7. Acceptance: the Firebase emulator suite (Firestore, Auth, Functions) runs for the portal and panel functions, with seed data, and the vendor and buyer apps can point to it through config. No ticket tests against production.

**T0.11 Reconcile skills.** Status: DONE (2026-11-05). Make each skill in .cursor/skills consistent with this file, or reduce it to a pointer. If a skill and this file disagree, this file wins.

Consistency findings from the 2026-10-29 setup run. Reconciled in this ticket. OPEN and CONFIRM items in the source of truth were not resolved.
- [x] .cursor/skills/appointments-domain/SKILL.md:18 says the BFF enforces appointment transitions. Section 1.1 and S1.10 say Cloud Functions enforce them.
  Evidence: skill now says Cloud Functions enforce transitions.
- [x] .cursor/skills/appointments-domain/SKILL.md:28 calls the admin hold record a ticket. Section 0 and BR-9.3 call it a hold case.
- [x] .cursor/skills/vendor-suspension-modes/SKILL.md:14 uses ticket for the hold record, and marks clinic and groomer appointment holds as CONFIRM. BR-9.3 decided that clinics and groomers follow the same hold rule.
- [x] .cursor/skills/vendor-suspension-modes/SKILL.md:18 says "Ticket contents" for the hold case.
- [x] .cursor/skills/no-show-flow/SKILL.md:13 says the 120 minute check is enforced by the BFF and a Cloud Function. BR-6.8 and S1.11 say flagNoShow enforces it.
- [x] .cursor/skills/cloud-functions-rules/SKILL.md:7 lists existing functions as vendor_signup.js and vendors.js only. Section 1.1 also lists orders_split.js, service_request.js and services.js.
- [x] .cursor/skills/cloud-functions-rules/SKILL.md:13 says suspension handling opens an admin ticket. BR-9.3 says a hold case.
- [x] .cursor/skills/admin-panel-contract/SKILL.md:17 says "Admin ticket queue". A2.1 says a hold case queue.
- [x] .cursor/skills/vendor-type-architecture/SKILL.md:9 lists later types as trainer, walker, host. BR-1.6 lists hotel, trainer, walker, services store.
- [x] .cursor/skills/vendor-type-architecture/SKILL.md:13 lists account status as pending, active, suspended. BR-2.5 also includes rejected, banned and not a vendor.
- [x] .cursor/skills/single-release-rollout/SKILL.md:8 ends the deploy order with mobile. Section 1.3 says then apps.
- [x] .cursor/skills/single-release-rollout/SKILL.md:14 leaves backward compatibility or a forced update open. BR-14.1 decided that shared data changes stay additive until the forced update.
- [x] .cursor/skills/money-piastres/SKILL.md:7 says never store or compute float EGP. Section 1.1 says the buyer app uses float EGP today and converts at the boundary (S2.3).
- [x] AGENTS.md:56 lists admin order monitoring as a portal feature. BR-1.4 says admins use tinderpaws_panel, and AGENTS.md:550 says this app is vendor-only.
- [x] AGENTS.md:57 lists marketplace browse as a feature of this repo. BR-1.2 says buyers use the Flutter app.
- [x] AGENTS.md:553, AGENTS.md:658 and AGENTS.md:686 say vendor data comes only from the BFF and presentation never reads Firestore. Section 1.1 says clients read Firestore where the rules allow, the portal BFF keeps existing features, and new business rules call the shared functions.
- [x] APP_CONTEXT.txt:18 calls this work Phase 3. D11 says phase 3 is testing and release.
- [x] APP_CONTEXT.txt:56 says presentation never talks to Firestore and uses the BFF only. Same conflict as AGENTS.md:553.
- [x] APP_CONTEXT.txt:266 says isHalo is an admin trust badge. BR-5.1 and D4 say Halo is seller id platformVendor. BR-5.3 recommends that isHalo is no longer written or read. O1 stays open.
- [x] APP_CONTEXT.txt:289 says the order-split function is planned. Section 1.1 lists orders_split.js as existing.
- [x] docs/phase-3-foundation.md:17 says production data is a single-seller catalog, and line 18 says the live app is tinder_paws v1.0.10+15 with no vendor identity. BR-3.1 says products live in products/{id} with vendorId. Local buyer main pubspec is 1.0.16+24. T0.9 already calls this document stale.
- [x] docs/phase-3-foundation.md:35 shows the mobile app writing orders as the target. Section 5 says orders are created by a function after S2.11.
- [x] docs/phase-3-foundation.md:107 says vendorId is the owning auth uid. Section 5 and BR-5.1 say Halo uses vendorId platformVendor.
- [x] docs/phase-3-foundation.md:121 says isHalo is a trust badge written by the server. BR-5.1 decided Halo is the platform seller. BR-5.3 recommends the field is no longer written or read.
- [x] docs/phase-3-foundation.md:325 writes isHalo false in the backfill. BR-5.3 recommends the field is no longer written.
- [x] docs/phase-3-foundation.md:329 says the products UI is not built, and lines 330 to 332 say the products BFF returns empty arrays. T0.9 says that claim is stale.
- [x] docs/phase-3-foundation.md:404 to 405 leaves the delivery fee model open. BR-4.7 and D7 decided it is optional, per vendor, and set by the admin only.
- [x] docs/phase-3-foundation.md:406 to 408 leaves Halo as an open trust-badge policy. BR-5.1 decided Halo items are platformVendor. O1 stays open for the isHalo field only.
  Evidence for the checked findings: skills under .cursor/skills (appointments-domain, vendor-suspension-modes, no-show-flow, cloud-functions-rules, admin-panel-contract, vendor-type-architecture, single-release-rollout, money-piastres, firestore-multitenant-rules deploy order). The same three claims were aligned in AGENTS.md and .cursor/rules/nextjs-senior-engineering-tenderpaws.mdc. APP_CONTEXT.txt is gitignored, so its banner and the four lines were edited on disk and are not in the commit. docs/phase-3-foundation.md was already marked superseded in T0.9, so those findings are closed by that banner. No OPEN or CONFIRM item was resolved.


**T0.13 Reconcile the source of truth with the audit and sync dev with main.** Repos WEB, BUYER, PANEL. Est 1 to 2 h. Status: DONE.
- [x] dev includes main (master on the panel) in WEB, BUYER and PANEL. No push.
  Evidence: clean trees before the merge. WEB dev merge `98fd495` (main `b018b15` into dev `95f5601`). BUYER dev merge `9d4f357` (main `647cd48` into dev `505f61f`), then checkout back to main. PANEL dev merge `6aa4db5` (master `b510dc8` into dev `5250bf3`), then checkout back to master. VENDOR APP unchanged: main and dev both `9c96797`.
- [x] This file matches the audit notes in sections 1.2, 1.3, 4 (D14), 7, 8 and 9.
  Evidence: the edits in this ticket, committed on WEB dev.

**T0.14 Rules inventory and single source.** Repos WEB, BUYER, PANEL. Est 4 to 8 h. Status: TODO. Acceptance:
- [ ] List every Firestore and Storage rules file and index file in all repos.
- [ ] The owner exports the live deployed rules from the Firebase console and the file compares them.
- [ ] Choose one canonical location.
- [ ] The canonical file contains every collection in use (events, products, orders, vendors, store, promo codes and the rest).
- [ ] Document the deploy command.
- [ ] No agent deploys.
  Note: the portal rules copy lacks the events block, so deploying it would remove the events rules.

**T0.15 Portal test and lint baseline.** Repo WEB. Est 3 to 6 h. Status: DONE (2026-11-05). Acceptance:
- [x] Fix the 19 lint errors (react-hooks/set-state-in-effect and others).
  Evidence: `npx eslint . --quiet` exits 0. The 19 errors were all `react-hooks/set-state-in-effect`. Loaders now start from `setTimeout` so setState is not synchronous in the effect. Draft resets and the profile form update state during render when their source changes. Popup layout uses `queueMicrotask`. Back-button visibility uses `useSyncExternalStore`.
- [x] Add a test runner (Vitest) with first tests for session and products validation.
  Evidence: Vitest 3.2.7. `src/features/auth/domain/session-body.test.ts` (2 tests). `src/features/products/domain/schemas.test.ts` (4 tests). `npm test` reports 6 passed.
- [x] A documented test command.
  Evidence: `npm test` in package.json and README.md.
- [x] tsc stays clean.
  Evidence: `npm run typecheck` (`tsc --noEmit`) exits 0.

**T0.16 Backups.** Repos WEB, BUYER, PANEL, VENDOR APP. Est 1 to 2 h. Status: DONE (2026-11-06). The vendor app remote item stays PENDING. Acceptance:
- [ ] A remote exists for the vendor app. PENDING. `git ls-remote --heads https://github.com/TwoR-Tech-Marketing/tender_paws_partner.git` returned "Repository not found." Nothing was created. Tracked-file scan of the vendor app (`git ls-files`) found no google-services.json, GoogleService-Info.plist, key.properties, jks, keystore or .env file. Ahmed creates the repo. FINAL PUSH retries the push.
- [x] dev and the allowed work branches are pushed for WEB, BUYER and PANEL. They did not exist on origin, so the push created them (fast-forward check: no remote tip to be behind).
  WEB origin tips: dev `3f4cd6f7640273bb75faaa78500ca1c8562e6152`, feature/T0.11-reconcile-skills `62e5feda05d0a59ee9f32461b096a76aaf1b06bc`, feature/T0.15-portal-test-lint `e10e963b1befcd40bef6919a89654fd55e1f2aeb`, feature/T0.9-stale-docs `5dcbba5655679a4e4082f86fa253cf6cfcd875b1`.
  BUYER origin tips: dev `9d4f357c4fe3eaaf27cb26f1f7307912ce0d6fa9`, backup/main-before-notifications-v2 `ad81917f120fc161da79d5c0aae37a3a015d6908`, backup/notifications-redesign-v2-old `bc268897d714dadba241dea9aef23f2828598b65`, feat/events-checked-in-delete-guard `7a7a008a389bc73804623d350d199e72cb52e1d4`, feature/all-announcement-redirect `bc268897d714dadba241dea9aef23f2828598b65`, feature/flutter-3.47.9-buyer `647cd489636d11876c0e116a8e757f11849d7760`, feature/notifications-redesign `e3cdca0953df1928494cc009861460e81b19a2cc`, feature/notifications-redesign-v2 `610953d8f307495052716e99ea8c9693684c0114`, feature/undo-like-superlike `505f61f2eb1fcdce201a93fd7d7997f881d9af33`, fix/ios27-ipad-launch-crash `b204b76ee3e8a494fce2168423433a0712c785cc`, fix/td-001-td-002-filter-ui `a63d7843f996f8f3ab7fb4d047167788dbe7daa9`.
  PANEL origin tips: dev `6aa4db59ae4a1f8165c4f20ad516af3332a1b939`, feat/events-renotify-visibility `5250bf335a759543c82f12f976449c66537b964a`.
- [x] main and master were not pushed. BUYER new-bundle was not pushed. Codemagic builds the buyer app on a push to main.

**T0.17 Register the vendor app in Firebase, Apple and Google Play.** Est 1 to 2 h, rough. Status: TODO. Manual steps by Ahmed plus flutterfire configure. Blocks T0.6b on a real device. Emulator and fake-auth work in T0.6b do not need this ticket.

**BM-1 Reconcile the business model.** Repo WEB. Status: DONE (2026-11-06). Acceptance:
- [x] D15, D16, D17 and D19 are in section 4. D15 replaces the portal BFF [CONFIRM] in section 1.1. D19 replaces the "no push" line in the standard ticket prompt and the commit rules.
- [x] Section 3A lists AB-1 to AB-17 with evidence from the state report.
- [x] docs/parity.md and docs/contracts/README.md exist.
- [x] The workspace rule follows D14 and D19. The vendor app line says the app exists and the remote is pending.

### Phase 1 details

All Phase 1 tickets: change the portal and the vendor app in the same ticket, from one contract file, with the same rules, states and strings. Update docs/parity.md. PC-1, PC-2 and PC-3 follow D15 and sit after S1.1. They add the portal features the vendor app does not have yet: signup (PC-1), store profile and profile change requests (PC-2), settings and the notifications inbox (PC-3).

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

**S2.12 Remove secret prints in the buyer app.** Est 1 to 2 h. Status: TODO. Widened 2026-11-06 (BM-1). Remove every print, debugPrint or log of a payment token, key or personal data. At least main.dart lines 21 and 26 and payment_service.dart lines 60 and 247 (re-check the line numbers). Search lib/ for others. Do not change payment behavior. If a secret value is hardcoded, do not move or delete it. List it for a separate ticket with rotation. Live-app fix: branch from main as fix/S2.12-remove-secret-prints. Do not merge into main or dev. Leave the branch for a Shorebird patch. Record the branch and hash here when the branch exists.

**A2.1 to A2.7.** Acceptance follows the titles: suspension modes with a hold case queue (A2.1); admin-only delivery fee in vendorAdminSettings (A2.2); Halo stamping with platformVendor (A2.3); governorate list management and migration (A2.4); provider approval, deals, review moderation, coupons and refunds (A2.5); timers, balances and points functions (A2.6); the hardcoded push token removed and rotated (A2.7).

### Phase 3 details

**T3.1 to T3.6.** Integration testing of all clients against the emulator and a production copy, migration rehearsal, old-version tests, bug-fix buffer, store submissions with Apple review time, then the merge of dev into main only after sign-off.

### Track E: Events hardening

Separate from the multi-vendor project, buyer app and panel. All tickets TODO.

**EV-1 Events device and console verification.** Est 2 to 3 h. Acceptance: create an event, import a sheet, claim a ticket, watch the QR rotate, check in by scan and by manual lookup, confirm a double check-in fails, confirm an old screenshot fails, and confirm in the Firebase console that the events functions and rules are the deployed ones.

**EV-2 Merge the delete guard and align the rules.** Est 2 to 4 h. Acceptance: branch feat/events-checked-in-delete-guard is merged in the buyer app, the buyer rules and the panel rules tests agree, and the events rules exist in the canonical rules file (T0.14).

**EV-3 QR replay window.** Est 2 to 4 h. Acceptance: decide the window and skew (today a 30 second window with a skew of 2, so a screenshot can work for a minute or two until the first successful scan); apply the decision; tests updated.

**EV-4 Attendee matching.** Est 2 to 5 h. Acceptance: decide email only or email then phone (the import code matches by email only; the earlier design said phone as backup); implement the decision with tests.

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
- docs/phase-3-foundation.md and the old planning document (../MULTI_VENDOR_SERVICES_PLANNING_PRICING.md) are marked superseded by this file (T0.9). Their old claims are not current.
- There is one production Firebase project and no staging project.
- main keeps changing with store releases while dev is built.
- Unpushed local work: WEB 21 commits, BUYER 33, PANEL 19 (default branches), the vendor app has no remote, and several local-only buyer branches. 2026-11-06 (T0.16): dev and the allowed work branches were pushed for WEB, BUYER and PANEL. main, master and new-bundle were not pushed. The vendor app remote is still PENDING.
- Firestore rules exist in several repos and the portal copy lacks the events block.
- Portal lint errors from the audit are fixed and Vitest covers session and product validation (T0.15). Warnings remain outside those 19 errors.
- Codemagic builds on a push to main in the buyer app.
- The Events delete guard is not on buyer main while the panel tests expect it.
- The QR is valid for a minute or two before the first scan.
- The buyer app prints a payment token prefix at startup.
- 2026-11-06: full payment tokens are printed in the buyer app at payment_service.dart lines 60 and 247 (state report Part E, line 427). S2.12 covers those prints.
- The hardcoded push token is still in functions/services.js.
- 2026-11-06: createdBy and updatedBy on admin products are the hardcoded username ahmedhany1284 (store_screen.dart lines 1122 and 1140, state report Part H item 15).
- 2026-11-06: Storage rules allow wide writes in both repo copies (state report Part F, lines 617 to 618).
- 2026-11-06: governorate handlers in functions/governorates.js are HTTPS onRequest (seven handlers, wired from functions/index.js line 23, state report Part E line 571). The handlers set CORS and do not verify an Auth token before reading or writing.
- The Events attendee import matches by email only.

---

## 9. Changelog

- 2026-10-28: File created from the project chat. Contains the business requirements and decisions agreed so far, the architecture decision that Cloud Functions are the endpoints (D1), the data contract proposals, the endpoint registry, and all tickets with estimates and acceptance criteria. Added tickets T0.0, T0.10, T0.11, S2.10, S2.11, A2.7 and T0.9 from the alignment report.
- 2026-10-29: Setup run on dev. T0.0, T0.1 and T0.1b are done. T0.6v is blocked because fvm 3.44.2 shows Need setup. Consistency findings are listed under T0.11. Nothing pushed.
- 2026-11-01: T0.6 vendor app base created at ../tender_paws_partner on branch dev (16 conventional commits after main seed). Analyze and tests green. Ticket moved to REVIEW. Nothing pushed.
- 2026-11-03: T0.6 Android debug APK and iOS no-codesign Runner.app built successfully. Partner `dev` got Android signing-guard and iOS CocoaPods sync fixes. Ticket T0.6 marked DONE. Nothing pushed.
- 2026-11-03: T0.6f vendor app base polish on partner `dev` (font provenance, display font for headings, design skills local copy, language and emulator host tests, SPM lockfile note). Analyze and 21 tests green. Ticket T0.6f marked DONE. Nothing pushed.
- 2026-11-03: T0.6v re-investigation closed. FVM list Need setup is a metadata display issue (legacy root version file removed since Flutter 3.35; flutter.version.json present). SDK 3.44.2 usable; GO for current development. Ticket T0.6v marked DONE. Flutter modernization epic T0.12 and children T0.12a to T0.12d added (proposed target Flutter 3.47.9 / Dart 3.13.7 as of plan date; re-confirm at T0.12a). Nothing pushed.
- 2026-11-03: Flutter modernization sequence revised to vendor first then buyer with a buyer safety gate. T0.12a DONE: installed Flutter 3.47.9 (Dart 3.13.7) via FVM; kept 3.44.2 for rollback; pinned tender_paws_partner `.fvmrc` to 3.47.9; buyer remains on 3.44.2 until T0.12c. Global FVM default left at 3.44.2. Nothing pushed.
- 2026-11-03: T0.12b vendor migration DONE on tender_paws_partner `dev`. Flutter 3.47.9 / Dart 3.13.7. Analyze clean, 21 tests passed, Android debug APK and iOS no-codesign Runner.app built. Codemagic pin 3.47.9. pub upgrade within constraints; no Dart source changes. Rollback: git `bb643da`, FVM 3.44.2. Waiting for approval before T0.12c. Nothing pushed.
- 2026-11-03: T0.12c buyer assessment DONE (read-only) on tinder_paws `main` `472293c`. Baseline Flutter 3.44.2 / Dart 3.12.2. Analyze 0 errors / 58 warnings / 229 infos; 69 tests passed. Crashlytics wired; production rates inaccessible via available tooling (PENDING owner console export). Engineering thresholds and stop-and-review checkpoint recorded under T0.12c. Buyer source/deps/FVM/CI unchanged. Migration blocked until owner approval. Nothing pushed.
- 2026-11-04: T0.12c-pre consolidated buyer readiness DONE (read-only). Reconfirmed Git: main `472293c`, ahead 32, clean; dev behind by 4. Crashlytics rates still inaccessible (MCP/CLI/gcloud). Limited safety policy locked; engineering gate READY; runtime regression UNAVAILABLE until Console paste. Compatibility matrix and implementation runbook recorded under T0.12c. Buyer code untouched. Waiting for approval to start migration. SoT-only change.
- 2026-11-04: T0.12c buyer migration executed on `feature/flutter-3.47.9-buyer` (`647cd48` from `472293c`). Flutter 3.47.9 / Dart 3.13.7. Analyze 0 errors / 59 warnings / 229 infos; 69 tests passed; Android debug APK and iOS no-codesign OK. Native bumps required by Flutter mins: Gradle 8.14.3, AGP 8.11.1, Kotlin 2.2.20. Codemagic pinned 3.47.9. No push. Soft toolchain “soon dropped” warnings remain. Production Crashlytics rates still unavailable. STOP for CONTINUE or STOP AND REVERT.
- 2026-11-04: T0.12c accepted after post-migration native toolchain audit (AGP/Gradle/Kotlin REQUIRED at Flutter error floors). T0.12d final alignment DONE: vendor `9c96797` and buyer `647cd48` both Flutter 3.47.9 / Dart 3.13.7; Codemagic both 3.47.9; vendor analyze clean + 21 tests + Android/iOS debug OK; buyer 0 errors / 59 warnings / 229 infos + 69 tests + Android/iOS debug OK. Intentional native toolchain differences retained. No app code changes. No device smoke. No production Crashlytics rates. Nothing pushed. Epic T0.12 marked DONE.
- 2026-11-04: T0.12e local consolidation DONE. Fast-forward only onto local `main` for vendor (`9c96797`), buyer (`647cd48`), and portal (`95f5601`). Feature/`dev` branches preserved. Buyer product history retained (33 ahead of `origin/main` locally). Nothing pushed.
- 2026-11-04: T0.12f SoT accuracy cleanup. Current buyer state: local `main` @ `647cd48` (migration commit; base `472293c`). Removed outdated “pending merge” / `main` still at `472293c` wording. Historical feature-branch path preserved. Nothing pushed.
- 2026-11-04: Audit reconciliation (T0.13). Merged main into dev on WEB (`98fd495`, from main `b018b15` and dev `95f5601`) and BUYER (`9d4f357`, from main `647cd48` and dev `505f61f`), and master into dev on PANEL (`6aa4db5`, from master `b510dc8` and dev `5250bf3`). VENDOR APP already matched at `9c96797` and was left unchanged. Nothing pushed. Branch policy updated: main is what is shippable and shipped, dev is the project base, and D14 amends D10 for the T0.12e fast-forward of main. Repo table notes the panel default branch master, the vendor app with no remote, and Flutter 3.47.9 / Dart 3.13.7 on BUYER and VENDOR APP. Index notes for T0.6v (superseded by T0.12), T0.8 (OPEN, see track E), and T0.6p, T0.6c and T0.7 (evidence in chat reports). Added T0.13 to T0.16, Track E (EV-1 to EV-4) and S2.12. Risks updated. New tickets add about 18 to 35 hours. Flutter modernization (T0.12) is done and was outside the original estimate. Total about 550 to 765 hours.
- 2026-11-05: T0.9 stale docs marked superseded. Banner on docs/phase-3-foundation.md. Banner on the parent planning file MULTI_VENDOR_SERVICES_PLANNING_PRICING.md, which is outside this git repo. Bodies kept. Open questions in that planning file were not resolved. Nothing pushed.
- 2026-11-05: T0.11 skills reconciled with this file. Hold case wording, Cloud Function enforcement, vendor types, deploy order, piastres boundary, and the portal BFF scope now match. APP_CONTEXT.txt edited locally and left untracked. Nothing pushed.
- 2026-11-05: T0.15 portal lint and test baseline. The 19 react-hooks/set-state-in-effect errors are gone (`npx eslint . --quiet`). Vitest 3.2.7 added. `npm test` runs 6 tests for session body and product create validation. `npm run typecheck` is clean. Command documented in README.md. Nothing pushed.
- 2026-11-06: BM-1 reconciles the business model with the 2026-11-06 state report and the services spec. D15, D16, D17 and D19 recorded. Section 3A adds AB-1 to AB-17. BR-6.12, BR-7.5 and BR-12.5 added. O19 to O24 added. T0.16 marked DONE with remote tips, and the vendor app remote left PENDING. T0.17, PC-1, PC-2 and PC-3 added. S2.12 widened. docs/parity.md and docs/contracts/README.md added. Workspace rule aligned with D14 and D19.
