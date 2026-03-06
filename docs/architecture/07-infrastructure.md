# 07 — Infrastructure

## 1. Hosting

### 1.1 Primary: Firebase App Hosting

✅ `apphosting.yaml` is present in the repo root. The Next.js application is deployed to **Firebase App Hosting**, which provides native Next.js support (Server Components, Server Actions, API routes), automatic HTTPS, global CDN, and direct integration with Firebase Auth, Firestore, and Cloud Functions.

```yaml
# apphosting.yaml (present in repo root — review before production deploy)
runConfig:
  minInstances: 0          # scale-to-zero for cost efficiency
  maxInstances: 10
  cpu: 1
  memoryMiB: 512
env:
  - variable: DB_BACKEND
    value: firebase          # ⚠️ This will use MemoryAdapter until FirebaseAdapter is implemented
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    secret: FIREBASE_PROJECT_ID
```

### 1.2 Alternative: Self-Hosted (Docker)

✅ `docker-compose.yml` is present in the repo root. For Postgres or Supabase backend:

```yaml
# docker-compose.yml (present in repo root)
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      DB_BACKEND: postgres
      DATABASE_URL: postgres://harmonia:harmonia@db:5432/harmonia
  db:
    image: postgres:16
    volumes: [postgres_data:/var/lib/postgresql/data]
```

---

## 2. Firebase Project Configuration

### 2.1 Required Firebase Services

| Service | Purpose |
|---------|---------|
| **Firestore** | Primary document database |
| **Authentication** | User identity + Custom Claims |
| **Cloud Functions** (2nd Gen) | Serverless backend logic |
| **Cloud Storage** | PDFs, videos, signatures, photos |
| **FCM** | Push notifications |
| **App Check** | Anti-abuse on callable functions |
| **Firebase Extensions** | SendGrid email (Trigger Email extension) |

### 2.2 Firebase Project Region

> **Required:** Firestore and Cloud Functions must be deployed to **`europe-west1`** or **`me-central1`** (closest available to Israel) for PDPPA data residency compliance and latency optimisation.

### 2.3 Firebase Emulator Suite (Local Development)

> ⚠️ Firebase Emulator Suite is **not required** for current development because the app defaults to `mock` or `postgres` backend. It will be required once the `FirebaseAdapter` is properly implemented.

```bash
# When Firebase is connected, start emulators:
firebase emulators:start --import=./scripts/db/emulator-seed
# Auth → 9099  Firestore → 8080  Functions → 5001  Storage → 9199
```

---

## 3. Environments

| Environment | Hosting | Database | Purpose |
|-------------|---------|----------|---------|
| **Local Dev (current)** | `localhost:9002` (port configured in `package.json`) | `mock` (in-memory) or Postgres via `docker compose up` | All development |
| **Local Dev (target)** | `localhost:9002` | Firebase Emulator Suite | After FirebaseAdapter is implemented |
| **Staging** | Firebase App Hosting (preview channel) | Firestore (staging project) | Integration testing |
| **Production** | Firebase App Hosting | Firestore (prod project) | Live users |

### 3.1 NPM Scripts (Verified)

```json
"dev":         "next dev --turbopack -p 9002"   // dev server at port 9002
"build":       "next build"
"test":        "vitest"
"typecheck":   "tsc --noEmit"
"db:start":    "docker compose up -d"
"db:setup":    "npm run db:migrate && npm run db:seed"
"db:studio":   "npx drizzle-kit studio"
"i18n:audit":  "node scripts/i18n/audit.mjs"
"genkit:dev":  "genkit start -- tsx src/ai/dev.ts"
```

### 3.2 Environment Variables (Verified from codebase)

All secrets are stored in **Google Secret Manager** in production. Never committed to source control.

