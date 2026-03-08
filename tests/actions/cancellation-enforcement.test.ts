import { describe, it, expect } from 'vitest';
import { rescheduleLesson, cancelLesson } from '@/app/actions/reschedule-lesson';

describe('rescheduleLesson', () => {
  it('returns success for a new time well in the future (> 24h)', async () => {
    const futureTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const result = await rescheduleLesson({
      lessonSlotId: 'slot-1',
      newStartTime: futureTime,
      requestedBy: 'student-1',
      conservatoriumId: 'cons-1',
    });
    expect(result.success).toBe(true);
    expect(result.isLateReschedule).toBe(false);
  });

  it('blocks reschedule when new time is less than 24h away', async () => {
    const soonTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2h from now
    const result = await rescheduleLesson({
      lessonSlotId: 'slot-1',
      newStartTime: soonTime,
      requestedBy: 'student-1',
      conservatoriumId: 'cons-1',
    });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INSUFFICIENT_NOTICE');
    expect(result.hoursRequired).toBe(24);
  });

  it('allows admin bypass even within 24h window', async () => {
    const soonTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const result = await rescheduleLesson({
      lessonSlotId: 'slot-1',
      newStartTime: soonTime,
      requestedBy: 'admin-1',
      conservatoriumId: 'cons-1',
      bypassNoticeCheck: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects if newStartTime is in the past', async () => {
    const pastTime = new Date(Date.now() - 1000).toISOString();
    const result = await rescheduleLesson({
      lessonSlotId: 'slot-1',
      newStartTime: pastTime,
      requestedBy: 'student-1',
      conservatoriumId: 'cons-1',
    });
    expect(result.success).toBe(false);
  });
});

describe('cancelLesson', () => {
  it('returns success for an on-time cancellation with makeup credit', async () => {
    const result = await cancelLesson({
      lessonSlotId: 'slot-1',
      cancelledBy: 'student-1',
      conservatoriumId: 'cons-1',
    });
    expect(result.success).toBe(true);
    expect(result.makeupCreditIssued).toBe(true);
    expect(result.isLateCancellation).toBe(false);
  });

  it('returns missing fields error', async () => {
    const result = await cancelLesson({
      lessonSlotId: '',
      cancelledBy: 'student-1',
      conservatoriumId: 'cons-1',
    });
    expect(result.success).toBe(false);
  });
});
