## CI/CD & Infrastructure

> **Time estimate:** 2--4 hours from scratch.
> All commands are copy-pasteable. All config is derived from the actual project files.

---

### Environment Strategy

Lyriosa runs in 4 environments. The database backend, auth mode, and secrets differ per environment.

| Environment | Firebase Project | DB Backend | Auth Mode | Trigger | URL |
|---|---|---|---|---|---|
| **Local dev** | N/A | `mock` (in-memory) | Dev bypass (synthetic site_admin) | `npm run dev` | `http://localhost:9002` |
| **PR Preview** | `harmonia-dev` | `mock` | Firebase Auth | PR opened/updated | `pr-{n}.harmonia-dev.web.app` |
| **Staging** | `harmonia-staging` | `firebase` | Firebase Auth | Push to `main` | `harmonia-staging.web.app` |
| **Production** | `harmonia-production` | `firebase` | Firebase Auth | Tag `v*` | `harmonia.web.app` |

#### Environment Variables by Target

| Variable | Local | PR Preview | Staging | Production |
|---|---|---|---|---|
| `DB_BACKEND` | `mock` (default) | `mock` | `firebase` | `firebase` |
| `AUTH_PROVIDER` | unset (dev bypass) | `firebase` | `firebase` | `firebase` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | -- | -- | Secret | Secret (GSM) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | -- | `harmonia-dev` | `harmonia-staging` | `harmonia-production` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | -- | Dev key | Staging key | Production key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | -- | `*.firebaseapp.com` | `*.firebaseapp.com` | `*.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | -- | Dev app ID | Staging app ID | Production app ID |
| `CARDCOM_*` | -- | -- | Test creds | Live creds (GSM) |
| `TWILIO_*` | -- | -- | Test creds | Live creds (GSM) |
| `SENDGRID_API_KEY` | -- | -- | Test key | Live key (GSM) |
| `GOOGLE_API_KEY` | Placeholder | -- | Key | Key (GSM) |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | -- | -- | Test key | Live key |

#### Dev Mode Behaviour

When running locally **without** `FIREBASE_SERVICE_ACCOUNT_KEY`:

| Concern | Behaviour |
|---|---|
| **Authentication** | Bypassed. `proxy.ts` injects synthetic `site_admin` claims. `verifyAuth()` returns dev user. |
| **Database** | `MemoryAdapter` with in-memory mock seed from `src/lib/data.ts`. 85 conservatoriums, 484 teachers, 5,217 compositions. |
| **Secrets** | None needed. Payment, email, and SMS features are no-ops. |
| **i18n** | Fully functional: `he` (default at `/`), `en`, `ar`, `ru`. |

The bypass is controlled by:

```typescript
// src/proxy.ts
const isDevBypass = process.env.NODE_ENV !== 'production'
  && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
```

#### Minimal `.env.local`

```env
GEMINI_API_KEY=placeholder_key_to_bypass_check
GOOGLE_API_KEY=placeholder_key_to_bypass_check
NEXT_PUBLIC_ALLOW_BOOTSTRAP_MOCK_FALLBACK=1
```

---

### Database Backends

Lyriosa supports 5 database backends via the `DB_BACKEND` env var. The resolution logic in `src/lib/db/index.ts`:

1. If `DB_BACKEND` is set explicitly, use that value.
2. Else if `DATABASE_URL` is set, use `postgres`.
3. Otherwise, default to `mock`.

| Backend | Adapter | Best For | Required Env Vars |
|---|---|---|---|
| **mock** (default) | `MemoryDatabaseAdapter` | Local dev, PR previews, demos | None |
| **postgres** | `PostgresAdapter` | Integration testing, self-hosted | `DATABASE_URL` |
| **firebase** | `FirebaseAdapter` (503 lines) | Staging + Production | `FIREBASE_SERVICE_ACCOUNT_KEY` |
| **supabase** | `SupabaseAdapter` | Alternative hosted Postgres | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` |
| **pocketbase** | `PocketBaseAdapter` | Ultra-lightweight single-tenant | `POCKETBASE_URL` |

#### Local PostgreSQL via Docker

```bash
# Start Postgres container
npm run db:start        # docker compose up -d

# Apply schema + seed data
npm run db:setup        # runs schema.sql + seed.sql + repertoire.seed.sql

# Update .env.local
# DB_BACKEND=postgres
# DATABASE_URL=postgresql://harmonia:harmonia_pass@localhost:5432/harmonia_dev

npm run dev             # restart dev server
```

