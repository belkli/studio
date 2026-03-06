# 07 — Infrastructure

## 1. Hosting

### 1.1 Primary: Firebase App Hosting

The Next.js application is deployed to **Firebase App Hosting**, which provides:
- Native Next.js support (Server Components, Server Actions, API routes)
- Automatic HTTPS and global CDN
- Zero-configuration scaling — serverless, scales to zero when idle
- Direct integration with Firebase Auth, Firestore, and Cloud Functions

```yaml
# apphosting.yaml
runConfig:
  minInstances: 0          # scale-to-zero for cost efficiency
  maxInstances: 10
  cpu: 1
  memoryMiB: 512
env:
  - variable: DB_BACKEND
    value: firebase
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    secret: FIREBASE_PROJECT_ID
```

### 1.2 Alternative: Self-Hosted (Docker)

For conservatoriums using the PostgreSQL or Supabase backend, the app can be self-hosted:

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

All development uses the Firebase Emulator Suite — no developer should have write access to the production Firebase project:

```bash
# Start all emulators:
firebase emulators:start --import=./scripts/db/emulator-seed

# Emulators active:
# Auth      → localhost:9099
# Firestore → localhost:8080
# Functions → localhost:5001
# Storage   → localhost:9199
# FCM       → localhost:9150
```

---

## 3. Environments

| Environment | Hosting | Firebase Project | Database | Purpose |
|-------------|---------|-----------------|----------|---------|
| **Local Dev** | `localhost:3000` | Emulator Suite | Postgres (Docker) or Firestore Emulator | Developer machines |
| **Staging** | Firebase App Hosting (staging channel) | `harmonia-staging` | Firestore (staging project) | Integration testing, client review |
| **Production** | Firebase App Hosting | `harmonia-prod` | Firestore (prod project) | Live users |

### 3.1 Environment Variables

All secrets are stored in **Google Secret Manager** and injected at build/runtime. Never committed to source control.

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

## 5. External Service Integrations

### 5.1 Cardcom (Israeli Payment Gateway)

- **Pattern:** Hosted Payment Page (PCI scope stays with Cardcom; no card data on Harmonia servers)
- **Recurring billing:** Cardcom tokenised charge via server-to-server API
- **Installments:** J5 parameter, 1–12 months (Israeli market standard)
- **Webhook:** Cardcom posts to `/api/cardcom-webhook`; validated with HMAC signature
- **Section 46 tax receipts:** Donation payments trigger call to Israel Tax Authority API for allocation number

### 5.2 Twilio

- **SMS:** Lesson reminders, urgent cancellations, payment failures
- **WhatsApp Business API:** Primary channel for Israel market; respects 24h messaging window
- **Phone OTP:** Firebase Auth phone verification flows through Twilio for custom sender ID

### 5.3 Google Calendar API

- **Two-way sync** for opted-in teachers
- `syncTeacherCalendars` Cloud Function runs every 15 minutes
- Reads teacher's Google Calendar for conflicts → marks in `teacherExceptions` collection
- Writes new Harmonia lessons to teacher's calendar as events

### 5.4 Hebcal API

- Provides the Israeli national holiday calendar (Rosh Hashana, Yom Kippur, Sukkot, Pesach, etc.)
- Called once per academic year by `archiveExpiredRecords` / setup function
- Results stored in `/conservatoriums/{cid}/closureDates/` — used by the booking engine to auto-skip holiday dates when generating recurring lesson series

### 5.5 Israeli Ministry of Education

- **Form export:** Bulk XML/PDF export compatible with `pop.education.gov.il`
- **Exam registration:** Structured data export for Ministry exam registration
- **Integration pattern:** > TODO: Requires manual documentation — Ministry API specifics

### 5.6 Genkit / Google AI (Gemini)

- Server-side only; no Genkit calls from client components
- Flows defined in `src/ai/flows/`
- AI jobs are queued to `/conservatoriums/{cid}/aiJobs/` and processed by a PubSub worker Cloud Function
- All LLM responses go through human review before any consequential action is taken

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

