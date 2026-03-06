# Zod Schema Replacements for `z.any()` in `actions.ts`

## Overview

File: `src/app/actions.ts`, lines 269-275

The following schemas currently use `z.any()`, which disables all input validation on Server Actions. This is a **STRIDE Tampering** vulnerability rated High severity. Any client can inject arbitrary data into these actions.

```typescript
// CURRENT (INSECURE)
const FormSubmissionSchema = z.any();        // line 269
const EventProductionSchema = z.any();       // line 270
const UserSchema = z.any();                  // line 273
const LessonSchema = z.any();               // line 274
const ConservatoriumSchema = z.any();        // line 275
```

Additionally, `CreateEnrollmentSchema` (line 287) contains two `z.any()` fields:
```typescript
studentDetails: z.any(),   // line 290
parentDetails: z.any(),    // line 291
```

## Replacement Schemas

### 1. FormSubmissionSchema

Reference type: `FormSubmission` in `src/lib/types.ts:625-688`

Note: A partial schema already exists at `src/lib/validation/forms.ts:10-40`. The `actions.ts` schema should either import that schema or use this expanded version.

```typescript
import { z } from 'zod';

const CompositionSchema = z.object({
  id: z.string().optional(),
  composer: z.string().min(1),
  composerId: z.string().optional(),
  title: z.string().min(1),
  duration: z.string().regex(/^\d{1,3}:\d{2}$/, 'Duration must be in MM:SS format'),
  genre: z.string().min(1),
  instrument: z.string().optional(),
  approved: z.boolean().optional(),
});

const FormStatusSchema = z.enum([
  'DRAFT', 'PENDING_TEACHER', 'PENDING_ADMIN',
  'APPROVED', 'REJECTED', 'REVISION_REQUIRED', 'FINAL_APPROVED',
]);

const FormSubmissionSchema = z.object({
  id: z.string().min(1),
  formType: z.string().min(1),
  academicYear: z.string().optional(),
  grade: z.string().optional(),
  conservatoriumName: z.string().optional(),
  conservatoriumManagerName: z.string().optional(),
  conservatoriumManagerPhone: z.string().optional(),
  conservatoriumManagerEmail: z.string().email().optional().or(z.literal('')),
  conservatoriumId: z.string().optional(),

  studentId: z.string().min(1),
  studentName: z.string().min(1),

  applicantDetails: z.object({
    gender: z.string().optional(),
    city: z.string().optional(),
    phone: z.string().optional(),
    birthDate: z.string().optional(),
  }).optional(),

  schoolDetails: z.object({
    schoolName: z.string().optional(),
    schoolSymbol: z.string().optional(),
    hasMusicMajor: z.boolean().optional(),
    isMajorParticipant: z.boolean().optional(),
    plansTheoryExam: z.boolean().optional(),
    schoolEmail: z.string().email().optional().or(z.literal('')),
  }).optional(),

  instrumentDetails: z.object({
    instrument: z.string().optional(),
    yearsOfStudy: z.number().int().min(0).max(30).optional(),
    recitalField: z.string().optional(),
    previousOrOtherInstrument: z.string().optional(),
  }).optional(),

  teacherDetails: z.object({
    name: z.string().optional(),
    idNumber: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    yearsWithTeacher: z.number().int().min(0).max(30).optional(),
  }).optional(),

  additionalMusicDetails: z.object({
    ensembleParticipation: z.string().optional(),
    theoryStudyYears: z.number().int().min(0).max(20).optional(),
    orchestraParticipation: z.string().optional(),
  }).optional(),

  previousRepertoire: z.array(z.object({
    piece: z.string(),
    composer: z.string(),
    scope: z.string(),
    performedByHeart: z.boolean(),
  })).optional(),

  status: FormStatusSchema,
  submissionDate: z.string(),
  submittedBy: z.string().optional(),
  totalDuration: z.string(),
  repertoire: z.array(CompositionSchema),

  teacherId: z.string().optional(),
  adminId: z.string().optional(),
  teacherComment: z.string().max(2000).optional(),
  adminComment: z.string().max(2000).optional(),
  ministryComment: z.string().max(2000).optional(),
  managerNotes: z.string().max(2000).optional(),
  calculatedPrice: z.number().min(0).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'waived']).optional(),

  signatureUrl: z.string().optional(),
  signedBy: z.string().optional(),
  signedAt: z.string().optional(),

  formData: z.record(z.string(), z.unknown()).optional(),
  formTemplateId: z.string().optional(),

  // Ministry approval fields
  requiresMinistryApproval: z.boolean().optional(),
  ministryReviewedAt: z.string().optional(),
  ministryReviewedByDirectorId: z.string().optional(),
  ministryDirectorComment: z.string().max(2000).optional(),
  ministryExportedAt: z.string().optional(),
  ministryReferenceNumber: z.string().optional(),

  // Exam Registration fields
  examLevel: z.string().optional(),
  examType: z.string().optional(),
  preferredExamDateRange: z.string().optional(),
  teacherDeclaration: z.boolean().optional(),
  instrument: z.string().optional(),
  eventName: z.string().optional(),
  eventDate: z.string().optional(),
  eventLocation: z.string().optional(),
  conductor: z.string().optional(),
  accompanist: z.string().optional(),
  numParticipants: z.number().int().min(0).optional(),
});
```