The `docker-compose.yml` runs Postgres 16 Alpine with auto-init from `scripts/db/schema.sql` and `scripts/db/seed.sql`. The schema uses row-level tenant isolation (`conservatorium_id` on every table), JSONB for i18n columns (`{he, en, ru, ar}`), and PostgreSQL enums for `user_role` and `lesson_status`.

Other DB commands:

```bash
npm run db:stop         # docker compose down
npm run db:reset        # Drop all tables + recreate + reseed
npm run db:studio       # Open Drizzle Kit studio for DB inspection
```

---

### Auth Provider Abstraction

Authentication is decoupled from any specific backend via `AUTH_PROVIDER` env var (`firebase` | `supabase`). Both providers are implemented.

| Provider | Cookie/Session | Custom Claims Storage | Env Vars |
|---|---|---|---|
| **firebase** (default) | `__session` cookie (14-day), Firebase Admin `verifySessionCookie()` | Firebase Custom Claims on Auth token | `FIREBASE_SERVICE_ACCOUNT_KEY`, `NEXT_PUBLIC_FIREBASE_*` |
| **supabase** | Supabase session cookie via `@supabase/ssr` | `app_metadata` on `auth.users` | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `NEXT_PUBLIC_SUPABASE_*` |
| **none** (local dev) | Dev bypass | Synthetic `site_admin` | (none) |

Architecture: `src/lib/auth/provider.ts` defines `IAuthProvider` interface. `getAuthProvider()` factory reads `AUTH_PROVIDER` at boot. All auth-consuming code (`auth-utils.ts`, `proxy.ts`, login/logout routes, `actions/auth.ts`) calls the interface -- never Firebase or Supabase directly.

See `docs/AUTH_PROVIDERS.md` for env var reference and `docs/plans/2026-03-09-auth-provider-abstraction.md` for the full implementation plan.

---

### GitHub Repository Setup

#### Create the Repository

```bash
gh repo create harmonia --private --source=. --push
```

#### Branch Protection Rules

Go to **Settings > Branches > Add branch protection rule** or run:

```bash
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint & Typecheck",
      "Tests",
      "DB Integration",
      "Next.js Build"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

- [ ] **Required status checks**: `Lint & Typecheck`, `Tests`, `DB Integration`, `Next.js Build`
- [ ] **Require branches to be up to date** before merging: ON
- [ ] **Require pull request reviews**: 1 approval minimum
- [ ] **Dismiss stale reviews**: ON
- [ ] **Require linear history**: ON
- [ ] **Allow force pushes / deletions**: OFF

#### GitHub Secrets

**Settings > Secrets and variables > Actions.**

##### Firebase Deployment Secrets

| Secret | Where to Get It | Used By |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Console > Project Settings > Service Accounts > Generate new private key (DEV). Paste full JSON. | Preview deploys |
| `FIREBASE_PROJECT_ID_DEV` | Firebase Console > Project Settings > General (dev) | Preview deploys |
| `FIREBASE_SERVICE_ACCOUNT_STAGING` | Same flow, STAGING project | Staging deploy |
| `FIREBASE_PROJECT_ID_STAGING` | Firebase Console (staging) | Staging deploy |
| `FIREBASE_SERVICE_ACCOUNT_PRODUCTION` | Same flow, PRODUCTION project | Production deploy |
| `FIREBASE_PROJECT_ID_PRODUCTION` | Firebase Console (production) | Production deploy |

##### Application Secrets (Staging + Production)

| Secret | Service | Description |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin | Server-side auth verification (base64 JSON) |
| `CARDCOM_TERMINAL_NUMBER` | Cardcom | Payment terminal number |
| `CARDCOM_API_NAME` | Cardcom | Payment API name |
| `CARDCOM_API_PASSWORD` | Cardcom | Payment API password |
| `CARDCOM_WEBHOOK_SECRET` | Cardcom | HMAC secret for webhook verification |
| `TWILIO_ACCOUNT_SID` | Twilio | SMS/WhatsApp account SID |
| `TWILIO_AUTH_TOKEN` | Twilio | SMS/WhatsApp auth token |
| `SENDGRID_API_KEY` | SendGrid | Email delivery |
| `GOOGLE_API_KEY` | Google AI / Genkit | AI flows (Gemini) |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Firebase App Check | reCAPTCHA v3 site key |

**How to create a Firebase service account secret:**

```bash
# 1. Download JSON key from Firebase Console > Service Accounts
# 2. Base64-encode (for FIREBASE_SERVICE_ACCOUNT_KEY in apphosting.yaml)
cat path/to/serviceAccountKey.json | base64 -w 0

