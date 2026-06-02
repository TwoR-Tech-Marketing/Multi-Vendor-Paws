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

2. Create `.env.local` from `.env.example` and fill Firebase values.

3. Run dev server:

```bash
npm run dev
```

## Project Structure

- `src/app` - routes and pages
- `src/lib/firebase.ts` - Firebase initialization
