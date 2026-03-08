# Harmonia Deployment Guide

> Last updated: 2026-03-06

This document covers everything needed to run Harmonia locally, deploy to staging/production via CI/CD, and configure all supporting services.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development](#2-local-development)
3. [Environment Strategy](#3-environment-strategy)
4. [CI/CD Pipeline](#4-cicd-pipeline)
5. [Database Options](#5-database-options)
6. [Firebase Setup](#6-firebase-setup)
7. [GitHub Actions Setup](#7-github-actions-setup)
8. [Production Checklist](#8-production-checklist)

---

## 1. Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Runtime (matches CI and Cloud Functions) |
| npm | 10+ | Package manager (ships with Node 20) |
| Git | 2.40+ | Version control |
| Firebase CLI | 13+ | Deployment, emulators, rules management |
| Docker (optional) | 24+ | Local PostgreSQL via `docker compose` |
| PostgreSQL client (optional) | 16 | Running `seed.sql` against a local DB |

### Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Firebase Projects

Three Firebase projects are required, mapped in `.firebaserc`:

| Alias | Project ID | Purpose |
|-------|-----------|---------|
| `default` | `harmonia-dev` | PR preview channels |
| `staging` | `harmonia-staging` | Staging (push to `main`) |
| `production` | `harmonia-production` | Production (git tag `v*`) |

Create them at https://console.firebase.google.com and then link:

```bash
firebase use --add    # Select each project and assign the alias
```

---

## 2. Local Development

### Quick Start

```bash
# Clone the repository
git clone https://github.com/belkli/studio.git
cd studio

# Install dependencies
npm install

# Create local environment file
cp .env.local.example .env.local
# Or create manually — see below for required variables

# Start the dev server (port 9002, Turbopack enabled)
npm run dev
```

### Minimal `.env.local`

```env
# AI keys (placeholders are fine for local dev — GenKit features degrade gracefully)
GEMINI_API_KEY=placeholder_key_to_bypass_check
GOOGLE_API_KEY=placeholder_key_to_bypass_check

# Enable client-side mock data fallback when /api/bootstrap is unavailable
NEXT_PUBLIC_ALLOW_BOOTSTRAP_MOCK_FALLBACK=1
```

### Dev Mode Behaviour

When running locally **without** `FIREBASE_SERVICE_ACCOUNT_KEY`:

| Concern | Behaviour |
|---------|-----------|
| **Authentication** | Bypassed. All requests get a synthetic `site_admin` user (`dev-user`). |
| **Database** | `MemoryAdapter` with in-memory mock seed data from `src/lib/data.ts`. No external DB required. |
| **Secrets** | None needed. Payment, email, and SMS features are no-ops. |
| **i18n** | Fully functional with 4 locales: `he` (default, served at `/`), `en`, `ar`, `ru`. |

The dev bypass is controlled in `src/proxy.ts`:

```typescript
const isDevBypass = process.env.NODE_ENV !== 'production'
  && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
```

And in `src/lib/auth-utils.ts`, `verifyAuth()` returns a synthetic `site_admin` user when the bypass is active.

### Local PostgreSQL (Optional)

To test with a real database instead of the in-memory mock:

```bash
# Start PostgreSQL container
npm run db:start        # docker compose up -d

# Apply schema + seed data
npm run db:setup        # runs schema.sql then seed.sql + repertoire.seed.sql

# Update .env.local
DB_BACKEND=postgres
DATABASE_URL=postgresql://harmonia:harmonia_pass@localhost:5432/harmonia_dev

# Restart dev server
npm run dev
```

Other DB commands:

```bash
npm run db:stop         # docker compose down
npm run db:reset        # Drop all tables + re-create + re-seed
npm run db:studio       # Open Drizzle Kit studio for DB inspection
```

### Firebase Emulators (Optional)

For testing Firestore rules, Cloud Functions, and Auth locally:

```bash
# From project root
firebase emulators:start
```

Emulator ports (configured in `firebase.json`):

| Service | Port |
|---------|------|
| Auth | 9099 |
| Firestore | 8080 |
| Functions | 5001 |
| Storage | 9199 |
| Emulator UI | 4000 |

---

## 3. Environment Strategy

| Environment | Firebase Project | DB Backend | Auth Mode | Build Trigger | URL |
|-------------|-----------------|------------|-----------|---------------|-----|
| **Local dev** | N/A (bypassed) | `mock` (MemoryAdapter) | Dev bypass (synthetic site_admin) | `npm run dev` | `http://localhost:9002` |
| **PR Preview** | `harmonia-dev` | `mock` | Firebase Auth | Pull request opened/updated | `https://harmonia-dev--pr-{n}-{hash}.web.app` |
| **Staging** | `harmonia-staging` | `firebase` | Firebase Auth | Push to `main` | `https://harmonia-staging.web.app` |
| **Production** | `harmonia-production` | `firebase` | Firebase Auth | Git tag `v*` | `https://harmonia.web.app` |

### Environment Variables by Target

| Variable | Local | PR Preview | Staging | Production |
|----------|-------|------------|---------|------------|
| `DB_BACKEND` | `mock` (default) | `mock` | `firebase` | `firebase` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | -- | -- | Secret | Secret (GSM) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | -- | `harmonia-dev` | `harmonia-staging` | `harmonia-production` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | -- | Dev key | Staging key | Production key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | -- | `*.firebaseapp.com` | `*.firebaseapp.com` | `*.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | -- | Dev app ID | Staging app ID | Production app ID |
| `CARDCOM_*` | -- | -- | Test creds | Live creds |
| `TWILIO_*` | -- | -- | Test creds | Live creds |
| `SENDGRID_API_KEY` | -- | -- | Test key | Live key |
| `GOOGLE_API_KEY` | Placeholder | -- | Key | Key (GSM) |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | -- | -- | Test key | Live key |

---

## 4. CI/CD Pipeline

The pipeline is defined in `.github/workflows/ci.yml` and consists of 7 stages:

```
                    +-----------+
                    |   Lint    |  (Stage 1)
                    | ESLint   |
                    | TSC      |
                    | i18n     |
                    +-----+-----+
                          |
                    +-----+-----+
                    |           |
              +-----v---+ +----v------+
              |  Tests  | | DB Tests  |  (Stage 2)
              | Vitest  | | Postgres  |
              +---------+ +-----------+
                    |           |
                    +-----+-----+
                          |
                    +-----v-----+
                    |   Build   |  (Stage 3)
                    | Next.js   |
                    +-----+-----+
                          |
              +-----------+-----------+
              |           |           |
        +-----v---+ +----v----+ +----v--------+
        | Preview | | Staging | | Production  |  (Stage 4)
        |  (PR)   | | (main)  | | (tag v*)    |
        +---------+ +---------+ +-------------+
```

### Stage Details

#### Stage 1: Lint & Typecheck
Runs on every push and PR.

```bash
npm run lint -- --max-warnings 780   # ESLint
npm run typecheck                     # TypeScript (tsc --noEmit)
npm run i18n:audit                    # Translation completeness check
```

#### Stage 2: Unit Tests
Runs after lint passes.

```bash
npm run test -- --run --reporter=verbose   # Vitest
```

#### Stage 2b: DB Integration Tests
Runs in parallel with unit tests (after lint). Spins up a PostgreSQL 16 service container.

```bash
# CI sets: DATABASE_URL=postgresql://harmonia:harmonia_pass@localhost:5432/harmonia_dev
# CI sets: DB_BACKEND=postgres
npm run db:reset
```

#### Stage 3: Build
Runs after both test stages pass.

```bash
npm run build   # Next.js production build (DB_BACKEND=mock)
```

#### Stage 4a: Deploy Preview (PR only)
Creates a Firebase Hosting preview channel that expires after 7 days.

- Channel ID: `pr-{pull_request_number}`
- Project: `harmonia-dev`
- DB: `mock` (self-contained demo data)

#### Stage 4b: Deploy Staging (push to `main`)
Deploys to the live channel of `harmonia-staging`.

- Also deploys Firestore rules, indexes, and storage rules
- DB: `firebase`
- Environment: `staging` (with environment protection in GitHub)

#### Stage 4c: Deploy Production (tag `v*`)
Deploys to the live channel of `harmonia-production`.

- Also deploys Firestore rules, indexes, and storage rules
- DB: `firebase`
- Environment: `production` (with environment protection in GitHub)
- Triggered by pushing a semver tag: `git tag v1.0.0 && git push --tags`

### Useful Local Commands

```bash
npm run dev              # Dev server (Turbopack, port 9002)
npm run build            # Production build
npm run lint             # ESLint
npm run typecheck        # TypeScript check
npm run test             # Vitest (watch mode)
npm run test -- --run    # Vitest (single run)
npm run e2e              # Playwright end-to-end tests
npm run e2e:ui           # Playwright with UI
npm run i18n:audit       # Check translation completeness
npm run i18n:sync        # Sync missing keys from English
npm run db:setup         # Migrate + seed local Postgres
npm run db:reset         # Drop + recreate + seed
```

---

## 5. Database Options

Harmonia supports 5 database backends, controlled by the `DB_BACKEND` environment variable. The resolution logic lives in `src/lib/db/index.ts`:

1. If `DB_BACKEND` is set explicitly, use that value.
2. Else if `DATABASE_URL` is set, use `postgres`.
3. Otherwise, default to `mock`.

### mock (default)

- **Adapter:** `MemoryDatabaseAdapter`
- **Data source:** `src/lib/data.ts` + `src/lib/db/default-memory-seed.ts`
- **Setup:** None. Data lives in-process memory, reset on every server restart.
- **Best for:** Local development, PR previews, demos.
- **Contains:** 85 conservatoriums, 68 teachers, students, parents, lessons, 5,217 compositions, and all supporting data.

### postgres

- **Adapter:** `PostgresAdapter`
- **Required env:** `DATABASE_URL`
- **Setup:**
  ```bash
  npm run db:start     # Start Docker Postgres (or use an external instance)
  npm run db:setup     # Apply schema + seed
  ```
- **Seed file:** `scripts/db/seed.sql` — contains full referential data: 85 conservatoriums, 68 teachers, students, parents, 10 lessons, instruments, and all i18n translations in JSON columns.
- **Best for:** Staging, integration testing, realistic performance testing.

### supabase

- **Adapter:** `SupabaseAdapter`
- **Required env:** `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- **Setup:** Create a Supabase project, apply the same schema (`seed.sql`), set env vars.
- **Best for:** Alternative hosted Postgres with built-in auth and realtime.

### firebase

- **Adapter:** `FirebaseAdapter`
- **Required env:** `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON service account key)
- **Setup:** Data stored in Firestore. Initial data can be imported via Cloud Functions or Admin SDK scripts.
- **Best for:** Production. Fully managed, scales automatically, integrates with Firebase Auth and Storage.

### pocketbase

- **Adapter:** `PocketBaseAdapter`
- **Required env:** `POCKETBASE_URL`
- **Setup:** Run a PocketBase instance, configure collections to match the schema.
- **Best for:** Self-hosted environments where Postgres isn't available.

---

## 6. Firebase Setup

### Project Structure

Each Firebase project (dev, staging, production) should have these services enabled:

- **Authentication** (Email/Password + Google provider)
- **Firestore** (Native mode, `europe-west1` for PDPPA compliance)
- **Storage** (for sheet music, practice videos, signatures, etc.)
- **Functions** (Node.js 20, `europe-west1`)
- **App Hosting** or **Hosting** (for Next.js deployment)

### Firebase App Hosting vs Firebase Hosting

| Feature | Firebase Hosting | Firebase App Hosting |
|---------|-----------------|---------------------|
| Static sites | Yes | Yes |
| SSR (Next.js) | Via Cloud Run (manual) | Native (auto-detected) |
| Preview channels | Yes (PR deploys use this) | Limited |
| Custom domains | Yes | Yes |
| Secret Manager | Manual | Native (`apphosting.yaml`) |
| Auto-scaling | No | Yes (`minInstances` / `maxInstances`) |

**Production uses App Hosting** (`apphosting.yaml`), configured with:
- `minInstances: 1` (avoids cold starts for SLA)
- `maxInstances: 10`
- `cpu: 2`, `memoryMiB: 1024`
- Secrets referenced from Google Secret Manager

**PR Previews and Staging use Firebase Hosting** with the `FirebaseExtended/action-hosting-deploy` GitHub Action.

### Deploying Firestore Rules & Indexes

Rules are defined in:
- `firestore.rules` — RBAC + tenant isolation + PDPPA protections (588 lines)
- `firestore.indexes.json` — 16 composite indexes for lessonSlots, invoices, makeupCredits, practiceLogs, etc.
- `storage.rules` — Storage access rules with PII protections for minors

Deploy manually:

```bash
firebase deploy --only firestore:rules,firestore:indexes --project harmonia-staging
firebase deploy --only storage --project harmonia-staging
```

CI automatically deploys rules on staging and production pushes.

### Deploying Cloud Functions

Functions are in the `functions/` directory (separate `package.json`, Node.js 20):

Currently deployed functions:
- `onUserCreated` — User lifecycle trigger
- `onUserApproved` — Sets custom claims on approval
- `onUserDeleted` — Cleanup trigger
- `onUserParentSync` — Parent/child link sync
- `bookLessonSlot` — Atomic lesson booking (callable)
- `bookMakeupLesson` — Atomic makeup lesson booking (callable)

Deploy:

```bash
cd functions
npm install
npm run build
firebase deploy --only functions --project harmonia-staging
```

Or deploy everything at once:

```bash
firebase deploy --project harmonia-staging
```

---

## 7. GitHub Actions Setup

### Required Repository Secrets

Navigate to **GitHub > Settings > Secrets and variables > Actions** and add:

#### Firebase Deployment

| Secret | Required For | Description |
|--------|-------------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | PR Preview | Service account JSON for `harmonia-dev` |
| `FIREBASE_SERVICE_ACCOUNT_STAGING` | Staging | Service account JSON for `harmonia-staging` |
| `FIREBASE_SERVICE_ACCOUNT_PRODUCTION` | Production | Service account JSON for `harmonia-production` |
| `FIREBASE_PROJECT_ID_DEV` | PR Preview | `harmonia-dev` |
| `FIREBASE_PROJECT_ID_STAGING` | Staging | `harmonia-staging` |
| `FIREBASE_PROJECT_ID_PRODUCTION` | Production | `harmonia-production` |

#### Application Secrets (Staging + Production)

| Secret | Service | Description |
|--------|---------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin | Service account JSON for server-side auth verification |
| `CARDCOM_TERMINAL_NUMBER` | Cardcom | Payment gateway terminal number |
| `CARDCOM_API_NAME` | Cardcom | Payment gateway API name |
| `CARDCOM_API_PASSWORD` | Cardcom | Payment gateway API password |
| `CARDCOM_WEBHOOK_SECRET` | Cardcom | HMAC secret for webhook verification |
| `TWILIO_ACCOUNT_SID` | Twilio | SMS/WhatsApp account SID |
| `TWILIO_AUTH_TOKEN` | Twilio | SMS/WhatsApp auth token |
| `SENDGRID_API_KEY` | SendGrid | Email delivery API key |
| `GOOGLE_API_KEY` | Google AI / GenKit | AI features API key |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Firebase App Check | reCAPTCHA v3 site key |

#### Firebase Service Account Setup

For each Firebase project, create a service account:

1. Go to **Firebase Console > Project Settings > Service Accounts**
2. Click **Generate new private key**
3. Copy the entire JSON content
4. Paste as the value of the corresponding GitHub secret

### GitHub Environments

Configure two protected environments in **GitHub > Settings > Environments**:

- **staging**: Auto-deploy on push to `main`
  - URL: `https://harmonia-staging.web.app`
- **production**: Deploy on tag `v*`
  - URL: `https://harmonia.web.app`
  - (Recommended) Require manual approval for production deploys

---

## 8. Production Checklist

### Firebase Infrastructure

- [ ] 3 Firebase projects created (`harmonia-dev`, `harmonia-staging`, `harmonia-production`)
- [ ] `.firebaserc` aliases configured for all 3 projects
- [ ] Firestore enabled in Native mode, `europe-west1` region
- [ ] Firebase Storage enabled, `europe-west1` region
- [ ] Firebase Authentication enabled (Email/Password + Google)
- [ ] Firestore rules deployed (`firestore.rules`)
- [ ] Firestore indexes deployed (`firestore.indexes.json`)
- [ ] Storage rules deployed (`storage.rules`)
- [ ] Cloud Functions deployed to all environments
- [ ] Firebase App Hosting configured for production (`apphosting.yaml`)
- [ ] Custom domain configured in Firebase App Hosting

### Google Secret Manager (Production)

- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY` stored in Secret Manager
- [ ] `CARDCOM_TERMINAL_NUMBER` stored (live credentials, not test)
- [ ] `CARDCOM_API_NAME` stored
- [ ] `CARDCOM_API_PASSWORD` stored
- [ ] `CARDCOM_WEBHOOK_SECRET` stored
- [ ] `TWILIO_ACCOUNT_SID` stored
- [ ] `TWILIO_AUTH_TOKEN` stored
- [ ] `SENDGRID_API_KEY` stored
- [ ] `GOOGLE_API_KEY` stored

### GitHub

- [ ] All repository secrets set (see Section 7)
- [ ] `staging` environment created with URL
- [ ] `production` environment created with URL and approval gate

### Third-Party Services

- [ ] **Cardcom**: Live payment terminal activated (not test mode)
- [ ] **SendGrid**: Sender domain verified and authenticated (SPF/DKIM/DMARC)
- [ ] **Twilio**: Phone number provisioned for SMS + WhatsApp
- [ ] **Firebase App Check**: reCAPTCHA v3 provider enabled, site key configured

### Security

- [ ] Firebase App Check enabled on all client-facing APIs
- [ ] `CARDCOM_WEBHOOK_SECRET` set (enables HMAC validation in proxy)
- [ ] Firestore security rules reviewed (RBAC + tenant isolation + PDPPA)
- [ ] Storage rules reviewed (PII protections for minor recordings)
- [ ] No test/placeholder credentials in production environment

### Operational

- [ ] Firestore automatic backup schedule configured (daily)
- [ ] Firebase Alerts configured for Functions errors
- [ ] Monitoring dashboard set up in Google Cloud Console
- [ ] Error reporting enabled (Firebase Crashlytics or Google Cloud Error Reporting)
- [ ] `minInstances: 1` in `apphosting.yaml` to avoid cold starts

### Release Process

```bash
# 1. Ensure main is up to date and CI passes
git checkout main
git pull

# 2. Create a version tag
git tag v1.0.0 -m "Release 1.0.0: Initial production launch"
git push --tags

# 3. CI will:
#    - Run all checks (lint, typecheck, i18n, tests)
#    - Build with DB_BACKEND=firebase
#    - Deploy to harmonia-production
#    - Deploy Firestore rules + indexes + storage rules
```
