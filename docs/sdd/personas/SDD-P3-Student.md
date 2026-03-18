# SDD-P3: Persona Audit — Student
**Lyriosa 360° Architecture Audit**
**Persona:** Music Student (תלמיד/ה)
**Auditor Role:** Senior Full-Stack Architect + UX Product Lead
**Version:** 1.0 | **Date:** 2026-02-25

---

## 1. Executive Summary

The student persona is Lyriosa's most UX-sensitive role. A student who finds the app confusing or uninspiring will simply not use it — and the entire value proposition of self-service scheduling, practice logs, and digital forms collapses. The SDDs for student-facing features are reasonably thorough (enrollment wizard, self-service scheduling, gamified practice logs, AI Matchmaker), and the prototype mock data shows encouraging signs: `achievements`, `weeklyPracticeGoal`, `AssignedRepertoire`, and `PracticeVideo` types are all present in the type system.

**What Is Good:**
- The 9-step enrollment wizard (SDD-02) is well-designed and considers both the parent-registering-child and self-registering-student flows. The AI Matchmaker integration at Step 5 is a genuine differentiator.
- The gamification layer — achievements, practice streaks, mood tracking — is present in both the type system and the mock `addPracticeLog` logic. The 7-day streak detection algorithm in `use-auth.tsx` even works correctly in the prototype (though against mock data).
- The `AchievementType` union and the `awardAchievement` function show that the gamification architecture is partially thought through. The types `PIECE_COMPLETED` and `PRACTICE_STREAK_7` are implemented.
- The waitlist flow (SDD-02 Section 7) is well-specified — the 48-hour priority offer window with cascade-to-next logic is a thoughtful UX detail that prevents slot hoarding.
- `next-intl` with four language files (`he`, `ar`, `en`, `ru`) is already in the codebase and message files exist. The i18n infrastructure is partially wired.

**What Is Lacking:**
- **Sheet Music Viewer:** SDD-09 and SDD-14 both mention a PDF score viewer, but no implementation exists. Students need to see their assigned sheet music in-app, with the ability to annotate and zoom. This is table-stakes for a digital music learning platform.
- **Self-Service Rescheduling:** SDD-04 Section 5.3 documents the rescheduling flow thoroughly, but the prototype's `rescheduleLesson` function is a single state mutation that doesn't enforce the cancellation policy notice window, doesn't check for conflicts, and doesn't release the old slot back to the pool.
- **AI Matchmaker UI:** `match-teacher-flow.ts` exists in the prototype but the enrollment wizard (`enrollment-wizard.tsx`) doesn't call it. The teacher matching step is stubbed with mock teacher cards.
- **Practice Log — Full UI:** The `addPracticeLog` function exists in `use-auth.tsx` and the `PracticeLog` type is complete, but there is no implementation of the visual daily/weekly chart, the teacher comment view, or the "before-lesson summary" that teachers see.
- **Age-Gate & Under-13 Restrictions:** The nightly Cloud Function for the birthday upgrade (SDD-01 Section 2.3) is completely unimplemented. All students appear to use the same interface regardless of age.

**Critical Missing Feature Not in SDD:**
- **Student Onboarding Walkthrough:** The `hasSeenWalkthrough` field and `markWalkthroughAsSeen` function exist in the auth hook, suggesting a walkthrough was planned, but there's no implementation. A first-time student who completes enrollment needs guided onboarding to understand how to book lessons, log practice, etc.
- **Offline Mode / PWA Support:** Students log practice sessions on mobile, often in rooms with poor connectivity (basements, practice studios). A Progressive Web App with offline logging and background sync is critical for practice log adoption.

---

## 2. Functional Gap Analysis

### Gap 1: Gamification System — Incomplete Achievement Catalog
**Severity:** Medium (P2)

Only two achievement types (`PIECE_COMPLETED`, `PRACTICE_STREAK_7`) are implemented. The SDD implies a full gamification system. There's no points system, no level progression, no visual "trophy room," and no public sharing capability.

### Gap 2: Self-Service Rescheduling — Policy Not Enforced
**Severity:** High (P1)

The prototype allows rescheduling without checking the cancellation notice window. A student could reschedule a lesson starting in 2 hours — which should be treated as a late cancellation — but the mock code performs the reschedule silently.