| Variable | Required | Description | Status |
|----------|---------|-------------|--------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client | Firebase client config | ⚠️ Optional — app degrades to mock without it |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client | Firebase Auth domain | ⚠️ Optional |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client | Firebase project ID | ⚠️ Optional |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client | Firebase app ID | ⚠️ Optional |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Server | Admin SDK (base64 JSON) | ❌ Not yet used |
| `DB_BACKEND` | All | `mock` \| `firebase` \| `postgres` \| `supabase` \| `pocketbase` | ✅ |
| `DATABASE_URL` | Postgres | Auto-selects postgres when set | ✅ |
| `PAYMENT_GATEWAY_PROVIDER` | Payments | `CARDCOM` (default) \| `PELECARD` \| `HYP` \| `TRANZILA` \| `STRIPE` | ⚠️ Stub |
| `CARDCOM_TERMINAL_NUMBER` | Production | Live Cardcom terminal | ⚠️ Stub |
| `CARDCOM_SANDBOX_TERMINAL_NUMBER` | Staging | Separate sandbox terminal | ⚠️ Stub |
| `CARDCOM_SANDBOX` | Staging | `'true'` to use sandbox API URLs | ⚠️ Stub |
| `CARDCOM_API_NAME` / `CARDCOM_API_PASSWORD` | Production | Cardcom API credentials | ⚠️ Stub |
| `CARDCOM_WEBHOOK_SECRET` | Production | HMAC validation | ⚠️ Stub |
| `PELECARD_TERMINAL_NUMBER` / `HYP_TERMINAL_NUMBER` / `TRANZILA_TERMINAL_NUMBER` | Alt payments | Alternative gateway terminals | ⚠️ Optional |
| `STRIPE_PUBLISHABLE_KEY` | Alt payments | Stripe public key | ⚠️ Incomplete |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | SMS/WhatsApp | Twilio auth | ⚠️ Stub |
| `TWILIO_SMS_FROM` | SMS | Sender number e.g. `+972...` | ⚠️ Stub |
| `TWILIO_WHATSAPP_FROM` | WhatsApp | Sender e.g. `whatsapp:+1...` | ⚠️ Stub |
| `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL` | Email | SendGrid | ⚠️ Stub |
| `GOOGLE_CALENDAR_CLIENT_ID` / `GOOGLE_CALENDAR_CLIENT_SECRET` | Calendar | Teacher calendar sync | ⚠️ Spec only |
| `HEBCAL_API_KEY` | Holidays | Israeli holiday feed | ⚠️ Spec only |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | App Check | reCAPTCHA v3 | ❌ Not yet wired |
| `GOOGLE_API_KEY` / `GENKIT_API_KEY` | AI | Gemini/Genkit key | ✅ Required for AI flows |

| Variable | Required | Description |
|----------|---------|-------------|
| `FIREBASE_PROJECT_ID` | All | Firebase project identifier |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Server-side | Admin SDK service account (base64 JSON) |
| `DB_BACKEND` | All | `firebase` \| `postgres` \| `supabase` \| `pocketbase` |
| `DATABASE_URL` | Postgres/Supabase | PostgreSQL connection string |
| `CARDCOM_TERMINAL_NUMBER` | Prod / Staging | Cardcom merchant terminal |
| `CARDCOM_API_KEY` | Prod / Staging | Cardcom API key |
| `TWILIO_ACCOUNT_SID` | Prod / Staging | Twilio account |
| `TWILIO_AUTH_TOKEN` | Prod / Staging | Twilio auth token |
| `TWILIO_WHATSAPP_NUMBER` | Prod / Staging | WhatsApp sender number (`+972...`) |
| `SENDGRID_API_KEY` | Prod / Staging | Transactional email |
| `GOOGLE_CALENDAR_CLIENT_ID` | Prod / Staging | Teacher calendar sync |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Prod / Staging | Teacher calendar sync |
| `HEBCAL_API_KEY` | Prod / Staging | Israeli holiday calendar feed |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Client-side | App Check reCAPTCHA v3 |
| `GENKIT_API_KEY` | Server-side | Gemini/Genkit AI key |

---

## 4. CI/CD Pipeline

> TODO: Requires manual documentation — specific GitHub Actions / Cloud Build pipeline configuration.

### 4.1 Recommended Pipeline Stages

```
Push to branch
    └── Lint (ESLint) + Type check (tsc --noEmit)
        └── Unit + Integration tests (Vitest)
            └── Build (next build)
                ├── [PR] → Deploy to Preview Channel (Firebase Hosting Preview)
                └── [main] → Deploy to Staging
                              └── [tag v*] → Deploy to Production
```

