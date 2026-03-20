import { describe, it, expect } from 'vitest';
import type { ScholarshipApplication } from '@/lib/types';
import { selectApplicationsForDocumentPurge } from '@/lib/scholarship-purge';

const makeApp = (overrides: Partial<ScholarshipApplication>): ScholarshipApplication => ({
  id: 'app-1',
  studentId: 'stu-1',
  studentName: 'יעל',
  instrument: 'פסנתר',
  conservatoriumId: 'cons-1',
  academicYear: '2024-2025',
  status: 'APPROVED',
  submittedAt: '2024-09-01T00:00:00Z',
  priorityScore: 80,
  ...overrides,
});

const now = new Date('2026-03-20T00:00:00Z');

describe('selectApplicationsForDocumentPurge', () => {
  it('selects APPROVED application with documents older than 12 months', () => {
    const app = makeApp({
      status: 'APPROVED',
      approvedAt: '2025-01-01T00:00:00Z',
      documents: ['https://storage.example.com/doc.pdf'],
    });
    expect(selectApplicationsForDocumentPurge([app], now)).toHaveLength(1);
  });

  it('does not select application less than 12 months old', () => {
    const app = makeApp({
      status: 'APPROVED',
      approvedAt: '2025-07-01T00:00:00Z',
      documents: ['https://storage.example.com/doc.pdf'],
    });
    expect(selectApplicationsForDocumentPurge([app], now)).toHaveLength(0);
  });

  it('does not select application with no documents', () => {
    const app = makeApp({
      status: 'APPROVED',
      approvedAt: '2025-01-01T00:00:00Z',
      documents: [],
    });
    expect(selectApplicationsForDocumentPurge([app], now)).toHaveLength(0);
  });

  it('does not select application with undefined documents', () => {
    const app = makeApp({
      status: 'APPROVED',
      approvedAt: '2025-01-01T00:00:00Z',
    });
    expect(selectApplicationsForDocumentPurge([app], now)).toHaveLength(0);
  });

  it('selects REJECTED application older than 12 months', () => {
    const app = makeApp({
      status: 'REJECTED',
      rejectedAt: '2024-12-01T00:00:00Z',
      documents: ['https://storage.example.com/doc.pdf'],
    });
    expect(selectApplicationsForDocumentPurge([app], now)).toHaveLength(1);
  });

  it('does not select SUBMITTED application', () => {
    const app = makeApp({
      status: 'SUBMITTED',
      documents: ['https://storage.example.com/doc.pdf'],
    });
    expect(selectApplicationsForDocumentPurge([app], now)).toHaveLength(0);
  });
});