# 3. Add to GitHub Secrets (paste raw JSON, NOT base64, for deploy actions)
gh secret set FIREBASE_SERVICE_ACCOUNT < path/to/dev-key.json
gh secret set FIREBASE_PROJECT_ID_DEV --body "harmonia-dev"
gh secret set FIREBASE_SERVICE_ACCOUNT_STAGING < path/to/staging-key.json
gh secret set FIREBASE_PROJECT_ID_STAGING --body "harmonia-staging"
gh secret set FIREBASE_SERVICE_ACCOUNT_PRODUCTION < path/to/prod-key.json
gh secret set FIREBASE_PROJECT_ID_PRODUCTION --body "harmonia-production"
```

#### GitHub Environments

**Settings > Environments:**

1. **staging** -- no special protections (auto-deploys on merge to main). URL: `https://harmonia-staging.web.app`
2. **production** -- require manual approval, deployment branches: tags only (`v*`). URL: `https://harmonia.web.app`

---

### GitHub Actions CI/CD Pipeline

#### Pipeline Architecture

```
                    +-----------+
                    |   Lint    |  Stage 1
                    | ESLint   |
                    | TSC      |
                    | i18n     |
                    +-----+-----+
                          |
                    +-----+-----+
                    |           |
              +-----v---+ +----v------+
              |  Tests  | | DB Tests  |  Stage 2 (parallel)
              | Vitest  | | Postgres  |
              +---------+ +-----------+
                    |           |
                    +-----+-----+
                          |
                    +-----v-----+
                    |   Build   |  Stage 3
                    | Next.js   |
                    +-----+-----+
                          |
              +-----------+-----------+
              |           |           |
        +-----v---+ +----v----+ +----v--------+
        | Preview | | Staging | | Production  |  Stage 4
        |  (PR)   | | (main)  | | (tag v*)    |
        +---------+ +---------+ +-------------+
```

#### Complete Workflow: `.github/workflows/ci.yml`

```yaml
name: CI/CD

on:
  push:
    branches:
      - main
    tags:
      - 'v*'
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

env:
  NODE_VERSION: '20'

jobs:
  # --------------------------------------------------------
  # Stage 1: Lint + Type Check + i18n Audit
  # --------------------------------------------------------
  lint:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: ESLint
        run: npm run lint -- --max-warnings 780

      - name: TypeScript type check
        run: npm run typecheck

      - name: Validate translations
        run: npm run i18n:audit

  # --------------------------------------------------------
  # Stage 2a: Unit & Integration Tests (Vitest)
  # --------------------------------------------------------
  test:
    name: Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run Vitest
        run: npm run test -- --run --reporter=verbose

  # --------------------------------------------------------
  # Stage 2b: Database Integration Test (Postgres 16)
  # --------------------------------------------------------
  db-test:
    name: DB Integration
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: harmonia
          POSTGRES_PASSWORD: harmonia_pass
          POSTGRES_DB: harmonia_dev
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U harmonia -d harmonia_dev"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 10
    env:
      DATABASE_URL: postgresql://harmonia:harmonia_pass@localhost:5432/harmonia_dev
      DB_BACKEND: postgres
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - name: Install PostgreSQL client
        run: sudo apt-get update && sudo apt-get install -y postgresql-client

      - name: Install dependencies
        run: npm ci

      - name: Run DB schema migration
        run: npm run db:reset

  # --------------------------------------------------------
  # Stage 3: Next.js Build
  # --------------------------------------------------------
  build:
    name: Next.js Build
    runs-on: ubuntu-latest
    needs: [test, db-test]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build Next.js
        run: npm run build
        env:
          DB_BACKEND: mock

  # --------------------------------------------------------
  # Stage 4a: Deploy Preview (on PR)
  # --------------------------------------------------------
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    permissions:
      pull-requests: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          DB_BACKEND: mock

      - name: Deploy to Firebase Hosting Preview Channel
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: ${{ secrets.FIREBASE_PROJECT_ID_DEV }}
          channelId: pr-${{ github.event.pull_request.number }}
          expires: 7d

  # --------------------------------------------------------
  # Stage 4b: Deploy Staging (merge to main)
  # --------------------------------------------------------
  deploy-staging:
    name: Deploy Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: staging
      url: https://harmonia-staging.web.app
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          DB_BACKEND: firebase

      - name: Deploy to Firebase Hosting (Staging)
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_STAGING }}
          projectId: ${{ secrets.FIREBASE_PROJECT_ID_STAGING }}
          channelId: live

      - name: Deploy Firestore Rules & Indexes
        uses: w9jds/firebase-action@v13.22.1
        with:
          args: deploy --only firestore:rules,firestore:indexes,storage --project ${{ secrets.FIREBASE_PROJECT_ID_STAGING }}
        env:
          GCP_SA_KEY: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_STAGING }}

  # --------------------------------------------------------
  # Stage 4c: Deploy Production (tag v*)
  # --------------------------------------------------------
  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    environment:
      name: production
      url: https://harmonia.web.app
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          DB_BACKEND: firebase

      - name: Deploy to Firebase Hosting (Production)
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_PRODUCTION }}
          projectId: ${{ secrets.FIREBASE_PROJECT_ID_PRODUCTION }}
          channelId: live

      - name: Deploy Firestore Rules & Indexes
        uses: w9jds/firebase-action@v13.22.1
        with:
          args: deploy --only firestore:rules,firestore:indexes,storage --project ${{ secrets.FIREBASE_PROJECT_ID_PRODUCTION }}
        env:
          GCP_SA_KEY: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_PRODUCTION }}
```

