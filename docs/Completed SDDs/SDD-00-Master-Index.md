# Harmonia — Complete System Design Document
## Master Index & Architecture Overview

**Version:** 2.0  
**Status:** Ready for Development  
**Stack:** Next.js (App Router) · TypeScript · Firebase · shadcn/ui · Tailwind CSS (RTL) · Genkit AI

---

## Vision Statement

Harmonia transforms Israeli music conservatoriums from paper-and-phone operations into a self-running digital institution. Every administrative task that today requires a phone call, a WhatsApp message, or a handwritten form becomes automated, transparent, and accessible 24/7 — for students, parents, teachers, and managers alike.

---

## Module Map

| Module | File | Status |
|--------|------|--------|
| 00 | Master Index & Architecture | ✅ This file |
| 01 | Identity, Family & Role Management | `SDD-01-Identity-and-Access.md` |
| 02 | Student Registration & Enrollment | `SDD-02-Student-Registration-Enrollment.md` |
| 03 | Teacher Management & Availability | `SDD-03-Teacher-Management.md` |
| 04 | Smart Scheduling & Booking Engine | `SDD-04-Scheduling-and-Booking.md` |
| 05 | Payment, Packages & Billing | `SDD-05-Payment-and-Billing.md` |
| 06 | Cancellation, Makeup & Sick Leave | `SDD-06-Cancellation-and-Makeup.md` |
| 07 | Communication & Notifications | `SDD-07-Communication-and-Notifications.md` |
| 08 | Forms, Approvals & Ministry Submissions | `SDD-08-Forms-and-Approvals.md` |
| 09 | Learning Management System (LMS) | `SDD-09-Learning-Management.md` |
| 10 | AI Agents & Automation | `SDD-10-AI-Agents.md` |
| 11 | Reporting, Analytics & Admin Dashboard | `SDD-11-Reporting-and-Analytics.md` |

---

## System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        HARMONIA PLATFORM                         │
├───────────────┬──────────────────────┬───────────────────────────┤
│  PUBLIC SITE  │   AUTHENTICATED APP  │      ADMIN PORTAL         │
│  /register    │   /dashboard         │   /admin                  │
│  /login       │   /schedule          │   /admin/teachers         │
│  /try         │   /forms             │   /admin/billing          │
│  /book        │   /practice          │   /admin/reports          │
└───────────────┴──────────────────────┴───────────────────────────┘
         │                   │                        │
         ▼                   ▼                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                      FIREBASE BACKEND                            │
│  Firestore (DB) · Auth · Storage · Functions · Extensions        │
└──────────────────────────────────────────────────────────────────┘
         │                   │                        │
         ▼                   ▼                        ▼
┌──────────┐        ┌──────────────┐        ┌─────────────────────┐
│ GENKIT   │        │  PAYMENT GW  │        │  EXTERNAL SERVICES  │
│ AI Layer │        │  (Cardcom /  │        │  Google Calendar    │
│ Agents   │        │   Tranzila)  │        │  Twilio SMS         │
└──────────┘        └──────────────┘        │  Ministry API       │
                                            └─────────────────────┘
```

---

## Core Design Principles

1. **Mobile-First, RTL-Always** — All interfaces designed for Hebrew, right-to-left, on mobile.
2. **Self-Service Over Phone Calls** — Every action a parent or student currently calls about must be doable online.
3. **Zero Paperwork** — All forms, signatures, and approvals are digital.
4. **Automation Over Manual Labor** — If a computer can do it, a human shouldn't have to.
5. **AI as the Invisible Staff Member** — AI handles matching, scheduling suggestions, progress reports, and routine communications.
6. **Composable Modules** — Each module is independently deployable; a conservatorium can start with Module 01+02+04+05 and add others over time.

---

## Key Data Models (Master Reference)

All modules reference these shared models. Module-specific extensions are defined within each SDD.

### `User`
```typescript
{
  id: string;
  email?: string;           // absent for STUDENT_UNDER_13
  phone?: string;
  firstName: string;
  lastName: string;
  role: UserRole;           // see Module 01
  conservatoriumId: string;
  approved: boolean;
  dateOfBirth?: Date;       // drives age-gate logic
  parentId?: string;        // links child to parent
  childIds?: string[];      // links parent to children
  createdAt: Timestamp;
}
```

### `LessonSlot`
```typescript
{
  id: string;
  teacherId: string;
  studentId: string;
  instrument: Instrument;
  startTime: Timestamp;
  durationMinutes: number;  // 30 | 45 | 60
  type: 'RECURRING' | 'MAKEUP' | 'TRIAL' | 'ADHOC';
  status: SlotStatus;       // SCHEDULED | COMPLETED | CANCELLED_STUDENT | CANCELLED_TEACHER | NO_SHOW
  isVirtual: boolean;
  meetingLink?: string;
  packageId?: string;
  invoiceLineId?: string;
}
```

### `Package`
```typescript
{
  id: string;
  studentId: string;
  type: 'MONTHLY' | 'TRIAL' | 'PACK_5' | 'PACK_10' | 'YEARLY';
  totalCredits: number;
  usedCredits: number;
  price: number;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  validFrom: Date;
  validUntil: Date;
}
```

### `Invoice`
```typescript
{
  id: string;
  conservatoriumId: string;
  payerId: string;           // Parent or adult Student
  lineItems: InvoiceLineItem[];
  total: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: Date;
  paidAt?: Date;
}
```

---

## Competitive Analysis Summary

| Feature | My Music Staff | TeacherZone | Jackrabbit | AmpliTeach | **Harmonia Target** |
|---------|---------------|-------------|------------|------------|---------------------|
| Calendar Sync | ✅ | ⚠️ | ✅ | ✅ | ✅ Two-way |
| Self-Service Booking | ⚠️ | ✅ | ⚠️ | ✅ | ✅ Full |
| Package/Credits | ✅ | ✅ | ✅ | ✅ | ✅ + Ad-hoc |
| Payroll | ⚠️ | ❌ | ✅ | ⚠️ | ✅ Auto |
| LMS / Practice Logs | ⚠️ | ✅ | ❌ | ⚠️ | ✅ Full |
| AI Matching | ❌ | ❌ | ❌ | ❌ | ✅ Genkit |
| Ministry Forms | ❌ | ❌ | ❌ | ❌ | ✅ Native |
| Hebrew / RTL | ❌ | ❌ | ❌ | ❌ | ✅ Native |
| Family Portal | ⚠️ | ⚠️ | ✅ | ⚠️ | ✅ Multi-child |
| Cancellation Engine | ✅ | ⚠️ | ✅ | ✅ | ✅ + Teacher sick |
