import { describe, it, expect } from 'vitest';
import { PracticeLogSchema, TeacherCommentSchema } from '@/lib/validation/practice-log';

// Use a fixed past date that is always in the past
const PAST_DATE = '2020-01-15';

// ── PracticeLogSchema ─────────────────────────────────────────────────────────

describe('PracticeLogSchema', () => {
  const validLog = {
    studentId: 'student-1',
    date: PAST_DATE,
    durationMinutes: 30,
    pieces: [{ title: 'Sonata No. 1', composerId: 'comp-1', focusArea: 'technique' }],
    mood: 'OKAY' as const,
  };

  it('accepts a valid practice log', () => {
    const result = PracticeLogSchema.safeParse(validLog);
    expect(result.success).toBe(true);
  });

  it('rejects empty studentId', () => {
    const result = PracticeLogSchema.safeParse({ ...validLog, studentId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = PracticeLogSchema.safeParse({ ...validLog, date: '15-01-2020' });
    expect(result.success).toBe(false);
  });

  it('rejects future date', () => {
    const result = PracticeLogSchema.safeParse({ ...validLog, date: '2099-12-31' });
    expect(result.success).toBe(false);
  });

  it('rejects durationMinutes of 0', () => {
    const result = PracticeLogSchema.safeParse({ ...validLog, durationMinutes: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects durationMinutes exceeding 480', () => {
    const result = PracticeLogSchema.safeParse({ ...validLog, durationMinutes: 481 });
    expect(result.success).toBe(false);
  });

  it('accepts durationMinutes of exactly 480', () => {
    const result = PracticeLogSchema.safeParse({ ...validLog, durationMinutes: 480 });
    expect(result.success).toBe(true);
  });

  it('accepts durationMinutes of exactly 1', () => {
    const result = PracticeLogSchema.safeParse({ ...validLog, durationMinutes: 1 });
    expect(result.success).toBe(true);
  });

  it('rejects non-integer durationMinutes', () => {
    const result = PracticeLogSchema.safeParse({ ...validLog, durationMinutes: 30.5 });
    expect(result.success).toBe(false);
  });

  it('rejects empty pieces array', () => {
    const result = PracticeLogSchema.safeParse({ ...validLog, pieces: [] });
    expect(result.success).toBe(false);
  });

  it('rejects piece with empty title', () => {
    const result = PracticeLogSchema.safeParse({
      ...validLog,
      pieces: [{ title: '' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts multiple pieces', () => {
    const result = PracticeLogSchema.safeParse({
      ...validLog,
      pieces: [
        { title: 'Piece 1' },
        { title: 'Piece 2', composerId: 'comp-2' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts all valid mood values', () => {
    for (const mood of ['GREAT', 'OKAY', 'HARD'] as const) {
      const result = PracticeLogSchema.safeParse({ ...validLog, mood });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid mood value', () => {
    const result = PracticeLogSchema.safeParse({ ...validLog, mood: 'MEH' });
    expect(result.success).toBe(false);
  });

  it('accepts optional studentNote within 1000 chars', () => {
    const result = PracticeLogSchema.safeParse({
      ...validLog,
      studentNote: 'n'.repeat(1000),
    });
    expect(result.success).toBe(true);
  });

  it('rejects studentNote exceeding 1000 chars', () => {
    const result = PracticeLogSchema.safeParse({
      ...validLog,
      studentNote: 'n'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

// ── TeacherCommentSchema ──────────────────────────────────────────────────────

describe('TeacherCommentSchema', () => {
  it('accepts a valid teacher comment', () => {
    const result = TeacherCommentSchema.safeParse({
      logId: 'log-1',
      teacherComment: 'Great practice session!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty logId', () => {
    const result = TeacherCommentSchema.safeParse({ logId: '', teacherComment: 'Nice!' });
    expect(result.success).toBe(false);
  });

  it('rejects empty teacherComment', () => {
    const result = TeacherCommentSchema.safeParse({ logId: 'log-1', teacherComment: '' });
    expect(result.success).toBe(false);
  });

  it('rejects teacherComment exceeding 2000 chars', () => {
    const result = TeacherCommentSchema.safeParse({
      logId: 'log-1',
      teacherComment: 't'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts teacherComment of exactly 2000 chars', () => {
    const result = TeacherCommentSchema.safeParse({
      logId: 'log-1',
      teacherComment: 't'.repeat(2000),
    });
    expect(result.success).toBe(true);
  });
});
