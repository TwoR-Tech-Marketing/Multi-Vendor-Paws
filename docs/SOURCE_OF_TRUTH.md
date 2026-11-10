# Tender Paws Multi-Vendor: Source of Truth

Location: docs/SOURCE_OF_TRUTH.md in Multi-Vendor-Paws (authoritative path). Authoritative branch: dev (D16). Local branch after T0.12e was `main`; 2026-11-06: dev is the canonical copy.
Created: 2026-10-28. Last updated: 2026-11-08.

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
10. Decision rule (BM-3, 2026-11-08): Core business model items (money, pricing, legal, scope, dates) are decided by the owner. Everything else is decided by best practice and marked [DECIDED, best practice]; the owner may override later through a BM ticket.

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
- Environments [DECIDED as D18, 2026-11-06]: O7 closed. Use the Firebase emulator suite now (demo-tenderpaws). A staging Firebase project is later, only if the budget allows. Tickets never write to production for tests. Commands: docs/emulator.md and tinderpaws_panel/functions/EMULATOR.md.

### 1.2 Repositories

All are siblings under /Users/ahmedhany/Documents/studioProjects/TWOR/TenderPaws.

| Key | Folder | What it is | Default access |
|---|---|---|---|
| WEB (home) | Multi-Vendor-Paws | Next.js vendor web portal. Holds this file, contracts and the parity table | Editable |
| BUYER | tinder_paws | Flutter buyer mobile app. Flutter 3.47.9 and Dart 3.13.7 | Read only unless the ticket says so. Never switch branches or stash there |
| PANEL | tinderpaws_panel | Flutter web admin panel plus Cloud Functions (functions/). Default branch is master, not main | Read only unless the ticket says so |
| VENDOR APP | tender_paws_partner | Flutter vendor mobile app (base from T0.6). Exists at tender_paws_partner. 2026-11-08 (P-BATCH2): remote https://github.com/TwoR-Tech-Marketing/tender_paws_partner.git exists; `dev` and work branches pushed. `main` not pushed. Branches main and dev at 9c96797. Flutter 3.47.9 and Dart 3.13.7 | Editable |

Fifth folder (T0.18, 2026-11-10): `tenderpaws-landing-client-web` also sits in the parent folder (own git repo, Firebase config). It is out of scope for this project's agents and was left untouched.

