/**
 * @fileoverview Cloud Function specs for lesson lifecycle triggers.
 * SDD-P1 and SDD-P9 specify event-driven functions that fire
 * when a lesson is cancelled or completed.
 */

import type { LessonSlot, MakeupCredit, ConservatoriumLiveStats, AchievementType } from '@/lib/types';

/**
 * onLessonCancelled — Firestore Trigger (onDocumentUpdated)
 * 
 * Triggers when a lesson slot's status changes to any CANCELLED_* state.
 * 
 * Actions:
 * 1. Determine if a makeup credit should be issued based on CancellationPolicy:
 *    - CANCELLED_TEACHER → always issue credit
 *    - CANCELLED_CONSERVATORIUM → always issue credit
 *    - CANCELLED_STUDENT_NOTICED → issue if policy.studentCancellationCredit === 'FULL'
 *    - CANCELLED_STUDENT_NO_NOTICE → issue if policy.studentLateCancelCredit === 'FULL'
 *    - NO_SHOW_STUDENT → never issue (policy.noShowCredit === 'NONE')
 * 
 * 2. Create MakeupCredit document with:
 *    - status: 'AVAILABLE'
 *    - expiresAt: now + policy.makeupCreditExpiryDays
 *    - issuedBySlotId: the cancelled slot ID
 * 
 * 3. Update conservatoriumStats/live:
 *    - Decrement lessonsScheduledThisWeek
 *    - Increment openMakeupCredits
 * 
 * 4. Dispatch notifications via notification dispatcher:
 *    - To student/parent: "Your lesson on {date} has been cancelled. A makeup credit has been issued."
 *    - To admin (if teacher-cancelled): "{teacher} cancelled {count} lessons on {date}"
 * 
 * 5. If the slot had a room lock, release it.
 */
export interface OnLessonCancelledSpec {
    trigger: 'onDocumentUpdated';
    path: 'conservatoriums/{cid}/lessonSlots/{slotId}';
    condition: 'status changed to CANCELLED_* or NO_SHOW_*';
}

/**
 * onLessonCompleted — Firestore Trigger (onDocumentUpdated)
 * 
 * Triggers when a lesson slot's status changes to COMPLETED.
 * 
 * Actions:
 * 1. Update conservatoriumStats/live:
 *    - Increment lessonsCompletedThisWeek
 *    - Increment lessonsCompletedThisMonth
 *    - Add durationMinutes/60 to lessonHoursThisMonth
 * 
 * 2. Check for student achievements:
 *    - FIRST_LESSON: if this is the student's first completed lesson
 * 
 * 3. Update teacher's payroll tracking:
 *    - Add lesson record to current payroll period
 * 
 * 4. Release room lock if applicable
 */
export interface OnLessonCompletedSpec {
    trigger: 'onDocumentUpdated';
    path: 'conservatoriums/{cid}/lessonSlots/{slotId}';
    condition: 'status changed to COMPLETED';
}

// ── Scheduled Functions ──────────────────────────────────────

/**
 * expireMakeupCredits — Scheduled (daily at 03:00 IST)
 * 
 * Queries all AVAILABLE credits where expiresAt < now.
 * Updates status to 'EXPIRED'. Decrements openMakeupCredits in stats.
 * 
 * SDD-P6 identifies RC-5: Expiry race condition.
 * Fix: use a Firestore transaction per credit to prevent a concurrent
 * redemption from succeeding on an about-to-expire credit.
 */
export interface ExpireMakeupCreditsSpec {
    schedule: 'every day 03:00';
    timezone: 'Asia/Jerusalem';
}

/**
 * dailyAgeGateCheck — Scheduled (daily at 02:00 IST)
 * 
 * SDD-P3: When a STUDENT_UNDER_13 turns 13, upgrade to STUDENT_OVER_13.
 * 1. Query users where role === 'student' and dateOfBirth <= 13 years ago
 * 2. For each match, update Firebase Custom Claims
 * 3. Send parent notification about the role upgrade
 */
export interface DailyAgeGateCheckSpec {
    schedule: 'every day 02:00';
    timezone: 'Asia/Jerusalem';
}

/**
 * sendLessonReminders — Scheduled (daily at 08:00 IST)
 * 
 * Queries lessons starting tomorrow. Dispatches reminders
 * via each user's notification preferences.
 */
export interface SendLessonRemindersSpec {
    schedule: 'every day 08:00';
    timezone: 'Asia/Jerusalem';
}
