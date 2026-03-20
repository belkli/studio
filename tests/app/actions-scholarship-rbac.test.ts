/**
 * Tests for scholarship RBAC gating.
 * NOTE: src/app/actions.ts uses 'use server' — do NOT import it directly.
 * We test the pure logic functions from src/lib/scholarship-rbac.ts instead.
 */
import { describe, it, expect } from 'vitest';
import type { ScholarshipApplication, User } from '@/lib/types';
import {
  isCommitteeMember,
  redactScholarshipForNonCommittee,
} from '@/lib/scholarship-rbac';

const baseApp: ScholarshipApplication = {
  id: 'app-1',
  studentId: 'stu-1',
  studentName: 'יעל כהן',
  instrument: 'פסנתר',
  conservatoriumId: 'cons-1',
  academicYear: '2025-2026',
  status: 'APPROVED',
  submittedAt: '2025-10-01T00:00:00Z',
  priorityScore: 85,
  approvedAt: '2025-11-01T00:00:00Z',
  documents: ['https://storage.example.com/income-cert.pdf'],
  aiScore: {
    score: 88,
    urgencyLevel: 'HIGH',
    reasoning: 'קשיים כלכליים חמורים.',
    recommendedAward: { discountPercent: 75, durationMonths: 12, confidence: 'HIGH' },
    flaggedForHumanReview: false,
  },
};

const committeeAdmin = {
  id: 'admin-comm-1',
  role: 'conservatorium_admin' as const,
  conservatoriumId: 'cons-1',
  scholarshipCommittee: true,
};

const regularAdmin = {
  id: 'admin-reg-1',
  role: 'conservatorium_admin' as const,
  conservatoriumId: 'cons-1',
  scholarshipCommittee: false,
};

const siteAdmin = {
  id: 'site-admin-1',
  role: 'site_admin' as const,
  conservatoriumId: '',
  scholarshipCommittee: false,
};

describe('isCommitteeMember', () => {
  it('returns true for conservatorium_admin with scholarshipCommittee flag', () => {
    expect(isCommitteeMember(committeeAdmin)).toBe(true);
  });
  it('returns false for conservatorium_admin without flag', () => {
    expect(isCommitteeMember(regularAdmin)).toBe(false);
  });
  it('returns true for site_admin (global bypass)', () => {
    expect(isCommitteeMember(siteAdmin)).toBe(true);
  });
});

describe('redactScholarshipForNonCommittee', () => {
  it('strips documents and aiScore for non-committee admin', () => {
    const result = redactScholarshipForNonCommittee(baseApp);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = result as any;
    expect(raw.documents).toBeUndefined();
    expect(raw.aiScore).toBeUndefined();
    expect(result.studentName).toBe('יעל כהן');
    expect(result.status).toBe('APPROVED');
  });

  it('redacted summary does not include documents field', () => {
    const result = redactScholarshipForNonCommittee(baseApp);
    expect('documents' in result).toBe(false);
  });
});