#### How the Pipeline Triggers

| Trigger | What Happens |
|---|---|
| Push to any branch | Lint + Typecheck + Unit Tests + DB Test + Build |
| Open/update a PR | All above + Firebase Preview Channel (`pr-123.harmonia-dev.web.app`, 7-day expiry). Auto-comment on PR. |
| Merge to `main` | All checks + deploy Staging + Firestore rules/indexes |
| Push tag `v*` | All checks + deploy Production + Firestore rules/indexes |

#### Caching & Concurrency

**Cache:** `actions/setup-node@v4` with `cache: npm` caches `~/.npm` keyed on `package-lock.json` hash.

**Concurrency:** PRs cancel in-progress runs for the same branch. Pushes to `main` queue sequentially.

#### How to Release

```bash
git checkout main && git pull origin main
git tag v1.0.0 -m "Release 1.0.0: Initial production launch"
git push origin v1.0.0
# CI runs all checks -> deploys production -> deploys Firestore rules
```

**Rollback:** tag the last known-good commit with a new version and push.

#### Future: E2E Tests in CI

```yaml
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
        env:
          DB_BACKEND: mock
      - run: npx playwright test --reporter=html
        env:
          CI: true
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

Playwright config already handles CI: `forbidOnly`, `retries: 2`, `workers: 1`.

---

### Firebase Configuration

#### Firebase Projects

| Environment | Project ID | Purpose |
|---|---|---|
| Dev | `harmonia-dev` | PR preview channels, emulators |
| Staging | `harmonia-staging` | Pre-production (merge to `main`) |
| Production | `harmonia-production` | Live site (tag `v*`) |

Configured in `.firebaserc`:

```json
{
  "projects": {
    "default": "harmonia-dev",
    "staging": "harmonia-staging",
    "production": "harmonia-production"
  }
}
```

#### Create Firebase Projects

**Repeat for each project (dev, staging, production):**

- [ ] [Firebase Console](https://console.firebase.google.com/) > Add project
- [ ] Name: `harmonia-dev` / `harmonia-staging` / `harmonia-production`
- [ ] Region: **`europe-west1`** (Belgium) -- PDPPA compliance (`me-central1` lacks App Hosting support)
- [ ] Enable services:
  - [ ] **Authentication** > Email/Password, Google, Microsoft
  - [ ] **Firestore** > Native mode, `europe-west1`
  - [ ] **Cloud Storage** > `europe-west1`
  - [ ] **Hosting** > Get started
  - [ ] **Cloud Functions** > Enable (requires Blaze plan)

#### Firebase App Hosting vs Firebase Hosting

| Feature | Firebase Hosting | Firebase App Hosting |
|---|---|---|
| Static sites | Yes | Yes |
| SSR (Next.js) | Via Cloud Run (manual) | Native (auto-detected) |
| Preview channels | Yes (PR deploys use this) | Limited |
| Custom domains | Yes | Yes |
| Secret Manager | Manual | Native (`apphosting.yaml`) |
| Auto-scaling | No | Yes (`minInstances`/`maxInstances`) |

**Production uses App Hosting** (`apphosting.yaml`). **PR Previews and Staging use Firebase Hosting** via the `FirebaseExtended/action-hosting-deploy` GitHub Action.

#### Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase projects:list

firebase use default        # harmonia-dev
firebase use staging        # harmonia-staging
firebase use production     # harmonia-production
```

