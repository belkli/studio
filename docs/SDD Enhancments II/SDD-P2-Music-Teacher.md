# SDD-P2: Persona Audit — Music Teacher
**Harmonia 360° Architecture Audit**
**Persona:** Music Teacher (מורה למוזיקה)
**Auditor Role:** Senior Full-Stack Architect + LMS Domain Expert
**Version:** 1.0 | **Date:** 2026-02-25
**Source:** Studio-main prototype + SDD Enhancements v2.0 (Modules 03, 04, 06, 07, 09, 10)

---

## 1. Executive Summary

The music teacher is simultaneously the system's most active daily user and the person whose autonomy the system is most likely to violate through poor UX. The SDDs for teacher management (Module 03) and the LMS (Module 09) are conceptually well-designed, but the prototype implementation is thin. The teacher's entire experience — from daily lesson management to LMS content delivery to sick leave workflows — exists almost entirely in documentation, not in code.

**What Is Good:**
- The two-layer availability model (weekly template + exception overrides) in SDD-03 is the correct pattern for managing teacher schedules without micromanaging them. This design is production-grade.
- The `TeacherSpecialty` tag taxonomy is well-thought-out and directly feeds the AI Matchmaker (SDD-10), creating a genuine data loop between teacher profiles and student matching.
- The `draft-progress-report-flow.ts` AI flow exists in the prototype and represents the most teacher-relevant AI feature in the current codebase. The Genkit implementation is structurally sound.
- SDD-09's practice log model correctly captures the key pedagogical data points: duration, pieces, mood, and teacher comment. The design of the "Before Lesson" dashboard view (showing student's practice since last lesson) is a genuine productivity win for teachers.
- The substitute teacher workflow (SDD-03, Section 7) is well-designed: sick leave → identify affected slots → suggest available substitutes → one-click assignment. This is a real pain point solved intelligently.

**What Is Lacking or Thin:**
- **LMS Implementation:** The prototype contains zero LMS components. No practice log UI, no repertoire assignment interface, no sheet music viewer, no multimedia feedback system. SDD-09 is entirely aspirational at this point.
- **One-on-One Lesson Tracking:** The teacher dashboard's "attendance marking" (one-tap: Present/Absent/No-Show) is mentioned in SDD-03 but not implemented. There's also no teacher note persistence per lesson — the `teacherNote` field exists on the `LessonSlot` model but there's no UI to populate it.
- **Multimedia Feedback (Video/Audio Sync):** SDD-09 mentions "multimedia feedback" but provides no technical specification. Storing and serving teacher audio/video recordings against specific student practice log entries is architecturally non-trivial — it requires Firebase Storage with secure per-user access rules, and potentially a media processing pipeline for audio waveform display.
- **Sick Leave Flow:** Documented in SDD-03 and SDD-06, but the `SickLeaveModal` component doesn't exist in the prototype. The emergency "I'm sick — cancel today's lessons" flow is one of the highest-priority teacher UX needs and it's missing.
- **Substitute Teaching:** The `SubstituteAssignmentPanel` is documented but not implemented. The matching logic (finding teachers who teach the same instrument with availability at the exact conflicting times) is not implemented anywhere.
- **Calendar Sync:** Two-way Google Calendar / iCal sync is documented in SDD-03 Section 3.3 but the implementation is completely absent. This is a table-stakes feature for teachers who manage busy multi-employer schedules.
- **Payment Transparency:** Teachers can view their own paystub at `/dashboard/teacher/payroll` per the SDD, but there's no implementation. Teachers are blind to their earnings, which creates trust issues.

**What Is Missing Entirely (Not in SDD):**
- **Studio Notes / Teaching Journal:** Teachers need a private pedagogical journal per student — separate from the student-visible teacher comment on practice logs. This is a standard feature in TeacherZone and My Music Staff.
- **Parent Communication Logging:** Teachers need a record of all communications with parents (WhatsApp, SMS, in-app messages) per student, accessible from the student card.
- **Exam Progress Tracking:** For exam-track students, teachers need a structured progress tracker tied to the Ministry's exam curriculum — which scales (כלל), pieces (יצירות), and sight-reading (ניגון מהדף) requirements. SDD-08 handles form submission but not the day-to-day exam preparation tracking.
- **Group/Ensemble Lesson Support:** SDD-09 briefly mentions "group lessons" as a future feature, but there's no data model, attendance sheet, or scheduling flow for ensemble lessons. This is critical for conservatoriums with orchestras, chamber groups, or theory classes.

