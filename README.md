# Multi-Vendor-Paws

Base Next.js project for TenderPaws multi-vendor web platform.

## Stack

- Next.js (App Router)
- TypeScript
- Firebase (Auth, Firestore, Storage)

## Setup

1. Install dependencies:

```bash
npm install
```

2. For a real Firebase project, copy `.env.example` to `.env.local` and fill in your own values.
   The template holds placeholders only. For local work use the demo below instead.

3. Run dev server:

```bash
npm run dev
```

4. Check the portal:

```bash
npm test
npm run lint
npm run typecheck
```

`npm test` runs Vitest. The first tests cover session body validation and product create validation.

## Local demo against the Firebase emulators

Run the portal against the local Firebase emulators with demo data only:

```bash
npm run dev:demo
```

- The emulators must already be running, seeded from the panel repo (`tinderpaws_panel`). See `docs/emulator.md`.
- The script loads `emulator.env.example` (project `demo-tenderpaws`, all emulator hosts on 127.0.0.1) and starts `next dev` on port 3000, or on `PORT` when set.
- It refuses to start if the final environment could reach a real project: a non `demo-` project id, a missing emulator host, or any service account credential. Problems are listed by variable name only.
- Service account variables are blanked for the demo, so a `.env.local` cannot supply credentials. Other `.env.local` values still load; move `.env.local` aside if the check complains.

When the public Firebase variables are missing, the auth and portal screens show a configuration screen instead of crashing. In development it names the missing variables.

## Project Structure

- `src/app` - routes and pages
- `src/lib/firebase.ts` - Firebase initialization
- `src/lib/auth.ts` - auth helpers and identity subscription
- `src/app/login` - vendor sign-in screen
- `src/app/dashboard` - identity-protected dashboard

## Planning Documents

Project documentation is maintained privately. See `docs/README.md`.

## Agent Rules

- `AGENTS.md` - project-level agent instructions
- `.cursor/rules/nextjs-senior-architecture.mdc` - always-on architecture rule

## Prototype (client approval)

- `docs/prototype` — desktop **website** UI prototype (vendor + admin portal)
- Two brand themes: **Orange** (mobile app) and **Purple** (admin panel)
- See `docs/prototype/README.md` for screen list and how to open
