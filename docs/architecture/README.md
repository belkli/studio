# Lyriosa -- Architecture Documentation

> **Last updated:** 2026-03-07
> **Stack:** Next.js 16 | React 19 | TypeScript 5 | Firebase 12 | shadcn/ui | Tailwind CSS v4 | next-intl 4 | Genkit 1.29 | Zod 4

---

## What Is Lyriosa?

Lyriosa is a multi-tenant SaaS platform that digitises the full operational lifecycle of Israeli music conservatoriums. It replaces phone calls, paper forms, Excel payroll sheets, and WhatsApp cancellations with a self-service, automated, and AI-assisted platform. It serves **7 primary user roles** and supports **4 languages** (Hebrew, English, Arabic, Russian) with native RTL.

---

## Table of Contents

| # | Document | Status | Description |
|---|----------|--------|-------------|
| -- | **This file** | -- | Executive summary and index |
| 01 | [Product Context](./01-product-context.md) | ✅ | Business goals, user roles, primary use cases, premium tier |
| 02 | [Architecture](./02-architecture.md) | ✅ | System containers, patterns, module map, dev mode |
| 03 | [Frontend](./03-frontend.md) | ✅ | Tech stack, routing, state management, i18n, a11y |
| 04 | [Backend](./04-backend.md) | ✅ | Server Actions, Cloud Functions, AI flows, payments |
| 05 | [Data Persistence](./05-data-persistency.md) | ✅ | Multi-backend strategy, Firestore schema, entity models |
| 06 | [Security](./06-security.md) | ✅ | Auth, RBAC, PDPPA compliance, threat model |
| 07 | [Infrastructure](./07-infrastructure.md) | ✅ | Hosting, CI/CD, environments, external services |
| 08 | [Execution Status](./08-execution-status.md) | ✅ | Phase completion status, remaining blockers |
| 09 | [BYOD Integrations](./09-byod-integrations.md) | 📋 | Per-tenant secrets (Secret Manager), payment BYOD, cost model |

### Status Legend

- ✅ Implemented and active
- 🚧 Partially implemented (code exists, not fully wired)
- 📋 Planned / spec only

---

## Architecture Snapshot

```
┌──────────────────────────────────────────────────────────────────────┐
│                         HARMONIA PLATFORM                            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │          NEXT.JS 16 APP  (Firebase App Hosting)              │    │
│  │  Public Site · Authenticated Dashboard · Admin Portal        │    │
│  │  Server Actions (mutations) · Server Components (SSR)        │    │
│  │  Edge Proxy (src/proxy.ts) — session validation + headers    │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │         DATABASE ADAPTER  (src/lib/db/)                      │    │
│  │  mock (default) · firebase ✅ · postgres ✅ · supabase ✅     │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│              ┌───────────────┼──────────────────────────┐           │
│              ▼               ▼                          ▼           │
│  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────────┐   │
│  │  GENKIT AI   │  │  PAYMENT GATEWAY │  │  CLOUD FUNCTIONS    │   │
│  │  8 flows ✅  │  │  Cardcom 🚧     │  │  6 functions ✅     │   │
│  │  Gemini API  │  │  +4 alternatives │  │  Auth + Booking     │   │
│  └──────────────┘  └──────────────────┘  └─────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Module Status

| Module | Domain | Status |
|--------|--------|--------|
| 01 | Identity, Family & Role Management | ✅ UI + mock + Firestore adapter |
| 02 | Student Registration & Enrollment | ✅ UI + mock + Firestore adapter |
| 03 | Teacher Management & Availability | ✅ UI + mock + Firestore adapter |
| 04 | Smart Scheduling & Booking Engine | ✅ UI + CF booking functions |
| 05 | Payment, Packages & Billing | ✅ UI + 🚧 Cardcom integration |
| 06 | Cancellation, Makeup & Sick Leave | ✅ UI + CF makeup booking |
| 07 | Communication & Notifications | 🚧 Dispatcher code ready, no credentials |
| 08 | Forms, Approvals & Ministry Submissions | ✅ UI + Zod validation |
| 09 | Learning Management System (LMS) | ✅ UI + mock data |
| 10 | AI Agents & Automation | ✅ 8 Genkit flows active |
| 11 | Reporting, Analytics & Admin Dashboard | ✅ UI + mock aggregations |
| 12 | Smart Slot Filling | ✅ Genkit flow active |
| 13 | Musicians for Hire Marketplace | ✅ UI + mock data |
| 14 | Additional Features (Rentals, Open Day, Alumni) | ✅ UI + mock data |
| 15 | Internationalization (i18n / L10n) | ✅ 4 locales, split files |
| 16 | Guidance & AI Help Assistant | ✅ Genkit flow active |
| 17 | Scholarships & Donation Management | ✅ UI + mock data |
| PS | Playing School Programme | ✅ UI + mock data |