**What Is Redundant:**
- SDD-09 Section 5 (Sheet Music Viewer) overlaps significantly with SDD-14 (Additional Features) which also mentions a PDF viewer for scores. These should be unified under SDD-09 with SDD-14 referencing it.

---

## 2. Functional Gap Analysis

### Gap 1: Lesson Notes & Teacher Journal System
**Severity:** High (P1)

The `LessonSlot.teacherNote` field is a single string — insufficient for real pedagogical use. Teachers need:
- A structured lesson summary (what was covered, what homework was assigned)
- A private studio note (internal, not visible to student/parent)
- Homework assignment with due date
- Technical issue flags (e.g., "student has poor posture — needs correction")
- Ability to reference previous lesson notes in the current session

### Gap 2: Multimedia Feedback Architecture
**Severity:** Medium (P2)

The SDD mentions "audio/video sync" feedback but provides no spec. This is architecturally complex: teachers need to record a short audio or video clip in response to a student's practice log, and the student/parent needs to receive and play it. Standard Firebase Storage can handle the files, but the UX around recording, upload progress, and in-app playback needs a full spec.

### Gap 3: Sick Leave & Substitute System Implementation
**Severity:** Critical (P0 for launch)

A teacher who gets sick on a Tuesday morning needs to be able to cancel all their lessons for the day in under 30 seconds. This is the highest-urgency mobile UX pattern in the entire teacher experience. It is documented but not implemented.

### Gap 4: Two-Way Calendar Sync
**Severity:** High (P1)

Teachers in Israel routinely teach at multiple conservatoriums. Without calendar sync, they will double-book themselves constantly. The implementation requires a scheduled Cloud Function (every 15 minutes) that reads the teacher's Google Calendar API or CalDAV feed and marks conflicts in Harmonia's availability system.

### Gap 5: Israeli Exam Curriculum Tracker
**Severity:** Medium (P1 for conservatoriums that prepare exam students)

The Israeli Ministry of Education music exams (בחינות משרד החינוך) require specific repertoire lists per instrument and level. Teachers preparing students for these exams need a structured tracker showing: which required pieces are assigned, practice progress per piece, and mock exam readiness assessment.

### Gap 6: Group Lesson / Ensemble Data Model
**Severity:** Medium (P2)

The `LessonSlot` model has a `GROUP` type placeholder but no implementation. A group lesson needs a `studentIds: string[]` array (not just `studentId`), a group attendance sheet, and a separate credit consumption model where each student in the group consumes credits independently.

### Gap 7: Practice Log Gamification for Students
**Severity:** Low (P2)

SDD-09 mentions gamification but doesn't specify it. The teacher sets weekly practice goals; the student sees colored progress indicators. This needs a concrete points/streak system spec so the front-end can be built consistently.

---

## 3. Actionable Technical Specifications

### 3.1 Firestore: Enhanced Lesson Note Model

Replace the single `teacherNote` string on `LessonSlot` with a structured notes sub-collection:

```typescript
// Collection: /conservatoriums/{cid}/lessonSlots/{slotId}/notes/{noteId}
// (Sub-collection keeps notes separate from slot metadata for query efficiency)
interface LessonNote {
  id: string;
  slotId: string;
  studentId: string;
  teacherId: string;
  lessonDate: Timestamp;

  // Public-facing (visible to student + parent)
  lessonSummary: string;          // What we covered today
  homeworkAssignment?: {
    description: string;
    dueDateLessonNumber?: number; // "By lesson 3" or specific date
    dueDate?: Date;
    pieces: string[];
    specificFocusAreas: string[];
  };

  // Internal (teacher-only, never exposed to student/parent role)
  studioNote?: string;            // Private pedagogical journal
  technicalFlags?: {
    flag: 'POSTURE' | 'TONE' | 'RHYTHM' | 'THEORY_GAP' | 'MOTIVATION' | 'TECHNIQUE';
    detail: string;
  }[];
  teacherMood: 'GREAT_SESSION' | 'PRODUCTIVE' | 'CHALLENGING' | 'CONCERN';

  // Multimedia
  audioFeedbackUrl?: string;      // Firebase Storage URL
  videoFeedbackUrl?: string;
  sheetMusicAnnotationUrl?: string; // annotated score PDF

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Firestore Security Rules for lesson notes:**
```javascript
// Only the teacher who owns the slot can write
// Student + parent can read ONLY the public fields (lessonSummary, homeworkAssignment)
// studioNote is NEVER exposed to student/parent roles

