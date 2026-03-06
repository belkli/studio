# Harmonia — Architecture Documentation

> **System Status:** Functional prototype with full UI, mock-data backend, and typed service-layer stubs. Real Firebase Auth, Firestore persistence, and third-party integrations (Cardcom, Twilio) are **not yet active** — the app runs against in-memory mock data and a `MemoryDatabaseAdapter` by default. All typed stubs, schemas, and specs are in place and ready for production wiring.
>
> **Verified Stack:** Next.js 16 · React 19 · TypeScript 5 · Firebase SDK 12 · shadcn/ui (Radix) · Tailwind CSS v4 · next-intl 4 · Genkit 1.29 · Zod 4 · date-fns 4 · React Hook Form 7 · Recharts 3 · jsPDF 4 · react-signature-canvas · driver.js (walkthrough)

---

## What Is Harmonia?

Harmonia is a multi-tenant SaaS platform that digitises the full operational lifecycle of Israeli music conservatoriums — replacing phone calls, paper forms, Excel payroll sheets, and WhatsApp cancellations with a self-service, automated, and AI-assisted platform. It serves six primary user roles: **conservatorium administrators**, **delegated admins**, **teachers**, **students**, **parents**, and **school coordinators** (Playing School programme).

Its key differentiators over existing tools (My Music Staff, TeacherZone, Jackrabbit) are:
- **Native Hebrew/Arabic RTL** with full four-language support (`he`, `ar`, `en`, `ru`), `localePrefix: 'as-needed'` (Hebrew served at root `/`)
- **Israeli payment & legal compliance** — Cardcom/Pelecard/HYP/Tranzila/Stripe gateway abstraction, 17% VAT, Ministry of Education form submission, IS 5568 accessibility, PDPPA privacy law
- **AI agents** powered by Genkit 1.29 + `@genkit-ai/google-genai` for teacher matching, schedule optimisation, progress report drafting, event poster generation, and lead nurturing
- **Zero-paperwork** Ministry of Education form workflows with `react-signature-canvas` digital signatures
- **Playing School (בית ספר מנגן)** programme — a separate module for school-partnership group lessons
- **Musicians for Hire** marketplace allowing conservatorium teachers to accept event bookings

---

## Table of Contents

| # | Document | Description |
|---|----------|-------------|
| — | **This file** | Executive summary and index |
| 01 | [Product Context](./01-product-context.md) | Business goals, user roles, primary use cases |
| 02 | [Architecture](./02-architecture.md) | System containers, architectural patterns, module map |
| 03 | [Frontend](./03-frontend.md) | Tech stack, UI structure, state management |
| 04 | [Backend](./04-backend.md) | API design, Cloud Functions stubs, domain logic |
| 05 | [Data Persistence](./05-data-persistency.md) | Firestore schema, entity relationships, multi-backend strategy |
| 06 | [Security](./06-security.md) | Authentication, authorisation, PDPPA compliance, performance targets |
| 07 | [Infrastructure](./07-infrastructure.md) | Environments, hosting, CI/CD, external services |

---

## Critical Architecture Snapshot

```
┌──────────────────────────────────────────────────────────────────────┐
│                         HARMONIA PLATFORM                            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │          NEXT.JS 16 APP  (Firebase App Hosting)              │    │
│  │  Public Site · Authenticated Dashboard · Admin Portal        │    │
│  │  Server Actions (mutations) · Server Components (SSR)        │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │         DATABASE ADAPTER  (src/lib/db/)                      │    │
│  │  mock (default) · firebase · postgres · supabase · pocketbase│    │
│  │  ⚠️  firebase adapter is currently a MemoryDatabaseAdapter stub│   │
│  └──────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│              ┌───────────────┼──────────────────────────┐           │
│              ▼               ▼                          ▼           │
│  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────────┐   │
│  │  GENKIT AI   │  │  PAYMENT GATEWAY │  │  EXTERNAL SERVICES  │   │
│  │  Genkit 1.29 │  │  Cardcom (stub)  │  │  Twilio (stub)      │   │
│  │  6 AI flows  │  │  +4 alternatives │  │  SendGrid (stub)    │   │
│  │  ACTIVE ✅   │  │  ⚠️ stubs only   │  │  Google Calendar    │   │
│  └──────────────┘  └──────────────────┘  │  (stub)             │   │
│                                          │  Hebcal (stub)      │   │
│                                          └─────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘

LEGEND:  ✅ Implemented  ⚠️ Stub/spec only  ❌ Not started
```

---

## Module Implementation Status

| Module | Domain | Priority | Status |
|--------|--------|----------|--------|
| 01 | Identity, Family & Role Management | P0 | ✅ UI + mock data |
| 02 | Student Registration & Enrollment | P0 | ✅ UI + mock data |
| 03 | Teacher Management & Availability | P0 | ✅ UI + mock data |
| 04 | Smart Scheduling & Booking Engine | P0 | ✅ UI + mock; ⚠️ CF spec only |
| 05 | Payment, Packages & Billing | P0 | ✅ UI + mock; ⚠️ Cardcom stub |
| 06 | Cancellation, Makeup & Sick Leave | P0 | ✅ UI + mock; ⚠️ CF spec only |
| 07 | Communication & Notifications | P1 | ⚠️ Dispatcher stub; no real sends |
| 08 | Forms, Approvals & Ministry Submissions | P1 | ✅ UI + mock; signature UI present |
| 09 | Learning Management System (LMS) | P2 | ✅ UI + mock data |
| 10 | AI Agents & Automation | P2 | ✅ 6 Genkit flows active |
| 11 | Reporting, Analytics & Admin Dashboard | P2 | ✅ UI + mock aggregations |
| 12 | Smart Slot Filling | P2 | ✅ `target-empty-slots-flow.ts` |
| 13 | Musicians for Hire Marketplace | P2 | ✅ UI + mock data |
| 14 | Additional Features (Rentals, Open Day, Alumni) | P2 | ✅ UI + mock data |
| 15 | Internationalization (i18n / L10n) | P0 | ✅ Fully wired, 4 locales |
| 16 | Guidance & AI Help Assistant | P2 | ✅ `help-assistant-flow.ts` |
| 17 | Scholarships & Donation Management | P3 | ✅ UI + mock data |
| PS | Playing School Programme | P1 | ✅ UI + mock data |
