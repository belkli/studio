import { describe, it, expect, vi, afterEach } from 'vitest';
import { isInUserApprovalQueue, isOverdue } from '@/lib/form-utils';
import type { FormSubmission, User } from '@/lib/types';

// Minimal FormSubmission factory
function makeForm(overrides: Partial<FormSubmission> = {}): FormSubmission {
  return {
    id: 'form-1',
    formType: 'רסיטל בגרות',
    studentId: 'student-1',
    studentName: 'Test Student',
    status: 'DRAFT',
    submissionDate: new Date().toISOString(),
    totalDuration: '00:00',
    repertoire: [],
    conservatoriumId: 'cons-1',
    ...overrides,
  } as FormSubmission;
}

// Minimal User factory
function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@test.com',
    role: 'student',
    conservatoriumId: 'cons-1',
    conservatoriumName: 'Test Conservatorium',
    approved: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  } as User;
}

describe('isInUserApprovalQueue', () => {
  describe('teacher role', () => {
    it('returns true when form is PENDING_TEACHER and teacher has student in students list', () => {
      const teacher = makeUser({ role: 'teacher', students: ['student-1', 'student-2'] });
      const form = makeForm({ status: 'PENDING_TEACHER', studentId: 'student-1' });
      expect(isInUserApprovalQueue(form, teacher)).toBe(true);
    });

    it('returns false when form is PENDING_TEACHER but student is not in teacher students list', () => {
      const teacher = makeUser({ role: 'teacher', students: ['student-99'] });
      const form = makeForm({ status: 'PENDING_TEACHER', studentId: 'student-1' });
      expect(isInUserApprovalQueue(form, teacher)).toBe(false);
    });

    it('returns false when form is PENDING_TEACHER and teacher has no students array', () => {
      const teacher = makeUser({ role: 'teacher', students: undefined });
      const form = makeForm({ status: 'PENDING_TEACHER', studentId: 'student-1' });
      expect(isInUserApprovalQueue(form, teacher)).toBe(false);
    });

    it('returns false for teacher when form is APPROVED', () => {
      const teacher = makeUser({ role: 'teacher', students: ['student-1'] });
      const form = makeForm({ status: 'APPROVED', studentId: 'student-1' });
      expect(isInUserApprovalQueue(form, teacher)).toBe(false);
    });

    it('returns false for teacher when form is PENDING_ADMIN', () => {
      const teacher = makeUser({ role: 'teacher', students: ['student-1'] });
      const form = makeForm({ status: 'PENDING_ADMIN', studentId: 'student-1' });
      expect(isInUserApprovalQueue(form, teacher)).toBe(false);
    });
  });

  describe('conservatorium_admin role', () => {
    it('returns true when form is PENDING_ADMIN and same conservatoriumId', () => {
      const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-1' });
      const form = makeForm({ status: 'PENDING_ADMIN', conservatoriumId: 'cons-1' });
      expect(isInUserApprovalQueue(form, admin)).toBe(true);
    });

    it('returns true when form is REVISION_REQUIRED and same conservatoriumId', () => {
      const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-1' });
      const form = makeForm({ status: 'REVISION_REQUIRED', conservatoriumId: 'cons-1' });
      expect(isInUserApprovalQueue(form, admin)).toBe(true);
    });

    it('returns false when form is PENDING_ADMIN but different conservatoriumId', () => {
      const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-2' });
      const form = makeForm({ status: 'PENDING_ADMIN', conservatoriumId: 'cons-1' });
      expect(isInUserApprovalQueue(form, admin)).toBe(false);
    });

    it('returns false when form is APPROVED', () => {
      const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-1' });
      const form = makeForm({ status: 'APPROVED', conservatoriumId: 'cons-1' });
      expect(isInUserApprovalQueue(form, admin)).toBe(false);
    });
  });

  describe('delegated_admin role', () => {
    it('returns true when form is PENDING_ADMIN and same conservatoriumId', () => {
      const admin = makeUser({ role: 'delegated_admin', conservatoriumId: 'cons-1' });
      const form = makeForm({ status: 'PENDING_ADMIN', conservatoriumId: 'cons-1' });
      expect(isInUserApprovalQueue(form, admin)).toBe(true);
    });

    it('returns false when different conservatoriumId', () => {
      const admin = makeUser({ role: 'delegated_admin', conservatoriumId: 'cons-99' });
      const form = makeForm({ status: 'PENDING_ADMIN', conservatoriumId: 'cons-1' });
      expect(isInUserApprovalQueue(form, admin)).toBe(false);
    });
  });

  describe('site_admin role', () => {
    it('returns true when form is PENDING_ADMIN regardless of conservatoriumId', () => {
      const siteAdmin = makeUser({ role: 'site_admin', conservatoriumId: 'cons-99' });
      const form = makeForm({ status: 'PENDING_ADMIN', conservatoriumId: 'cons-1' });
      expect(isInUserApprovalQueue(form, siteAdmin)).toBe(true);
    });

    it('returns true when form is REVISION_REQUIRED', () => {
      const siteAdmin = makeUser({ role: 'site_admin' });
      const form = makeForm({ status: 'REVISION_REQUIRED' });
      expect(isInUserApprovalQueue(form, siteAdmin)).toBe(true);
    });

    it('returns false when form is APPROVED', () => {
      const siteAdmin = makeUser({ role: 'site_admin' });
      const form = makeForm({ status: 'APPROVED' });
      expect(isInUserApprovalQueue(form, siteAdmin)).toBe(false);
    });
  });

  describe('ministry_director role', () => {
    it('returns true when form is APPROVED', () => {
      const director = makeUser({ role: 'ministry_director' });
      const form = makeForm({ status: 'APPROVED' });
      expect(isInUserApprovalQueue(form, director)).toBe(true);
    });

    it('returns false when form is PENDING_ADMIN', () => {
      const director = makeUser({ role: 'ministry_director' });
      const form = makeForm({ status: 'PENDING_ADMIN' });
      expect(isInUserApprovalQueue(form, director)).toBe(false);
    });
  });

  describe('other roles', () => {
    it('returns false for student role', () => {
      const student = makeUser({ role: 'student' });
      const form = makeForm({ status: 'PENDING_TEACHER' });
      expect(isInUserApprovalQueue(form, student)).toBe(false);
    });

    it('returns false for parent role', () => {
      const parent = makeUser({ role: 'parent' });
      const form = makeForm({ status: 'PENDING_ADMIN' });
      expect(isInUserApprovalQueue(form, parent)).toBe(false);
    });
  });
});