match /conservatoriums/{cid}/lessonSlots/{slotId}/notes/{noteId} {
  allow read: if isTeacherOfSlot(slotId) ||
                 isStudentOfSlot(slotId) && resource.data.keys().hasNone(['studioNote', 'technicalFlags', 'teacherMood']);
  allow write: if isTeacherOfSlot(slotId);
}
```

---

### 3.2 Teacher Dashboard: Attendance Marking Component

```typescript
// src/components/teacher/TodayLessonCard.tsx
interface TodayLessonCardProps {
  slot: LessonSlot;
  student: StudentProfile;
  practiceLogSummary?: PracticeLogSummary;
}

// The card renders as a timeline item in /dashboard/teacher
// Attendance states and their downstream effects:

type AttendanceAction = 
  | 'MARK_PRESENT'           // → status: COMPLETED, credit consumed
  | 'MARK_NO_SHOW_STUDENT'   // → status: NO_SHOW_STUDENT, credit forfeited, parent notified
  | 'MARK_ABSENT_NOTICED'    // → status: CANCELLED_STUDENT_NOTICED, makeup credit issued
  | 'MARK_VIRTUAL'           // → status: COMPLETED (virtual), meetingLink shown

// Server action (Next.js App Router)
// src/app/actions/attendance.ts
'use server'
export async function markAttendance(
  slotId: string,
  conservatoriumId: string,
  action: AttendanceAction,
  teacherNote?: string
): Promise<void> {
  const slotRef = db.doc(`conservatoriums/${conservatoriumId}/lessonSlots/${slotId}`);

  await db.runTransaction(async (tx) => {
    const slotSnap = await tx.get(slotRef);
    const slot = slotSnap.data() as LessonSlot;

    if (slot.status !== 'SCHEDULED') {
      throw new Error('Slot is not in SCHEDULED state');
    }

    const newStatus = mapActionToStatus(action);
    tx.update(slotRef, {
      status: newStatus,
      attendanceMarkedAt: Timestamp.now(),
      teacherNote: teacherNote ?? null,
      updatedAt: Timestamp.now(),
    });

    // Trigger downstream effects via stats document update
    if (newStatus === 'COMPLETED') {
      const statsRef = db.doc(`conservatoriums/${conservatoriumId}/stats/live`);
      tx.update(statsRef, {
        lessonsCompletedThisWeek: FieldValue.increment(1),
      });
    }
  });

  // Emit event for notification system (SDD-07)
  if (action === 'MARK_NO_SHOW_STUDENT') {
    await triggerNoShowNotification(slotId, conservatoriumId);
  }
}
```

---

### 3.3 Sick Leave Flow — Full Implementation Spec

```typescript
// src/components/teacher/SickLeaveModal.tsx
// Triggered by the emergency button on /dashboard/teacher

interface SickLeaveRequest {
  teacherId: string;
  conservatoriumId: string;
  dateRange: {
    from: Date;
    to: Date;    // defaults to same day for single-day sick leave
  };
  note?: string;   // e.g., "COVID-19 — isolating"
}

// Preview screen: before confirming, show teacher ALL affected lessons
// "You are about to cancel 4 lessons on Tuesday, March 4:"
// [Student Name] — 15:00 — Piano — 45 min (credit will be issued)
// [Student Name] — 16:00 — Piano — 30 min (credit will be issued)
// ...
// "All affected students/parents will be notified immediately via WhatsApp & SMS."
// [CONFIRM SICK LEAVE] button