### 2. UserSchema

Reference type: `User` in `src/lib/types.ts:437-516`

```typescript
const UserRoleSchema = z.enum([
  'student', 'teacher', 'parent', 'conservatorium_admin',
  'delegated_admin', 'site_admin', 'ministry_director',
  'admin', 'superadmin', 'school_coordinator',
]);

const InstrumentInfoSchema = z.object({
  instrument: z.string().min(1),
  teacherName: z.string(),
  yearsOfStudy: z.number().int().min(0).max(30),
});

const WeeklyAvailabilityBlockSchema = z.object({
  dayOfWeek: z.enum(['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const UserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  email: z.string().email().max(254),
  idNumber: z.string().max(20).optional(),
  role: UserRoleSchema,
  conservatoriumId: z.string().min(1),
  conservatoriumName: z.string().min(1),
  branchId: z.string().optional(),
  conservatoriumStudyYears: z.number().int().min(0).max(30).optional(),
  instruments: z.array(InstrumentInfoSchema).optional(),
  avatarUrl: z.string().optional(),
  schoolName: z.string().optional(),
  schoolSymbol: z.string().optional(),
  birthDate: z.string().optional(),
  enrollmentDate: z.string().optional(),
  gender: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  approved: z.boolean(),
  rejectionReason: z.string().max(1000).optional(),
  dateOfBirth: z.string().optional(),
  parentId: z.string().optional(),
  childIds: z.array(z.string()).optional(),
  students: z.array(z.string()).optional(),
  grade: z.string().optional(),

  // Teacher-specific fields
  bio: z.string().max(5000).optional(),
  videoUrl: z.string().optional(),
  education: z.array(z.string()).optional(),
  performanceCredits: z.array(z.string()).optional(),
  teachingPhilosophy: z.object({
    he: z.string().optional(),
    en: z.string().optional(),
    ru: z.string().optional(),
    ar: z.string().optional(),
  }).optional(),
  availableForNewStudents: z.boolean().optional(),
  lessonDurationsOffered: z.array(z.enum(['30', '45', '60']).transform(Number)).optional(),
  specialties: z.array(z.enum([
    'EXAM_PREP', 'EARLY_CHILDHOOD', 'PERFORMANCE', 'JAZZ',
    'THEORY', 'SPECIAL_NEEDS', 'BEGINNER_ADULTS', 'COMPETITION', 'ENSEMBLE',
  ])).optional(),
  teachingLanguages: z.array(z.enum(['HE', 'EN', 'AR', 'RU'])).optional(),
  availability: z.array(WeeklyAvailabilityBlockSchema).optional(),
  maxStudents: z.number().int().min(0).max(200).optional(),
  teacherRatingAvg: z.number().min(0).max(5).optional(),
  teacherRatingCount: z.number().int().min(0).optional(),
  employmentType: z.enum(['EMPLOYEE', 'FREELANCE']).optional(),
  ratePerDuration: z.object({
    '30': z.number().min(0),
    '45': z.number().min(0),
    '60': z.number().min(0),
  }).optional(),

  // Student-specific fields
  weeklyPracticeGoal: z.number().int().min(0).max(600).optional(),
  packageId: z.string().optional(),
  hasSeenWalkthrough: z.boolean().optional(),
  isRegistered: z.boolean().optional(),

  accountType: z.enum(['FULL', 'PLAYING_SCHOOL', 'TRIAL']).optional(),
  isDelegatedAdmin: z.boolean().optional(),
  delegatedAdminPermissions: z.array(z.string()).optional(),
  isPrimaryConservatoriumAdmin: z.boolean().optional(),
  registrationSource: z.enum(['email', 'google', 'microsoft', 'admin_created']).optional(),
  status: z.enum(['active', 'graduated', 'inactive']).optional(),
  graduationYear: z.number().int().min(1900).max(2100).optional(),

  // Allow additional fields to pass through (notifications, gamification, etc.)
  // These are complex nested types managed by the system, not user input
  createdAt: z.union([z.string(), z.number(), z.date()]).optional(),
}).passthrough();

// NOTE: .passthrough() allows additional fields like notifications, achievements,
// gamification, translations, performanceProfile, playingSchoolInfo etc. to pass
// through without validation. These fields are system-managed and should not be
// directly editable by users. Future work: create separate schemas for
// user-editable vs system-managed fields.
```

