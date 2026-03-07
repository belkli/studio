# 07 -- Infrastructure

## 1. Hosting

### 1.1 Firebase App Hosting (Production)

`apphosting.yaml` configuration:

```yaml
runConfig:
  minInstances: 1       # avoid cold starts
  maxInstances: 10
  cpu: 2
  memoryMiB: 1024

env:
  - variable: DB_BACKEND
    value: firebase
  - variable: FIREBASE_SERVICE_ACCOUNT_KEY
    secret: FIREBASE_SERVICE_ACCOUNT_KEY
  # + Cardcom, Twilio, SendGrid, Genkit secrets
```

### 1.2 Docker (Local / Self-Hosted)

`docker-compose.yml` for Postgres backend:

```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      DB_BACKEND: postgres
      DATABASE_URL: postgres://harmonia:harmonia@db:5432/harmonia
  db:
    image: postgres:16
```

### 1.3 Edge Proxy (`src/proxy.ts`)

Runs on Edge Runtime. Handles:
- API routes: pass through directly
- Public routes: intl middleware only
- Dashboard routes: validate `__session`, inject auth headers
- Cardcom webhook: HMAC header presence check
- Dev bypass: synthetic claims when no Firebase credentials

---

## 2. Environments

| Environment | Hosting | Database | Port |
|-------------|---------|----------|------|
| **Local Dev** | `localhost:9002` | `mock` or Postgres | 9002 |
| **Staging** | Firebase App Hosting | Firestore (staging project) | -- |
| **Production** | Firebase App Hosting | Firestore (prod project) | -- |

---

## 3. CI/CD Pipeline

`.github/workflows/ci.yml` -- multi-stage pipeline:

```
Push to branch / PR
  +-- Stage 1: Lint (ESLint --max-warnings 780) + Typecheck + i18n Audit
      +-- Stage 2a: Unit Tests (Vitest)
      +-- Stage 2b: DB Integration (Postgres 16 service container)
          +-- Stage 3: Build (next build with DB_BACKEND=mock)
              +-- [PR]  Stage 4a: Firebase Hosting Preview Channel (7d expiry)
              +-- [main] Stage 4b: Deploy Staging + Firestore Rules/Indexes
              +-- [tag v*] Stage 4c: Deploy Production + Firestore Rules/Indexes
```

- Node.js 20 on `ubuntu-latest`
- `concurrency` with `cancel-in-progress` on PRs
- Postgres service container for DB integration tests

---

## 4. NPM Scripts

```json
"dev":         "next dev --turbopack -p 9002"
"build":       "next build"
"test":        "vitest"
"typecheck":   "tsc --noEmit"
"lint":        "eslint ."
"db:start":    "docker compose up -d"
"db:migrate":  "node scripts/db/run-sql-file.mjs scripts/db/schema.sql"
"db:seed":     "node scripts/db/run-sql-file.mjs scripts/db/seed.sql"
"db:reset":    "node scripts/db/reset.mjs"
"db:studio":   "npx drizzle-kit studio"
"i18n:audit":  "node scripts/i18n/audit.mjs"
"genkit:dev":  "genkit start -- tsx src/ai/dev.ts"
```

---

## 5. Environment Variables

### Required for Production

| Variable | Type | Purpose |
|----------|------|---------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Secret | Admin SDK (base64 JSON) |
| `DB_BACKEND` | Config | `firebase` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Public | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Public | Firebase Auth domain |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Public | Firebase app ID |
| `GOOGLE_API_KEY` | Secret | Gemini/Genkit AI flows |

### Payment & Notifications (Production)

| Variable | Purpose |
|----------|---------|
| `CARDCOM_TERMINAL_NUMBER` | Cardcom live terminal |
| `CARDCOM_API_NAME` / `CARDCOM_API_PASSWORD` | Cardcom API auth |
| `CARDCOM_WEBHOOK_SECRET` | HMAC validation |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | SMS/WhatsApp |
| `SENDGRID_API_KEY` | Email delivery |

### Local Development

| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_BACKEND` | `mock` | Auto-detected |
| `DATABASE_URL` | (unset) | Set to use Postgres |
| `NEXT_PUBLIC_ALLOW_BOOTSTRAP_MOCK_FALLBACK` | `1` | Client mock fallback |

---

## 6. Testing Infrastructure

| Tool | Config | Purpose |
|------|--------|---------|
| Vitest | `vitest.config.ts` | Unit + integration tests |
| React Testing Library | `tests/setup.tsx` | Component tests |
| Playwright | `playwright.config.ts` | E2E browser tests |

Test files:
- `tests/lib/auth-utils.test.ts` -- auth utility tests
- `tests/lib/instrument-matching.test.ts` -- matching logic
- `tests/components/landing-page.test.tsx` -- landing page
- `tests/i18n-landing-keys.test.ts` -- translation coverage
- `e2e/*.spec.ts` -- 6 Playwright e2e specs

---

## 7. External Services

| Service | Implementation | Status |
|---------|---------------|--------|
| **Cardcom** | `src/lib/payments/cardcom.ts` | 🚧 Full code, needs credentials |
| **Pelecard / HYP / Tranzila / Stripe** | Redirect URLs in `actions.ts` | 🚧 Redirect only |
| **Twilio** | `src/lib/notifications/dispatcher.ts` | 🚧 Full code, needs credentials |
| **SendGrid** | Notification dispatcher | 🚧 Full code, needs credentials |
| **Google Calendar** | `src/lib/cloud-functions/calendar-sync.ts` | 📋 Spec only |
| **Hebcal API** | `src/lib/cloud-functions/holiday-calendar.ts` | 📋 Spec only |
| **Genkit / Gemini** | `src/ai/flows/` (8 flows) | ✅ Active |

---

## 8. Firebase Project Requirements

| Service | Purpose |
|---------|---------|
| Firestore | Primary document database |
| Authentication | User identity + Custom Claims |
| Cloud Functions (2nd Gen) | Auth + booking functions |
| Cloud Storage | PDFs, videos, signatures |
| FCM | Push notifications |
| App Check | Anti-abuse (planned) |

**Region:** `europe-west1` or `me-central1` (PDPPA data residency).