// Server action
'use server'
export async function submitSickLeave(request: SickLeaveRequest): Promise<SickLeaveResult> {
  // 1. Query all SCHEDULED slots for this teacher in the date range
  const affectedSlots = await getAffectedSlots(
    request.teacherId,
    request.conservatoriumId,
    request.dateRange
  );

  // 2. Write teacher exception to availability
  const exceptionRef = db.collection(
    `conservatoriums/${request.conservatoriumId}/teacherExceptions`
  ).doc();
  await exceptionRef.set({
    id: exceptionRef.id,
    teacherId: request.teacherId,
    dateFrom: Timestamp.fromDate(request.dateRange.from),
    dateTo: Timestamp.fromDate(request.dateRange.to),
    type: 'SICK_LEAVE',
    note: request.note ?? null,
    createdAt: Timestamp.now(),
  });

  // 3. Batch-update all affected slots + issue makeup credits
  const BATCH_SIZE = 400;
  const results: string[] = [];

  for (let i = 0; i < affectedSlots.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = affectedSlots.slice(i, i + BATCH_SIZE);

    for (const slot of chunk) {
      // Cancel the slot
      batch.update(
        db.doc(`conservatoriums/${request.conservatoriumId}/lessonSlots/${slot.id}`),
        {
          status: 'CANCELLED_TEACHER',
          cancelledAt: Timestamp.now(),
          cancelledBy: request.teacherId,
          cancellationReason: 'TEACHER_SICK_LEAVE',
          updatedAt: Timestamp.now(),
        }
      );

      // Issue makeup credit
      const creditRef = db.collection(
        `conservatoriums/${request.conservatoriumId}/makeupCredits`
      ).doc();
      const policy = await getCancellationPolicy(request.conservatoriumId);
      batch.set(creditRef, {
        id: creditRef.id,
        conservatoriumId: request.conservatoriumId,
        studentId: slot.studentId,
        packageId: slot.packageId ?? null,
        issuedBySlotId: slot.id,
        issuedReason: 'TEACHER_CANCELLATION',
        issuedAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(
          addDays(new Date(), policy.makeupCreditExpiryDays)
        ),
        status: 'AVAILABLE',
        amount: slot.effectiveRate,
      });

      results.push(slot.id);
    }
    await batch.commit();
  }

  // 4. Notify admin
  await notifyAdminOfSickLeave(request.teacherId, request.conservatoriumId, affectedSlots.length);

  // 5. Notifications to students/parents are triggered by the onLessonCancelled function
  // (event-driven, not called here directly)

  return {
    affectedSlotsCount: affectedSlots.length,
    makeupCreditsIssued: affectedSlots.length,
    exceptionId: exceptionRef.id,
  };
}
```

---

### 3.4 Google Calendar Two-Way Sync

```typescript
// functions/src/calendarSync.ts
// Runs every 15 minutes via Firebase Scheduled Function

export const syncTeacherCalendars = onSchedule('every 15 minutes', async () => {
  const teachersWithCalendar = await db
    .collectionGroup('teachers')
    .where('calendarSyncEnabled', '==', true)
    .get();

  for (const teacherDoc of teachersWithCalendar.docs) {
    const teacher = teacherDoc.data() as TeacherProfile;
    await syncSingleTeacherCalendar(teacher);
  }
});