### Gap 3: AI Matchmaker — Flow Exists, UI Doesn't Connect
**Severity:** High (P1)

`match-teacher-flow.ts` uses a two-pass algorithm (hard filters + LLM scoring) that is architecturally correct. But the enrollment wizard renders static mock teacher cards. The Genkit flow is never called from the UI.

### Gap 4: Practice Video Upload
**Severity:** Medium (P2)

The `PracticeVideo` type and `addPracticeVideo` mock exist. A student can theoretically "submit" a video, but there's no actual Firebase Storage upload, no video playback component, and no connection to a real camera/file picker.

### Gap 5: Age-Gate Logic
**Severity:** High (P1 — compliance)

The system has no runtime enforcement of the under-13 restrictions. The nightly Cloud Function for birthday upgrades doesn't exist. A student born yesterday could theoretically access the full student interface if manually assigned the `STUDENT_OVER_13` role.

---

## 3. Actionable Technical Specifications

### 3.1 Gamification: Full Achievement Catalog

```typescript
// src/lib/types/achievements.ts
export type AchievementType =
  // Practice milestones
  | 'PRACTICE_STREAK_7'         // 7 consecutive days logged
  | 'PRACTICE_STREAK_30'        // 30 consecutive days
  | 'TOTAL_HOURS_10'            // 10 cumulative practice hours
  | 'TOTAL_HOURS_50'            // 50 cumulative hours
  | 'TOTAL_HOURS_100'           // 100 cumulative hours — "Century Club"
  // Repertoire milestones
  | 'PIECE_COMPLETED'           // Any piece marked COMPLETED
  | 'PIECES_COMPLETED_5'        // 5 pieces in lifetime
  | 'PERFORMANCE_READY'        // First piece marked PERFORMANCE_READY
  // Enrollment milestones
  | 'YEARS_ENROLLED_1'          // 1 year since first lesson
  | 'YEARS_ENROLLED_3'
  | 'FIRST_RECITAL'             // Performed in any recital
  | 'FIRST_LESSON'              // Attended first lesson
  // Engagement
  | 'FORM_SUBMITTED'            // First form submitted
  | 'EXAM_REGISTERED'           // First exam registration
  | 'EXAM_PASSED'               // Ministry exam passed

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;             // Hebrew title
  titleHe: string;
  description: string;
  icon: string;              // emoji or icon name
  achievedAt: string;        // ISO timestamp
  sharedAt?: string;         // if student chose to share
  points: number;            // for leaderboard / level calc
}

export const ACHIEVEMENT_DEFINITIONS: Record<AchievementType, Omit<Achievement, 'id' | 'achievedAt'>> = {
  PRACTICE_STREAK_7:    { type: 'PRACTICE_STREAK_7', title: '7 Days of Practice',   titleHe: 'שבוע של תרגול!',    description: 'תרגלת 7 ימים ברצף', icon: '🔥', points: 50  },
  PRACTICE_STREAK_30:   { type: 'PRACTICE_STREAK_30', title: '30-Day Streak',        titleHe: '30 יום ברצף!',     description: 'חודש שלם של תרגול יומי', icon: '🌟', points: 200 },
  TOTAL_HOURS_10:       { type: 'TOTAL_HOURS_10',  title: '10 Hours Practiced',      titleHe: '10 שעות תרגול',   description: 'הגעת ל-10 שעות תרגול מצטברות', icon: '⏱️', points: 100 },
  PIECE_COMPLETED:      { type: 'PIECE_COMPLETED', title: 'Piece Completed!',         titleHe: 'יצירה הושלמה!',   description: 'כל הכבוד על השלמת יצירה', icon: '🎵', points: 75  },
  FIRST_RECITAL:        { type: 'FIRST_RECITAL',   title: 'First Recital!',          titleHe: 'הופעה ראשונה!',    description: 'ניגנת בהופעה הראשונה שלך', icon: '🎭', points: 150 },
  // ... etc
};

// Student total level calculation
export function calculateStudentLevel(achievements: Achievement[]): { level: number; points: number; title: string } {
  const points = achievements.reduce((sum, a) => sum + a.points, 0);
  const levels = [
    { level: 1, min: 0,    title: 'מתחיל',      titleEn: 'Beginner' },
    { level: 2, min: 100,  title: 'לומד',       titleEn: 'Learner' },
    { level: 3, min: 300,  title: 'מתרגל',      titleEn: 'Practitioner' },
    { level: 4, min: 700,  title: 'מוזיקאי',    titleEn: 'Musician' },
    { level: 5, min: 1500, title: 'אמן',        titleEn: 'Artist' },
  ];
  const current = [...levels].reverse().find(l => points >= l.min) ?? levels[0];
  return { level: current.level, points, title: current.title };
}
```

