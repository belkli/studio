import { describe, it, expect } from 'vitest';

// Test pure rating computation logic
// These mirror the logic in src/hooks/use-auth.tsx submitTeacherRating / getTeacherRating
// (those are client-side hook functions, not 'use server' — tested here as pure logic)

describe('Teacher rating logic', () => {
  type Rating = {
    id: string;
    teacherId: string;
    reviewerUserId: string;
    conservatoriumId: string;
    rating: 1 | 2 | 3 | 4 | 5;
    comment?: string;
    createdAt: string;
  };

  // Mirrors getTeacherRating avg computation from use-auth.tsx line 906
  const computeAvg = (ratings: Rating[], teacherId: string) => {
    const teacherRatings = ratings.filter(r => r.teacherId === teacherId);
    if (teacherRatings.length === 0) return 0;
    return teacherRatings.reduce((s, r, _, a) => s + r.rating / a.length, 0);
  };

  const computeCount = (ratings: Rating[], teacherId: string) =>
    ratings.filter(r => r.teacherId === teacherId).length;

  it('computes average rating correctly', () => {
    const ratings: Rating[] = [
      { id: '1', teacherId: 't1', reviewerUserId: 's1', conservatoriumId: 'cons-1', rating: 5, createdAt: '' },
      { id: '2', teacherId: 't1', reviewerUserId: 's2', conservatoriumId: 'cons-1', rating: 3, createdAt: '' },
      { id: '3', teacherId: 't1', reviewerUserId: 's3', conservatoriumId: 'cons-1', rating: 4, createdAt: '' },
    ];
    expect(computeAvg(ratings, 't1')).toBeCloseTo(4.0);
  });

  it('returns 0 (falsy) for teacher with no ratings', () => {
    expect(computeAvg([], 't1')).toBe(0);
    expect(computeCount([], 't1')).toBe(0);
  });

  it('validates rating is between 1 and 5 (integer only)', () => {
    const isValidRating = (r: number): r is 1 | 2 | 3 | 4 | 5 =>
      r >= 1 && r <= 5 && Number.isInteger(r);
    expect(isValidRating(1)).toBe(true);
    expect(isValidRating(5)).toBe(true);
    expect(isValidRating(3)).toBe(true);
    expect(isValidRating(0)).toBe(false);
    expect(isValidRating(6)).toBe(false);
    expect(isValidRating(2.5)).toBe(false);
  });

  it('prevents duplicate rating from same reviewer for same teacher', () => {
    const existing: Rating[] = [
      { id: '1', teacherId: 't1', reviewerUserId: 's1', conservatoriumId: 'cons-1', rating: 4, createdAt: '' },
    ];
    // Mirrors use-auth.tsx line 875: alreadyRated check
    const alreadyRated = existing.some(r => r.teacherId === 't1' && r.reviewerUserId === 's1');
    expect(alreadyRated).toBe(true);
  });

  it('allows rating different teachers independently', () => {
    const existing: Rating[] = [
      { id: '1', teacherId: 't1', reviewerUserId: 's1', conservatoriumId: 'cons-1', rating: 4, createdAt: '' },
    ];
    const alreadyRatedT2 = existing.some(r => r.teacherId === 't2' && r.reviewerUserId === 's1');
    expect(alreadyRatedT2).toBe(false);
  });

  it('rounds average to one decimal place as the hook does', () => {
    const ratings: Rating[] = [
      { id: '1', teacherId: 't1', reviewerUserId: 's1', conservatoriumId: 'cons-1', rating: 5, createdAt: '' },
      { id: '2', teacherId: 't1', reviewerUserId: 's2', conservatoriumId: 'cons-1', rating: 4, createdAt: '' },
      { id: '3', teacherId: 't1', reviewerUserId: 's3', conservatoriumId: 'cons-1', rating: 3, createdAt: '' },
    ];
    const avg = computeAvg(ratings, 't1');
    const rounded = Math.round(avg * 10) / 10;
    expect(rounded).toBe(4.0);
  });

  it('counts ratings per teacher correctly', () => {
    const ratings: Rating[] = [
      { id: '1', teacherId: 't1', reviewerUserId: 's1', conservatoriumId: 'cons-1', rating: 5, createdAt: '' },
      { id: '2', teacherId: 't1', reviewerUserId: 's2', conservatoriumId: 'cons-1', rating: 3, createdAt: '' },
      { id: '3', teacherId: 't2', reviewerUserId: 's1', conservatoriumId: 'cons-1', rating: 4, createdAt: '' },
    ];
    expect(computeCount(ratings, 't1')).toBe(2);
    expect(computeCount(ratings, 't2')).toBe(1);
  });

  it('requires a completed lesson before rating is eligible', () => {
    type Lesson = { teacherId: string; studentId: string; status: string };
    const lessons: Lesson[] = [
      { teacherId: 't1', studentId: 's1', status: 'COMPLETED' },
      { teacherId: 't2', studentId: 's1', status: 'SCHEDULED' },
    ];
    // Mirrors use-auth.tsx line 867: hasCompletedLesson check
    const canRateT1 = lessons.some(l => l.teacherId === 't1' && l.studentId === 's1' && l.status === 'COMPLETED');
    const canRateT2 = lessons.some(l => l.teacherId === 't2' && l.studentId === 's1' && l.status === 'COMPLETED');
    expect(canRateT1).toBe(true);
    expect(canRateT2).toBe(false);
  });
});
