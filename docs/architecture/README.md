# Harmonia — Architecture Documentation

> **System Status:** Pre-production prototype. Core domain models, UI components, and i18n infrastructure are implemented. Real Firebase integration, payment processing, and server-side security are the primary remaining production gaps.
>
> **Stack:** Next.js 15 (App Router) · TypeScript · Firebase · shadcn/ui · Tailwind CSS · next-intl · Genkit AI

---

## What Is Harmonia?

Harmonia is a multi-tenant SaaS platform that digitises the full operational lifecycle of Israeli music conservatoriums — replacing phone calls, paper forms, Excel payroll sheets, and WhatsApp cancellations with a self-service, automated, and AI-assisted platform. It serves four primary user personas: **conservatorium administrators**, **teachers**, **students**, and **parents**.

Its key differentiators over existing tools (My Music Staff, TeacherZone, Jackrabbit) are:
- **Native Hebrew/Arabic RTL** with full four-language support (`he`, `ar`, `en`, `ru`)
- **Israeli payment & legal compliance** — Cardcom gateway, Israeli VAT (17%), Ministry of Education form submission, Section 46 donation tax receipts, IS 5568 accessibility, and PDPPA privacy law
- **AI agents** powered by Genkit/Gemini for teacher matching, schedule optimisation, and progress report drafting
- **Zero-paperwork** Ministry of Education form workflows with digital signatures
- **Musicians for Hire** marketplace allowing conservatorium teachers to accept event bookings as a secondary revenue stream

---

## Table of Contents

| # | Document | Description |
|---|----------|-------------|
| — | **This file** | Executive summary and index |
| 01 | [Product Context](./01-product-context.md) | Business goals, user roles, primary use cases |
| 02 | [Architecture](./02-architecture.md) | System containers, architectural patterns, module map |
| 03 | [Frontend](./03-frontend.md) | Tech stack, UI structure, state management |
| 04 | [Backend](./04-backend.md) | API design, Cloud Functions, domain logic |
| 05 | [Data Persistence](./05-data-persistency.md) | Firestore schema, entity relationships, multi-backend strategy |
| 06 | [Security](./06-security.md) | Authentication, authorisation, PDPPA compliance, performance targets |
| 07 | [Infrastructure](./07-infrastructure.md) | Environments, hosting, CI/CD, external services |

---

## Critical Architecture Snapshot

```
┌──────────────────────────────────────────────────────────────────────┐
│                         HARMONIA PLATFORM                            │
├─────────────────┬────────────────────────┬───────────────────────────┤
│   PUBLIC SITE   │    AUTHENTICATED APP   │       ADMIN PORTAL        │
│  /              │  /[locale]/dashboard   │  /[locale]/dashboard      │
│  /register      │  /schedule             │  /admin                   │
│  /try           │  /forms                │  /admin/teachers          │
│  /book          │  /practice             │  /admin/billing           │
│  /about         │  /family               │  /admin/reports           │
└─────────────────┴────────────────────────┴───────────────────────────┘
         │                    │                          │
         ▼                    ▼                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        FIREBASE BACKEND                              │
│  Firestore · Auth (+ Custom Claims) · Storage · Cloud Functions      │
└──────────────────────────────────────────────────────────────────────┘
         │                    │                          │
         ▼                    ▼                          ▼
┌─────────────┐    ┌────────────────────┐    ┌───────────────────────┐
│  GENKIT AI  │    │   PAYMENT GATEWAY  │    │   EXTERNAL SERVICES   │
│  Gemini     │    │   Cardcom (IL)     │    │   Twilio SMS/WhatsApp │
│  Agents     │    │   Installments     │    │   SendGrid Email      │
│  Matchmaker │    │   Section 46 API   │    │   Google Calendar API │
│  Reports    │    │   (Tax Receipts)   │    │   Hebcal (Holidays)   │
└─────────────┘    └────────────────────┘    └───────────────────────┘
```

---

## Module Map

| Module | Domain | Priority |
|--------|--------|----------|
| 01 | Identity, Family & Role Management | P0 |
| 02 | Student Registration & Enrollment | P0 |
| 03 | Teacher Management & Availability | P0 |
| 04 | Smart Scheduling & Booking Engine | P0 |
| 05 | Payment, Packages & Billing | P0 |
| 06 | Cancellation, Makeup & Sick Leave | P0 |
| 07 | Communication & Notifications | P1 |
| 08 | Forms, Approvals & Ministry Submissions | P1 |
| 09 | Learning Management System (LMS) | P2 |
| 10 | AI Agents & Automation | P2 |
| 11 | Reporting, Analytics & Admin Dashboard | P2 |
| 12 | Smart Slot Filling | P2 |
| 13 | Musicians for Hire Marketplace | P2 |
| 14 | Additional Features (Rentals, Open Day, Alumni) | P2 |
| 15 | Internationalization (i18n / L10n) | P0 (cross-cutting) |
| 16 | Guidance & AI Help Assistant | P2 |
| 17 | Scholarships & Donation Management | P3 |

