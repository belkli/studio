# SDD-09: Learning Management System (LMS)

**Module:** 09  
**Dependencies:** Modules 01, 03, 04  
**Priority:** P2 — Competitive differentiator, post-launch

---

## 1. Overview & Rationale

Most conservatorium management tools handle the business of music education. Lyriosa also handles the *practice* of it. This module adds a lightweight but powerful learning management layer: practice logs, repertoire assignments, teacher notes, multimedia feedback, and progress tracking. This is what separates Lyriosa from a mere scheduling tool and makes it the student's musical home.

Inspiration: TeacherZone's practice logs + Seesaw's multimedia feedback, adapted for Israeli music education.

---

## 2. Student Practice Log

### 2.1 Data Model

```typescript
{
  id: string;
  studentId: string;
  teacherId: string;
  lessonSlotId?: string;       // optionally linked to a lesson
  
  date: Date;
  durationMinutes: number;
  pieces: {
    composerId?: string;
    title: string;
    focusArea?: string;        // e.g., "measures 14-20, right hand"
  }[];
  
  studentNote?: string;        // how did it go?
  mood: 'GREAT' | 'OKAY' | 'HARD';
  teacherComment?: string;     // teacher adds after seeing log
  
  createdAt: Timestamp;
}
```

### 2.2 Logging a Practice Session

**Student (13+) or Parent (for under-13)** logs via `/dashboard/practice/log`:

1. Select date (default: today)
2. Enter duration (slider: 5–120 min)
3. Select pieces practiced (from their assigned repertoire, or free-text)
4. Optional: note specific focus areas
5. Mood check: 😊 Great | 😐 OK | 😤 Tough
6. Optional written note: "Struggled with the left hand passage in bar 24"
7. Submit

The log is immediately visible to the teacher.

### 2.3 Teacher's View of Practice Data

Before each lesson, the teacher sees on their dashboard:
- Summary of student's practice since the last lesson
- Total minutes practiced
- Which pieces were worked on
- Any notes the student left
- A visual chart: daily practice bars for the past 2 weeks

If a student hasn't logged any practice in the past 7 days, a subtle "No recent practice logged" indicator appears on the teacher's student card.

### 2.4 Weekly Practice Goals

Teacher can set a weekly practice goal for each student (e.g., 3 sessions × 30 min):
- Student sees their progress toward the weekly goal in a visual tracker
- Green if on track, amber if behind, red if very behind
- Parent also sees this on the Family Hub

---

## 3. Repertoire Management

### 3.1 Assigned Repertoire

Teacher can assign specific pieces to a student at `/dashboard/teacher/students/:id/repertoire`:

```typescript
{
  id: string;
  studentId: string;
  teacherId: string;
  composition: Composition;    // from the shared composition library
  status: 'LEARNING' | 'POLISHING' | 'PERFORMANCE_READY' | 'COMPLETED';
  assignedAt: Timestamp;
  targetDate?: Date;           // e.g., "ready for recital by May 1"
  teacherNotes?: string;
  studentNotes?: string;
}
```

- Student sees all their assigned pieces in a "My Repertoire" section
- Status can be updated by both teacher and student
- Completed pieces build a historical repertoire portfolio

### 3.2 Sheet Music & Resources Library