#### Firebase App Hosting Config

`apphosting.yaml` (project root):

```yaml
runConfig:
  minInstances: 1       # avoid cold starts
  maxInstances: 10
  cpu: 2
  memoryMiB: 1024

env:
  - variable: DB_BACKEND
    value: firebase
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: harmonia-production
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    value: REPLACE_WITH_FIREBASE_API_KEY
  - variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    value: harmonia-production.firebaseapp.com
  - variable: NEXT_PUBLIC_FIREBASE_APP_ID
    value: REPLACE_WITH_FIREBASE_APP_ID
  - variable: FIREBASE_SERVICE_ACCOUNT_KEY
    secret: FIREBASE_SERVICE_ACCOUNT_KEY
  - variable: CARDCOM_TERMINAL_NUMBER
    secret: CARDCOM_TERMINAL_NUMBER
  - variable: CARDCOM_API_NAME
    secret: CARDCOM_API_NAME
  - variable: CARDCOM_API_PASSWORD
    secret: CARDCOM_API_PASSWORD
  - variable: CARDCOM_WEBHOOK_SECRET
    secret: CARDCOM_WEBHOOK_SECRET
  - variable: TWILIO_ACCOUNT_SID
    secret: TWILIO_ACCOUNT_SID
  - variable: TWILIO_AUTH_TOKEN
    secret: TWILIO_AUTH_TOKEN
  - variable: SENDGRID_API_KEY
    secret: SENDGRID_API_KEY
  - variable: GOOGLE_API_KEY
    secret: GOOGLE_API_KEY
  - variable: NEXT_PUBLIC_RECAPTCHA_SITE_KEY
    value: REPLACE_WITH_RECAPTCHA_SITE_KEY
```

#### Google Secret Manager

```bash
gcloud config set project harmonia-production

# Create each secret
echo -n "VALUE" | gcloud secrets create FIREBASE_SERVICE_ACCOUNT_KEY --data-file=-
echo -n "VALUE" | gcloud secrets create CARDCOM_TERMINAL_NUMBER --data-file=-
echo -n "VALUE" | gcloud secrets create CARDCOM_API_NAME --data-file=-
echo -n "VALUE" | gcloud secrets create CARDCOM_API_PASSWORD --data-file=-
echo -n "VALUE" | gcloud secrets create CARDCOM_WEBHOOK_SECRET --data-file=-
echo -n "VALUE" | gcloud secrets create TWILIO_ACCOUNT_SID --data-file=-
echo -n "VALUE" | gcloud secrets create TWILIO_AUTH_TOKEN --data-file=-
echo -n "VALUE" | gcloud secrets create SENDGRID_API_KEY --data-file=-
echo -n "VALUE" | gcloud secrets create GOOGLE_API_KEY --data-file=-

# Grant App Hosting service account access (repeat per secret)
gcloud secrets add-iam-policy-binding FIREBASE_SERVICE_ACCOUNT_KEY \
  --member="serviceAccount:harmonia-app@harmonia-production.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

#### Cloud Functions Deployment

6 functions deployed to `europe-west1`, Node.js 20:

| Function | Type | Purpose |
|---|---|---|
| `onUserApproved` | Firestore trigger | Sets Custom Claims (`role`, `conservatoriumId`, `approved`) |
| `onUserCreated` | Firestore trigger | New user lifecycle, welcome notification |
| `onUserDeleted` | Firestore trigger | Token revocation, data archival |
| `onUserParentSync` | Firestore trigger | Syncs `parentOf/{parentId_studentId}` documents |
| `bookLessonSlot` | Callable | Atomic booking: validate > check availability > room lock > deduct credit > create slot |
| `bookMakeupLesson` | Callable | Atomic makeup redemption: verify AVAILABLE > create slot + mark REDEEMED |

```bash
cd functions && npm install && npm run build && cd ..
firebase deploy --only functions --project harmonia-staging
```

#### Firestore Rules & Indexes

- `firestore.rules` -- 585 lines, RBAC + tenant isolation for 40+ collections
- `firestore.indexes.json` -- 17 composite indexes
- `storage.rules` -- PII protections for minors

```bash
firebase deploy --only firestore:rules,firestore:indexes --project harmonia-staging
firebase deploy --only storage --project harmonia-staging
```

CI deploys rules automatically on staging and production pushes.

#### Firebase Emulators

Configured in `firebase.json`:

| Emulator | Port |
|---|---|
| Auth | 9099 |
| Firestore | 8080 |
| Functions | 5001 |
| Storage | 9199 |
| Emulator UI | 4000 |

```bash
firebase emulators:start
# With persistence:
firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data
```

---

### Vercel Configuration (Alternative to Firebase Hosting)

To use Vercel instead of Firebase Hosting, replace the deploy stages in `ci.yml`.

#### Project Setup

```bash
npm install -g vercel
vercel link      # follow prompts
vercel --prod    # manual test deploy
```

#### Vercel Project Settings

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Build Command | `npm run build` |
| Output Directory | `.next` (auto-detected) |
| Install Command | `npm ci` |
| Node.js Version | 20.x |

#### Environment Variables (Vercel Dashboard)

**All environments:**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your project ID |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Your app ID |

**Production only:**

| Variable | Value |
|---|---|
| `DB_BACKEND` | `firebase` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Base64-encoded service account JSON |
| `GOOGLE_API_KEY` | Gemini API key |

**Preview only:**

| Variable | Value |
|---|---|
| `DB_BACKEND` | `mock` |
| `NEXT_PUBLIC_ALLOW_BOOTSTRAP_MOCK_FALLBACK` | `1` |

#### Password Protection (Demo Gate)

- [ ] **Project Settings > Deployment Protection** > Enable Password Protection
- [ ] Set password (e.g., `harmonia-demo-2026`)

#### CI/CD Deploy Stages for Vercel

```yaml
  deploy-preview:
    name: Deploy Preview (Vercel)
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          github-comment: true

  deploy-staging:
    name: Deploy Staging (Vercel)
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    name: Deploy Production (Vercel)
    runs-on: ubuntu-latest
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    environment:
      name: production
      url: https://harmonia.vercel.app
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

