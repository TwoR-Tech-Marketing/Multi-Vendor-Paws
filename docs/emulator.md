# Pointing clients at the Firebase emulator suite (T0.10)

The suite lives in the panel repo (`tinderpaws_panel`), where the Cloud Functions source is. Always use project id `demo-tenderpaws`.

Start from `tinderpaws_panel/functions`:

```bash
npm run emulators
```

Full commands and seed details: `../tinderpaws_panel/functions/EMULATOR.md`.

Until T0.14, the emulator loads Firestore and Storage rules from `tinderpaws_panel/emulator-rules/`, which is a copy of the buyer app rules (the buyer Firestore file includes the events block).

## Vendor web portal (this repo)

For local Next.js work against the suite:

1. Keep production Firebase env values out of the process.
2. Set:

```bash
export NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-tenderpaws
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
export FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
export NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST=127.0.0.1:5001
```

3. When a portal ticket wires the client Firebase SDK or Admin SDK for emulator hosts, use those variables. Existing BFF routes that use the Admin SDK pick up `FIRESTORE_EMULATOR_HOST` and `FIREBASE_AUTH_EMULATOR_HOST` automatically when set.

Callable base for browser clients: `http://127.0.0.1:5001/demo-tenderpaws/us-central1`.

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