async function syncSingleTeacherCalendar(teacher: TeacherProfile): Promise<void> {
  const oauth2Client = await getTeacherOAuthClient(teacher.id); // Stored refresh token
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const conservatoriumId = teacher.conservatoriumId;

  // IMPORT: Fetch external events and mark as unavailable in Harmonia
  const externalEvents = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    timeMax: addDays(new Date(), 30).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const externalBusy = (externalEvents.data.items ?? [])
    .filter(e => !e.description?.includes('HARMONIA_EXPORT')) // Don't import own exports
    .map(e => ({
      start: new Date(e.start!.dateTime!),
      end: new Date(e.end!.dateTime!),
      title: e.summary ?? 'External Event',
    }));

  // Detect conflicts with existing Harmonia scheduled slots
  const harmoniaSlots = await getTeacherScheduledSlots(teacher.id, conservatoriumId, 30);
  const conflicts = detectConflicts(harmoniaSlots, externalBusy);

  if (conflicts.length > 0) {
    await notifyTeacherOfCalendarConflicts(teacher, conflicts);
  }

  // Mark external busy times in Harmonia availability exceptions
  await upsertExternalBusyBlocks(teacher.id, conservatoriumId, externalBusy);

  // EXPORT: Push all upcoming Harmonia lessons to Google Calendar
  const upcomingLessons = harmoniaSlots.filter(s => s.status === 'SCHEDULED');
  for (const lesson of upcomingLessons) {
    const student = await getStudent(lesson.studentId);
    const existingEventId = lesson.googleCalendarEventId;

    if (existingEventId) {
      // Update existing event
      await calendar.events.patch({
        calendarId: 'primary',
        eventId: existingEventId,
        requestBody: buildCalendarEvent(lesson, student, teacher),
      });
    } else {
      // Create new event
      const result = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          ...buildCalendarEvent(lesson, student, teacher),
          description: `HARMONIA_EXPORT | Lesson ID: ${lesson.id}`,
        },
      });
      // Store event ID back on the slot for future updates
      await db
        .doc(`conservatoriums/${conservatoriumId}/lessonSlots/${lesson.id}`)
        .update({ googleCalendarEventId: result.data.id });
    }
  }
}

// OAuth token management — store encrypted refresh tokens in Firestore
// /conservatoriums/{cid}/teachers/{tid}/integrations/googleCalendar
interface GoogleCalendarIntegration {
  enabled: boolean;
  accessToken: string;        // encrypted at rest using KMS
  refreshToken: string;       // encrypted at rest using KMS
  tokenExpiry: Timestamp;
  calendarId: string;         // 'primary' or specific calendar
  connectedAt: Timestamp;
  lastSyncAt?: Timestamp;
  lastSyncStatus?: 'SUCCESS' | 'FAILED';
  lastSyncError?: string;
}
```

---

### 3.5 LMS: Practice Log — Full Implementation

```typescript
// src/app/dashboard/practice/log/page.tsx (Student view)
// src/app/dashboard/teacher/students/[studentId]/practice/page.tsx (Teacher view)

// Server action for logging practice
'use server'
export async function logPracticeSession(
  studentId: string,
  conservatoriumId: string,
  data: {
    date: string;                // 'YYYY-MM-DD'
    durationMinutes: number;
    pieces: {title: string; focusArea?: string; composerId?: string}[];
    studentNote?: string;
    mood: 'GREAT' | 'OKAY' | 'HARD';
    relatedSlotId?: string;
  }
): Promise<string> {
  const logRef = db.collection(`conservatoriums/${conservatoriumId}/practiceLogs`).doc();

  await logRef.set({
    id: logRef.id,
    studentId,
    conservatoriumId,
    date: data.date,
    durationMinutes: data.durationMinutes,
    pieces: data.pieces,
    studentNote: data.studentNote ?? null,
    mood: data.mood,
    lessonSlotId: data.relatedSlotId ?? null,
    teacherComment: null,         // Teacher fills this later
    createdAt: Timestamp.now(),
  } as PracticeLog);

  // Update the student's weekly practice stats for the gamification layer
  await updateWeeklyPracticeStats(studentId, conservatoriumId, data.durationMinutes);

  return logRef.id;
}

// Firestore: Practice Logs Collection
// /conservatoriums/{cid}/practiceLogs/{logId}
interface PracticeLog {
  id: string;
  conservatoriumId: string;
  studentId: string;
  teacherId?: string;         // denormalized from student-teacher relationship
  lessonSlotId?: string;
  date: string;               // 'YYYY-MM-DD' — indexed for range queries
  durationMinutes: number;
  pieces: {
    title: string;
    composerId?: string;
    focusArea?: string;
  }[];
  studentNote?: string;
  mood: 'GREAT' | 'OKAY' | 'HARD';
  teacherComment?: string;    // Added by teacher after reviewing
  teacherCommentedAt?: Timestamp;

  // Gamification
  pointsAwarded?: number;
  streakContribution: boolean; // Did this log maintain a streak?