Required secrets:

```bash
gh secret set VERCEL_TOKEN --body "your-vercel-token"
gh secret set VERCEL_ORG_ID --body "your-org-id"
gh secret set VERCEL_PROJECT_ID --body "your-project-id"
```

---

### Supabase Configuration (Alternative DB + Auth)

Lyriosa supports Supabase as both a database backend (`DB_BACKEND=supabase`) and auth provider (`AUTH_PROVIDER=supabase`).

#### CLI Setup

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

#### Database Migration

```bash
npm run db:migrate    # runs scripts/db/schema.sql
npm run db:seed       # runs seed.sql + repertoire.seed.sql
npm run db:reset      # drop + recreate + reseed
```

#### Environment Variables

```env
# Database
DB_BACKEND=supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Auth (if using Supabase Auth)
AUTH_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Custom Claims (Supabase Auth)

For Supabase, user roles are stored in `app_metadata`:

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data ||
  '{"role": "teacher", "conservatoriumId": "cons-1", "approved": true}'::jsonb
WHERE id = '<user-uuid>';
```

#### Row Level Security (RLS)

**CRITICAL before production.** Full policies in `docs/architecture/06-security.md` section 4a.

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conservatoriums ENABLE ROW LEVEL SECURITY;
```

#### Backups

- [ ] Enable **Point-in-Time Recovery** (Pro plan)
- [ ] Free tier: 7-day daily backups
- [ ] Test restore at least once

---

### Monitoring & Observability

#### Sentry (Error Tracking) -- MUST HAVE

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

- [ ] Create account at [sentry.io](https://sentry.io) (free: 5K errors/month)
- [ ] Add env vars: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (GitHub secret)
- [ ] Wizard wraps `next.config.ts` with `withSentryConfig`

#### UptimeRobot -- MUST HAVE

- [ ] Free account at [uptimerobot.com](https://uptimerobot.com)
- [ ] Monitors: production homepage (5 min), staging (15 min), API health (5 min)
- [ ] Alert contacts: email + Slack webhook

#### PostHog Analytics -- NICE TO HAVE

```bash
npm install posthog-js
```

EU hosting (`api_host: 'https://eu.posthog.com'`) for PDPPA. Free: 1M events/month.

#### Log Management

Firebase App Hosting streams to **Google Cloud Logging** automatically.

```bash
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=harmonia" \
  --project=harmonia-production --limit=50 \
  --format="table(timestamp, severity, textPayload)"
