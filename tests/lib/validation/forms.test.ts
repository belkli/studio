import { describe, it, expect } from 'vitest';
import {
  FormSubmissionSchema,
  SignatureSubmissionSchema,
  AttendanceMarkSchema,
  SickLeaveRequestSchema,
} from '@/lib/validation/forms';

// ── FormSubmissionSchema ──────────────────────────────────────────────────────

describe('FormSubmissionSchema', () => {
  const validForm = {
    formType: 'RECITAL',
    conservatoriumId: 'cons-1',
    studentId: 'student-1',
    studentName: 'Test Student',
  };

  it('accepts a minimal valid submission', () => {
    const result = FormSubmissionSchema.safeParse(validForm);
    expect(result.success).toBe(true);
  });

  it('rejects empty formType', () => {
    const result = FormSubmissionSchema.safeParse({ ...validForm, formType: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty conservatoriumId', () => {
    const result = FormSubmissionSchema.safeParse({ ...validForm, conservatoriumId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty studentId', () => {
    const result = FormSubmissionSchema.safeParse({ ...validForm, studentId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty studentName', () => {
    const result = FormSubmissionSchema.safeParse({ ...validForm, studentName: '' });
    expect(result.success).toBe(false);
  });

  it('accepts valid grade values', () => {
    for (const grade of ['י', 'יא', 'יב'] as const) {
      const result = FormSubmissionSchema.safeParse({ ...validForm, grade });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid grade value', () => {
    const result = FormSubmissionSchema.safeParse({ ...validForm, grade: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('accepts repertoire array', () => {
    const result = FormSubmissionSchema.safeParse({
      ...validForm,
      repertoire: [{
        id: 'comp-1',
        composer: 'Bach',
        title: 'Fugue',
        duration: '3:00',
        genre: 'Baroque',
      }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects repertoire item missing required fields', () => {
    const result = FormSubmissionSchema.safeParse({
      ...validForm,
      repertoire: [{ id: 'comp-1', composer: 'Bach' }], // missing title, duration, genre
    });
    expect(result.success).toBe(false);
  });
});

// ── SignatureSubmissionSchema ─────────────────────────────────────────────────

describe('SignatureSubmissionSchema', () => {
  const validSignature = {
    formSubmissionId: 'form-1',
    signatureDataUrl: 'data:image/png;base64,abc123',
    signerId: 'user-1',
    signerRole: 'student' as const,
  };

  it('accepts a valid signature submission', () => {
    const result = SignatureSubmissionSchema.safeParse(validSignature);
    expect(result.success).toBe(true);
  });

  it('rejects empty formSubmissionId', () => {
    const result = SignatureSubmissionSchema.safeParse({ ...validSignature, formSubmissionId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects signatureDataUrl not starting with data:image/', () => {
    const result = SignatureSubmissionSchema.safeParse({
      ...validSignature,
      signatureDataUrl: 'https://example.com/img.png',
    });
    expect(result.success).toBe(false);
  });

  it('rejects signatureDataUrl larger than 500,000 chars', () => {
    const result = SignatureSubmissionSchema.safeParse({
      ...validSignature,
      signatureDataUrl: 'data:image/png;base64,' + 'a'.repeat(500_000),
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty signerId', () => {
    const result = SignatureSubmissionSchema.safeParse({ ...validSignature, signerId: '' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid signer roles', () => {
    const roles = ['student', 'teacher', 'parent', 'conservatorium_admin', 'site_admin', 'ministry_director'] as const;
    for (const signerRole of roles) {
      const result = SignatureSubmissionSchema.safeParse({ ...validSignature, signerRole });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid signer role', () => {
    const result = SignatureSubmissionSchema.safeParse({ ...validSignature, signerRole: 'guest' });
    expect(result.success).toBe(false);
  });
});

// ── AttendanceMarkSchema ──────────────────────────────────────────────────────

describe('AttendanceMarkSchema', () => {
  it('accepts MARK_PRESENT action', () => {
    const result = AttendanceMarkSchema.safeParse({
      slotId: 'slot-1',
      action: 'MARK_PRESENT',
    });
    expect(result.success).toBe(true);
  });

  it('accepts all valid actions', () => {
    for (const action of ['MARK_PRESENT', 'MARK_NO_SHOW_STUDENT', 'MARK_ABSENT_NOTICED', 'MARK_VIRTUAL'] as const) {
      const result = AttendanceMarkSchema.safeParse({ slotId: 'slot-1', action });
      expect(result.success).toBe(true);
    }
  });

  it('rejects empty slotId', () => {
    const result = AttendanceMarkSchema.safeParse({ slotId: '', action: 'MARK_PRESENT' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid action', () => {
    const result = AttendanceMarkSchema.safeParse({ slotId: 'slot-1', action: 'SKIP' });
    expect(result.success).toBe(false);
  });

  it('rejects teacherNote exceeding 500 chars', () => {
    const result = AttendanceMarkSchema.safeParse({
      slotId: 'slot-1',
      action: 'MARK_PRESENT',
      teacherNote: 'n'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('accepts teacherNote of exactly 500 chars', () => {
    const result = AttendanceMarkSchema.safeParse({
      slotId: 'slot-1',
      action: 'MARK_PRESENT',
      teacherNote: 'n'.repeat(500),
    });
    expect(result.success).toBe(true);
  });
});

// ── SickLeaveRequestSchema ────────────────────────────────────────────────────

describe('SickLeaveRequestSchema', () => {
  const validSickLeave = {
    teacherId: 'teacher-1',
    conservatoriumId: 'cons-1',
    dateRange: { from: '2026-06-01', to: '2026-06-03' },
  };

  it('accepts a valid sick leave request', () => {
    const result = SickLeaveRequestSchema.safeParse(validSickLeave);
    expect(result.success).toBe(true);
  });

  it('accepts same-day sick leave (from === to)', () => {
    const result = SickLeaveRequestSchema.safeParse({
      ...validSickLeave,
      dateRange: { from: '2026-06-01', to: '2026-06-01' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects when from date is after to date', () => {
    const result = SickLeaveRequestSchema.safeParse({
      ...validSickLeave,
      dateRange: { from: '2026-06-10', to: '2026-06-01' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format (not YYYY-MM-DD)', () => {
    const result = SickLeaveRequestSchema.safeParse({
      ...validSickLeave,
      dateRange: { from: '01/06/2026', to: '2026-06-03' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty teacherId', () => {
    const result = SickLeaveRequestSchema.safeParse({ ...validSickLeave, teacherId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects note exceeding 500 chars', () => {
    const result = SickLeaveRequestSchema.safeParse({
      ...validSickLeave,
      note: 'z'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('accepts note of exactly 500 chars', () => {
    const result = SickLeaveRequestSchema.safeParse({
      ...validSickLeave,
      note: 'z'.repeat(500),
    });
    expect(result.success).toBe(true);
  });
});