  createdAt: Timestamp;
}

// Composite Firestore index required:
// Collection: practiceLogs
// Fields: conservatoriumId ASC, studentId ASC, date DESC
```

---

### 3.6 Israeli Exam Curriculum Tracker

```typescript
// Collection: /conservatoriums/{cid}/examPrepTrackers/{trackerId}
interface ExamPrepTracker {
  id: string;
  conservatoriumId: string;
  studentId: string;
  teacherId: string;
  examType: 'MINISTRY_LEVEL_1' | 'MINISTRY_LEVEL_2' | 'BAGRUT' | 'OTHER';
  instrument: Instrument;
  targetExamDate?: Date;
  ministryFormId?: string;    // links to FormSubmission in Module 08

  requirements: {
    category: 'SCALES' | 'PIECES' | 'SIGHT_READING' | 'THEORY' | 'EAR_TRAINING';
    description: string;         // e.g., "All major scales, 4 octaves"
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'READY' | 'EXAM_PASSED';
    teacherAssessment?: string;
    lastAssessedAt?: Timestamp;
  }[];

  assignedPieces: {
    compositionId?: string;
    title: string;
    composer?: string;
    category: 'REQUIRED_LIST_A' | 'REQUIRED_LIST_B' | 'FREE_CHOICE';
    readinessPercent: number;   // 0-100
    status: 'LEARNING' | 'POLISHING' | 'PERFORMANCE_READY';
  }[];