```

---

### Free Tier Limits & Cost Estimates

#### Firebase (Blaze Plan)

| Service | Free Quota | Overage | Year 1 Est. (5 cons) |
|---|---|---|---|
| Firestore reads | 50K/day | $0.06/100K | $0 |
| Firestore writes | 20K/day | $0.18/100K | $0 |
| Firestore storage | 1 GiB | $0.18/GiB/mo | $0 |
| Cloud Functions | 2M invocations/mo | $0.40/M | $0 |
| Hosting bandwidth | 360 MiB/day | $0.15/GiB | $0 |
| Cloud Storage | 5 GiB | $0.026/GiB/mo | $0 |
| Authentication | Unlimited email/OAuth | Phone: $0.01-0.06/SMS | $0 |
| App Hosting (Cloud Run) | N/A | ~$0.000024/vCPU-sec | **$15-30/mo** |

#### All Services

| Service | Free Tier | Monthly Cost |
|---|---|---|
| Firebase (Blaze) | Per-service quotas | $30-60 |
| GitHub Actions | 2,000 CI min/mo | $0 |
| Sentry | 5K errors/mo | $0 |
| UptimeRobot | 50 monitors | $0 |
| PostHog | 1M events/mo | $0 |
| Secret Manager (85-cons) | 6 free | ~$31 |
| **Total (Year 1)** | | **$30-60** |

#### Scaling

| Scale | Monthly Cost |
|---|---|
| 5 conservatoriums (launch) | $30-60 |
| 10 conservatoriums | $40-70 |
| 20+ conservatoriums | $60-110 |
| 85 conservatoriums (full) | $150-300 |

---

### Tool Recommendation Matrix

| Tool | Category | Free Tier | Verdict | When |
|---|---|---|---|---|
| Firebase Auth | Auth | Unlimited | **IN USE** | -- |
| Firebase App Hosting | Hosting | Blaze required | **IN USE** | -- |
| Gemini / Genkit | AI | Varies | **IN USE** | -- |
| Docker (Postgres) | Local DB | Free | **IN USE** | -- |
| **Sentry** | Errors | 5K/mo | **MUST HAVE** | Before launch |
| **UptimeRobot** | Uptime | 50 monitors | **MUST HAVE** | Before launch |
| **SendGrid** | Email | 100/day | **MUST HAVE** | When creds ready |
| **Twilio** | SMS/WhatsApp | $15 trial | **MUST HAVE** | When creds ready |
| PostHog | Analytics | 1M events | NICE TO HAVE | After 5 cons |
| Resend | Email | 3K/mo | NICE TO HAVE | If templates need work |
| Cloudflare | CDN/DDoS | Generous | NICE TO HAVE | At 20+ cons |
| Clerk | Auth | 10K MAU | SKIP | Firebase Auth complete |
| Pinecone | Vectors | 2M vectors | SKIP | Help assistant works without it |
| Vercel | Hosting | 100 GiB BW | SKIP | Firebase already configured |

---

### Production Checklist

#### Firebase Infrastructure

- [ ] 3 Firebase projects created (`harmonia-dev`, `harmonia-staging`, `harmonia-production`)
- [ ] `.firebaserc` aliases configured
- [ ] Firestore enabled in Native mode, `europe-west1`
- [ ] Firebase Storage enabled, `europe-west1`
- [ ] Firebase Authentication enabled (Email/Password + Google + Microsoft)
- [ ] Firestore rules deployed (`firestore.rules`)
- [ ] Firestore indexes deployed (`firestore.indexes.json`)
- [ ] Storage rules deployed (`storage.rules`)
- [ ] Cloud Functions deployed to all environments
- [ ] Firebase App Hosting configured (`apphosting.yaml`)
- [ ] Custom domain configured

#### Google Secret Manager (Production)

- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY`
- [ ] `CARDCOM_TERMINAL_NUMBER` (live, not test)
- [ ] `CARDCOM_API_NAME`
- [ ] `CARDCOM_API_PASSWORD`
- [ ] `CARDCOM_WEBHOOK_SECRET`
- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `SENDGRID_API_KEY`
- [ ] `GOOGLE_API_KEY`

#### GitHub

- [ ] All repository secrets set
- [ ] `staging` environment created with URL
- [ ] `production` environment created with URL + approval gate

#### Third-Party Services

- [ ] **Cardcom**: live payment terminal activated
- [ ] **SendGrid**: sender domain verified (SPF/DKIM/DMARC)
- [ ] **Twilio**: phone number provisioned (SMS + WhatsApp)
- [ ] **Firebase App Check**: reCAPTCHA v3 enabled + site key configured

#### Security