---

### 3.2 Rescheduling: Policy-Enforced Server Action

```typescript
// src/app/actions/reschedule-lesson.ts
'use server'
export async function rescheduleLesson(
  slotId: string,
  newStartTime: string,
  conservatoriumId: string,
  requesterId: string
): Promise<{ success: boolean; error?: 'LATE_CANCEL' | 'SLOT_TAKEN' | 'NOT_AUTHORIZED' }> {

  const slotRef = db.doc(`conservatoriums/${conservatoriumId}/lessonSlots/${slotId}`);
  const slot = (await slotRef.get()).data() as LessonSlot;

  // Authorization check
  if (slot.studentId !== requesterId) {
    return { success: false, error: 'NOT_AUTHORIZED' };
  }

  // Policy check: is the existing lesson within the no-reschedule window?
  const policy = await getCancellationPolicy(conservatoriumId);
  const hoursUntilLesson = (new Date(slot.startTime).getTime() - Date.now()) / 3600000;

  if (hoursUntilLesson < policy.studentNoticeHoursRequired) {
    // Treat as late cancellation — do NOT allow reschedule
    return { success: false, error: 'LATE_CANCEL' };
  }

  // New slot availability check within transaction
  const newStart = new Date(newStartTime);
  const newEnd = new Date(newStart.getTime() + slot.durationMinutes * 60000);
  const lockKey = `${slot.roomId}_${formatSlotKey(Timestamp.fromDate(newStart))}`;
  const lockRef = db.doc(`conservatoriums/${conservatoriumId}/roomLocks/${lockKey}`);

  try {
    await db.runTransaction(async (tx) => {
      const lockSnap = await tx.get(lockRef);
      if (lockSnap.exists()) {
        throw new Error('SLOT_TAKEN');
      }

      // Release old lock
      const oldLockKey = `${slot.roomId}_${formatSlotKey(slot.startTime as unknown as Timestamp)}`;
      tx.delete(db.doc(`conservatoriums/${conservatoriumId}/roomLocks/${oldLockKey}`));

      // Claim new lock
      tx.set(lockRef, { slotId, bookedAt: Timestamp.now(), releasedAt: Timestamp.fromDate(newEnd) });

      // Update the slot
      tx.update(slotRef, {
        startTime: Timestamp.fromDate(newStart),
        updatedAt: Timestamp.now(),
        rescheduledFrom: slot.startTime,
        rescheduledAt: Timestamp.now(),
      });
    });
  } catch (e: any) {
    return { success: false, error: 'SLOT_TAKEN' };
  }

  // Notify teacher of rescheduled lesson
  await triggerNotification('LESSON_RESCHEDULED', { slotId, conservatoriumId, oldTime: slot.startTime, newTime: newStartTime });

  return { success: true };
}
```

---

### 3.3 Age-Gate: Birthday Upgrade Cloud Function

```typescript
// functions/src/ageUpgrade.ts
export const dailyAgeGateCheck = onSchedule('every 24 hours', async () => {
  const today = new Date();
  const birthdayFilter = format(today, 'MM-dd'); // e.g., "03-15"

  // Find all STUDENT_UNDER_13 whose birthday is today (born exactly 13 years ago)
  const thirteenYearsAgo = subYears(today, 13);
  const startOfTarget = startOfDay(thirteenYearsAgo);
  const endOfTarget = endOfDay(thirteenYearsAgo);

  const turningThirteen = await db
    .collectionGroup('users')
    .where('role', '==', 'STUDENT_UNDER_13')
    .where('dateOfBirth', '>=', Timestamp.fromDate(startOfTarget))
    .where('dateOfBirth', '<=', Timestamp.fromDate(endOfTarget))
    .get();

  for (const studentDoc of turningThirteen.docs) {
    const student = studentDoc.data() as User;
    const parentId = student.parentId;
    if (!parentId) continue;

    // Create an age-upgrade invitation record
    const inviteRef = db.collection('ageUpgradeInvitations').doc();
    await inviteRef.set({
      id: inviteRef.id,
      studentId: student.id,
      conservatoriumId: student.conservatoriumId,
      parentId,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(addDays(today, 30)),
      status: 'PENDING', // PENDING | ACCEPTED | DEFERRED | PARENT_MANAGED
    });

    // Notify parent
    await triggerNotification('AGE_UPGRADE_INVITATION', {
      parentId,
      studentName: student.firstName,
      inviteId: inviteRef.id,
    });
  }
});
```