  overallReadinessPercent: number;  // computed field, updated on any change
  teacherRecommendation?: 'READY_TO_SIT' | 'NEEDS_MORE_TIME' | 'NOT_READY';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Admin Pre-Population:** The Ministry publishes official exam syllabi. Import these as template `examRequirements` into Firestore:
```
/examSyllabi/{instrument}_{level}
```
When a teacher creates a new tracker, they select the exam type → requirements auto-populate from the syllabus template.

---

### 3.7 Group/Ensemble Lesson Data Model

Extend the `LessonSlot` model to support multiple students:

```typescript
// Extension to LessonSlot for group lessons:
interface GroupLessonSlot extends LessonSlot {
  type: 'GROUP';
  studentId: '_GROUP_';               // sentinel value — not used for group lessons
  studentIds: string[];               // all students in the group
  groupName?: string;                 // e.g., "Chamber Trio A"
  ensembleId?: string;               // links to an Ensemble document
  maxStudents: number;
  currentStudentCount: number;        // denormalized for queries

  attendance: {                        // per-student attendance (not on base model)
    studentId: string;
    status: 'PRESENT' | 'ABSENT_NOTICED' | 'ABSENT_NO_NOTICE' | 'NO_SHOW';
    creditConsumed: boolean;
  }[];
}

// Collection: /conservatoriums/{cid}/ensembles/{ensembleId}
interface Ensemble {
  id: string;
  conservatoriumId: string;
  name: string;                       // e.g., "Youth Chamber Orchestra"
  type: 'ORCHESTRA' | 'CHAMBER' | 'BAND' | 'CHOIR' | 'THEORY_CLASS';
  teacherId: string;
  studentIds: string[];
  maxSize: number;
  instrument?: Instrument;            // null for mixed ensembles
  schedule?: {
    dayOfWeek: number;
    startTime: string;
    durationMinutes: number;
    roomId: string;
  };
  isActive: boolean;
  createdAt: Timestamp;
}
```

---

### 3.8 Multimedia Feedback Architecture

For teachers to leave audio/video feedback on student practice logs:

```typescript
// Upload flow (teacher-side)
// 1. Teacher opens a practice log entry
// 2. Taps "Add Audio Feedback" → uses MediaRecorder API (browser) or native recording
// 3. Recording is uploaded to Firebase Storage with a resumable upload

// Firebase Storage path structure:
// /conservatoriums/{cid}/feedback/{studentId}/{logId}/audio_{timestamp}.webm
// /conservatoriums/{cid}/feedback/{studentId}/{logId}/video_{timestamp}.webm

// Security Rule: Only teacher of that student can write; student + parent can read
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /conservatoriums/{cid}/feedback/{studentId}/{logId}/{file} {
      allow read: if isStudentOrParentOf(studentId) || isTeacherOf(cid, studentId);
      allow write: if isTeacherOf(cid, studentId);
    }
  }
}

// Playback: Generate a short-lived signed URL (via Cloud Function) for audio/video
// Do NOT store permanent public URLs — these contain sensitive student PII context
export const getFeedbackUrl = onCall(async (request) => {
  const { storagePath, conservatoriumId, studentId } = request.data;

  // Verify requester has access
  await verifyFeedbackAccess(request.auth!.uid, conservatoriumId, studentId);

  const [signedUrl] = await storage
    .bucket()
    .file(storagePath)
    .getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

  return { url: signedUrl };
});

// Client-side playback component
// src/components/lms/AudioFeedbackPlayer.tsx
// Uses the Web Audio API to render a waveform visualization
// Fetches signed URL on mount, streams audio with <audio> element
```

---

### 3.9 Teacher LMS Dashboard — "Before the Lesson" View

The teacher's lesson preparation view (per student, before each session) should aggregate:

```typescript
// src/hooks/use-pre-lesson-summary.ts
export function usePreLessonSummary(studentId: string, conservatoriumId: string, lastLessonDate: Date) {
  // Query: practice logs since last lesson
  const practiceLogs = useFirestoreQuery<PracticeLog>(
    query(
      collection(db, `conservatoriums/${conservatoriumId}/practiceLogs`),
      where('studentId', '==', studentId),
      where('date', '>', formatDate(lastLessonDate)),
      orderBy('date', 'desc')
    )
  );

  const summary = useMemo(() => {
    if (!practiceLogs.data) return null;
    const logs = practiceLogs.data;
    return {
      totalMinutes: logs.reduce((sum, l) => sum + l.durationMinutes, 0),
      sessionCount: logs.length,
      piecesWorkedOn: [...new Set(logs.flatMap(l => l.pieces.map(p => p.title)))],
      mostRecentMood: logs[0]?.mood ?? null,
      studentNotes: logs.filter(l => l.studentNote).map(l => ({
        date: l.date,
        note: l.studentNote!,
      })),
      noLoggedPractice: logs.length === 0,
    };
  }, [practiceLogs.data]);

  return { summary, loading: practiceLogs.loading };
}
```

---

## 4. Summary Scorecard

| Area | SDD Coverage | Prototype Implementation | Priority to Fix |
|------|-------------|--------------------------|-----------------|
| Attendance Marking | ✅ Documented | ❌ Missing | P0 |
| Sick Leave Flow | ✅ Documented | ❌ Missing | P0 |
| Practice Log (LMS) | ✅ Documented | ❌ Missing | P1 |
| Lesson Notes (Structured) | ⚠️ Partial (single string) | ❌ Missing | P1 |
| Substitute Matching | ✅ Documented | ❌ Missing | P1 |
| Teacher Payroll View | ✅ Documented | ❌ Missing | P1 |
| Google Calendar Sync | ✅ Documented | ❌ Missing | P1 |
| Repertoire Assignment | ✅ Documented | ❌ Missing | P1 |
| Multimedia Feedback | ⚠️ Mentioned | ❌ Missing | P2 |
| Exam Curriculum Tracker | ❌ Not documented | ❌ Missing | P1 |
| Group/Ensemble Lessons | ⚠️ Placeholder | ❌ Missing | P2 |
| Private Studio Notes | ❌ Not documented | ❌ Missing | P1 |
| Progress Report AI | ✅ Documented + Coded | ⚠️ Partial (flow exists) | P1 (needs UI) |

**Bottom Line:** The teacher is Harmonia's most important daily user, and they currently have nothing to use. The prototype's only teacher-facing AI feature — `draft-progress-report-flow.ts` — is a Cloud function with no UI hookup. The critical path for teacher launch is: (1) attendance marking with one-tap UI, (2) sick leave emergency flow, (3) basic practice log view (read-only from lesson dashboard), (4) structured lesson notes. Everything else (multimedia, calendar sync, exam tracker) follows in subsequent sprints. The architectural foundations are solid; the implementation simply hasn't started.
