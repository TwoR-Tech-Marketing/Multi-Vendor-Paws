# Production Security — TenderPaws Vendor Portal

## Session model

- **Primary session:** httpOnly cookie `__session` (Firebase session cookie, max 14 days).
- **Client Firebase user:** derived from the session only. The client signs out after the session exchange; before a shared callable or Storage upload, `ensureClientAuth()` fetches a custom token for the session uid and signs in with tab-scoped (session storage) persistence. Nothing long-lived is kept in IndexedDB.
- **Theme/locale:** `localStorage` only (`tp-vendor-theme`, `tp-vendor-locale`).

## Local development setup

Login will fail until Firebase Admin credentials are configured. **Easiest option:**

1. Open [Firebase Console](https://console.firebase.google.com/) → project **pets-acd3f**
2. **Project settings** → **Service accounts** → **Generate new private key** (downloads a `.json` file)
3. Save that file as `firebase-service-account.json` in the project root (already gitignored)
4. In `.env.local`:

```env
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
FIREBASE_PROJECT_ID=pets-acd3f
```

5. Restart `npm run dev`

**Alternative (Vercel / production):** copy `client_email` and `private_key` from the JSON into env vars:

```env
FIREBASE_PROJECT_ID=pets-acd3f
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@pets-acd3f.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

Never commit the JSON file or private key to git.

## Required server environment variables

Set in hosting secrets (Vercel, etc.). Never prefix with `NEXT_PUBLIC_`.

| Variable | Description |
|----------|-------------|
| `FIREBASE_PROJECT_ID` | Firebase project ID (`pets-acd3f`) |
| `FIREBASE_CLIENT_EMAIL` | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Service account private key (escape newlines as `\n`) |

## Auth flow

1. Client signs in with Firebase Auth (email/password) → obtains ID token.
2. `POST /api/auth/session` with `{ idToken }` → server verifies token, resolves vendor session, sets `__session` cookie.
3. Client calls `signOutVendor()` to clear Firebase client auth.
4. `GET /api/auth/me` returns minimal session DTO for portal bootstrap.
5. Shared callables go through `invokeCallable()` ([`src/lib/callable.ts`](../src/lib/callable.ts)), which first awaits `ensureClientAuth()` ([`src/lib/client-auth.ts`](../src/lib/client-auth.ts)). When the client user is missing or not yet confirmed for this page, it calls `POST /api/auth/firebase-token`, which verifies the `__session` cookie (with revocation check) and returns `{ token, uid }`: an Admin `createCustomToken` for the session uid, no extra claims, nothing read from the request body, `Cache-Control: no-store`, cross-site requests refused. A different client uid is replaced by signing in with that token. Concurrent callers share one request. A 401 clears the client user and surfaces as `functions/unauthenticated`.
6. `POST /api/auth/logout` revokes refresh tokens and clears cookie; the portal also signs the client Firebase user out. A missing session at portal bootstrap does the same.

## Route protection

- **Middleware** ([`src/middleware.ts`](../src/middleware.ts)): portal routes require cookie presence; auth routes redirect when cookie exists.
- **API routes**: full session verification via Firebase Admin `verifySessionCookie`.
- **BFF** ([`src/app/api/vendor/*`](../src/app/api/vendor/)): vendor data never read directly from Firestore in the browser.

## BFF endpoints (vendor)

| Route | Access |
|-------|--------|
| `GET/PATCH /api/vendor/profile` | Authenticated vendor |
| `GET /api/vendor/products` | Active vendor only |
| `GET /api/vendor/orders` | Active vendor only |
| `GET /api/vendor/earnings` | Active vendor only |
| `GET /api/vendor/notifications` | Authenticated vendor |
| `POST /api/auth/firebase-token` | Valid session cookie; custom token for the session uid only |

## Firestore rules

Deploy [`firestore.rules`](../firestore.rules) to Firebase:

```bash
firebase deploy --only firestore:rules
```

Rules enforce vendor isolation even if someone bypasses the Next.js app.

## Firebase App Check (production)

1. In Firebase Console → App Check → register the web app.
2. Use reCAPTCHA Enterprise (or v3) for production.
3. Enforce App Check on Firestore, Cloud Functions, and Storage.
4. Use debug tokens only in local development.

## Production build hardening

Configured in [`next.config.ts`](../next.config.ts) when `NODE_ENV=production`:

- No browser source maps
- Strip `console.*` (except `console.error`)
- Security headers (CSP, HSTS, X-Frame-Options, etc.)

## Deployment checklist

- [ ] Service account env vars set on host
- [ ] `firestore.rules` deployed
- [ ] App Check enforced in Firebase project
- [ ] HTTPS enabled (required for `Secure` cookies)
- [ ] Smoke test: login → cookie set → `/api/auth/me` → dashboard → logout
- [ ] Verify DevTools: no Firestore requests for profile data (only `/api/vendor/*`)

## What cannot be hidden in the browser

Users with DevTools will always see requests to your domain. Security is enforced by **authorization**, not by hiding network traffic. Do not put secrets in client bundles or API responses.