Portal hosting (2026-11-08, Week 2 Step 0, read only): the portal is a Next.js App Router app. Docs (`docs/production-security.md`) describe production secrets for **Vercel** (or equivalent Node host): `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, plus client `NEXT_PUBLIC_FIREBASE_*`. Local env is `.env.local` / `GOOGLE_APPLICATION_CREDENTIALS`. Repo `firebase.json` has Firestore rules/indexes and Storage rules only (no Hosting target). No `.vercel` project link in the tree. Vendors are **not** confirmed to use a live production portal URL today; first production cutover is a new surface. Admin panel hosting remains Firebase Hosting in PANEL. Deploy waves live in `~/Downloads/DEPLOY_PLAN.md`.

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
  - 2026-11-08 (BM-3, D27): doctor is added as a vendor type for telehealth. One vendor type per account (D28).

### BR-2 Vendor lifecycle and validation
- 2.1 [DECIDED, from code] Signup creates an enabled Auth user and a vendor_signup_requests document (pending). The vendors/{uid} document is created on approval.
- 2.2 [DECIDED, from code] The admin approves, rejects, suspends and bans through functions (vendor_signup-reviewVendorSignupRequest, vendors-suspendVendor, vendors-banVendor).
- 2.3 [DECIDED] Admin validation protects buyers. Store vendors need no documents (confirmed with the owner).
  - 2026-11-08 (BM-3): superseded by D25. Documents are required for every vendor type, shops included. The admin defines the list per type. Existing approved vendors get 30 days to upload.
- 2.4 [OPEN] Do clinics and groomers upload documents? The old planning document requires a tax registration and a license.
  - 2026-11-08 (BM-3): superseded by D25 (same rule for all vendor types). The exact document list per type stays an owner detail for the admin to enter (DOC-1).
- 2.5 [DECIDED] Account gates in both vendor clients: active, pending, rejected, suspended, banned, not a vendor. [AS-BUILT] The code does not store those six names as statuses. Mapping from the state report Part E vendor status table (lines 471 to 478). BR-2.5 is unchanged.

  | Gate in BR-2.5 | What is stored | Session kind |
  |---|---|---|
  | active | vendors.status = active | active |
  | pending | Signup request status pending, or a vendor user who is neither active nor currently restricted | pending |
  | rejected | Signup request status rejected; Auth user kept (D28 / S1.1) | rejected |
  | suspended | vendors.status = suspended and users.accountStatus = suspended (not a ban) | suspended |
  | banned | Not a status string. isBanned true while status stays suspended | banned |
  | not a vendor | No vendor session. A user document with another role is mobile_app_account | not_vendor, or mobile_app_account |
  - 2026-11-08 (BM-3, D28): rejected applicants keep their account, see a required reason, may reapply (changes AB-2 in S1.1). Pending vendors see status, profile, settings, notifications (O20). Banned gets its own gate/kind in S1.1 (changes AB-4).
  - 2026-11-08 (S1.1): table above matches shipped callable kinds in portal and vendor app.
- 2.6 [RECOMMENDED] A suspension, temporary or permanent, keeps the Auth account enabled so the vendor sees the status and the reason. Only a ban disables it. Today a permanent suspend disables Auth.
  - 2026-11-08 (BM-3, D28): decided [DECIDED, best practice]. Suspension keeps login enabled; only a permanent ban disables login. Answers O5.
- 2.7 [DECIDED] Pending vendors cannot use products, orders or earnings.

### BR-3 Store catalog and orders
- 3.1 [DECIDED, from code] Vendor products live in top-level products/{id} with vendorId. The legacy store path is still read by older app versions.
- 3.2 [DECIDED, from code] Product status: active, inactive, out_of_stock, archived.
- 3.3 [DECIDED] Vendors cannot create Halo items. The admin creates them in the admin panel.
- 3.4 [DECIDED, from code] Buyer orders are split into one vendor order per vendor.
  - 2026-11-08 (BM-3, D20): single-vendor cart (Talabat/Breadfast style). Halo is TenderPaws' own store. createOrder rejects mixed carts. orders_split remains only for old app versions until the forced update.
- 3.5 [DECIDED] The platform takes its fee on orders from the vendor. [OPEN] Whether the commission base includes the vendor's delivery fee. [AS-BUILT] orders_split already includes the delivery fee in the commission base (state report Part E, orders_split.js lines 322 to 327, and Part H item 6). O8 stays open.
  - 2026-11-08 (BM-3, D22): fees apply to items only, never delivery. Delivery fee goes 100 percent to the vendor. Gateway fee absorbed inside TenderPaws' fee. Default 10 percent when no deal. Answers O8 and O9. AB-6 fixed in DL-1.

### BR-4 Delivery coverage (store vendors only)
- 4.1 [DECIDED] Delivery applies to store vendors only. Hotels, clinics, groomers and trainers have no delivery zones.
- 4.2 [DECIDED] The buyer location comes from the device location service (lat, lng), with a manual map picker if permission is denied. The app needs it before browsing.
- 4.3 [DECIDED] A vendor chooses exactly one coverage mode: a zone {lat, lng, radiusMeters} or a list of governorate ids. Zone is the basic mode. No combined mode.
- 4.4 [DECIDED] Buyers only see the vendor items they are eligible for. Eligibility is computed on the server and checked again at checkout.
- 4.5 [DECIDED] Halo keeps the rule category to governorate, by id, fail closed. It applies to Halo only.
- 4.6 [DECIDED] Governorates are referenced by a stable id, never by name. One canonical list with nameEn and nameAr. The buyer's governorate is resolved from lat and lng with boundary data, name aliases only as a fallback.
  - 2026-11-08 (S1.2 Gate B): official list and boundaries are geoBoundaries gbOpen Egypt ADM1 (full GeoJSON). Licence ODbL 1.0. Closes O16.
- 4.7 [DECIDED] Delivery fee: optional, per vendor, set by the admin only, hidden from the vendor portal and vendor app, added to the order total, and it belongs to the vendor. Halo keeps its governorate based fees.
- 4.8 [OPEN] What a buyer sees before choosing a location, and what happens to the cart when the location changes.
- 4.9 [RECOMMENDED] Eligibility: a function returns the eligible vendor ids for the buyer location, then the app queries those vendors plus Halo. Coverage is not copied onto products.
  - 2026-11-08 (BM-3, D28): decided [DECIDED, best practice]. Answers O3.

### BR-5 Halo
- 5.1 [DECIDED] Halo items are sold by the platform under seller id platformVendor. They are separate from vendor items.
- 5.2 [DECIDED] Halo items are created only in the admin panel and are not affected by vendor suspension.
- 5.3 [RECOMMENDED] Halo is defined only by seller id platformVendor, which is what the buyer app uses. The isHalo field is no longer written or read, and kept in documents for compatibility.
  - 2026-11-08 (BM-3, D28): Halo by platformVendor only [DECIDED, best practice]. Answers O1.
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
  - 2026-11-08 (BM-3, D28): no answer in 48 hours confirms no-show (O21); arrived late returns to the provider (O22); report an issue opens an admin support case (O23).
- 6.9 [DECIDED] Reviews: 1 to 5 on cleanliness, waiting time and doctor efficiency, plus tags (friendly doctor, clean clinic, long waiting time, clear explanation, good with nervous pets). Only for completed appointments, one per appointment. The admin can delete a review. [OPEN] Groomer categories and tags, provider replies, review editing.
  - 2026-11-08 (BM-3, D28): groomers use grooming quality, pet handling, punctuality with own tags (O14). Provider replies once; buyer edits within 7 days; admin deletes.
- 6.10 [OPEN] Slot length (fixed or per service), capacity per slot, minimum notice, booking window, home visit price and area, cancellation windows, who may reschedule and how often, decline reason and reapply, whether one account can hold two vendor types.
  - 2026-11-08 (BM-3, D28): booking defaults [DECIDED, best practice]. Slot length per service (default 30 minutes), capacity 1 unless raised, minimum notice 2 hours, window 30 days, buyer reschedules once up to 12 hours before, provider sets home visit fee and radius. One vendor type per account. Answers O12.
- 6.11 [OPEN] Services need a location for discovery. Whether to sort or filter by distance.
  - 2026-11-08 (BM-3, D28): discovery sorted by distance [DECIDED, best practice].
- 6.12 [DECIDED] Provider dashboard: number of visits, a chart of each service's share, number of new patients, an overall rating from 1 to 5, and a rating per category. The admin can delete a review (services spec section 2.8). Which parts are for the provider and which are for the admin is [OPEN] (O24).
  - 2026-11-08 (BM-3, D28): providers see their own numbers; admin sees all plus moderation. Answers O24.

### BR-7 Deals and billing
- 7.1 [DECIDED] Per provider the admin sets a deal: fixed subscription, percentage, or both.
  - 2026-11-08 (BM-3, D22): deals are per branch with apply-to-all; types are fixed fee per order and/or percentage of item value; no vendor subscription product. Vendors without branches have one deal.
- 7.2 [DECIDED] The percentage is taken after the coupon. The balance is live, through an append-only earnings ledger (sale, refund, adjustment, payout).
  - 2026-11-08 (BM-3, D21): every buyer payment goes to TenderPaws; vendors and doctors are paid net on a weekly or monthly cycle set per vendor by the admin; payouts are manual ledger entries; vendors see a statement; vendors pay nothing upfront.
- 7.3 [DECIDED] Subscription shows amount, start date, renewal date, payment status and grace period. The period is monthly or annual (services spec section 2.10).
  - 2026-11-08 (BM-3, D21): superseded. No vendor subscriptions in this model.
- 7.5 [AS-BUILT] Default commission is 10 percent, with per-vendor overrides in commissionConfig/main written by setVendorCommission (state report Part E, vendors.js lines 707 to 756, and Part H item 14, vendors.js line 14). How this relates to the BR-7.1 deal model is [OPEN] (O19).
  - 2026-11-08 (BM-3, D22): answered by D22. Keep 10 percent as default when no deal is set (O19).
- 7.4 [OPEN] Who collects the patient payment, payout schedule and method, how the fixed fee is collected and what happens after the grace period, whether a deal applies per provider or per branch.
  - 2026-11-08 (BM-3, D21, D22): TenderPaws collects; payout cycle weekly or monthly per vendor; fixed fee is per order on items; deal applies per branch (apply-to-all option).

### BR-8 Payments and refunds
- 8.1 [DECIDED] Payments run in the mobile app: Apple in-app purchase for digital goods (for example subscription plans), the Fawaterak webview for everything else.
  - 2026-11-08 (BM-3, D26): Apple digital goods only via in-app purchase. Android: Play Billing or Fawaterak by remote switch. Physical goods, appointments and telehealth via Fawaterak (verify Apple one-to-one services rule before release).
- 8.2 [DECIDED] Refunds are manual through support. The admin marks refunded, which writes a ledger refund entry and reverses points.
- 8.3 [DECIDED] Taxes depend on the payment method and are handled with the payment integration. Store gross, discount, paid amount, fee, net, method and gateway reference on every payment so taxes can be added later.
- 8.4 [OPEN] Who pays the Fawaterak gateway fee. Whether the telehealth chat counts as a digital good for Apple (not verified).
  - 2026-11-08 (BM-3, D22): gateway fee absorbed inside TenderPaws' fee (answers O9). Telehealth is a live service paid via Fawaterak under D26/D27 (not treated as an Apple digital good in this model; verify before release).

### BR-9 Suspension and holds
- 9.1 [DECIDED] The admin chooses when suspending: hidden (the vendor's items are not shown anywhere) or view_only (items shown as unavailable, ordering blocked in the UI and enforced at checkout on the server).
- 9.2 [DECIDED] The mode is stored on the vendor, not on each product, so lifting a suspension restores everything with no product writes.
- 9.3 [DECIDED] Open orders go on hold and a hold case with them goes to the admin. Clinics and groomers behave the same way with appointments.
- 9.4 [OPEN] How a hold case is resolved (cancel, refund through support, reassign), what the buyer is told, the default mode for a ban.
  - 2026-11-08 (BM-3, D28): hold cases [DECIDED, best practice]. Admin chooses per case: cancel and refund, or release; buyer sees a neutral on-hold message. Answers O10.

### BR-10 Telehealth
- 10.1 [OPEN] Spec only: price 200 (currency assumed EGP), checkout, then a chat with a doctor account. Scope not decided. Open: who the doctors are, what the payment buys, how 24/7 is covered, doctor pay, photos and videos.
  - 2026-11-08 (BM-3, D27): telehealth in scope. Doctor vendor type; admin-configurable price; one payment per chat; queue with 15-minute timeout then support/manual refund; photos yes, video no; reuses buyer chat; doctors paid via deals and payouts. Doctor pay terms remain an owner detail.

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
  - 2026-11-08 (BM-3): add telehealth chats and payout notifications for vendors; buyer prompts keep no-show, visit completed, and review request. Exact wording remains best practice for implementers.

### BR-14 Compatibility and release
- 14.1 [DECIDED] Production stays on main until everything is done. Changes to shared data are additive until the forced update.
- 14.2 [RECOMMENDED] Force an update after the new version is live in both stores, using the existing version/config switch and a remote flag. The current check hard-blocks when the latest major is higher or the minor or patch is more than 1 ahead.
  - 2026-11-08 (BM-3, D28): forced update after both stores have the new version [DECIDED, best practice]. Answers O2. Token rotation order for SEC-1 answers O25 (function, app update, enough users, then rotate).
- 14.3 [RECOMMENDED] After the forced update, rules deny direct client order creation and orders are created by a function (S2.11).
- 14.4 [DECIDED] Migrations are idempotent scripts, rehearsed on a copy of production data.

### BR-15 Quality and security
- 15.1 [DECIDED] No keys, tokens or personal data in source or logs.
- 15.2 [OPEN] Verify the live Firestore and Storage rules in the Firebase console. The repo rules look wide open and may not be deployed.
- 15.3 [DECIDED] Remove the hardcoded device push token in tinderpaws_panel/functions/services.js (A2.7).
- 15.4 [DECIDED, BM-2] Firebase client `apiKey` values in the buyer `lib/firebase_options.dart` (FlutterFire generated) are client identifiers, not secrets. Protection comes from Firestore and Storage rules (T0.14) and App Check where enabled. No rotation ticket for those keys.

---

## 3A. As built register

[AS-BUILT] records what the code does when the model was silent (D17). It is not a decision. Source: state report Part H, "The model is silent and the code already chooses" (lines 673 to 691), checked against Part E.

| Id | What the code does | Evidence | Linked | Fate | Ticket |
|---|---|---|---|---|---|
| AB-1 | Ban is stored as vendors.status suspended plus isBanned true. users.accountStatus is suspended. | Part H item 1. Part E lines 446 to 451 | BR-2.5, O5 | Keep storage; show a separate banned screen | S1.1 |
| AB-2 | Reject sets the signup request to rejected and deletes the Auth user. There is no rejected session. | Part H item 2. Part E lines 434 to 435 | BR-2.5, O5 | Done (S1.1): keep Auth, rejected kind, required reason, reapply callable | S1.1 |
| AB-3 | A permanent suspend disables Auth. A temporary suspend does not. A permanent ban disables Auth. A temporary ban does not. | Part H item 3. Part E lines 441 to 443 and 447 to 448 | BR-2.6, O5 | Change: only a permanent ban disables login (D28) | S1.2 |
| AB-4 | The portal folds ban and suspend into one session kind, suspended. | Part H item 4. Part E lines 462 and 468 | BR-2.5 | Done (S1.1): `banned` is its own kind in portal and vendor app | S1.1 |
| AB-5 | Pending vendors may open settings, profile and notifications. Products, orders, earnings and the dashboard sit behind ActiveVendorGuard. | Part H item 5. Part E line 469 | BR-2.7, O20 | Keep (D28) | Done |
| AB-6 | Commission uses subtotal plus a split of the delivery fee, minus a split of the discount. | Part H item 6. orders_split.js lines 322 to 327 | BR-3.5, O8 | Change: items only (D22) | DL-1 |
| AB-7 | Checkout delivery fee is one global document, delivery_fees/const_fees, and falls back to 70. | Part H item 7. Part E lines 529 to 532 | BR-4.7 | Change: per-vendor fee, explicit error if missing | S2.3 |
| AB-8 | A second fee table, settings/delivery_fees, is keyed by governorate name and falls back to 30. No static caller was found. | Part H item 8. Part E lines 533 to 534 | BR-4.7 | Remove | S2.3 |
| AB-9 | Governorates are matched by the name string. The document id is used after that match. | Part H item 9. Part E lines 494 to 495 and 534 | BR-4.6, O16 | Change: ids only, migration | S1.2, S2.3 |
| AB-10 | Admin-created products do not set vendorId or isHalo. | Part H item 10. store_screen.dart lines 1112 to 1143 | BR-5.4 | Fix: stamp platformVendor | A2.3, S2.8 |
| AB-11 | The buyer Halo path filters vendorId == platformVendor and also maps isHalo onto the item. | Part H item 11. Part E lines 507 to 514 | BR-5.3, O1 | Keep vendorId only, stop using isHalo (D28) | S2.8 |
| AB-12 | The buyer client creates orders. | Part H item 12. orders_service.dart line 126 | BR-14.3, S2.11 | Change: server createOrder, rules deny client writes | S2.11, CART-1 |
| AB-13 | Subscription plans use a Fawaterak token path. No Apple in-app purchase package was found under buyer lib. | Part H item 13. main.dart lines 18 to 26 | BR-8.1, S2.10 | Change: Apple in-app purchase; Android switch (D26) | S2.10 |
| AB-14 | Default commission is 10 percent in vendors.js line 14, with per-vendor overrides in commissionConfig/main. | Part H item 14. vendors.js lines 707 to 756 | BR-7.5, O19 | Keep as default for vendors without a deal (D22) | DL-1 |
| AB-15 | createdBy and updatedBy on admin products are the literal username ahmedhany1284. | Part H item 15. store_screen.dart lines 1122 and 1140 | BR-5.4 | Change: the signed-in admin's id | A2.3 |
| AB-16 | Legacy service_request statuses differ from the appointment status list, and those triggers are not in functions/index.js. | Part H item 16. Part E lines 503 and 555 | BR-6.7 | Confirm not deployed, then retire; replaced by the appointments engine | S1.10, A2.7 |
| AB-17 | The workspace rule forbade commits to main, while D14 and the git history show main was fast-forwarded in T0.12e. | Part H item 17 | D14. Wording aligned in this ticket | Fixed by BM-1 (D14, D19) | Done |
| AB-18 | Panel and buyer read and write governorates through the Firestore SDK, not the HTTPS `governorates-*` functions. WEB and VENDOR APP have no HTTPS callers. | GOV-1 audit: `GovernorateRepository`, `DeliveryValidationService`; grep of Multi-Vendor-Paws and tender_paws_partner | BR-4.6, risk 1 | Keep; HTTPS mutates locked in GOV-1; Firestore writes protected by rules in T0.14 | GOV-1, T0.14 |

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
| D9 | 2026-10 | Store vendors need no documents. Superseded by D25 (2026-11-08). |
| D10 | 2026-10 | Branch policy: production on main, all work on dev, merge at the end. No early fixes. |
| D11 | 2026-10 | Phases: 0 setup, 1 portal and vendor app together, 2 buyer app and admin panel, 3 testing and release. |
| D12 | 2026-10 | The vendor app mirrors tinder_paws structure, including the user repository with a stream. It is built first as a base, then authentication. |
| D13 | 2026-10 | The buyer location comes from the device location service. |
| D14 | 2026-11-04 | D10 amended. main is what is shippable and shipped (store releases, Shorebird patches, and the Flutter 3.47.9 upgrade on its own track, T0.12). dev is the base for the multi-vendor project in every repo. Feature branches are feature/<ticket>-<slug> from dev and merge into dev. Merge main into dev regularly and log it. dev merges into main only when the multi-vendor release is signed off. T0.12e fast-forwarded main in WEB, BUYER and VENDOR APP on purpose, which replaced the earlier rule never to commit to main for that work. |
| D15 | 2026-11-06 | Vendor features that carry business rules are served by shared Cloud Functions in tinderpaws_panel/functions, used by both the portal and the vendor app. Existing portal BFF features (products, orders, profile, earnings) move to shared functions inside the ticket that touches them. This resolves the [CONFIRM] that was on the portal BFF in section 1.1. |
| D16 | 2026-11-06 | docs/SOURCE_OF_TRUTH.md on WEB dev is the only canonical business model. Any other summary is derived from it and is never edited by hand. |
| D17 | 2026-11-06 | Business model changes run as BM-n tickets. Choices the code already made without a business rule are recorded in section 3A with AB ids and the mark [AS-BUILT]. [AS-BUILT] means this is what the code does, not that it was decided. |
| D18 | 2026-11-06 | O7 decided. Test with the Firebase emulator suite and project id demo-tenderpaws. A staging Firebase project is later, only if the budget allows. No ticket tests write to production. |
| D19 | 2026-11-06 | GitHub account ahmedhany1284. Git and the gh CLI are used as that user. Never log in, never change accounts, and never print or copy tokens or credentials. Allowed pushes are dev and work branches (feature/*, fix/*, feat/*, backup/*) only. Never push main or master, because Codemagic builds the buyer app on a push to main. Never force push, never delete remote branches, never push tags, and never open or merge pull requests. Before pushing a branch that already exists on origin, the remote tip must be an ancestor of the local tip. If it is not, stop and ask. |
| D20 | 2026-11-08 | Single-vendor cart, like Talabat and Breadfast. A cart holds items from one store only; adding from another store asks to clear the cart. Halo is TenderPaws' own store. createOrder rejects mixed carts. orders_split stays for old app versions until the forced update. |
| D21 | 2026-11-08 | Money flow. Every buyer payment goes to TenderPaws through the app. Vendors of every type, doctors included, are paid their net on a payout cycle set per vendor by the admin (weekly or monthly). Payouts are manual transfers recorded as payout entries in the ledger. Vendors see a statement. Vendors pay nothing upfront: no vendor subscriptions. |
| D22 | 2026-11-08 | Deals. Set per branch, with an apply-to-all-branches option; vendors without branches have one deal. Types: fixed fee per order (same amount whatever the order size), percentage of item value, or both. Fees apply to items only, never to delivery; the delivery fee is per vendor and goes 100 percent to the vendor. The payment gateway fee is absorbed inside TenderPaws' fee (vendor net = items minus deal fees). A vendor with no deal pays the 10 percent default. |
| D23 | 2026-11-08 | Coupons. Admin coupons funded by TenderPaws (vendor paid on the full price). Vendor coupons funded by the vendor (fees on the discounted price). One coupon per checkout; every coupon has an expiry and a per-user limit. Vendors create their own coupons in the portal and the vendor app. |
| D24 | 2026-11-08 | Points. A TenderPaws program, not per vendor. 1 point per EGP paid on any purchase (floor of paid piastres / 100). Each point expires 12 months after it is earned. Reversed on refund. Redemption out of this release (later: vendor partnerships, TenderPaws funding, or Halo items). |
| D25 | 2026-11-08 | Documents required for every vendor type, shops included. The admin defines the required list per vendor type in the panel. Existing approved vendors keep selling and get 30 days to upload. Supersedes D9. |
| D26 | 2026-11-08 | Payments. Apple: every digital good (subscription plans, stickers, any digital item) only through in-app purchase. Android: Google Play Billing or Fawaterak, chosen by a remote switch per platform (Google policy may require Play Billing; the switch turns Fawaterak off without a build). Physical goods, appointments and telehealth chats use Fawaterak (Apple allows other methods for live one-to-one services; verify before release). Refunds stay manual through support. |
| D27 | 2026-11-08 | Telehealth in scope. Doctor is a vendor type using the portal and the vendor app with a chat inbox. Price configurable by the admin. One payment buys one chat; when the doctor ends it, a new chat needs a new payment. A paid chat enters a queue, any available doctor accepts; no acceptance in 15 minutes flags it to support for a manual refund. Photos allowed, no video. Reuses the buyer app chat. Doctors paid through deals and payouts. |
| D28 | 2026-11-08 | Best-practice defaults [DECIDED, best practice]: suspension keeps login enabled, only a permanent ban disables it (O5); rejected applicants keep their account, see a required reason, may reapply; pending vendors see status, profile, settings, notifications (O20); one vendor type per account; Halo by platformVendor only (O1); booking defaults (O12); no-show 48 hours (O21); arrived late (O22); report an issue (O23); groomer labels (O14); review reply and edit rules; dashboard split (O24); hold cases (O10); discovery by distance; forced update (O2); token rotation order (O25); eligibility function (O3); percentages round half up, calendar weeks start Saturday, Western digits (O17). |
| D29 | 2026-11-08 | Release plan: weeks 1 to 4 vendor portal and vendor app, week 5 buyer and admin, weeks 6 to 8 extension. Weekly checkpoint. Week 1 starts 2026-11-09. |


Open, with a recommendation where one exists

Still open (BM-3, 2026-11-08)

| Id | Question | Who decides | Blocks |
|---|---|---|---|
| Owner | Which documents each vendor type must upload | Owner, entered by admin in the panel | DOC-1 go-live, not the build |
| Owner | How doctors are paid (fixed per chat, percentage, or both) | Owner, set as each doctor's deal | TH-1 go-live |
| Owner | Subscription plan prices in the stores | Owner | S2.10 store setup |
| O6 | Scope against the planning document, including the admin mobile app and the phase split | Owner | Nothing now; assumed no admin mobile app |
| O15 | Buyer view before a location is chosen, cart on location change | Developer | S2.1, S2.2 |
| O16 | Official governorate list, boundary data and licence | answered by S1.2 Gate B (geoBoundaries EGY ADM1, ODbL 1.0, best practice) |
| O18 | Which data the vendor app streams from Firestore and which goes through functions | Developer | Per ticket |

Answered (kept for traceability)

| Id | Question | Answered by |
|---|---|---|
| O1 | What isHalo means | answered by D28 |
| O2 | Old versions | answered by D28 |
| O3 | Eligibility approach | answered by D28 |
| O4 | Clinic and groomer documents | answered by D25 |
| O5 | Suspension and the Auth account | answered by D28 |
| O16 | Official governorate list, boundary data and licence | answered by S1.2 Gate B |
| O7 (D-ENV) | Environment: emulator suite only, or a second staging Firebase project | answered by D18 |
| O8 | Does the commission base include the delivery fee | answered by D22 |
| O9 | Who pays the Fawaterak fee | answered by D22 |
| O10 | Hold case resolution and buyer messaging | answered by D28 |
| O11 | Telehealth scope and Apple treatment | answered by D27 (scope); doctor pay remains an owner detail |
| O12 | Slots, capacity, notice, cancellation, reschedule, home visit price | answered by D28 (cancellation stays manual per D8) |
| O13 | Points base, expiry, redemption value, who funds coupons, coupon limits | answered by D23, D24 |
| O14 | Groomer review labels and tags | answered by D28 |
| O17 | Percentage rounding mode, calendar week start day, Arabic numerals | answered by D28 |
| O19 | How the existing 10 percent commission and per-vendor overrides relate to the BR-7.1 deal model | answered by D22 |
| O20 | Which screens a pending vendor may open | answered by D28 |
| O21 | What happens on a no-show when the buyer never answers | answered by D28 |
| O22 | Whether the answer "arrived late" reopens the appointment | answered by D28 |
| O23 | What "report an issue" creates and who handles it | answered by D28 |
| O24 | Which dashboard parts are for the provider and which are for the admin | answered by D28 |
| O25 | When to rotate the Fawaterak tokens relative to old app versions | answered by D28 |

Events decisions (alignment 7.3), kept under Track E

- Is Events live in the current store version?
- QR replay window: shorten the skew or accept one to two minutes of exposure before the first scan (EV-3).
- Attendee matching: email only (code) or email then phone (original design) (EV-4).

---

## 5. Data contracts

Locked by T0.5 (2026-11-06). Canonical files: docs/contracts/*.md. Money is integer piastres. Field names follow what the code already stores (state report Part E) unless a ticket below changes them. Existing collections often use camelCase on vendor docs and mixed snake_case on users.

Summary (details in the contract files):

- vendors/{uid}: locked live fields in docs/contracts/vendors.md. vendorType, suspension.mode, deliveryCoverage locked by S1.2 / S1.3. suspension.mode Auth behavior answered by D28 (O5).
- vendor_signup_requests/{id}: status pending, approved, rejected. docs/contracts/signup.md.
- vendorAdminSettings/{vendorId} (new): deliveryFeePiastres. Admin and functions only. Introduced with A2.2.
- vendorDeals/{vendorId} (new): deal fields. Relation to commissionConfig answered by D22 (O19). See docs/contracts/deals.md (stub until DL-1).
- governorates/{id}: id is stable. name live. nameEn, nameAr in S1.2. O16 blocks official list. docs/contracts/governorates.md.
- products/{id}: docs/contracts/products.md. Halo is vendorId platformVendor.
- orders and vendorOrders: docs/contracts/orders.md. createOrder after S2.11.
- vendors/{id}/branches/{branchId} (new): S1.8. Not locked beyond the BR-6.2 field list.
- appointments/{id} (new): S1.10. Status list decided. Transitions remain [CONFIRM] under BR-6.7 until S1.10.
- appointmentReviews/{id} (new): S2.7 / S1.12. Groomer tags answered by D28 (O14).
- pointsLedger/{id} (new): S2.6 / PTS-1. Base and expiry answered by D24 (O13). See docs/contracts/points.md (stub).
- holdCases/{id} (new): docs/contracts/suspension-holds.md. Resolution answered by D28 (O10).
- earnings ledger: docs/contracts/earnings.md.
- Session: docs/contracts/vendor-session.md (vendor_session-resolveVendorSession).

Remaining [CONFIRM] outside contracts: BR-1.5 admin mobile app (O6). BR-6.7 appointment transitions (S1.10).

---

## 6. Endpoint registry (Cloud Functions)

Existing in tinderpaws_panel/functions: vendor_signup-reviewVendorSignupRequest, vendors-suspendVendor (extend with mode), vendors-banVendor, orders_split, service_request, services. Planned endpoints below. Type is callable unless noted. Status values as in section 0.

| Name | Caller | Purpose | Ticket | Status |
|---|---|---|---|---|
| vendor_session-resolveVendorSession | Vendor portal and vendor app | Shared session kind and profile (includes `banned` and `rejected`) | T0.6b, S1.1 | DONE |
| vendor_signup-reapplyVendorSignupRequest | Rejected applicant (portal, vendor app) | Edit signup fields and return request to pending | S1.1 | DONE |
| vendor_signup-reviewVendorSignupRequest | Admin | Approve or reject; reject keeps Auth and stores reason (default if empty) | existing, S1.1 | LIVE; reject behavior updated in S1.1 |
| resolveBuyerEligibility | Buyer | From lat and lng return governorate id/names, resolution, eligible vendor ids with orderable flags, Halo rule | S1.2, S2.2 | DONE (S1.2; not wired in live buyer yet) |
| suspendVendor (extended) | Admin | Suspend with mode, hold open orders, create hold case; Auth stays enabled | S1.2, A2.1 | DONE (S1.2) |
| createOrder | Buyer | Create an order with eligibility, fees, coupon and piastres checked on the server; single-vendor check (D20) | S2.11, CART-1 | TODO |
| unsuspendVendor | Admin | Lift a suspension and release holds (also via shouldSuspend false) | A2.1 | DONE via suspendVendor in S1.2 |
| setVendorDeliveryFee | Admin | Set the admin-only delivery fee | A2.2 | TODO |
| vendors-setVendorDeal | Admin | Set vendorDeals/{vendorId} (type, fixed, percentage, apply to all, history) | DL-1, A2.5 | DONE (2026-11-08) |
| registerVendorFcmToken | Vendor | Register the push token of a vendor device | S1.6 | TODO |
| vendors-setVendorDeliveryCoverage | Store vendor | Save deliveryCoverage (zone or governorates) | S1.3 | DONE |
| vendors-getVendorDeliveryCoverage | Vendor | Read own coverage | S1.3 | DONE |
| vendors-listGovernoratesForCoverage | Vendor | Active governorate options for picker | S1.3 | DONE |
| vendor_products-list/get/create/update/archive/setStatus | Portal + vendor app | Shared product CRUD; portal flag default BFF | S1.4 | DONE |
| vendor_orders-list/get/updateStatus | Portal + vendor app | Shared orders; held locked; portal flag default BFF | S1.5 | DONE |
| Shared earnings, profile, settings callables | Portal and vendor app | Remaining D15 moves | S1.6, PC-2, PC-3 | TODO |
| vendor_documents-setVendorDocumentRequirements | Admin | Define required docs per vendor type | DOC-1 | DONE |
| vendor_documents-submitVendorDocument | Vendor | Record uploaded document metadata | DOC-1 | DONE |
| vendor_documents-reviewVendorDocument | Admin | Approve or reject a document | DOC-1 | DONE |
| vendor_documents-getVendorDocumentRequirements | Vendor or admin | Read requirements for a vendor type | DOC-1 / fix/W1-cleanup | DONE |
| vendor_documents-getMyVendorDocuments | Vendor | Own requirements + documents (no client Firestore) | DOC-1 / fix/W1-cleanup | DONE |
| vendor_documents-listVendorsMissingDocuments | Admin | Active vendors missing required docs + deadline | DOC-1 / fix/W1-cleanup | DONE |
| Vendor coupons create and manage | Vendor, admin | Vendor and admin coupons | VC-1 | TODO |
| Payout recording and statements | Admin, vendor | Record payouts and vendor statements | PAY-1 | TODO |
| Points award, expiry, reversal | System | Points ledger after payment, expiry, refund reversal | PTS-1 | TODO |
| Telehealth: start paid chat, accept, end, queue timeout | Buyer, doctor, system | Paid telehealth chat lifecycle | TH-1, TH-2 | TODO |
| Store purchase verification (Apple, Google) and notifications | System | Verify in-app purchases and notify | S2.10 | TODO |
| Fawaterak gateway calls with the token as a secret | Buyer | Payment gateway via server secret (no client token) | SEC-1 | TODO |
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
| governorates-getAllGovernorates | Open HTTPS | List governorates | GOV-1 | LIVE; auth open (GOV-1) |
| governorates-getCategoryGovernorates | Open HTTPS | List governorates for a category | GOV-1 | LIVE; auth open (GOV-1) |
| governorates-validateOrderDelivery | Open HTTPS | Validate cart items against a governorate name | GOV-1 | LIVE; auth open (GOV-1). Live buyer uses Firestore instead (AB-18) |
| governorates-createGovernorate | Admin HTTPS Bearer | Create governorate | GOV-1 | LIVE; admin Bearer required (GOV-1) |
| governorates-updateGovernorate | Admin HTTPS Bearer | Update governorate | GOV-1 | LIVE; admin Bearer required (GOV-1) |
| governorates-deleteGovernorate | Admin HTTPS Bearer | Delete governorate | GOV-1 | LIVE; admin Bearer required (GOV-1) |
| governorates-assignCategoryGovernorates | Admin HTTPS Bearer | Replace category governorate assignments | GOV-1 | LIVE; admin Bearer required (GOV-1) |

service_request.js and services.js are in the repo and are not required by functions/index.js. Deployment is UNKNOWN (state report Part E, lines 555 to 556).

---

## 7. Tickets

Estimates are focused hours for one developer using Cursor, roughly plus or minus 35 percent. 2026-11-08 (BM-3): total roughly 600 to 850 hours including DL-1, CART-1, DOC-1, VC-1, PTS-1, PAY-1, TH-1 to TH-3 and GOV-1, against a 5-week plan with a 2 to 3 week extension (D29). Weekly checkpoints decide cuts early. Earlier running notes: about 572 to 800 hours after BM-1; BM-1 and BM-2 and BM-3 themselves are documentation and are not added again as build hours.

### Index

Phase 0: setup

| Id | Title | Repos | Est (h) | Status |
|---|---|---|---|---|
| T0.0 | Install this file and its rule in the portal | WEB | 1 to 2 | DONE |
| T0.1 | Create dev branches in the three existing repos | WEB, BUYER, PANEL | 0.5 | DONE |
| T0.1b | Workspace context rule in the portal | WEB | 0.5 | DONE |
| T0.2 | Impeccable design skill in the portal | WEB | 1 | DONE (to verify) |
| T0.3 | Domain skills in the portal | WEB | 2 | DONE |
| T0.4 | Close the open business questions with the owner | none | 4 to 6 | WAITING (3 owner details left; see section 4) |
| T0.5 | Lock the data contracts (section 5) and endpoint shapes (section 6) | WEB | 8 to 10 | DONE |
| T0.6p | Preflight check | read only | 1 | DONE. Evidence is in chat reports, not in commits. |
| T0.6v | Setup verification before the base app | read only | 0.5 | DONE. Superseded by T0.12 (pin 3.47.9). |
| T0.6c | Alignment and readiness check | read only | 1 | DONE (first run). Evidence is in chat reports, not in commits. |
| T0.6 | Create the vendor app base | VENDOR APP | 5 to 8 | DONE |
| T0.6f | Vendor app base polish | VENDOR APP | 1 to 2 | DONE |
| T0.6b | Vendor user repository, authentication, route gates, login screens | VENDOR APP, PANEL | 5 to 6 | DONE |
| T0.7 | Buyer app location and catalog report | read only | 1 | DONE. Evidence is in chat reports, not in commits. |
| T0.8 | Events branches decision | none | 0.5 | OPEN. The Events delete guard branch and the panel branch feat/events-renotify-visibility are not merged; see track E. |
| T0.9 | Update stale docs | WEB | 1 to 2 | DONE |
| T0.10 | Decide and set up the test environment (emulator suite or staging project) | WEB, PANEL | 3 to 6 | DONE |
| T0.11 | Reconcile the skills with this file | WEB | 1 to 2 | DONE |
| T0.12 | Flutter modernization epic (vendor first, then buyer) | BUYER, VENDOR APP | 1 to 2 | DONE |
| T0.12a | Install and pin the approved Flutter stable via FVM | BUYER, VENDOR APP | 1 to 2 | DONE |
| T0.12b | Migrate the vendor app to the approved Flutter | VENDOR APP | 4 to 8 | DONE |
| T0.12c | Assess and migrate the buyer app (with safety gate) | BUYER | 8 to 16 | DONE |
| T0.12d | Align Flutter or Dart pins, CI and cross-app regression | BUYER, VENDOR APP, WEB | 3 to 5 | DONE |
| T0.12e | Consolidate Flutter modernization onto local main | BUYER, VENDOR APP, WEB | 1 to 2 | DONE |
| T0.12f | Source of Truth accuracy cleanup after consolidation | WEB | 0.5 | DONE |
| T0.13 | Reconcile the source of truth with the audit and sync dev with main | WEB, BUYER, PANEL | 1 to 2 | DONE |
| T0.14 | Rules inventory and single source | WEB, BUYER, PANEL | 4 to 8 | BLOCKED (waiting for live exports) |
| T0.15 | Portal test and lint baseline | WEB | 3 to 6 | DONE |
| T0.16 | Backups | WEB, BUYER, PANEL, VENDOR APP | 1 to 2 | DONE |
| T0.17 | Register the vendor app in Firebase, Apple and Google Play | VENDOR APP | 1 to 2 rough | TODO |
| T0.18 | Make Cursor rules, skills and settings available to Claude Code | WEB, BUYER, PANEL, VENDOR APP | 2 to 3 | DONE |
| BM-1 | Reconcile the business model, parity and the workspace rule | WEB | done this session | DONE |
| BM-2 | Record security findings from S2.12 (SEC-1, SEC-2, O25) | WEB | docs | DONE |
| BM-3 | Record decisions D20 to D29, release plan, parked work and risk register | WEB | docs | DONE |
| GOV-1 | Governorates HTTPS endpoints auth check and lock to admins | PANEL, WEB (docs) | 1 to 3 | DONE |

Phase 1: portal and vendor app together (every ticket is done in both)

| Id | Title | Repos | Est (h) | Week | Status |
|---|---|---|---|---|---|
| S1.1 | Account states in both apps, including rejected and banned; reject keeps the account | WEB, VENDOR APP, PANEL | 20 to 25 | 1 | DONE |
| DOC-1 | Vendor documents: admin list per type, upload, review, 30-day window | WEB, VENDOR APP, PANEL | 14 to 20 | 1 | DONE |
| PC-1 | Vendor signup and signup status in the vendor app | WEB, VENDOR APP | 8 to 12 rough | 3 | TODO |
| PC-2 | Store profile and profile change requests in the vendor app | WEB, VENDOR APP | 8 to 12 rough | 3 | TODO |
| PC-3 | Settings and notifications inbox in the vendor app | WEB, VENDOR APP | 5 to 8 rough | 3 | TODO |
| S1.2 | Governorate list, coverage model, eligibility and suspension functions | PANEL | 20 to 28 | 1 | DONE |
| S1.3 | Coverage picker | WEB, VENDOR APP | 16 to 20 | 2 | DONE |
| S1.4 | Products | WEB, VENDOR APP | 16 to 22 | 2 | DONE |
| S1.5 | Orders including the hold state | WEB, VENDOR APP | 11 to 14 | 2 | DONE |
| DL-1 | Deal model per branch; commission on items only; ledger | WEB, VENDOR APP, PANEL | 12 to 18 | 2 | DONE |
| S1.6 | Earnings, notifications and push | WEB, VENDOR APP, PANEL | 13 to 16 | 3 | TODO |
| VC-1 | Vendor coupons and admin coupons | WEB, VENDOR APP, PANEL | 12 to 16 | 3 | TODO |
| PAY-1 | Payouts: cycle per vendor, admin recording, vendor statement | WEB, VENDOR APP, PANEL | 10 to 14 | 3 | TODO |
| S1.7 | Vendor type and clinic or groomer onboarding | WEB, VENDOR APP | 12 to 16 | 3 | TODO |
| S1.8 | Branches and services | WEB, VENDOR APP | 16 to 22 | 3 | TODO |
| S1.9 | Availability editor | WEB, VENDOR APP | 27 to 37 | 4 | TODO |
| S1.10 | Appointments inbox and status machine | WEB, VENDOR APP, PANEL | 14 to 18 | 4 | TODO |
| S1.11 | No-show and extra service invoices | WEB, VENDOR APP, PANEL | 12 to 15 | 4 | TODO |
| S1.12 | Reviews and dashboard | WEB, VENDOR APP | 16 to 20 | 4 | TODO |
| S1.13 | Deals view and statement (no subscription) | WEB, VENDOR APP | 8 to 12 | 4 | TODO |
| S1.14 | Suspension states on the vendor side | WEB, VENDOR APP | included in S1.2 and S1.5 | 1 to 2 | TODO |
| TH-1 | Telehealth doctor side: chat inbox, queue, end session | WEB, VENDOR APP, PANEL | 16 to 22 | 4 | TODO |

Phase 2: buyer app and admin panel

| Id | Title | Repos | Est (h) | Week | Status |
|---|---|---|---|---|---|
| S2.1 | Location-first browsing | BUYER | 14 to 18 | 5 | TODO |
| S2.2 | Eligibility with hidden and view-only vendors | BUYER | 14 to 18 | 5 | TODO |
| S2.3 | Governorate ids, piastres and per vendor delivery fee at checkout | BUYER | 8 to 12 | 5 | TODO |
| CART-1 | Single-vendor cart | BUYER | 6 to 10 | 5 | TODO |
| S2.5 | Service discovery and booking | BUYER | 25 to 33 | 6 to 8 | TODO |
| S2.6 | Fawaterak for appointments, points and coupons | BUYER | 15 to 22 | 6 to 8 | TODO |
| S2.7 | Reviews and no-show prompts | BUYER | 12 to 16 | 6 to 8 | TODO |
| S2.8 | Halo fix and badge | BUYER, PANEL | 4 to 6 | 5 | TODO |
| S2.9 | Old version compatibility | BUYER | 6 to 8 | 6 to 8 | TODO |
| S2.10 | Apple in-app purchase plus Google Play Billing switch (own track, before next store submission) | BUYER, PANEL | 20 to 30 | own track | TODO |
| S2.11 | Server-side order creation and rules hardening | BUYER, PANEL | 25 to 40 | 5 | TODO |
| S2.12 | Remove every payment token print in the buyer app, including main.dart and payment_service.dart | BUYER | 1 to 2 | Done, branch ready to ship | REVIEW |
| PTS-1 | Points earning, expiry, reversal | BUYER, PANEL | 8 to 12 | 6 to 8 | TODO |
| TH-2 | Buyer telehealth checkout and chat | BUYER, PANEL | 12 to 16 | 6 to 8 | TODO |
| TH-3 | Admin doctors and price | PANEL | 6 to 8 | 6 to 8 | TODO |
| SEC-1 | Move Fawaterak tokens out of the buyer app into a PANEL callable secret | BUYER, PANEL | 6 to 10 | weeks 1 to 2 | TODO |
| SEC-2 | Restrict the Google Maps API key in Google Cloud console | BUYER (manual) | 0.5 | now | TODO |
| A2.1 | Suspension modes and hold case queue | PANEL | 14 to 20 | 5 | TODO |
| A2.2 | Per vendor delivery fee, admin only | PANEL | 5 to 7 | 5 | TODO |
| A2.3 | Halo stamping and management | PANEL | 5 to 7 | 5 | TODO |
| A2.4 | Governorate list management and migration | PANEL | 10 to 14 | 5 | TODO |
| A2.5 | Provider approval, deals, review moderation, coupons, refunds | PANEL | 16 to 22 | 5 | TODO |
| A2.6 | Functions: timers, balances, points | PANEL | 20 to 28 | 5 | TODO |
| A2.7 | Remove the hardcoded push token | PANEL | 1 to 2 | 5 | TODO |

Phase 3: testing and release

| Id | Title | Est (h) | Week | Status |
|---|---|---|---|---|
| T3.1 | Integration testing across all clients | 25 to 35 | 6 to 8 | TODO |
| T3.2 | Migration rehearsal on a copy of production data | 10 to 14 | 6 to 8 | TODO |
| T3.3 | Old-version compatibility tests | 6 to 8 | 6 to 8 | TODO |
| T3.4 | Bug-fix buffer | 25 to 40 | 6 to 8 | TODO |
| T3.5 | Store submissions and staged rollout | 8 to 12 | 8 | TODO |
| T3.6 | Merge dev into main | 3 to 4 | 8 | TODO |

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

**T0.4 Owner questions.** Status: WAITING (2026-11-08 BM-3). Most items answered by D20 to D28. Still open and listed in section 4: O6, O15, O16, O18, plus three owner details (documents per vendor type, doctor pay terms, subscription plan prices in the stores). Events decisions stay under Track E. Update section 3 and 4 when the remaining items are answered.

**T0.5 Lock contracts.** Status: DONE (2026-11-06). Acceptance:
- [x] Section 5 shapes are final or listed as open with the ticket they block. Canonical files under docs/contracts/.
  Evidence: vendor-session, vendors, products, orders, earnings, notifications, coverage-eligibility, suspension-holds, governorates, signup, profile-change-requests, settings.
- [x] Section 6 lists Phase 1 and PC endpoints with contract pointers. vendor_session-resolveVendorSession added.
  Evidence: section 6 row and docs/contracts/vendor-session.md.
- [x] Firestore rules needs listed per domain file.
- [x] Remaining CONFIRM: BR-1.5 (O6), BR-6.7 transitions (S1.10). OPEN-dependent: O5 suspend Auth, O10 holds, O13 points, O14 groomer tags, O16 governorates, O19 deals.

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

**T0.6b Vendor user repository and authentication.** Repos VENDOR APP and PANEL. Depends on T0.6, T0.5. O5 stays OPEN (Auth disable policy is not resolved here; the app maps callable kinds only). GATE C additions locked 2026-11-08. Acceptance:
- [x] One repository instance with stored subscriptions, a stream that replays the latest value, disposal, no persisted cache.
  Evidence: `packages/vendor_repository` (`FirebaseVendorRepo`, `FakeVendorRepo`). Replay on listen. No SharedPreferences session cache.
- [x] Vendor model with snake_case fields, status pending, rejected, active, suspended, banned and an is-vendor flag. Pending and rejected vendors may have no vendors document, so the gate also reads the signup request.
  Evidence: `Vendor` in `packages/vendor_repository`. Session kinds come from PANEL `vendor_session-resolveVendorSession` (port of the portal resolver, including signup request reads).
- [x] One authentication bloc, a pure accountGateOf, localized error messages.
  Evidence: `AuthenticationBloc`, `accountGateOf`. Unknown kind maps to not_vendor with contact-support copy. EN/AR under `auth.*`.
- [x] Router redirects driven by auth state, a pure resolveRedirect with tests including the redirect parameter safety.
  Evidence: `resolve_redirect.dart` + `test/features/auth/resolve_redirect_test.dart`.
- [x] Splash, login, forgot password and account status screens, logout with confirmation.
  Evidence: auth screens under `lib/features/auth/presentation/view/`. Settings sign-out uses `LogoutConfirmDialog`.
- [x] Tests for the repository, bloc, redirects and screens.
  Evidence: package + `test/features/auth/*`. GATE C: session failure stays signed in with retry (`sessionError`); unknown kind → notVendor + support body; suspended copy carries reason and expiry.
- [x] PANEL callable `vendor_session-resolveVendorSession` with emulator smoke against seed accounts.
  Evidence: `functions/vendor_session.js`, `npm run test:session:emu` (active, pending, suspended reason/expiry, banned, buyer, not_vendor).

**T0.9 Stale docs.** Status: DONE (2026-11-05). docs/phase-3-foundation.md said the mobile app is 1.0.10+15 and the portal products API is unbuilt. The old planning document disagrees with this file. Both are marked superseded. Their bodies are kept as history.
- [x] docs/phase-3-foundation.md is marked superseded by this file.
  Evidence: banner at the top of docs/phase-3-foundation.md. Buyer pubspec on local main is 1.0.16+24 (`tinder_paws/pubspec.yaml`). Products routes are implemented in `src/app/api/vendor/products/route.ts` and `src/app/api/vendor/products/[productId]/route.ts`, not empty-array stubs.
- [x] The old planning document is marked superseded by this file.
  Evidence: banner at the top of `../MULTI_VENDOR_SERVICES_PLANNING_PRICING.md` (parent folder, not a git repo). It still mentions an admin mobile app and clinic tax and license documents. Those stay [CONFIRM] and [OPEN] here (BR-1.5, BR-2.4, O6). Nothing in that file was rewritten.

**T0.10 Test environment.** Status: DONE (2026-11-06). O7 decided as D18. Acceptance:
- [x] Firebase emulator suite for Auth, Firestore, Functions and Storage in PANEL (`tinderpaws_panel/firebase.json`), project id `demo-tenderpaws`.
  Evidence: `npm run test:emu` in `functions/` starts the suite, seeds, and exits 0. Script line: `✔  Script exited successfully (code 0)`.
- [x] Idempotent seed with fake data only (active store, pending signup, rejected signup, temporary suspended, banned, non-vendor user, products, governorates with ids).
  Evidence: `functions/test/seed.emulator.js`. Log: `Seed complete for demo-tenderpaws`.
- [x] Firestore rules for the emulator from the buyer copy (events block). CLI cannot load rules outside the panel directory, so the copy is at `tinderpaws_panel/emulator-rules/` until T0.14.
  Evidence: `emulator-rules/README.md` and `firebase.json` firestore.rules path.
- [x] npm scripts: `emulators`, `seed`, `test:suspend:emu`, `test:emu`. Smoke test calls `suspendVendorCore` (vendors-suspendVendor) against the emulator.
  Evidence: `ok  suspendVendorCore temporarily suspends the active seed vendor`. `All suspend emulator smoke tests passed.`
- [x] Portal and vendor app config documented.
  Evidence: `docs/emulator.md` (WEB) and `tinderpaws_panel/functions/EMULATOR.md`.

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

**T0.14 Rules inventory and single source.** Repos WEB, BUYER, PANEL. Est 4 to 8 h. Status: BLOCKED (2026-11-06). GATE A: both live exports are missing (`~/Downloads/firestore.rules.live` and `~/Downloads/storage.rules.live`). Inventory recorded. Diff against live and the canonical choice wait for the exports.
- [x] List every Firestore and Storage rules file and index file in all repos (re-verified 2026-11-06).

  | Path | Lines | sha256 (first 12) | Notes |
  |---|---|---|---|
  | WEB `firestore.rules` | 341 | 481c5f534c2f | No `match /events`. State report Part F |
  | WEB `storage.rules` | 51 | 618f5f4e8b04 | Vendor-scoped plus open legacy paths |
  | WEB `firestore.indexes.json` | 426 | abde2f894786 | Larger index set |
  | BUYER `firestore.rules` | 465 | fc9da55f8446 | Has `match /events` at line 397 |
  | BUYER `storage.rules` | 12 | 225dd131c751 | Signed-in write under 50MB, all paths |
  | BUYER `firestore.indexes.json` | 119 | 6adfe851fe27 | Smaller index set |
  | PANEL `emulator-rules/firestore.rules` (on PANEL `dev`) | 465 | fc9da55f8446 | Byte match of BUYER firestore.rules (T0.10 copy) |
  | PANEL `emulator-rules/storage.rules` (on PANEL `dev`) | 12 | 225dd131c751 | Byte match of BUYER storage.rules |
  | PANEL `emulator-rules/firestore.indexes.json` (on PANEL `dev`) | 119 | 6adfe851fe27 | Byte match of BUYER indexes |
  | PANEL `database.rules.json` | 5 | 7df49e5459b9 | Realtime Database only. Not Firestore |
  | VENDOR APP | none | | No firebase.json or project rules. Sample rules under build/ios SourcePackages are FlutterFire examples, not project rules |

  Known repo-to-repo differences (state report Part F, re-checked): BUYER Firestore has events; WEB does not. Storage models differ. Indexes differ. Deploying WEB Firestore would drop events.
- [ ] The owner exports the live deployed rules. Waiting for `~/Downloads/firestore.rules.live` and `~/Downloads/storage.rules.live`.
- [ ] Diff live against every repo copy, per collection and path.
- [ ] Choose one canonical location (GATE B after the exports exist).
- [ ] The canonical file contains every collection in use.
- [ ] Document the deploy command (do not run it).
- [x] No agent deploys.

**T0.15 Portal test and lint baseline.** Repo WEB. Est 3 to 6 h. Status: DONE (2026-11-05). Acceptance:
- [x] Fix the 19 lint errors (react-hooks/set-state-in-effect and others).
  Evidence: `npx eslint . --quiet` exits 0. The 19 errors were all `react-hooks/set-state-in-effect`. Loaders now start from `setTimeout` so setState is not synchronous in the effect. Draft resets and the profile form update state during render when their source changes. Popup layout uses `queueMicrotask`. Back-button visibility uses `useSyncExternalStore`.
- [x] Add a test runner (Vitest) with first tests for session and products validation.
  Evidence: Vitest 3.2.7. `src/features/auth/domain/session-body.test.ts` (2 tests). `src/features/products/domain/schemas.test.ts` (4 tests). `npm test` reports 6 passed.
- [x] A documented test command.
  Evidence: `npm test` in package.json and README.md.
- [x] tsc stays clean.
  Evidence: `npm run typecheck` (`tsc --noEmit`) exits 0.

**T0.16 Backups.** Repos WEB, BUYER, PANEL, VENDOR APP. Est 1 to 2 h. Status: DONE (2026-11-06; vendor remote closed 2026-11-08 in P-BATCH2). Acceptance:
- [x] A remote exists for the vendor app. Created private `TwoR-Tech-Marketing/tender_paws_partner`. Tracked-file scan found no google-services.json, GoogleService-Info.plist, key.properties, jks, keystore or .env. Pushed `dev` (`235c3a785ba7aad0c4d34f3aa92fdbc8a0fc0e4a`) and `feature/T0.6b-vendor-auth` (`f10b53a8aafdafee6d8e8db81e263ffc39e06d0e`). `main` was not pushed.
- [x] dev and the allowed work branches are pushed for WEB, BUYER and PANEL. They did not exist on origin, so the push created them (fast-forward check: no remote tip to be behind).
  WEB origin tips: dev `3f4cd6f7640273bb75faaa78500ca1c8562e6152`, feature/T0.11-reconcile-skills `62e5feda05d0a59ee9f32461b096a76aaf1b06bc`, feature/T0.15-portal-test-lint `e10e963b1befcd40bef6919a89654fd55e1f2aeb`, feature/T0.9-stale-docs `5dcbba5655679a4e4082f86fa253cf6cfcd875b1`.
  BUYER origin tips: dev `9d4f357c4fe3eaaf27cb26f1f7307912ce0d6fa9`, backup/main-before-notifications-v2 `ad81917f120fc161da79d5c0aae37a3a015d6908`, backup/notifications-redesign-v2-old `bc268897d714dadba241dea9aef23f2828598b65`, feat/events-checked-in-delete-guard `7a7a008a389bc73804623d350d199e72cb52e1d4`, feature/all-announcement-redirect `bc268897d714dadba241dea9aef23f2828598b65`, feature/flutter-3.47.9-buyer `647cd489636d11876c0e116a8e757f11849d7760`, feature/notifications-redesign `e3cdca0953df1928494cc009861460e81b19a2cc`, feature/notifications-redesign-v2 `610953d8f307495052716e99ea8c9693684c0114`, feature/undo-like-superlike `505f61f2eb1fcdce201a93fd7d7997f881d9af33`, fix/ios27-ipad-launch-crash `b204b76ee3e8a494fce2168423433a0712c785cc`, fix/td-001-td-002-filter-ui `a63d7843f996f8f3ab7fb4d047167788dbe7daa9`.
  PANEL origin tips: dev `6aa4db59ae4a1f8165c4f20ad516af3332a1b939`, feat/events-renotify-visibility `5250bf335a759543c82f12f976449c66537b964a`.
- [x] main and master were not pushed. BUYER new-bundle was not pushed. Codemagic builds the buyer app on a push to main.

**T0.17 Register the vendor app in Firebase, Apple and Google Play.** Est 1 to 2 h, rough. Status: TODO. Manual steps by Ahmed plus flutterfire configure. Blocks T0.6b on a real device. Emulator and fake-auth work in T0.6b do not need this ticket.

**T0.18 Make every Cursor rule, skill, command and setting available to Claude Code.** Repos WEB, BUYER, PANEL, VENDOR APP and the parent folder. Est 2 to 3 h. Status: DONE (2026-11-10). Configuration and documents only. Acceptance:
| # | Item | Evidence |
|---|---|---|
| 1 | Parent `CLAUDE.md` is a pointer file (repo map, D16, production safety, D19, no em dashes, `git -C`) and imports the WEB `AGENTS.md` and the four WEB alwaysApply rules | `CLAUDE.md` in the parent folder (local, the parent is not a git repo) |
| 2 | Each repo has a `CLAUDE.md` that imports its `AGENTS.md` and its alwaysApply rules, plus a glob line for `visible-toggles` | `CLAUDE.md` in WEB, BUYER, VENDOR APP (committed) and PANEL (local only, its `AGENTS.md` is git-excluded) |
| 3 | VENDOR APP `source-of-truth.mdc` and `workspace-context.mdc` got `alwaysApply: true` and a description, in the original Cursor files | `tender_paws_partner/.cursor/rules` |
| 4 | WEB `.cursor/skills` (21 skills) is visible to Claude Code through one symbolic link per skill, in `Multi-Vendor-Paws/.claude/skills` and in the parent `.claude/skills` | links resolve, no broken link; the skill list shown in a Claude Code session included them |
| 5 | The 17 design skills from `.agents/skills` (identical in BUYER, PANEL, VENDOR APP) are copied to `~/.claude/skills`. `impeccable` exists as a WEB project skill and as a personal skill and both are kept | `~/.claude/skills` |
| 6 | Domain skills that differ from WEB were overwritten with the WEB copy in BUYER, VENDOR APP and PANEL (PANEL is local only, git-excluded) | `scripts/sync-domain-skills.sh` |
| 7 | No Cursor commands exist, so nothing to convert | none found |
| 8 | Project `.mcp.json` in the parent folder holds only dart, next-devtools and drawio, with no secrets. Skipped: postman, firebase, gcloud, StitchMCP, Meta Developer Tools | `.mcp.json` |
| 9 | `.claude/settings.local.json` in the parent and each repo denies firebase deploy and login, gcloud, force push, push to main or master, reset --hard and rebase, plus `git -C` variants. Each is git-excluded through `.git/info/exclude` | `git check-ignore` |
- Decision: domain skills are edited in WEB only (`Multi-Vendor-Paws/.cursor/skills` is canonical, T0.11). Run `scripts/sync-domain-skills.sh` to copy them to the other repos. Do not edit them in BUYER, PANEL or VENDOR APP.
- Available to port later: the Cursor hook in `.cursor/hooks.json` (preToolUse, runs the impeccable `hook-before-edit` script). It was not ported to Claude Code.
- Not migrated, for Ahmed to decide later: MCP servers `firebase-mcp-server` and `gcloud` (can write to Firebase and Google Cloud, never give Claude Code a production write tool), `StitchMCP`, `postman`, `Meta Developer Tools`.

**BM-1 Reconcile the business model.** Repo WEB. Status: DONE (2026-11-06). Acceptance:
- [x] D15, D16, D17 and D19 are in section 4. D15 replaces the portal BFF [CONFIRM] in section 1.1. D19 replaces the "no push" line in the standard ticket prompt and the commit rules.
- [x] Section 3A lists AB-1 to AB-17 with evidence from the state report.
- [x] docs/parity.md and docs/contracts/README.md exist.
- [x] The workspace rule follows D14 and D19. The vendor app line says the app exists and the remote is pending.

**BM-2 Security findings from S2.12.** Repo WEB. Status: DONE (2026-11-08). Docs only. Acceptance:
- [x] SEC-1 and SEC-2 recorded as their own track (like S2.12), not part of the multi-vendor release merge to main.
- [x] O25 added for Fawaterak rotation timing relative to old app versions.
- [x] BR-15.4 notes Firebase client apiKeys are identifiers; protection is rules (T0.14).
- [x] Risks updated for hardcoded Fawaterak tokens in the live buyer app (high).
- [x] File and line references only; no secret values in this file.

**SEC-1 Move Fawaterak tokens out of the buyer app.** Track: own track like S2.12. Branch from buyer `main`, not part of the multi-vendor release. Repos BUYER, PANEL. Est 6 to 10 h. Status: TODO.
- Finding: `tinder_paws/lib/features/store/data/config/payment_config.dart` lines 102 to 106 hold Fawaterak production and staging API tokens as string literals. Values are never written into this file.
- Scope: a callable in PANEL `functions` holds the Fawaterak token as a Firebase secret (`defineSecret`) and makes the gateway calls; the buyer app calls that function instead of embedding the token; then rotate the tokens in the Fawaterak dashboard.
- Order: ship the function, ship the app update, wait until enough users are on the new build (Shorebird patch where possible), then rotate. Rotating first breaks every installed version that still embeds the old token. The token remains in git history until rotated.
- Needs Ahmed's Fawaterak dashboard access for rotation. O25 decides forced update vs accepting that old installs stop paying after rotate.

**SEC-2 Restrict the Google Maps key.** Manual by Ahmed. Est 0.5 h. Status: TODO.
- Finding: `tinder_paws/lib/core/widgets/location_screen.dart` line 78 holds a Google Maps API key string literal. Value is never written into this file.
- Action: in Google Cloud console, restrict the key to the Android package name, the iOS bundle id, and the Maps APIs only.

### Phase 1 details

All Phase 1 tickets: change the portal and the vendor app in the same ticket, from one contract file, with the same rules, states and strings. Update docs/parity.md. PC-1, PC-2 and PC-3 follow D15 and sit after S1.1. They add the portal features the vendor app does not have yet: signup (PC-1), store profile and profile change requests (PC-2), settings and the notifications inbox (PC-3).

**S1.1 Account states in both apps, including rejected and banned; reject keeps the account.** Skills: vendor-type-architecture, vendor-suspension-modes. Week 1. Changes AB-2 and AB-4. Status: DONE (2026-11-08). Merged to each `dev` on `feature/S1.1-account-gates`.
- Acceptance:
  - [x] Shared callable kinds include `banned` and `rejected` (emulator `test:session:emu` + `test:reapply:emu` via `test:emu`).
  - [x] Reject keeps Auth; default reason when notes empty; panel reject UI requires reason.
  - [x] `vendor_signup-reapplyVendorSignupRequest` callable + portal BFF proxy + vendor app reapply screen.
  - [x] Portal session kind via shared callable (D15); local Admin resolver marked deprecated.
  - [x] Vendor app gates/routes/copy for rejected and banned; auth tests passed (`fvm flutter test test/features/auth/`, 17 passed).
  - [x] Portal gate-mapping unit tests (`portal-account-gate.test.ts`); full login E2E against emulator not required for DONE (kind mapping covered; callable covered in PANEL emulator).
  - [x] Merge into each `dev` and push per D19.
- Deploy notes (do not deploy in this ticket):
  1. Deploy functions: `vendor_session-resolveVendorSession`, `vendor_signup-reviewVendorSignupRequest`, `vendor_signup-reapplyVendorSignupRequest` (and `admin_auth.js` already from GOV-1).
  2. Then panel hosting (reject reason UI), then portal, then vendor app.
  3. Risk: live panel reject still works without reason (server stores default). Old reject-deleted-Auth behavior stops; applicants keep login.
  4. Verify: reject without notes stores default; reject with notes stores reason; rejected login shows reason; reapply returns pending; banned shows banned not suspended.
  5. Rollback: previous function revisions; panel/app rollbacks independent.

**S1.2 Governorate list, coverage model, eligibility and suspension functions.** Repo PANEL (functions) plus WEB/VENDOR APP suspension banners (S1.14 part). Skills: delivery-zones-geo, vendor-suspension-modes, cloud-functions-rules. Status: DONE (2026-11-08). Branches: PANEL/WEB/VENDOR APP `feature/S1.2-coverage-eligibility`.
- Acceptance:
  - [x] Canonical governorates with ids, nameEn, nameAr, code; migration script with mandatory dry run (`scripts/migrate_governorates.js`, emulator only this ticket).
  - [x] Gate B approved: full geoBoundaries EGY ADM1 GeoJSON asset + SOURCE.md (ODbL 1.0); alias map for all 27 shapeName/shapeISO; PIP then nearest ≤2 km; fail closed beyond.
  - [x] `eligibility-resolveBuyerEligibility` returns governorateId, nameEn, nameAr, resolution, vendors with orderable flags, Halo fail closed.
  - [x] `suspendVendor` mode (default hidden), holdCases, Auth stays enabled on permanent suspend; lift releases holds.
  - [x] Suspension mode on session profile; portal and vendor app banners show mode/reason/expiry.
  - [x] Emulator/unit tests: boundaries, eligibility, suspend/holds. Nothing deployed.
- Deploy notes (do not deploy in this ticket):
  1. Before functions deploy: confirm boundary file and SOURCE.md ship with the functions bundle.
  2. Deploy functions: eligibility-resolveBuyerEligibility, vendors-suspendVendor, liftExpiredVendorRestrictions, vendor_session-resolveVendorSession (suspensionMode).
  3. Run migrate_governorates with DRY_RUN=1 on a copy, then apply; keep legacy name field.
  4. Existing suspended vendors: Auth state unchanged (no backfill). New permanent suspends no longer disable Auth.
  5. Rollback: previous function revisions; boundary file rolls with functions.

**S1.3 Coverage picker.** Skills: delivery-zones-geo. Status: DONE (2026-11-08). Gate D OK (Google Maps, separate restricted keys; Play signing SHA-1; quotas; gitignore + fail-if-missing; T0.17 steps in DEPLOY_PLAN). Acceptance: zone or governorates via `vendors-setVendorDeliveryCoverage`; radius 500–100000; EN/AR; portal `/settings/coverage` + app `CoverageScreen`; non-store hidden; approve gated for stores; active missing-coverage banner. Branches: `feature/S1.3-coverage-picker`.

**S1.4 Products.** Status: DONE (2026-11-08). Shared `vendor_products-*`; portal flag `NEXT_PUBLIC_VENDOR_PRODUCTS_DATA_SOURCE` default `bff`; vendor app list/create/archive (no spreadsheet); pending locked; Halo blocked. Shipped on same feature branch set as S1.3.

**S1.5 Orders including the hold state.** Status: DONE (2026-11-08). Shared `vendor_orders-*`; portal flag default `bff`; hold banner + locked status updates; DL-1 fee/net when present. Shipped on same feature branch set as S1.3.

**S1.6 Earnings, notifications and push.** Acceptance: earnings summary and entries, notification inbox, registerVendorFcmToken, push for a new order, token cleanup on logout.

**S1.7 Vendor type and onboarding.** Skills: provider-onboarding, vendor-type-architecture. Acceptance: vendorType drives navigation and labels from one config (store, clinic, groomer, doctor per D27); provider fields from 6.2; approval status; changes to live data go through change requests; documents required per D25 / DOC-1.

**S1.8 Branches and services.** Acceptance: branches, services and prices (piastres), duplicate services between branches, optional photos.

**S1.9 Availability editor.** Skills: availability-scheduling. Acceptance: weekly hours and exceptions per branch, home visit option, conflict detection with booked appointments, Africa/Cairo handling, right-to-left calendar, the race-safe booking rule recorded in the contract. Booking defaults from D28 (answered O12).

**S1.10 Appointments inbox and status machine.** Skills: appointments-domain. Acceptance: statuses and transitions enforced by functions, statusHistory, provider actions, inbox filters.

**S1.11 No-show and extra service invoices.** Skills: no-show-flow. Acceptance: flagNoShow enforces the 120 minute rule on the server, buyer notification with four answers, createExtraInvoice. Outcomes from D28 (O21 to O23).

**S1.12 Reviews and dashboard.** Skills: reviews-and-tags. Acceptance: reviews list, aggregates computed on the server, dashboard with visits, services chart, new patients and ratings.

**S1.13 Deals view and statement (no subscription).** Skills: deals-and-billing. Week 4. Est 8 to 12 h. Acceptance: read-only view of the deal (per branch where applicable) and live balance / statement. No vendor subscription product (D21). Deal write path is DL-1 / A2.5.

**S1.14 Suspension states on the vendor side.** Covered by S1.1, S1.2 and S1.5: banners, reasons, blocked operational routes, held items.

**DOC-1 Vendor documents.** Repos WEB, VENDOR APP, PANEL. Week 1. Est 14 to 20 h. Skills: provider-onboarding. Status: DONE (2026-11-08; admin UI gaps closed in fix/W1-cleanup 2026-11-08). Acceptance:
- [x] Admin defines the required document list per vendor type in the panel (type picker: store, clinic, groomer, doctor; owner enters values; code does not invent the business list). Callable `vendor_documents-setVendorDocumentRequirements`.
- [x] Vendors upload in the portal and the vendor app; admin reviews via `reviewVendorDocument` (approve / reject with reason). Panel lists pending submissions. Vendor app reads status via `vendor_documents-getMyVendorDocuments` (D15, no client Firestore).
- [x] Existing approved vendors keep selling and get a 30-day `documentCompliance` window without auto-suspend. Panel lists active vendors missing documents with deadline via `vendor_documents-listVendorsMissingDocuments` (emulator covered).
- [x] Contract `docs/contracts/documents.md` locked (including the three read/list callables).
- Deploy notes: see Wave 4 in `~/Downloads/DEPLOY_PLAN.md`. Rules in repo copies only (T0.14).

**DL-1 Deal model per branch; commission on items only; ledger.** Repos WEB, VENDOR APP, PANEL. Week 2. Est 12 to 18 h. Skills: deals-and-billing, money-piastres. Status: DONE (2026-11-08) for fee cutover + admin write path; vendor read view deferred to S1.13. Acceptance:
- [x] Deals set on `vendorDeals/{vendorId}` with apply-to-all and optional `branchOverrides`; vendors without a deal use default 10 percent (D22). Panel deal editor on vendor detail.
- [x] Types: fixed, percentage, or both. Shared `lib/deal_fees.js`: items only, delivery 100 percent to vendor, fee capped at fee base, half-up percent, admin/vendor coupon rules (D23). Gateway absorbed in TenderPaws fee.
- [x] `orders_split` uses the shared module only when `commissionConfig/main.itemsOnlyFrom` is set and `placedAt >= itemsOnlyFrom`. Existing orders never recomputed. vendorOrders store `platformFeePiastres` / `vendorNetPiastres` and mirror legacy `commissionPiastres` / `netPiastres`. Fixes AB-6 for new orders after cutover.
- [x] Contract `docs/contracts/deals.md` and `earnings.md` locked; `vendors-setVendorDeal` in section 6.
- [x] Emulator: `test:deal_fees` (9) and `test:deals:emu` (4) including pre-cutover legacy path.
- Deploy notes: Wave DL-1 in `~/Downloads/DEPLOY_PLAN.md`. Leave `itemsOnlyFrom` unset until cutover. Never recompute historical vendorOrders.

**VC-1 Vendor coupons and admin coupons.** Repos WEB, VENDOR APP, PANEL. Week 3. Est 12 to 16 h. Skills: points-and-coupons. Acceptance:
- [ ] Admin coupons funded by TenderPaws (vendor paid on full price). Vendor coupons funded by the vendor (fees on discounted price) (D23).
- [ ] One coupon per checkout; expiry and per-user limit. Vendors create coupons in portal and app.
- [ ] Contract stub docs/contracts/coupons.md locked in this ticket.

**PAY-1 Payouts.** Repos WEB, VENDOR APP, PANEL. Week 3. Est 10 to 14 h. Skills: deals-and-billing, money-piastres. Acceptance:
- [ ] Admin sets weekly or monthly payout cycle per vendor (D21).
- [ ] Admin records manual payout ledger entries. Vendors see a statement in portal and app.
- [ ] Contract stub docs/contracts/payouts.md locked in this ticket.

**TH-1 Telehealth doctor side.** Repos WEB, VENDOR APP, PANEL. Week 4. Est 16 to 22 h. Skills: appointments-domain (chat reuse). Acceptance:
- [ ] Doctor vendor type uses portal and vendor app with a chat inbox (D27).
- [ ] Queue: paid chat waits; any available doctor accepts; 15-minute timeout flags support for manual refund.
- [ ] Doctor can end the chat; a new chat needs a new payment. Photos allowed, no video.
- [ ] Contract stub docs/contracts/telehealth.md locked in this ticket. Doctor pay terms remain an owner detail.

### Phase 2 details

**S2.1 Location-first browsing.** Acceptance: permission flow with manual picker fallback, location stored as lat, lng and governorate id, shown before the catalog, the picker's key moved out of source. Attribution: licences or about screen must credit geoBoundaries and OpenStreetMap contributors under ODbL (S1.2 / O16).

**S2.2 Eligibility with hidden and view-only vendors.** Acceptance: the catalog uses resolveBuyerEligibility, shows eligible vendors plus Halo; view_only items are marked unavailable and cannot be added to the cart; hidden vendors never appear.

**S2.3 Governorate ids, piastres and delivery fee.** Acceptance: orders store governorate ids, name matching and unused fee helpers removed, per vendor admin-set fee at checkout, Halo governorate fees kept, money in piastres at the boundaries, the silent 70 fallback replaced by an explicit error if missing (AB-7).

**CART-1 Single-vendor cart.** Repo BUYER. Week 5. Est 6 to 10 h. Acceptance: cart holds items from one store only; adding from another store asks to clear the cart; Halo is its own store; createOrder rejects mixed carts (D20). Works with S2.11.

**S2.5 Service discovery and booking.** Acceptance: providers, branches, services, availability, booking, home visit, statuses visible to the buyer.

**S2.6 Fawaterak, points and coupons.** Acceptance: appointment checkout through Fawaterak, points ledger entries, coupon at checkout, extra invoice payment.

**S2.7 Reviews and no-show prompts.** Acceptance: post-visit prompt, review with three ratings and tags, no-show answers.

**S2.8 Halo fix and badge.** Acceptance: Halo defined by platformVendor only, no reliance on isHalo, admin-created items stamped.

**S2.9 Old version compatibility.** Acceptance: every change is additive, the current store build is tested against new data, the forced update plan and flag exist.

**S2.10 Apple in-app purchase plus Google Play Billing switch.** Own track, before the next store submission. Est 20 to 30 h. Acceptance: Apple digital goods only via in-app purchase with server verification and restore; Android remote switch between Play Billing and Fawaterak (D26); Fawaterak no longer used for Apple digital goods; store guideline check done. Subscription plan prices remain an owner detail.

**S2.11 Server-side orders and rules hardening.** Acceptance: createOrder validates eligibility, fees and coupons; after the forced update the rules deny client order creation; live rules verified in the console (BR-15).

**PTS-1 Points earning, expiry, reversal.** Repos BUYER, PANEL. Weeks 6 to 8. Est 8 to 12 h. Skills: points-and-coupons, money-piastres. Acceptance: TenderPaws program, 1 point per EGP paid (floor of paid piastres / 100), each point expires 12 months after earned, reversed on refund (D24). Redemption out of this release. Contract stub docs/contracts/points.md locked in this ticket.

**TH-2 Buyer telehealth checkout and chat.** Repos BUYER, PANEL. Weeks 6 to 8. Est 12 to 16 h. Acceptance: buyer pays configurable price, enters queue, chats with accepting doctor; reuses buyer app chat; photos yes, video no (D27).

**TH-3 Admin doctors and price.** Repo PANEL. Weeks 6 to 8. Est 6 to 8 h. Acceptance: admin manages doctor vendors and the telehealth price; doctor pay terms remain an owner detail.

**GOV-1 Governorates HTTPS endpoints auth check and lock to admins.** Repos PANEL (functions), WEB (SOT, contract). Week 1 day 1. Est 1 to 3 h. Status: DONE (2026-11-08).
- Gate A (2026-11-08): approved. Mutating HTTPS require Bearer + verifyIdToken + shared admin check from `admin_auth.js` (same rule as vendors.js). Reads and `validateOrderDelivery` stay open. Panel/buyer use Firestore SDK (AB-18), not HTTPS. WEB and VENDOR APP: no HTTPS callers. Repo rules copies already `allow write: if isAdmin()` for `governorates` and `category_governorates` (WEB `firestore.rules` lines 132 to 133, BUYER `firestore.rules` lines 175 to 176, PANEL `emulator-rules/firestore.rules` lines 175 to 176); no new open-write risk added (live rules still T0.14 / risk 4).
- Acceptance:
  - [x] Read-only audit of seven handlers and callers (panel, buyer, WEB, vendor app).
  - [x] Mutating handlers refuse anonymous (401) and non-admin (403); admin allowed.
  - [x] Reads and validateOrderDelivery unchanged without a token.
  - [x] Contract `docs/contracts/governorates.md` locks the auth model; AB-18 recorded; outdated banner on PANEL `GOVERNORATE_DELIVERY_VALIDATION.md`.
  - [x] Emulator evidence: `firebase emulators:exec --project demo-tenderpaws --only auth,firestore,functions "npm run seed && npm run test:gov:emu"` exit 0. Tests: create/update/delete/assign anonymous 401, non-admin 403, admin allowed; getAll and getCategory open; validateOrderDelivery shapes unchanged.
- Branches: PANEL and WEB `feature/GOV-1-governorates-auth`.
- Deploy notes (do not deploy in this ticket):
  1. Before deploy: Ahmed checks Firebase console logs for the last 30 days of `governorates-*` invocations. Any call to a mutating handler means stop and review first.
  2. Deploy only the updated `governorates-*` HTTPS functions (and `admin_auth.js` / `vendors.js` shared import). No rules, indexes, panel hosting, or portal deploy required for GOV-1.
  3. Order: functions only.
  4. Risk to live users: low. Live panel and buyer use Firestore, not these HTTPS endpoints. Residual: any unknown external caller of mutate URLs starts getting 401/403 (intended).
  5. Verify: anonymous POST create returns 401; admin with Bearer succeeds; panel Firestore CRUD still works; buyer checkout validation still works.
  6. Rollback: redeploy previous functions revision for `governorates` (and `vendors` if the shared import must roll back together).

**S2.12 Remove secret prints in the buyer app.** Est 1 to 2 h. Status: REVIEW (2026-11-06). Branch left for Shorebird. Not merged into main or dev.
- BUYER branch: `fix/S2.12-remove-secret-prints` at `c1d2898d0cd4b90d3c1d26555b5fecd0542f5cc0`. Base was local main `647cd48`.
- Acceptance:
  - [x] Removed token prefix prints from main.dart (were lines 19 to 27).
  - [x] Removed full token prints and Authorization header dumps from payment_service.dart (were around lines 60 and 247). Also removed payment request body and response body dumps that carried customer data.
  - [x] Removed sign-in email print, payment redirect URL prints, payment intent id prints, and promo code value prints under lib/.
  - [x] Payment behavior unchanged (auth headers still built; tokens still used for requests).
  - [x] `fvm flutter analyze`: 0 errors, 59 warnings (at the ceiling). `fvm flutter test`: 69 passed.
- Hardcoded secret findings (left in place for a separate rotation ticket):
  - `lib/features/store/data/config/payment_config.dart` lines 102 to 106: Fawaterak production and staging API tokens as string literals.
  - `lib/core/widgets/location_screen.dart` line 78: Google Maps API key string literal.
  - `lib/firebase_options.dart`: Firebase apiKey values (FlutterFire generated).

**A2.1 to A2.7.** Acceptance follows the titles: suspension modes with a hold case queue (A2.1); admin-only delivery fee in vendorAdminSettings (A2.2); Halo stamping with platformVendor (A2.3); governorate list management and migration (A2.4); provider approval, deals, review moderation, coupons and refunds (A2.5); timers, balances and points functions (A2.6); the hardcoded push token removed and rotated (A2.7).

### Phase 3 details

**T3.1 to T3.6.** Integration testing of all clients against the emulator and a production copy, migration rehearsal, old-version tests, bug-fix buffer, store submissions with Apple review time, then the merge of dev into main only after sign-off.

### Release plan (D29)

Week 1 starts 2026-11-09. Weeks 1 to 4: vendor portal and vendor app. Week 5: buyer and admin. Weeks 6 to 8: extension (buyer booking, telehealth, in-app purchase, testing, store release). Weekly checkpoint.

| Week | Tickets |
|---|---|
| 1 | GOV-1 (day 1), S1.1, S1.2, DOC-1, S1.14 (with S1.2) |
| 2 | S1.3, S1.4, S1.5, DL-1, S1.14 (with S1.5) |
| 3 | S1.6, PC-1, PC-2, PC-3, VC-1, PAY-1, S1.7, S1.8 |
| 4 | S1.9, S1.10, S1.11, S1.12, S1.13, TH-1 |
| 5 | S2.1, S2.2, S2.3, CART-1, S2.8, S2.11, A2.1 to A2.7 |
| 6 to 8 | S2.5, S2.6, S2.7, TH-2, TH-3, PTS-1, S2.9, T3.1 to T3.6 (T3.5 and T3.6 in week 8) |
| Own track / parallel | S2.10 (before next store submission), SEC-1 (weeks 1 to 2), SEC-2 (now), S2.12 ship (now) |

### Parked work (outside the multi-vendor release)

Parked, not in the multi-vendor release. Not dropped.

| Item | Repo | State | Next step |
|---|---|---|---|
| Events feature (Discopawty): admin events, Excel import, moderators, QR tickets, server check-in | BUYER, PANEL | Built; delete guard on branch feat/events-checked-in-delete-guard not merged | Events track EV-1 to EV-4, T0.8 |
| Notifications screen redesign v2 (both tabs) | BUYER | Planned as a store release from main | After the multi-vendor release or with a store build |
| Push tap routing (announcement type All opens the Notifications screen) | BUYER | Superseded by work on main | None |
| Undo on the swipe card also undoes like and super like | BUYER | Cubit tests exist on main | Verify on device |
| TD-001 back button on cards not working | BUYER | Open | Later |
| TD-002 home feed lags while scrolling | BUYER | Open | Later |
| Filter screen redesign (breed list, many options) | BUYER | Branch fix/td-001-td-002-filter-ui | Later |
| iOS 27 iPad launch crash fix (UIScene) | BUYER | Branch fix/ios27-ipad-launch-crash | Confirm merged state before next store build |
| Deprecated APIs (WillPopScope, Radio groupValue) | BUYER | 59 analyzer warnings | Clean during S2 tickets that touch them |
| Toolchain warnings: cloud_functions Kotlin plugin, CocoaPods plus SPM hybrid, Gradle 9 and AGP 9 soon required | BUYER, VENDOR APP | Builds green | Upgrade when Flutter forces it |
| Portal ESLint warnings | WEB | 112 warnings, 0 errors | Clean during S1 tickets |
| Crashlytics, Play Console, App Store Connect baselines | BUYER | Not collected | Ahmed exports before the store release |
| Local stashes: buyer wip-ios-unrelated, panel GitHub Desktop stash | BUYER, PANEL | Local only | Review and drop or commit |
| Old local branches (new-bundle, backup/*, notifications branches) | BUYER | Pushed as backups | Clean up after release |
| Design skills (taste-skill, impeccable, Emil Kowalski) | All | Local, git-excluded | Keep |

### Track E: Events hardening

Separate from the multi-vendor project, buyer app and panel. All tickets TODO.

**EV-1 Events device and console verification.** Est 2 to 3 h. Acceptance: create an event, import a sheet, claim a ticket, watch the QR rotate, check in by scan and by manual lookup, confirm a double check-in fails, confirm an old screenshot fails, and confirm in the Firebase console that the events functions and rules are the deployed ones.

**EV-2 Merge the delete guard and align the rules.** Est 2 to 4 h. Acceptance: branch feat/events-checked-in-delete-guard is merged in the buyer app, the buyer rules and the panel rules tests agree, and the events rules exist in the canonical rules file (T0.14).

**EV-3 QR replay window.** Est 2 to 4 h. Acceptance: decide the window and skew (today a 30 second window with a skew of 2, so a screenshot can work for a minute or two until the first successful scan); apply the decision; tests updated.

**EV-4 Attendee matching.** Est 2 to 5 h. Acceptance: decide email only or email then phone (the import code matches by email only; the earlier design said phone as backup); implement the decision with tests.

---

## 8. Risks and known issues

Risk register (BM-3, 2026-11-08). 21 risks. Every security item is handled; the first four this week.

### 8.1 Security (in the order we handle them)

| # | Risk | Severity | Mitigation | Ticket | When |
|---|---|---|---|---|---|
| 1 | Governorates HTTPS endpoints (create, update, delete, assign) had no auth | High (confirmed GOV-1) | Mutating handlers require admin Bearer; reads and validateOrderDelivery stay open | GOV-1 | Week 1, day 1 |
| 2 | Google Maps key unrestricted in the buyer app | Low | Restrict to app ids and Maps APIs | SEC-2 | Now |
| 3 | Payment token prints in the live app | Medium | Fix ready; ship as Shorebird patch | S2.12 | Now |
| 4 | Live rules unknown; repo copies leave store open and promo codes writable; Storage allows wide writes | High | Export live rules, one canonical file, tighten | T0.14 | This week |
| 5 | Fawaterak production and staging tokens hardcoded in the live app and git history | High | Server function holds the token, ship, force update, rotate | SEC-1 | Weeks 1 to 2 |
| 6 | Digital goods sold outside Apple in-app purchase | High (store rejection) | In-app purchase on Apple, Android switch | S2.10 | Before next store submission |
| 7 | Hardcoded device push token in services.js | Medium | Remove and rotate | A2.7 | Week 5 |
| 8 | Orders written by the buyer client | Medium | Server createOrder, rules deny client writes | S2.11 | Week 5 |

### 8.2 Delivery zones

| # | Risk | Mitigation | Ticket |
|---|---|---|---|
| 9 | Old app versions ignore coverage and allow orders from vendors that do not deliver | Server rechecks eligibility at createOrder; forced update | S2.11, S2.9 |
| 10 | Shops without coverage become invisible | Coverage required before a shop goes active; admin list of shops without coverage | S1.3, A2 |
| 11 | Buyer denies location permission | Map picker fallback; nothing shown until a location is set | S2.1 |
| 12 | Buyer changes location with a cart | Recheck cart, remove undeliverable items with a message (single-vendor cart makes this one store) | S2.2, CART-1 |
| 13 | Migrating governorate names to ids breaks data | Idempotent script, dry run, rehearsal on a copy | S1.2, T3.2 |
| 14 | No official governorate boundary data | Open dataset with recorded licence; zone mode works without it | S1.2, O16 |
| 15 | Halo hidden by incomplete category mapping (fail closed) | Admin report of Halo categories without governorates | A2.3, A2.4 |
| 16 | The 70 EGP fallback charges the wrong fee | Per-vendor fee, explicit error if missing | S2.3 |

### 8.3 Delivery of the project

| # | Risk | Mitigation | Ticket |
|---|---|---|---|
| 17 | Scope is larger than 5 weeks (about 600 to 850 hours) | Bigger prompts, parallel agents, weekly checkpoint, extension of 2 to 3 weeks, cut list ready | D29 |
| 18 | One production Firebase, no staging | Emulators for all tests; migration rehearsal on a copy | D18, T3.2 |
| 19 | A push to main triggers a Codemagic build | Never push main or master from prompts | D19 |
| 20 | Google may reject Fawaterak for digital goods on Android | Remote switch per platform, no rebuild needed | D26 |
| 21 | Vendor app not registered in Firebase or stores | Register early; emulator and fake mode until then | T0.17 |

### 8.4 Resolved

- Unpushed local work (all four repos now on GitHub, T0.16).
- Stale and conflicting documents (marked superseded, T0.9, T0.11, BM-1).
- Portal lint errors (T0.15).

### 8.5 History (pre BM-3 bullet list)

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
- Hardcoded Fawaterak API tokens in the live buyer app (`payment_config.dart` lines 102 to 106). High. Tracked as SEC-1. Do not rotate until the callable path ships and enough users update (O25).
- The hardcoded push token is still in functions/services.js.
- 2026-11-06: createdBy and updatedBy on admin products are the hardcoded username ahmedhany1284 (store_screen.dart lines 1122 and 1140, state report Part H item 15).
- 2026-11-06: Storage rules allow wide writes in both repo copies (state report Part F, lines 617 to 618).
- 2026-11-06: governorate handlers in functions/governorates.js are HTTPS onRequest (seven handlers, wired from functions/index.js line 23, state report Part E line 571). The handlers set CORS and do not verify an Auth token before reading or writing.
- The Events attendee import matches by email only.

---

## 9. Changelog

- 2026-11-08: S1.3 / S1.4 / S1.5 DONE. Gate D OK (Maps keys per platform; Play signing SHA-1; quotas; gitignore + build fail-if-missing; T0.17 in DEPLOY_PLAN). Coverage callables + portal/app UI; product and order shared callables with portal BFF flags defaulting to `bff`; hold locks vendor status updates. Emulator coverage/products/orders tests added to `test:emu`.
- 2026-11-08: Branch verify before Gate D. WEB, PANEL, and VENDOR APP: no local or remote branch named `devtools` (display/typo only in merge subjects such as `bring DL-1 into.devtools` / `bring W1-cleanup into.devtools`). Merges landed on `dev`. `fix/W1-cleanup` and DL-1 are on each `dev` and already pushed to `origin/dev`. No merge of `devtools` into `dev` needed; no remote `devtools` to leave alone.
- 2026-11-08: DL-1 DONE (admin write + fee cutover). Gate C OK with fee-base cap, half-up 333@10%, admin-coupon zero/less note. `vendors-setVendorDeal`, panel deal editor, `lib/deal_fees.js`, `orders_split` behind `itemsOnlyFrom`. Vendor app read view deferred to S1.13. Emulator deal tests passed.
- 2026-11-08: fix/W1-cleanup. Closed Week 1 DOC-1 gaps: vendor app documents screen uses `vendor_documents-getMyVendorDocuments` (no client Firestore); portal `VendorDocumentsSection` load deferred with `setTimeout` (T0.15 pattern, eslint 0 errors); panel requirements type picker + missing-docs/deadline list via `listVendorsMissingDocuments`; emulator document tests extended. DOC-1 acceptance now truly met. Merged to each `dev` with `--no-ff`.
- 2026-11-08: Week 2 Step 0. Verified Week 1 (GOV-1, S1.1, S1.2, DOC-1) on each `dev`. Wrote `~/Downloads/DEPLOY_PLAN.md`. Recorded portal hosting in section 1.2 (Vercel-oriented secrets; not live). DOC-1 acceptance checkboxes filled; admin UI gaps listed (store-only requirements editor; no missing-docs/deadline list). Process note: PANEL DOC-1 admin screen commit `828a8f4` landed on `dev` without a `chore(merge): bring DOC-1 into dev` merge commit (do not rewrite history). Re-run: PANEL `npm run test:emu` exit 0; portal `npm test` 11 passed, typecheck clean, eslint 1 error / 114 warnings; vendor app `fvm flutter test` 38 passed, `fvm flutter analyze` 5 errors (DOC-1 `documents_screen.dart` imports `cloud_firestore` without a direct dependency).
- 2026-11-08: DOC-1 DONE. Requirements, submit/review callables, portal upload BFF, app documents screen, rules in repo copies (not deployed). Emulator document tests passed.
- 2026-11-08: S1.2 DONE. Gate B OK (full geoBoundaries EGY ADM1, ODbL). resolveBuyerEligibility, suspend modes/holds, canonical migration script, suspension banners. O16 closed. Emulator tests passed.
- 2026-11-08: S1.1 DONE. Session kinds `banned`/`rejected`; reject keeps Auth; reapply callable; portal session via shared callable; panel reject reason UI; portal gate unit tests; vendor app gates/reapply. Emulator `test:emu` passed. Merged to each `dev` and pushed.
- 2026-11-08: GOV-1 DONE. Gate A approved. Mutating `governorates-*` HTTPS handlers require admin Bearer via shared `admin_auth.js`. Reads and validateOrderDelivery stay open. AB-18 recorded (panel/buyer use Firestore SDK). Contract updated. Emulator `test:gov:emu` passed. Repo rules copies already admin-only writes for governorates (no new open-write risk). Deploy blocked until Ahmed reviews console logs for last 30 days of `governorates-*`.
- 2026-11-08: BM-3 brings the source of truth in line with the Master Alignment. Section 0 decision rule. D20 to D29 recorded; D9 superseded by D25. Open items closed with answered by Dn except O6, O15, O16, O18 and three owner details. BR dated notes. AB Fate and Ticket columns. New tickets DL-1, CART-1, DOC-1, VC-1, PTS-1, PAY-1, TH-1 to TH-3, GOV-1. Rescoped S1.1, S1.13, S2.10. Release plan, parked work, 21-row risk register. Contracts and parity updated. Skills wording checked.
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
- 2026-11-06: S2.12 buyer secret-print removal on `fix/S2.12-remove-secret-prints` at `c1d2898`. Analyze 0 errors / 59 warnings. 69 tests passed. Hardcoded Fawaterak tokens and the Google Maps key left for a rotation ticket. Branch not merged into main or buyer dev.
- 2026-11-06: T0.10 emulator suite. D18 closes O7. PANEL `demo-tenderpaws` emulators, seed, suspend smoke test (`npm run test:emu` exit 0). Rules from buyer copy under `emulator-rules/` until T0.14. docs/emulator.md added.
- 2026-11-06: T0.14 GATE A. Live rules exports missing. Repo inventory written under the ticket. Status BLOCKED until the exports exist.
- 2026-11-06: T0.5 locks docs/contracts for Phase 1 and PC domains. vendor_session-resolveVendorSession registered. Section 5 points at the contracts folder.
- 2026-11-08: T0.6b DONE. PANEL `vendor_session-resolveVendorSession` (emulator smoke). VENDOR APP `vendor_repository` + auth gates/screens. GATE C: session error+retry (no fake active, no auto logout); accountGateOf maps kind only (unknown → not_vendor + support); suspended shows reason/expiry. O5 left OPEN.
- 2026-11-08: BM-2 records SEC-1 (Fawaterak tokens out of buyer app via PANEL callable + rotate later), SEC-2 (restrict Google Maps key), O25 (rotation timing), BR-15.4 (Firebase client apiKeys are identifiers). T0.16 vendor remote closed: repo created and `dev` plus `feature/T0.6b-vendor-auth` pushed. No secret values written into this file.
- 2026-11-10: T0.18 DONE. Agent switched from Cursor to Claude Code (Claude Desktop, run from the parent folder); prompts unchanged; Claude files import or link to the Cursor files, which stay canonical.
