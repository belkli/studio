import type { Package, Invoice, PracticeLog, AssignedRepertoire, LessonNote, MakeupCredit } from '@/lib/types';
import { buildDefaultMemorySeed } from '@/lib/db/default-memory-seed';

// ── ID helpers ────────────────────────────────────────────────────
let _seq = 0;
function uid(prefix: string) { return `${prefix}-${++_seq}`; }
function isoDate(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return d.toISOString().split('T')[0];
}
function isoTs(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString();
}

// ── Factory: Package ──────────────────────────────────────────────
export function makePackage(overrides: Partial<Package> = {}): Package {
  return {
    id: uid('pkg'),
    conservatoriumId: 'cons-15',
    type: 'PACK_10',
    title: 'Test Pack of 10',
    description: '10 lesson credits',
    totalCredits: 10,
    usedCredits: 0,
    price: 1200,
    paymentStatus: 'PAID',
    validFrom: isoDate(),
    validUntil: isoDate(180),
    createdAt: isoTs(),
    ...overrides,
  };
}

export const makeExpiredPackage = (o?: Partial<Package>) =>
  makePackage({ validUntil: '2025-01-01', ...o });

export const makeTrialPackage = (o?: Partial<Package>) =>
  makePackage({ type: 'TRIAL', totalCredits: 1, price: 100, ...o });

// ── Factory: Invoice ──────────────────────────────────────────────
const VAT_RATE = 0.18;

export function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  const subtotal = 1200;
  const vatAmount = Math.round(subtotal * VAT_RATE);
  return {
    id: uid('inv'),
    invoiceNumber: `INV-${Date.now()}`,
    conservatoriumId: 'cons-15',
    payerId: 'parent-user-1',
    lineItems: [{ description: 'Lesson Package', total: subtotal }],
    subtotal,
    vatRate: VAT_RATE,
    vatAmount,
    total: subtotal + vatAmount,
    status: 'SENT',
    dueDate: isoDate(30),
    createdAt: isoTs(),
    ...overrides,
  };
}

// ── Factory: PracticeLog ──────────────────────────────────────────
export function makePracticeLog(overrides: Partial<PracticeLog> = {}): PracticeLog {
  return {
    id: uid('plog'),
    studentId: 'student-user-1',
    conservatoriumId: 'cons-15',
    date: isoDate(),
    durationMinutes: 45,
    mood: 'GREAT',
    streakContribution: true,
    pointsAwarded: 45,
    createdAt: isoTs(),
    ...overrides,
  };
}

// ── Factory: AssignedRepertoire ───────────────────────────────────
export function makeAssignedRepertoire(overrides: Partial<AssignedRepertoire> = {}): AssignedRepertoire {
  return {
    id: uid('rep'),
    studentId: 'student-user-1',
    compositionId: 'comp-db-0',
    status: 'LEARNING',
    assignedAt: isoTs(),
    ...overrides,
  };
}

// ── Factory: LessonNote ───────────────────────────────────────────
export function makeLessonNote(overrides: Partial<LessonNote> = {}): LessonNote {
  return {
    id: uid('note'),
    slotId: 'lesson-11',
    lessonSlotId: 'lesson-11',
    teacherId: 'teacher-user-1',
    studentId: 'student-user-1',
    lessonDate: isoTs(),
    lessonSummary: 'Test lesson summary',
    summary: 'Test lesson summary',
    isSharedWithStudent: true,
    isSharedWithParent: true,
    createdAt: isoTs(),
    ...overrides,
  };
}

// ── Factory: MakeupCredit ─────────────────────────────────────────
export function makeMakeupCredit(overrides: Partial<MakeupCredit> = {}): MakeupCredit {
  return {
    id: uid('credit'),
    conservatoriumId: 'cons-15',
    studentId: 'student-user-1',
    issuedBySlotId: 'lesson-11',
    issuedReason: 'TEACHER_CANCELLATION',
    issuedAt: isoTs(),
    expiresAt: isoTs(60),
    status: 'AVAILABLE',
    amount: 100,
    ...overrides,
  };
}

// ── Full-coverage seed ────────────────────────────────────────────
export function buildFullCoverageSeed() {
  const seed = buildDefaultMemorySeed();
  return {
    ...seed,
    packages: [
      makePackage({ id: 'pkg-active-1', studentId: 'student-user-1', type: 'PACK_10', usedCredits: 3 }),
      makePackage({ id: 'pkg-active-2', studentId: 'student-user-2', type: 'PACK_5', totalCredits: 5 }),
      makeExpiredPackage({ id: 'pkg-expired-1', studentId: 'student-user-4' }),
      makeTrialPackage({ id: 'pkg-trial-1', studentId: 'student-user-5' }),
    ],
    invoices: [
      makeInvoice({ id: 'inv-1', status: 'PAID', paidAt: isoDate(-14) }),
      makeInvoice({ id: 'inv-2', status: 'SENT' }),
      makeInvoice({ id: 'inv-3', status: 'OVERDUE', dueDate: '2026-01-01' }),
      makeInvoice({ id: 'inv-4', status: 'DRAFT' }),
    ],
    makeupCredits: [
      makeMakeupCredit({ id: 'mc-credit-1', status: 'AVAILABLE' }),
      makeMakeupCredit({ id: 'mc-credit-2', status: 'REDEEMED', redeemedBySlotId: 'lesson-6', redeemedAt: isoTs() }),
      makeMakeupCredit({ id: 'mc-credit-3', status: 'EXPIRED', expiresAt: '2026-01-31T09:00:00.000Z' }),
    ],
    practiceLogs: [
      makePracticeLog({ id: 'plog-1', date: '2026-03-13' }),
      makePracticeLog({ id: 'plog-2', date: '2026-03-12', durationMinutes: 30, mood: 'OKAY' }),
      makePracticeLog({ id: 'plog-3', date: '2026-03-11', durationMinutes: 60, mood: 'HARD' }),
      makePracticeLog({ id: 'plog-4', studentId: 'student-user-2', date: '2026-03-13', durationMinutes: 30 }),
    ],
    assignedRepertoire: [
      makeAssignedRepertoire({ id: 'rep-1', status: 'LEARNING' }),
      makeAssignedRepertoire({ id: 'rep-2', compositionId: 'comp-db-1', status: 'POLISHING' }),
      makeAssignedRepertoire({ id: 'rep-3', compositionId: 'comp-db-2', status: 'PERFORMANCE_READY' }),
      makeAssignedRepertoire({ id: 'rep-4', studentId: 'student-user-2', compositionId: 'comp-db-3', status: 'COMPLETED', completedAt: isoTs() }),
    ],
    lessonNotes: [
      makeLessonNote({ id: 'note-1', isSharedWithStudent: true, isSharedWithParent: true }),
      makeLessonNote({ id: 'note-2', slotId: 'lesson-12', lessonSlotId: 'lesson-12', studentId: 'student-user-2', isSharedWithStudent: false, isSharedWithParent: false }),
    ],
  };
}