### 3. LessonSchema

Reference type: `LessonSlot` in `src/lib/types.ts:791-821`

```typescript
const LessonTypeSchema = z.enum(['RECURRING', 'MAKEUP', 'TRIAL', 'ADHOC', 'GROUP']);

const SlotStatusSchema = z.enum([
  'SCHEDULED', 'COMPLETED',
  'CANCELLED_STUDENT_NOTICED', 'CANCELLED_STUDENT_NO_NOTICE',
  'CANCELLED_TEACHER', 'CANCELLED_CONSERVATORIUM',
  'NO_SHOW_STUDENT', 'NO_SHOW_TEACHER',
]);

const BookingSourceSchema = z.enum([
  'STUDENT_SELF', 'PARENT', 'TEACHER', 'ADMIN', 'AUTO_MAKEUP',
]);

const LessonSchema = z.object({
  id: z.string().min(1),
  conservatoriumId: z.string().min(1),
  teacherId: z.string().min(1),
  studentId: z.string().min(1),
  instrument: z.string().min(1),
  startTime: z.string(), // ISO Timestamp
  durationMinutes: z.union([z.literal(30), z.literal(45), z.literal(60)]),
  recurrenceId: z.string().optional(),
  type: LessonTypeSchema,
  bookingSource: BookingSourceSchema,
  roomId: z.string().optional(),
  branchId: z.string().optional(),
  isVirtual: z.boolean(),
  meetingLink: z.string().optional(),
  packageId: z.string().optional(),
  isCreditConsumed: z.boolean(),
  makeupCreditId: z.string().optional(),
  status: SlotStatusSchema,
  attendanceMarkedAt: z.string().optional(),
  teacherNote: z.string().max(2000).optional(),
  cancelledAt: z.string().optional(),
  cancelledBy: z.string().optional(),
  cancellationReason: z.string().max(1000).optional(),
  rescheduledFrom: z.string().optional(),
  rescheduledAt: z.string().optional(),
  googleCalendarEventId: z.string().optional(),
  effectiveRate: z.number().min(0).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
```

### 4. ConservatoriumSchema

Reference type: `Conservatorium` in `src/lib/types.ts:518-552`

```typescript
const ConservatoriumSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  nameEn: z.string().max(200).optional(),
  tier: z.enum(['A', 'B', 'C']),
  stampUrl: z.string().optional(),
  newFeaturesEnabled: z.boolean().optional(),
  aiAgentsConfig: z.record(z.string(), z.boolean()).optional(),

  pricingConfig: z.object({
    baseRatePerLesson: z.object({
      '30': z.number().min(0),
      '45': z.number().min(0),
      '60': z.number().min(0),
    }),
    discounts: z.object({
      pack5: z.number().min(0).max(100),
      pack10: z.number().min(0).max(100),
      yearly: z.number().min(0).max(100),
      sibling: z.number().min(0).max(100),
    }),
    adHocPremium: z.number().min(0).max(100),
    trialPrice: z.number().min(0),
  }).optional(),

  cancellationPolicy: z.object({
    studentNoticeHoursRequired: z.number().int().min(0),
    studentCancellationCredit: z.enum(['FULL', 'NONE']),
    studentLateCancelCredit: z.enum(['FULL', 'NONE']),
    noShowCredit: z.literal('NONE'),
    makeupCreditExpiryDays: z.number().int().min(0),
    maxMakeupsPerTerm: z.number().int().min(0),
  }).optional(),

  // Public profile fields
  about: z.string().max(10000).optional(),
  email: z.string().email().optional().or(z.literal('')),
  secondaryEmail: z.string().email().optional().or(z.literal('')),
  tel: z.string().optional(),
  officialSite: z.string().optional(),
  openingHours: z.string().optional(),
  foundedYear: z.number().int().min(1800).max(2100).optional(),

  location: z.object({
    city: z.string(),
    cityEn: z.string().optional(),
    address: z.string().optional(),
    postalCode: z.string().optional(),
    googlePlaceId: z.string().optional(),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
    googleMapsUrl: z.string().optional(),
    branches: z.array(z.string()).optional(),
  }).optional(),

  programs: z.array(z.string()).optional(),
  ensembles: z.array(z.string()).optional(),
  photoUrls: z.array(z.string()).optional(),
}).passthrough();

// NOTE: .passthrough() allows nested complex types (manager, departments,
// socialMedia, translations, etc.) to pass through. These should have
// dedicated schemas in a future iteration.
```

