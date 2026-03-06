# SDD-FIX-14: Alumni Module & Master Classes — Full Design

**PDF Issue:** #19  
**Priority:** P2

---

## 1. Alumni Module Design

### 1.1 Definition

**Who is an Alumni?**
- Any former student (not currently enrolled) who graduated from the conservatorium.
- Students become Alumni automatically when their enrollment is marked as "Graduated" or "Completed Program".
- Alumni choose whether to make their profile **public** (visible on the conservatorium's alumni page) or **private**.

### 1.2 Alumni Profile

```typescript
interface AlumniProfile {
  userId: string;
  conservatoriumId: string;
  graduationYear: number;
  primaryInstrument: string;
  currentOccupation?: string;
  bio: { he?: string; en?: string };
  profilePhotoUrl?: string;
  isPublic: boolean;
  achievements?: string[];
  socialLinks?: {
    website?: string;
    youtube?: string;
    spotify?: string;
    instagram?: string;
  };
  availableForMasterClasses: boolean;
}
```

### 1.3 Automatic Alumni Creation

When admin changes a student's status to "Graduated":
```typescript
async function graduateStudent(studentId: string, graduationYear: number) {
  await updateUser(studentId, { status: 'graduated', graduationYear });
  
  // Auto-create alumni profile (private by default)
  await createAlumniProfile({
    userId: studentId,
    conservatoriumId: student.conservatoriumId,
    graduationYear,
    primaryInstrument: student.primaryInstrument,
    isPublic: false,    // user must opt-in to be public
    availableForMasterClasses: false,
  });
  
  // Notify the graduate:
  await sendNotification(studentId, 'alumni_welcome');
}
```

### 1.4 Alumni Self-Service

Alumni can log in and manage their profile at `/dashboard/alumni/profile`:
- Toggle public visibility
- Update bio, current occupation, social links
- Mark as "Available for Master Classes"
- Upload profile photo

### 1.5 Public Alumni Page

`/about/alumni` — shows grid of public alumni profiles, filterable by year and instrument.

---

## 2. Master Classes

### 2.1 Who Can Create

| Role | Can Create | Notes |
|------|-----------|-------|
| CONSERVATORIUM_ADMIN | ✅ | Can create for any teacher/alumni |
| TEACHER | ✅ | Can offer their own master classes |
| ALUMNI | ✅ | If `availableForMasterClasses = true` |

### 2.2 Master Class Data Model

```typescript
interface MasterClass {
  id: string;
  conservatoriumId: string;
  title: { he: string; en: string };
  description: { he: string; en: string };
  
  instructor: {
    userId: string;
    displayName: string;
    instrument: string;
    bio?: string;
    photoUrl?: string;
  };
  
  instrument: string;
  maxParticipants: number;
  targetAudience: 'beginners' | 'intermediate' | 'advanced' | 'all';
  
  date: string;
  startTime: string;
  durationMinutes: number;
  location: string;
  isOnline: boolean;
  streamUrl?: string;
  
  // Included in package or extra cost:
  includedInPackage: boolean;
  priceILS?: number;
  
  // How many master classes per package:
  packageMasterClassCount?: number;
  
  status: 'draft' | 'published' | 'completed' | 'cancelled';
  registrations: MasterClassRegistration[];
}

interface MasterClassRegistration {
  studentId: string;
  registeredAt: string;
  attendanceStatus: 'registered' | 'attended' | 'no_show';
  isPartOfPackage: boolean;  // true if counted against package allowance
}
```

### 2.3 Package Allowance

Students in certain lesson packages receive X master classes per term. Track usage:

```typescript
interface StudentMasterClassAllowance {
  studentId: string;
  conservatoriumId: string;
  academicYear: string;
  totalAllowed: number;    // from their package
  used: number;
  remaining: number;
}
```

### 2.4 Admin Publishing Workflow

```
Instructor creates draft → 
Admin reviews (if not admin-created) → 
Admin publishes → 
Appears on website and student dashboard
```

### 2.5 Public Discovery

Master classes appear on:
- Conservatorium public page under "Master Classes" tab
- Student dashboard under "Upcoming Master Classes"
- Alumni page for alumni-hosted sessions

---

## Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Student marked as "Graduated" | Alumni profile created (private by default) |
| 2 | Graduate logs in → profile page | Can edit bio, toggle public, set master class availability |
| 3 | Public alumni page | Shows only profiles with isPublic = true |
| 4 | Teacher creates master class | Appears in admin review queue |
| 5 | Admin publishes master class | Appears on public site and student dashboards |
| 6 | Student with package registers | Counts against allowance; shows "X remaining" |
| 7 | Student without package registers | Charged if price > 0 |
