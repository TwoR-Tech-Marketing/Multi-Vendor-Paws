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

2. Firebase web config is already prefilled in `.env.example` for Tender Paws (`pets-acd3f`).
   If you need custom values, copy `.env.example` to `.env.local` and edit.

3. Run dev server:

```bash
npm run dev
```

## Project Structure

- `src/app` - routes and pages
- `src/lib/firebase.ts` - Firebase initialization
- `src/lib/auth.ts` - auth helpers and identity subscription
- `src/app/login` - vendor sign-in screen
- `src/app/dashboard` - identity-protected dashboard

## Planning Documents

- `PROJECT_ARCHITECTURE.md` - target architecture for multi-vendor implementation
- `PHASE3_TODO.md` - actionable checklist based on approved Phase 3 scope

## Agent Rules

- `AGENTS.md` - project-level agent instructions
- `.cursor/rules/nextjs-senior-architecture.mdc` - always-on architecture rule