Teachers can attach resources to a student's repertoire assignment:
- PDF sheet music upload (stored in Firebase Storage)
- External links (e.g., YouTube reference recording, IMSLP link)
- Audio files (teacher's own recording as a model)
- Text notes

**Important:** Uploaded PDFs are only accessible to the assigned student and teacher. Copyrighted material is the teacher's responsibility to license.

### 3.3 Composition Library (Shared)

System-wide searchable composition library (as defined in SDD v1.0):
- Composer, title, genre, era, duration
- Difficulty level (added for LMS purposes)
- Grade level tags (aligned with Israeli Ministry exam levels)
- Admin can add/edit/import compositions
- Optional future integration: Open Opus API for classical compositions

---

## 4. Lesson Notes

### 4.1 Teacher Lesson Notes

After each lesson, teacher can leave structured notes at `/dashboard/teacher/schedule`:

```typescript
{
  id: string;
  lessonSlotId: string;
  teacherId: string;
  studentId: string;
  
  summary: string;             // "Great progress on the Mozart sonata"
  focusItems: string[];        // specific things to work on
  homeworkAssignments: string[]; // e.g., ["Practice bars 14-20 slowly", "Listen to Brendel recording"]
  nextLessonGoal: string;
  
  isSharedWithStudent: boolean;  // teacher can keep private or share
  isSharedWithParent: boolean;
  
  createdAt: Timestamp;
}
```

- Shared notes are visible to student (13+) and/or parent on their dashboard
- Teacher can mark a note as "private" (visible only to teacher and admin)
- Notes are displayed chronologically in the student's profile

### 4.2 Student/Parent Viewing Notes

`/dashboard/lesson-notes`

- Timeline of all lesson notes
- Color coded: recent (bright), older (muted)
- Can filter by date range
- Homework items with checkboxes (for student to tick off)

---

## 5. Multimedia Feedback (Async Video)

### 5.1 Student Video Upload

Students (13+) or parents (on behalf of under-13) can upload a short practice video for mid-week teacher feedback:

`/dashboard/practice/upload`

- Max 60 seconds (configurable by admin)
- Supported: MP4, MOV
- Stored in Firebase Storage with student-teacher-only access
- Automatically linked to current assignment or free-form

### 5.2 Teacher Video Response

Teacher receives notification of uploaded video and can:
- Watch the video in the app
- Leave a timestamped text comment: "At 0:23 — notice how your wrist position drops here"
- Record a short audio response (up to 60 seconds)
- Teacher video responses are stored the same way

This eliminates the need for WhatsApp voice notes between teachers and students — keeping all communication within the platform and accessible to parents.

---

## 6. Progress Tracking & Reports

### 6.1 Student Progress Dashboard

`/dashboard/progress` (student and parent view)

- **Practice Streak:** Consecutive days with a logged session (gamification element)
- **Total Minutes Logged:** This week / this month / all time
- **Pieces Learned:** Count of compositions marked as completed
- **Exam Readiness:** If on exam track, a simple progress indicator per exam topic
- **Monthly Practice Chart:** Bar chart of daily minutes for the past 30 days

### 6.2 End-of-Semester Progress Report

Generated by the AI Progress Agent (Module 10) and reviewed/edited by the teacher:

```
Student: [Name]
Period: [semester]
Instrument: [instrument]
Teacher: [name]

Practice Summary
- Total sessions logged: X
- Average session length: X minutes
- Most-practiced piece: [title]

Progress Highlights
[AI-drafted paragraph, teacher-edited]

Areas for Development
[AI-drafted paragraph, teacher-edited]

Repertoire Completed This Semester
- [Piece 1]
- [Piece 2]

Recommendation for Next Semester
[Teacher written]

Teacher signature
```

Teacher reviews the AI draft, edits freely, then sends to parent/student with one click. PDFs generated and archived.

### 6.3 Admin Academic Overview

`/admin/reports/academic`

- Practice engagement rate by teacher (% of students logging practice)
- Average practice minutes per student, by instrument
- Repertoire advancement rate
- Exam pass rate (entered manually by teacher after results)

---

## 7. Gamification (Optional, Admin-Configurable)

To engage younger students:

| Element | Description |
|---------|-------------|
| Practice Streak | Flame icon for consecutive practice days |
| Monthly Badges | "Practiced every day this week!" badge |
| Milestone Celebrations | Confetti animation when a piece is marked complete |
| Practice Goal Progress Bar | Visual tracker toward weekly teacher-set goal |

These elements are purely motivational, visible only to the student and parent, and can be disabled per conservatorium.

---

## 8. UI Components Required

| Component | Description |
|-----------|-------------|
| `PracticeLogForm` | Daily practice session logging |
| `PracticeCalendar` | Monthly view with color-coded practice days |
| `PracticeStreakBadge` | Gamification streak display |
| `RepertoireList` | Student's assigned pieces with status |
| `SheetMusicViewer` | In-app PDF viewer for uploaded scores |
| `LessonNoteTimeline` | Chronological lesson note history |
| `HomeworkChecklist` | Ticked homework items from lesson notes |
| `VideoUploadWidget` | Async practice video upload |
| `VideoFeedbackPlayer` | Video player with timestamped comment overlay |
| `ProgressDashboard` | Student/parent progress overview |
| `ProgressReportEditor` | Teacher tool for editing AI-drafted reports |
| `AcademicReportAdmin` | Admin view of conservatorium-wide LMS data |