describe('isOverdue', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true when form was submitted more than slaDays ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15'));
    const form = makeForm({
      status: 'PENDING_TEACHER',
      submissionDate: '2026-03-01', // 14 days ago
    });
    expect(isOverdue(form, 7)).toBe(true);
  });

  it('returns false when form was submitted within slaDays', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15'));
    const form = makeForm({
      status: 'PENDING_TEACHER',
      submissionDate: '2026-03-12', // 3 days ago
    });
    expect(isOverdue(form, 7)).toBe(false);
  });

  it('uses default of 7 days when slaDays not provided', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15'));
    const overdueForm = makeForm({
      status: 'PENDING_ADMIN',
      submissionDate: '2026-03-01', // 14 days > 7
    });
    expect(isOverdue(overdueForm)).toBe(true);

    const freshForm = makeForm({
      status: 'PENDING_ADMIN',
      submissionDate: '2026-03-12', // 3 days < 7
    });
    expect(isOverdue(freshForm)).toBe(false);
  });

  it('returns false for non-pending statuses even if overdue', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15'));
    const approved = makeForm({
      status: 'APPROVED',
      submissionDate: '2026-01-01', // very old
    });
    expect(isOverdue(approved, 7)).toBe(false);

    const draft = makeForm({
      status: 'DRAFT',
      submissionDate: '2026-01-01',
    });
    expect(isOverdue(draft, 7)).toBe(false);

    const rejected = makeForm({
      status: 'REJECTED',
      submissionDate: '2026-01-01',
    });
    expect(isOverdue(rejected, 7)).toBe(false);
  });

  it('returns true for REVISION_REQUIRED status when overdue', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15'));
    const form = makeForm({
      status: 'REVISION_REQUIRED',
      submissionDate: '2026-03-01',
    });
    expect(isOverdue(form, 7)).toBe(true);
  });

  it('returns false when submission is exactly at the SLA boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T00:00:00.000Z'));
    const form = makeForm({
      status: 'PENDING_TEACHER',
      submissionDate: '2026-03-08T00:00:00.000Z', // exactly 7 days
    });
    // diffDays === 7, isOverdue checks diffDays > slaDays, so 7 > 7 = false
    expect(isOverdue(form, 7)).toBe(false);
  });

  it('returns true with a custom slaDays of 3', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15'));
    const form = makeForm({
      status: 'PENDING_ADMIN',
      submissionDate: '2026-03-10', // 5 days > 3
    });
    expect(isOverdue(form, 3)).toBe(true);
  });
});
