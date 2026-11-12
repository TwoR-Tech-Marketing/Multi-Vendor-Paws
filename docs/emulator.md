# Pointing clients at the Firebase emulator suite

The suite lives in the panel repo (`tinderpaws_panel`), where the Cloud Functions source is. Always use project id `demo-tenderpaws`.

Start from `tinderpaws_panel/functions`:

```bash
npm run emulators
```

Full commands and seed details: `../tinderpaws_panel/functions/EMULATOR.md`.

Until the shared rules are in place, the emulator loads Firestore and Storage rules from `tinderpaws_panel/emulator-rules/`, which is a copy of the buyer app rules (the buyer Firestore file includes the events block).

## Vendor web portal (this repo)

With the suite running and seeded, start the portal from this repo:

```bash
npm run dev:demo
```

`scripts/dev-demo.mjs` loads `emulator.env.example`, blanks the service account variables (`GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) so no `.env*` file can supply them, works out the final environment with the same loader Next.js uses, runs a safety check and then starts `next dev` (port 3000, or `PORT`). The check refuses to start, listing variable names only, when:

- any value mentions the production project,
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` or `FIREBASE_PROJECT_ID` does not start with `demo-`, or `GCLOUD_PROJECT` / `GOOGLE_CLOUD_PROJECT` is set to a non `demo-` id,
- an emulator host is missing,
- a service account credential is present.

Variables the template sets:

| Purpose | Variables |
| --- | --- |
| Browser config (demo values) | `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` |
| Browser emulators | `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST` (9099), `NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST` (8080), `NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST` (5001), `NEXT_PUBLIC_STORAGE_EMULATOR_HOST` (9199) |
| Server | `FIREBASE_PROJECT_ID`, `GCLOUD_PROJECT`, `FIREBASE_STORAGE_BUCKET`, `FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST`, `FIREBASE_STORAGE_EMULATOR_HOST`, `FIREBASE_FUNCTIONS_EMULATOR_HOST` |
| Always empty | `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |

How the code uses them:

- Browser SDK (`src/lib/firebase.ts`): when any `NEXT_PUBLIC_*_EMULATOR_HOST` is set, each SDK connects to its emulator once. It throws if a host is set while `NEXT_PUBLIC_FIREBASE_PROJECT_ID` does not start with `demo-`. With no host set, nothing changes.
- Admin SDK (`src/lib/firebase-admin.ts`): when `FIRESTORE_EMULATOR_HOST` and `FIREBASE_AUTH_EMULATOR_HOST` are set and the project id starts with `demo-`, it initializes with only the project id and bucket, no credential. Without those hosts it still requires a service account.
- Server callables use `FIREBASE_FUNCTIONS_EMULATOR_HOST` and the project id from `GCLOUD_PROJECT` or `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.

With `.env.local` copied from `emulator.env.example`, `npm run dev:local` (`scripts/dev-local.mjs`) runs the same check on the shell plus `.env*` files (and also refuses `FIREBASE_TOKEN`), starts or reuses the emulators from `../tinderpaws_panel/functions` (`PANEL_FUNCTIONS_DIR`), seeds them with `npm run seed:demo`, then starts `next dev` with `.env.local`.

Callable base for browser clients: `http://127.0.0.1:5001/demo-tenderpaws/us-central1`.

The Google Maps key is not part of the demo, so the coverage map shows its own missing key state.

## Vendor mobile app (`tender_paws_partner`)

The app already reads `FUNCTIONS_EMULATOR_HOST` through `AppEnv` and calls `useFunctionsEmulator` in `FunctionsClient`.

```bash
flutter run --dart-define=FUNCTIONS_EMULATOR_HOST=127.0.0.1:5001
```

Also point Auth and Firestore at the suite in debug (T0.6b and later tickets) with:

```bash
--dart-define=FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
--dart-define=FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
```

Do not point a release build at the emulators.