### 5. EventProductionSchema

Reference type: `EventProduction` in `src/lib/types.ts:1096-1127`

```typescript
const EventProductionStatusSchema = z.enum([
  'PLANNING', 'OPEN_REGISTRATION', 'CLOSED', 'COMPLETED',
]);

const EventVisibilityStatusSchema = z.enum([
  'draft', 'published', 'cancelled', 'completed',
]);

const PerformanceSlotSchema = z.object({
  performerId: z.string().optional(),
  performerName: z.string().optional(),
  compositionTitle: z.string(),
  composer: z.string(),
  duration: z.string().regex(/^\d{1,3}:\d{2}$/),
});

const EventProductionSchema = z.object({
  id: z.string().min(1),
  conservatoriumId: z.string().min(1),
  name: z.string().min(1).max(300),
  title: z.object({
    he: z.string(),
    en: z.string(),
    ru: z.string().optional(),
    ar: z.string().optional(),
  }).optional(),
  description: z.object({
    he: z.string(),
    en: z.string(),
    ru: z.string().optional(),
    ar: z.string().optional(),
  }).optional(),
  type: z.enum(['RECITAL', 'CONCERT', 'EXAM_PERFORMANCE', 'OPEN_DAY']),
  venue: z.string().min(1),
  eventDate: z.string(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  status: EventProductionStatusSchema,
  visibilityStatus: EventVisibilityStatusSchema.optional(),
  program: z.array(PerformanceSlotSchema),
  isPublic: z.boolean().optional(),
  isFree: z.boolean().optional(),
  ticketPrice: z.number().min(0).optional(),
  totalSeats: z.number().int().min(0).optional(),
  posterUrl: z.string().optional(),
  publishedAt: z.string().optional(),
  dressRehearsalDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).passthrough();
```

### 6. CreateEnrollmentSchema — Fix `z.any()` Fields

```typescript
const StudentDetailsSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.string().optional(),
  grade: z.string().optional(),
  schoolName: z.string().optional(),
  schoolSymbol: z.string().optional(),
  idNumber: z.string().max(20).optional(), // Israeli ת"ז
});

const ParentDetailsSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(9).max(15),
  idNumber: z.string().max(20).optional(), // Israeli ת"ז
  city: z.string().optional(),
  address: z.string().optional(),
});

const CreateEnrollmentSchema = z.object({
  token: z.string().min(1),
  registrationType: z.string().min(1),
  studentDetails: StudentDetailsSchema,
  parentDetails: ParentDetailsSchema,
  schoolId: z.string(),
  instrument: z.string().min(1),
  paymentMethod: z.string().optional(),
});
```

## Application Instructions

**For @Backend:**

1. Replace lines 269-275 in `src/app/actions.ts` with the schemas above
2. Replace lines 290-291 (studentDetails/parentDetails `z.any()`) with the typed versions
3. The schemas use `.passthrough()` on complex types (User, Conservatorium, EventProduction) to allow system-managed fields to pass through without breaking existing functionality
4. Import shared sub-schemas (CompositionSchema, FormStatusSchema, etc.) from a new file `src/lib/validation/schemas.ts` to avoid duplication
5. The existing `FormSubmissionSchema` in `src/lib/validation/forms.ts` can be used as-is for the dynamic form submission flow (it has a stricter schema). The `actions.ts` schema covers the full upsert case.

## Security Impact

Replacing `z.any()` with typed schemas closes the following attack vectors:

| Attack | Before | After |
|--------|--------|-------|
| Inject arbitrary fields into User document | Possible | Blocked (unknown fields on validated sub-objects are stripped) |
| Set `role: 'site_admin'` via upsertUserAction | Possible | Schema validates but **requireRole() must also be added** to the action |
| Inject SQL/NoSQL in string fields | No length limits | Max lengths enforced |
| Send negative prices/amounts | No validation | `z.number().min(0)` enforced |
| Inject script tags in text fields | No validation | Length limits + downstream HTML encoding |

**Important:** Zod validation alone is not sufficient for authorization. Each Server Action must also call `requireRole()` to verify the caller has permission for the operation. The schema prevents malformed data; `requireRole()` prevents unauthorized access.