### 4.2 Testing Infrastructure

| Tool | Config File | Purpose |
|------|------------|---------|
| **Vitest** | `vitest.config.ts` | Unit tests, integration tests |
| **React Testing Library** | `tests/setup.tsx` | Component tests |
| i18n completeness | `tests/i18n-completeness.test.ts` | Verifies all locales have all keys |
| i18n locale integrity | `tests/i18n-locale-integrity.test.ts` | Validates no untranslated strings |

---

## 5. External Service Integrations (Verified Status)

### 5.1 Payment Gateways (Multi-Provider)

Five Israeli/international gateways are supported via `PAYMENT_GATEWAY_PROVIDER` env var. All return mock redirect URLs when terminal numbers are absent.

| Gateway | File | Status |
|---------|------|--------|
| **Cardcom** (default) | `src/lib/payments/cardcom.ts` | ⚠️ Full API code — inactive (no credentials) |
| **PeleCard** | `src/app/actions.ts` `buildPaymentRedirectUrl()` | ⚠️ Redirect URL only |
| **HYP** | `src/app/actions.ts` | ⚠️ Redirect URL only |
| **Tranzila** | `src/app/actions.ts` | ⚠️ Redirect URL only |
| **Stripe** | `src/app/actions.ts` | ⚠️ Mock redirect only — incomplete |

### 5.2 Twilio (SMS + WhatsApp)

`src/lib/notifications/dispatcher.ts` — real Twilio REST API calls are implemented. When `TWILIO_ACCOUNT_SID` is absent, `sendSMS()` and `sendWhatsApp()` log a warning and return a mock SID. **Production-ready code — inactive due to missing credentials.**

### 5.3 Google Calendar API

`src/lib/cloud-functions/calendar-sync.ts` — typed specification only. OAuth token storage and the actual API calls are specified but not implemented. Teacher calendar connection UI exists but the backend sync function is not deployed.

### 5.4 Hebcal API (Israeli Holidays)

`src/lib/cloud-functions/holiday-calendar.ts` — typed specification. Includes the mandatory closure holidays list and `mapHebcalToClosureDate()` function spec. Not yet called.

### 5.5 Israeli Ministry of Education

Ministry XML/PDF export is handled via `FormSubmission` data with `ministryExportedAt` and `ministryReferenceNumber` fields. UI pages exist (`/dashboard/ministry-export`). Direct Ministry API integration:
> TODO: Requires manual documentation — Ministry API specifics and portal submission protocol

### 5.6 Genkit / Google AI (Gemini)

✅ **Active.** 8 Genkit flows in `src/ai/flows/` are called from `src/app/actions.ts`. All run server-side. Requires `GOOGLE_API_KEY` in the environment. Dev server: `npm run genkit:dev`.

---

## 6. Security Hardening Checklist

The following must be completed before any production user is onboarded:

### Sprint 0 — Non-Negotiable Pre-Launch Security

- [ ] Deploy Firebase Custom Claims (`onUserApproved` Cloud Function)
- [ ] Remove `localStorage` auth; replace with Firebase session cookies
- [ ] Deploy all Firestore Security Rules
- [ ] Deploy all Firebase Storage Security Rules (signed URLs for all sensitive files)
- [ ] Enable Firebase App Check on all callable functions
- [ ] Set all secrets in Google Secret Manager (remove from `.env` files)
- [ ] Configure Next.js security headers in `next.config.ts`:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
- [ ] Validate Cardcom HMAC on every webhook request
- [ ] Implement Zod validation on every Server Action and Callable Function input
- [ ] Remove pre-filled `password: 'password'` default from login form

### Ongoing Security Operations

- [ ] Firebase Emulator Suite used for all development — no writes to production from developer machines
- [ ] Service account keys rotated quarterly
- [ ] Security Rules unit tests run in CI pipeline
- [ ] PDPPA consent version tracked; re-consent triggered on policy update
- [ ] Annual IS 5568 accessibility audit

