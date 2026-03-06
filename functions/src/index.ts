/**
 * @fileoverview Harmonia Cloud Functions — Entry Point
 *
 * All Firebase Cloud Functions for the Harmonia platform are exported from
 * this file. Firebase CLI deploys all exports it finds here.
 *
 * Functions are organized by domain:
 * - auth/   — Custom Claims management, user lifecycle
 * - (future) booking/  — Lesson booking atomicity
 * - (future) lessons/  — Lesson triggers (cancellation, completion)
 * - (future) billing/  — Payroll export, invoice generation
 * - (future) calendar/ — Google Calendar sync
 * - (future) holidays/ — Israeli holiday calendar (Hebcal)
 *
 * All functions: region europe-west1 (PDPPA data residency)
 */

import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin SDK (required before any admin calls)
initializeApp();

// ── Auth & Custom Claims ────────────────────────────────────────

export { onUserApproved } from './auth/on-user-approved';
export { onUserCreated } from './auth/on-user-created';
export { onUserDeleted } from './auth/on-user-deleted';

// ── Users — Parent/Child Link Sync (DBA — Task #32) ────────────

export { onUserParentSync } from './users/on-user-parent-sync';

// ── Booking (Task #37) ───────────────────────────────────────────

export { bookLessonSlot } from './booking/book-lesson-slot';
export { bookMakeupLesson } from './booking/book-makeup-lesson';

// ── Lesson Triggers (Phase 2 — to be implemented) ───────────────
// export { onLessonCancelled } from './lessons/on-lesson-cancelled';
// export { onLessonCompleted } from './lessons/on-lesson-completed';

// ── Billing (Phase 2 — to be implemented) ───────────────────────
// export { generatePayrollExport } from './billing/generate-payroll-export';

// ── Calendar (Phase 2 — to be implemented) ──────────────────────
// export { syncTeacherCalendars } from './calendar/sync-teacher-calendars';
// export { getIsraeliHolidaysForYear } from './calendar/get-israeli-holidays';