- [ ] Firebase App Check enabled
- [ ] `CARDCOM_WEBHOOK_SECRET` set (HMAC validation)
- [ ] Firestore rules reviewed (RBAC + tenant isolation + PDPPA)
- [ ] Storage rules reviewed (PII protections for minors)
- [ ] No test/placeholder credentials in production

#### Operational

- [ ] Firestore automatic backup schedule (daily)
- [ ] Firebase Alerts for Functions errors
- [ ] Monitoring dashboard in GCP Console
- [ ] Error reporting enabled
- [ ] `minInstances: 1` in `apphosting.yaml`

---

### Git Hooks

| Hook | File | What It Does |
|---|---|---|
| `pre-commit` | `.husky/pre-commit` | `npx lint-staged` -- ESLint on staged `.ts/.tsx` files |
| `pre-push` | `.husky/pre-push` | `npm run typecheck` + `npm run test -- --run` |

---

### NPM Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `next dev --turbopack -p 9002` | Dev server |
| `npm run build` | `next build` | Production build |
| `npm run lint` | `eslint src/` | Lint |
| `npm run typecheck` | `tsc --noEmit` | Type check |
| `npm run test` | `vitest` | Unit tests (watch) |
| `npm run test -- --run` | `vitest --run` | Unit tests (CI) |
| `npm run e2e` | `playwright test` | E2E tests |
| `npm run e2e:ui` | `playwright test --ui` | E2E with UI |
| `npm run i18n:audit` | `node scripts/i18n/audit.mjs` | Translation check |
| `npm run i18n:sync` | `node scripts/i18n/sync-from-en.mjs` | Sync missing keys from English |
| `npm run db:start` | `docker compose up -d` | Start local Postgres |
| `npm run db:stop` | `docker compose down` | Stop local Postgres |
| `npm run db:setup` | migrate + seed | Full DB setup |
| `npm run db:reset` | `node scripts/db/reset.mjs` | Drop + recreate DB |
| `npm run db:studio` | `npx drizzle-kit studio` | DB inspector |

---

### Key Files

| File | Purpose |
|---|---|
| `.github/workflows/ci.yml` | CI/CD pipeline (7 jobs, 4 stages) |
| `firebase.json` | Firebase services (hosting, firestore, functions, emulators) |
| `.firebaserc` | Firebase project aliases (dev/staging/production) |
| `apphosting.yaml` | App Hosting runtime config (Cloud Run, 10 secrets) |
| `docker-compose.yml` | Local Postgres 16 Alpine |
| `scripts/db/schema.sql` | PostgreSQL schema (all tables, enums, indexes) |
| `scripts/db/seed.sql` | Rich mock data (3 conservatoriums, teachers, students, lessons) |
| `src/lib/db/index.ts` | DB backend resolution (`DB_BACKEND` env var) |
| `src/lib/auth/provider.ts` | Auth provider interface + factory (`AUTH_PROVIDER` env var) |
| `docs/AUTH_PROVIDERS.md` | Auth provider env var reference |
| `playwright.config.ts` | E2E config (Chromium, port 9002, 60s timeout) |
| `vitest.config.ts` | Unit test config (jsdom, React, `@/*` alias) |
| `next.config.ts` | Security headers, CSP, image domains, next-intl |
| `tsconfig.json` | TypeScript strict mode, `@/*` path alias |
| `.husky/pre-commit` | lint-staged hook |
| `.husky/pre-push` | typecheck + test hook |

---

### Troubleshooting

**ESLint `--max-warnings 780` fails:** run `npm run lint 2>&1 | tail -5` locally. Fix warnings or increase threshold.

**Build fails with Firebase import errors:** build uses `DB_BACKEND=mock`. Ensure `data.ts` does not import `firebase-admin` at top level.

**Firebase deploy "permission denied":** service account needs Firebase Hosting Admin + Cloud Run Admin + Service Account User roles.

**Port 9002 in use:** Windows: `netstat -ano | findstr :9002` then `taskkill /PID <PID> /F`. Linux/Mac: `lsof -i :9002`.

**Postgres container fails:** `docker compose down -v && docker compose up -d`.

**Typecheck passes locally, fails in CI:** commit `package-lock.json`. Test: `rm -rf node_modules && npm ci && npm run typecheck`.

**`DB_BACKEND=supabase` not connecting:** verify `SUPABASE_URL` includes `https://` prefix and `SUPABASE_SERVICE_KEY` is the service_role key (not anon key).

**Auth provider errors:** check `AUTH_PROVIDER` is `firebase` or `supabase` (case-sensitive). Leave unset for dev bypass.
