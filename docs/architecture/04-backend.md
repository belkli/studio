# 04 -- Backend

## 1. Overview

| Layer | Technology | Status |
|-------|-----------|--------|
| **Server Actions** | Next.js `'use server'` | ✅ `src/app/actions.ts` + `src/app/actions/*.ts` |
| **Firebase Admin SDK** | `firebase-admin` | ✅ `src/lib/firebase-admin.ts` |
| **Database** | `DatabaseAdapter` (5 backends) | ✅ All adapters implemented |
| **Cloud Functions** | Firebase CF (2nd Gen) | ✅ 6 functions in `functions/src/` |
| **Notification Dispatcher** | Twilio + SendGrid | 🚧 Code ready, inactive without credentials |
| **Payment Gateway** | Cardcom + 4 others | 🚧 Code ready, inactive without terminal numbers |

---

## 2. Server Actions

### 2.1 Auth Flow

Every action uses the `withAuth()` wrapper from `src/lib/auth-utils.ts`:

```typescript
export async function verifyAuth(): Promise<LyriosaClaims> {
  // 1. Try Admin SDK verifySessionCookie() (production path)
  // 2. Fallback: read x-user-* headers from proxy (dev with proxy)
  // 3. Dev-only: synthetic site_admin (NODE_ENV !== 'production')
  // Production: path 3 is unreachable (App Hosting sets NODE_ENV=production)
}

export function withAuth(schema, action) {
  return async (input) => {
    await verifyAuth();        // Auth check
    const parsed = schema.parse(input);  // Zod validation
    return action(parsed);
  };
}
```

`requireRole()` enforces RBAC with tenant isolation:
- Checks `approved` status
- Validates role against allowed list
- Global admins (`site_admin`, `superadmin`) bypass tenant checks
- Non-global roles must match `conservatoriumId` (throws `TENANT_MISMATCH`)

### 2.2 Additional Action Modules

| File | Purpose |
|------|---------|
| `src/app/actions/auth.ts` | Login, logout, session management |
| `src/app/actions/consent.ts` | PDPPA consent management |
| `src/app/actions/signatures.ts` | Digital signature capture |
| `src/app/actions/storage.ts` | File upload actions |
| `src/app/actions/user-preferences.ts` | User preference management |

### 2.3 Zod Validation

Dedicated schemas in `src/lib/validation/`:

| File | Schemas |
|------|---------|
| `booking.ts` | BookingRequest, MakeupBooking, Reschedule, CancelLesson |
| `conservatorium.ts` | Conservatorium settings |
| `event-production.ts` | Event and performance production |
| `form-submission-upsert.ts` | Form submission validation |
| `lesson-slot.ts` | Lesson slot create/update |
| `user-upsert.ts` | User create/update |

All previously `z.any()` schemas have been replaced with proper validators.

---

## 3. API Routes

| Route | Purpose |
|-------|---------|
| `/api/auth/login` | Creates Firebase session cookie via `createSessionCookie()` |
| `/api/auth/logout` | Revokes refresh tokens, clears `__session` cookie |
| `/api/bootstrap` | Serves mock seed data to client (dev mode) |
| `/api/cardcom-webhook` | Payment callback handler (HMAC validated) |

---

## 4. Cloud Functions (`functions/src/`)

All deployed to `europe-west1` (PDPPA data residency).

| Function | Type | Purpose |
|----------|------|---------|
| `onUserApproved` | Firestore trigger | Sets Custom Claims (`role`, `conservatoriumId`, `approved`) |
| `onUserCreated` | Firestore trigger | New user lifecycle, welcome notification |
| `onUserDeleted` | Firestore trigger | Token revocation, data archival |
| `onUserParentSync` | Firestore trigger | Syncs `parentOf/{parentId_studentId}` documents |
| `bookLessonSlot` | Callable | Atomic booking: validate -> check availability -> room lock -> deduct credit -> create slot |
| `bookMakeupLesson` | Callable | Atomic makeup redemption: verify AVAILABLE -> create slot + mark REDEEMED |

### Phase 2 Specs (Not Yet Deployed)

Typed specifications in `src/lib/cloud-functions/`:
- `lesson-triggers.ts` -- auto-issue makeup credits, dispatch notifications
- `calendar-sync.ts` -- two-way Google Calendar sync
- `holiday-calendar.ts` -- Hebcal API integration
- `payroll-export.ts` -- generate payroll CSV/Excel

---

## 5. AI Agents (Genkit 1.29 / Gemini)

All 8 flows run server-side, called from `src/app/actions.ts`:

| Flow | Input -> Output |
|------|----------------|
| `match-teacher-flow.ts` | Student preferences + teachers -> top 3 matches with reasons |
| `draft-progress-report-flow.ts` | Practice logs + notes -> Hebrew progress narrative |
| `help-assistant-flow.ts` | Question + locale -> grounded answer from help articles |
| `suggest-compositions.ts` | Instrument + level -> composition suggestions |
| `reschedule-flow.ts` | Natural language request -> structured reschedule options |
| `generate-event-poster.ts` | Event metadata -> poster content/layout |
| `target-empty-slots-flow.ts` | Empty slots -> prioritised outreach targets |
| `nurture-lead-flow.ts` | Playing School lead -> personalised follow-up message |

---

## 6. Payment Gateway (Multi-Provider)

Selected via `PAYMENT_GATEWAY_PROVIDER` env var (default: `CARDCOM`):

| Provider | Status |
|----------|--------|
| Cardcom | 🚧 Full API code in `src/lib/payments/cardcom.ts` (inactive without credentials) |
| Pelecard | 🚧 Redirect URL only |
| HYP | 🚧 Redirect URL only |
| Tranzila | 🚧 Redirect URL only |
| Stripe | 🚧 Incomplete |

All fall back to `/payment/mock?token=...` when terminal numbers are absent.

---

## 7. Notification Dispatcher

`src/lib/notifications/dispatcher.ts` (245 lines) -- production-ready code:
- `dispatchNotification()` routes to correct channel per `NotificationPreferences`
- `isQuietHours()` -- Israel timezone aware (Asia/Jerusalem)
- `normalizeIsraeliPhone()` -- converts `050-1234567` to `+972501234567`
- `sendSMS()` / `sendWhatsApp()` -- real Twilio REST API calls
- Falls back to `console.warn` when `TWILIO_ACCOUNT_SID` absent

---

## 8. Room Allocation

`src/lib/room-allocation.ts` -- active implementation:
- `resolveInstrumentId()` -- normalises instrument strings with multi-language matching
- `allocateRoomWithConflictResolution()` -- best-fit room based on equipment, blocks, conflicts
- Instrument compatibility matrix per instrument type