---

### 3.4 PWA / Offline Practice Log

```typescript
// next.config.ts — add PWA support
// npm install next-pwa
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firestore-cache',
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
      },
    },
  ],
});

// For offline practice log submission:
// Use IndexedDB (via idb-keyval) as the offline queue
// src/lib/offline-queue.ts
import { get, set, del, keys } from 'idb-keyval';

export async function queuePracticeLog(log: Partial<PracticeLog>): Promise<void> {
  const key = `offline-practice-${Date.now()}`;
  await set(key, log);
}

export async function flushOfflineQueue(): Promise<void> {
  const offlineKeys = (await keys()).filter(k => String(k).startsWith('offline-practice-'));
  for (const key of offlineKeys) {
    const log = await get(key);
    if (log) {
      await logPracticeSession(log.studentId, log.conservatoriumId, log);
      await del(key);
    }
  }
}

// Flush when online event fires
// src/hooks/use-offline-sync.ts
export function useOfflineSync() {
  useEffect(() => {
    const handleOnline = () => flushOfflineQueue();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);
}
```

---

### 3.5 Sheet Music Viewer Component

```typescript
// npm install react-pdf @react-pdf-viewer/core
// src/components/lms/SheetMusicViewer.tsx

'use client';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';

interface SheetMusicViewerProps {
  storagePath: string;      // Firebase Storage path
  compositionTitle: string;
  studentId: string;
  conservatoriumId: string;
}

export function SheetMusicViewer({ storagePath, compositionTitle, studentId, conservatoriumId }: SheetMusicViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const toolbarPluginInstance = toolbarPlugin();

  useEffect(() => {
    // Fetch signed URL via Cloud Function (never expose raw Storage URL)
    fetchSignedSheetMusicUrl(storagePath, studentId, conservatoriumId).then(setPdfUrl);
  }, [storagePath]);

  if (!pdfUrl) return <SheetMusicSkeleton />;

  return (
    <div className="sheet-music-viewer h-[600px] w-full rounded-lg border overflow-hidden">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <div className="toolbar-bar bg-muted px-4 py-2 flex items-center gap-2 border-b">
          <toolbarPluginInstance.Toolbar />
          <span className="text-sm text-muted-foreground">{compositionTitle}</span>
        </div>
        <Viewer
          fileUrl={pdfUrl}
          defaultScale={SpecialZoomLevel.PageWidth}
          plugins={[toolbarPluginInstance]}
        />
      </Worker>
    </div>
  );
}

// Storage path convention:
// /conservatoriums/{cid}/sheetMusic/{compositionId}/{filename}.pdf
// Security: read only if studentId has this composition in their AssignedRepertoire
```

---

## 4. Summary Scorecard

| Area | SDD Coverage | Prototype Implementation | Priority |
|------|-------------|--------------------------|----------|
| Enrollment Wizard | ✅ Full spec | ⚠️ UI exists, AI not wired | P1 |
| Self-Service Reschedule | ✅ Full spec | ⚠️ No policy enforcement | P1 |
| Gamification (basic) | ✅ Documented | ⚠️ Partial (2 achievements) | P2 |
| Practice Log UI | ✅ Documented | ⚠️ Type + mock only | P1 |
| Sheet Music Viewer | ⚠️ Mentioned | ❌ Not implemented | P2 |
| AI Matchmaker UI | ✅ Flow exists | ❌ Not wired to UI | P1 |
| Age-Gate Enforcement | ✅ Documented | ❌ No Cloud Function | P1 |
| Offline PWA | ❌ Not documented | ❌ Not implemented | P2 |
| Achievement Trophy Room | ⚠️ Implied | ❌ No UI | P2 |
| Practice Video Upload | ✅ Type exists | ⚠️ Mock only, no Storage | P2 |
