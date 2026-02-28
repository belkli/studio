# HARMONIA — SDD-PS2: Playing School 360° Integration Gap Specification
## (בית ספר מנגן — השלמת אינטגרציה מלאה)

**Version 1.0 | February 2026**
**Classification:** Internal – Product & Engineering
**Authors:** Expert Architect & Product Manager
**Prerequisite:** SDD-PS v1.0 (Playing School Program — baseline design)
**Status:** Gap-Only Document — Do Not Re-implement Covered Features

---

## 0. Purpose & Scope

SDD-PS v1.0 defined the data model, business rules, cloud functions, and new screens for the Playing School (בית ספר מנגן) program. However, a 360° integration audit reveals **ten critical gaps** where the Playing School offering is **not connected** to existing system surfaces — leaving students and parents unable to discover, register, pay, and manage their Playing School participation through the same workflows they use for regular conservatory enrollment.

This document specifies **only the delta** — new behavior required to close those gaps. Each gap is numbered GAP-01 through GAP-10, assigned a severity, and given precise UX flows, API contracts, data changes, and component-level implementation guidance.

### Gap Summary Table

| # | Gap | Severity | Affected Personas | Phase |
|---|---|---|---|---|
| GAP-01 | Main Registration Form lacks Playing School pathway | P0 — Critical | Parent, Student | Phase 2 |
| GAP-02 | No school-discovery surface before token (parent can't find link) | P0 — Critical | Parent | Phase 2 |
| GAP-03 | Family Hub shows no Playing School enrollment cards | P1 — High | Parent | Phase 3 |
| GAP-04 | Enrollment Wizard fully mocked — zero backend wiring | P0 — Critical | Parent | Phase 2 |
| GAP-05 | Student account not auto-created on enrollment completion | P1 — High | Student, Parent | Phase 2 |
| GAP-06 | Parent Billing Dashboard excludes Playing School charges | P1 — High | Parent | Phase 3 |
| GAP-07 | Notification Preferences UI missing Playing School event types | P2 — Medium | Parent, Teacher | Phase 3 |
| GAP-08 | Excellence Track parent acceptance flow not wired to Family Hub | P1 — High | Parent, Admin | Phase 4 |
| GAP-09 | Admin cannot generate/share enrollment tokens from UI | P1 — High | Conservatorium Admin | Phase 2 |
| GAP-10 | `school_coordinator` account invitation flow does not exist | P1 — High | Conservatorium Admin, Coordinator | Phase 2 |

---

## 1. GAP-01 — Main Registration Form: Playing School Pathway

### 1.1 Problem Statement

The primary enrollment entry point at `/enroll` (component: `enrollment-wizard.tsx`) asks whether the registrant is a parent or self-registering student, then proceeds immediately to conservatory / teacher / lesson-slot selection. There is **no branch for Playing School**. A parent whose child attends a partner school has no pathway through the standard registration UI and must rely on a separate token link they may never receive.

### 1.2 Required Change: Registration Type Selection Step

**File:** `src/components/enrollment/enrollment-wizard.tsx`

Add a third registration type option to the existing `registrationType` selector at **Step 1**:

```typescript
// Current
z.enum(["parent", "self"])

// New
z.enum(["parent", "self", "playing_school"])
```

#### New Step 1 UI — Registration Type

The existing two options (`parent` | `self`) are augmented with a third card:

```
┌────────────────────────────────────────────────────────────────────┐
│   🎓  I'm a parent enrolling my child for regular lessons           │
│       הרשמה לשיעורים פרטיים / קבוצתיים בקונסרבטוריון             │
├────────────────────────────────────────────────────────────────────┤
│   🎵  I'm a student enrolling myself                               │
│       תלמיד.ה מבוגר.ת המירשם/ת בעצמי                              │
├────────────────────────────────────────────────────────────────────┤
│   🏫  My child's school participates in Playing School ← NEW       │
│       בית הספר של ילדי/ה משתתף בתכנית "בית ספר מנגן"             │
│       [המשך לדף הרשמה לתכנית]                                    │
└────────────────────────────────────────────────────────────────────┘
```

#### Routing Logic

When the user selects `playing_school`:
1. Display an **intermediate school-lookup screen** (see GAP-02) embedded inside the wizard step — allowing the parent to search for their child's school.
2. If the school is found and has an active partnership → redirect to `/enroll/playing-school/[token]` (the dedicated Playing School wizard), pre-populating `schoolSymbol` from the lookup result.
3. If the school is found but has no active partnership → show "Your school is not yet enrolled. Leave your contact details and we'll notify you when the program launches."
4. If the school is not found → show a fallback with a conservatory contact form.

#### New Zod Schema Branch

```typescript
// Add to getFormSchema():
const getPlayingSchoolIntentSchema = (t: any) => z.object({
  schoolLookupQuery: z.string().min(2, t('validation.tooShort', { min: 2 })),
  schoolSymbol: z.string().min(1, t('validation.selectSchool')),
  childGrade: z.string().min(1, t('validation.selectGrade')),
});
```

#### New Cloud Function Required

```typescript
// src/lib/cloud-functions/school-lookup.ts

export async function findSchoolPartnershipBySymbol(
  schoolSymbol: string,
  conservatoriumId?: string
): Promise<{ found: boolean; partnershipId?: string; token?: string; programOptions?: SchoolProgram[] }>;

export async function findSchoolPartnershipByName(
  schoolName: string,
  locale: 'he' | 'ar' | 'ru' | 'en'
): Promise<Array<{ schoolName: string; schoolSymbol: string; municipalityName: string; hasActivePartnership: boolean }>>;
```

**Firestore query pattern:** Query `school_partnerships` where `status == 'ACTIVE'` across all conservatoria. Return only the minimum data needed (no financial data) for the lookup response.

---

## 2. GAP-02 — School Discovery Page (Public, Pre-Token)

### 2.1 Problem Statement

A parent who does not have a WhatsApp enrollment link and wants to find out if their child's school participates in Playing School has **no self-service discovery path**. The system design assumes the parent always arrives via a token link. This blocks organic enrollment and creates a dependency on schools/conservatories manually distributing links.

### 2.2 New Page: Public School Finder

**Route:** `/playing-school` (public, no authentication required)
**File:** `src/app/[locale]/playing-school/page.tsx`
**Component:** `src/components/harmonia/playing-school-finder.tsx`

#### Page Sections

```
┌─────────────────────────────────────────────────────────────────┐
│  HERO: "בית ספר מנגן — גלה/י אם בית הספר של ילדך משתתף"       │
│  Sub: Program description in 3 bullet points (§2.3 below)      │
├─────────────────────────────────────────────────────────────────┤
│  SEARCH BOX (RTL): "חפש/י את שם בית הספר"                      │
│  [Auto-complete Combobox — calls findSchoolPartnershipByName]   │
│  Optional filter: Municipality dropdown                         │
├─────────────────────────────────────────────────────────────────┤
│  RESULTS:                                                        │
│  For each matching school:                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🏫 שם בית הספר  ✅ תכנית פעילה                           │   │
│  │ 📍 עיריית XXX   🎻 כלים: חלילית, כלי קשת                │   │
│  │ [כפתור: להרשמה לתכנית]                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  FALLBACK: "בית הספר לא נמצא?"                                  │
│  [Leave contact details — interest form]                         │
└─────────────────────────────────────────────────────────────────┘
```

#### SEO & Public Landing Considerations

- Page must render server-side (`page.tsx` is a Server Component) for SEO.
- Meta tags: `<title>בית ספר מנגן — לימודי מוזיקה במחיר מסובסד</title>`
- Open Graph image: conservatory logo + school logo composite.
- Schema.org `EducationalOrganization` structured data per school partnership.
- Canonical URLs per municipality (`/playing-school?municipality=ramat-gan`).

#### "Not Yet in Program" Interest Form

```typescript
// New Firestore collection: playing_school_interest_leads
type PlayingSchoolInterestLead = {
  id: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  schoolName: string;  // free text if not found
  schoolGrade: string;
  municipalityGuess: string;
  createdAt: string;
  status: 'NEW' | 'CONTACTED' | 'CONVERTED';
};
```

Admin can view and export interest leads from `/dashboard/admin/playing-school/leads`.

### 2.3 Program Description Content

The public page must explain, in plain language (HE/AR/RU/EN), the three value propositions that appear consistently across real-world programs (Kiryat Ono, Herzliya, Ramat Gan):

1. **מחיר מסובסד:** ₪150–₪500 לשנה לעומת מאות שקלים בחודש ללא סבסוד.
2. **במסגרת שעות הלמידה:** ללא צורך בסידורי הסעה נוספים — השיעור מגיע לבית הספר.
3. **מסלול מצוינות:** תלמידים מוכשרים מוזמנים להמשיך ללימודים מעמיקים עם מלגה.

i18n key namespace: `PlayingSchool.finder.*`

---

## 3. GAP-03 — Family Hub: Playing School Enrollment Cards

### 3.1 Problem Statement

`family-hub.tsx` renders one `WeeklyDigestCard` per child in `user.childIds`. These cards reflect **only regular conservatory enrollments**. A child enrolled in Playing School does not appear in the Family Hub, and the parent has no in-app view of their Playing School participation after registration.

### 3.2 Required Changes to `family-hub.tsx`

#### 3.2.1 Data Fetching

Add a new custom hook:

```typescript
// src/hooks/use-playing-school-enrollments.ts
export function usePlayingSchoolEnrollments(parentId: string): {
  enrollments: PlayingSchoolEnrollment[];
  isLoading: boolean;
  error: Error | null;
}
```

This hook queries: `conservatoria/{conservatoriumId}/playing_school_enrollments` where `parentId == parentId`, across all conservatoria the family has a relationship with. Returns all non-cancelled enrollments for the current academic year.

#### 3.2.2 New Component: `PlayingSchoolChildCard`

**File:** `src/components/harmonia/playing-school-child-card.tsx`

```
┌────────────────────────────────────────────────────────────┐
│ 🏫  [שם בית הספר]                          [status badge]  │
│     תוכנית בית ספר מנגן                                    │
├────────────────────────────────────────────────────────────┤
│ תלמיד/ה:   [שם הילד]    כיתה: [כיתה]                       │
│ כלי:       [חליל / כינור]                                  │
│ שיעור:     [יום] בשעה [שעה]  | בית ספר [שם]               │
├────────────────────────────────────────────────────────────┤
│ תשלום:  ✅ שולם  /  ⏳ ממתין  /  🔴 פג תוקף              │
│ כלי:    🎻 מושאל — [שם הכלי]  /  ⏳ ממתין לאיסוף          │
├────────────────────────────────────────────────────────────┤
│ [EXCELLENCE TRACK NOTIFICATION — see GAP-08]               │
├────────────────────────────────────────────────────────────┤
│  [צפה בנוכחות]    [פרטי תשלום]    [צור קשר עם המורה]      │
└────────────────────────────────────────────────────────────┘
```

**Status Badge Values:**

| Enrollment Status | Badge Color | Label |
|---|---|---|
| PENDING_PAYMENT | Yellow | ממתין לתשלום |
| ACTIVE | Green | פעיל |
| WAITLIST | Blue | רשימת המתנה |
| CANCELLED | Red | בוטל |

#### 3.2.3 Integration in `family-hub.tsx`

```tsx
// In FamilyHub component, after existing children.map():
{psEnrollments.map(enrollment => (
  <PlayingSchoolChildCard
    key={enrollment.id}
    enrollment={enrollment}
    onViewAttendance={() => router.push(`/dashboard/family/ps-attendance/${enrollment.id}`)}
    onViewPayment={() => router.push(`/dashboard/family/ps-billing/${enrollment.id}`)}
  />
))}
```

#### 3.2.4 New Sub-Route: Attendance View

**Route:** `/dashboard/family/ps-attendance/[enrollmentId]`
**Component:** `PlayingSchoolAttendanceView`

Shows a calendar grid per academic year with per-lesson attendance:
- 🟢 Present
- 🔴 Absent — noticed
- ⚪ Absent — unnoticed
- 🏫 School event cancellation

Shows overall attendance percentage and teacher's group lesson notes (if admin enabled sharing).

---

## 4. GAP-04 — Enrollment Wizard: Real Backend Wiring

### 4.1 Problem Statement

`playing-school-enrollment-wizard.tsx` is entirely backed by `MOCK_SCHOOL_INFO` — a hardcoded constant. The `handleSubmit` function calls `setSubmitted(true)` with no API call. Payment processing, enrollment record creation, parent WhatsApp confirmation, and instrument pickup scheduling are all missing.

### 4.2 Required Wiring

#### 4.2.1 Token Resolution on Mount

Replace `MOCK_SCHOOL_INFO` with a real data fetch:

```typescript
// At component mount (useEffect / React Query)
const { data: partnershipInfo, isLoading, error } = useQuery({
  queryKey: ['ps-partnership', token],
  queryFn: () => resolvePlayingSchoolToken(token),
});

// Cloud function: src/lib/cloud-functions/school-partnership.ts
async function resolvePlayingSchoolToken(token: string): Promise<{
  partnershipId: string;
  conservatoriumId: string;
  schoolName: string;
  schoolSymbol: string;
  conservatoriumName: string;
  programs: SchoolProgram[];
  costBreakdown: {
    basePrice: number;
    municipalSubsidyPercent: number;
    ministrySubsidyPercent: number;
    parentContributionPerYear: number;
  };
  tokenExpiry: string; // ISO — tokens expire after one academic year
  tokenValid: boolean;
}>;
```

**Token invalidity states to handle:**
- Token not found → show "הקישור אינו תקף" error page.
- Token expired → show "ההרשמה לשנה זו נסגרה — צרו קשר עם הקונסרבטוריון" page.
- Partnership status != ACTIVE → show "התוכנית אינה פעילה כרגע" page.

#### 4.2.2 Enrollment Submission — Replace Mock

```typescript
// Replace setSubmitted(true) with:
const handleSubmit = async () => {
  setIsSubmitting(true);
  try {
    const result = await createPlayingSchoolEnrollment({
      partnershipId: partnershipInfo.partnershipId,
      conservatoriumId: partnershipInfo.conservatoriumId,
      programId: selectedProgramId,
      studentName,
      studentGrade,
      studentClass,
      studentDob,
      parentName,
      parentPhone,
      parentEmail,
      parentIdNumber: parentId,
      instrument,
      paymentMethod,
      consentGiven: consent,
    });

    if (paymentMethod === 'CARDCOM') {
      // Redirect to Cardcom hosted payment page
      window.location.href = result.cardcomPaymentUrl;
    } else {
      // SCHOOL_FEES path: show confirmation screen
      setSubmitted(true);
      setEnrollmentId(result.enrollmentId);
    }
  } catch (err) {
    toast({ title: 'שגיאה בהרשמה', description: err.message, variant: 'destructive' });
  } finally {
    setIsSubmitting(false);
  }
};
```

#### 4.2.3 Cardcom Return Handler

**New Route:** `/enroll/playing-school/[token]/payment-return`
**File:** `src/app/[locale]/enroll/playing-school/[token]/payment-return/page.tsx`

Handles Cardcom redirect after payment:
- On success (`?status=success&InternalDealNumber=XXX`): call `confirmCardcomPayment(enrollmentId, dealNumber)` → show success screen with instrument pickup instructions.
- On failure (`?status=error`): show retry button + support contact.
- Webhook handler at `/api/cardcom/playing-school-webhook` independently confirms payment server-side (idempotent).

#### 4.2.4 Post-Enrollment Confirmation Screen

The success screen (currently `setSubmitted(true)`) must show:

```
✅  ההרשמה אושרה!
────────────────────────────────────────────
שם התלמיד/ה:   [שם]
בית הספר:      [שם בית הספר]
כלי:           [חליל / כינור]
יום השיעור:    [יום + שעה]
────────────────────────────────────────────
📲  אישור נשלח ל-WhatsApp ול: [email]
🎻  כלי הנגינה ינתן ב: [שם בית הספר], [תאריך משוער]
    יש להביא שיק פיקדון על סך ₪[XXX]
────────────────────────────────────────────
[כפתור: כניסה לחשבון המשפחה שלי]
```

---

## 5. GAP-05 — Student Account Auto-Creation on Enrollment

### 5.1 Problem Statement

SDD-PS §6.4 mentions that "student account is auto-created when parent registers and pays," but no implementation specification exists. Without account creation, the student has no Harmonia identity, cannot appear in the teacher's attendance list, cannot receive group lesson notes, and cannot transition to the excellence track.

### 5.2 Auto-Creation Logic

#### Trigger Point

`createPlayingSchoolEnrollment` cloud function, on status transition to `ACTIVE` (i.e., on payment confirmation or admin's manual payment marking for SCHOOL_FEES).

#### Account Creation Specification

```typescript
async function autoCreatePlayingSchoolStudentAccount(
  enrollment: PlayingSchoolEnrollment
): Promise<{ userId: string; isNewAccount: boolean }> {
  // 1. Check if a user with matching (parentPhone + studentName + studentDob) already exists
  //    to prevent duplicates for siblings or re-enrollments.
  
  // 2a. If existing user found: link enrollment (enrollment.studentId = existingUser.id)
  //     and add conservatoriumId to existingUser.conservatoriumId if not present.
  
  // 2b. If new: create User document with:
  const newStudent: Partial<User> = {
    id: generateId(),
    name: enrollment.studentName,
    role: 'student',
    conservatoriumId: enrollment.conservatoriumId,
    parentId: enrollment.parentId ?? null,
    // No email/password yet — account is "lightweight" until excellence track
    accountType: 'PLAYING_SCHOOL',  // NEW field — see §5.3
    grade: enrollment.studentGrade,
    schoolSymbol: enrollment.schoolSymbol,
    playingSchoolEnrollmentId: enrollment.id,
    createdAt: new Date().toISOString(),
    // Achievements seed
    achievements: [{
      type: 'PLAYING_SCHOOL_ENROLLED',
      earnedAt: new Date().toISOString(),
    }],
  };
  
  // 3. Link: enrollment.studentId = newStudent.id
  // 4. Return { userId, isNewAccount }
}
```

#### 5.3 New `accountType` Field on User

Add to `src/lib/types.ts`:

```typescript
export type AccountType = 
  | 'FULL'          // Standard conservatory student — full access
  | 'PLAYING_SCHOOL' // Group-program student — limited access
  | 'EXCELLENCE'    // Playing School → upgraded to individual lessons
  ;
```

#### Student Dashboard for `PLAYING_SCHOOL` Account Type

**Route:** `/dashboard/student` — existing route, conditionally rendered based on `accountType`

When `accountType === 'PLAYING_SCHOOL'`, the student dashboard renders a **simplified view**:

```
┌────────────────────────────────────────────────────────────┐
│   🎻  שלום, [שם]! אתה/ת בתוכנית בית ספר מנגן              │
├────────────────────────────────────────────────────────────┤
│  📅  השיעור הבא:  [יום], [תאריך] | [בית ספר] | [שעה]     │
│  🎵  כלי:         [שם הכלי]                                 │
│  ✅  נוכחות:      [X מתוך Y שיעורים השנה]                  │
├────────────────────────────────────────────────────────────┤
│  🏆  הישגים                                                 │
│  [PLAYING_SCHOOL_ENROLLED badge]                            │
│  [FIRST_GROUP_LESSON badge — unlocked after lesson 1]       │
│  [3_MONTH_STREAK badge — if attended 12 consecutive lessons]│
├────────────────────────────────────────────────────────────┤
│  [IF excellenceTrackNominated = true]                       │
│  ⭐  המורה מינה/ה אותך למסלול מצוינות! [פרטים]             │
└────────────────────────────────────────────────────────────┘
```

**Hidden from `PLAYING_SCHOOL` account:** booking system, individual billing, makeup credits, teacher messaging, practice log, sheet music viewer.

#### New Achievement Types

Add to `AchievementType` in `src/lib/types.ts`:

```typescript
| 'PLAYING_SCHOOL_ENROLLED'
| 'FIRST_GROUP_LESSON'
| 'GROUP_LESSON_STREAK_3_MONTHS'
| 'EXCELLENCE_TRACK_NOMINATED'
| 'EXCELLENCE_TRACK_ENROLLED'
```

---

## 6. GAP-06 — Parent Billing Dashboard: Playing School Charges

### 6.1 Problem Statement

The existing `student-billing-dashboard.tsx` and the parent's payment history view display only regular conservatory invoices. Playing School charges (whether paid via Cardcom, school fees, or municipal direct) are invisible to the parent in the billing section of their account.

### 6.2 Required Changes

#### 6.2.1 Billing Data Hook Extension

Extend `useBillingData` (or equivalent billing hook) to also fetch Playing School billing records:

```typescript
// Additional query in billing hook:
const psInvoices = await getPlayingSchoolInvoices(parentId);

type PlayingSchoolInvoice = {
  id: string;
  enrollmentId: string;
  studentName: string;
  schoolName: string;
  academicYear: string;
  amount: number;                 // Parent contribution amount
  paymentMethod: PSPaymentMethod;
  status: 'PENDING' | 'PAID' | 'WAIVED';
  paidAt?: string;
  receiptUrl?: string;            // Firebase Storage URL
  cardcomDealNumber?: string;
};
```

#### 6.2.2 Billing Dashboard UI

In `student-billing-dashboard.tsx`, add a **Playing School section** above or below the regular invoices:

```
📋  חיובי בית ספר מנגן
────────────────────────────────────────────────────────────
[שם הילד] | [שם בית הספר] | שנה"ל [שנה]
סכום: ₪[XXX]   |   שולם: ✅ / ⏳ ממתין   |   [הורדת קבלה]
────────────────────────────────────────────────────────────
```

For SCHOOL_FEES method: show "תשלום נגבה דרך בית הספר" with the admin-confirmed date.
For MUNICIPAL_DIRECT: show "מסובסד במלואו על ידי העירייה — אין תשלום מהורים".
For CARDCOM: show Cardcom deal number + receipt download button.

#### 6.2.3 Payment Receipt Generation

Extend `generateInvoicePdf` (or equivalent) to support a `PlayingSchoolInvoice` template:

```
RECEIPT — בית ספר מנגן
Conservatory: [שם]   |   School: [שם בית הספר]
Student: [שם]        |   Grade: [כיתה]
Academic Year: [שנה]
────────────────────────────────────────────────
Program Fee:                     ₪X,XXX.00
Municipal Subsidy (XX%):        -₪X,XXX.00
Ministry Subsidy (XX%):         -₪XXX.00
────────────────────────────────────────────────
Parent Contribution:              ₪XXX.00
Payment Method: [שיטה]
Date Paid: [תאריך]
```

---

## 7. GAP-07 — Notification Preferences: Playing School Event Types

### 7.1 Problem Statement

`notification-preferences.tsx` (and the associated `NotificationType` enum) does not include any Playing School events. Parents cannot configure delivery preferences (WhatsApp vs. Email, quiet hours) for Playing School notifications, even though SDD-PS §8.2 defines 8 new notification event types.

### 7.2 Required Changes

#### 7.2.1 NotificationType Extension

In `src/lib/types.ts`, add to `NotificationType` union:

```typescript
| 'PLAYING_SCHOOL_ENROLLMENT_CONFIRMED'
| 'PLAYING_SCHOOL_LESSON_CANCELLED'
| 'PLAYING_SCHOOL_INSTRUMENT_PICKUP_READY'
| 'PLAYING_SCHOOL_INSTRUMENT_OVERDUE'
| 'EXCELLENCE_TRACK_NOMINATION'
| 'EXCELLENCE_TRACK_OFFER'
| 'SCHOOL_VENUE_CONFLICT'
| 'PAYMENT_DUE_SCHOOL_PROGRAM'
```

#### 7.2.2 Notification Preferences UI

In `notification-preferences.tsx`, add a new collapsible section:

```
────────────────────────────────────────────────────────────
🏫  הודעות בית ספר מנגן
────────────────────────────────────────────────────────────
✅ אישור הרשמה        📲 WhatsApp  📧 Email
✅ ביטול שיעור         📲 WhatsApp  📧 Email
✅ איסוף כלי נגינה     📲 WhatsApp  📧 Email
⚠️ עיכוב החזרת כלי     📲 WhatsApp  📧 Email
🌟 מינוי למסלול מצוינות 📲 WhatsApp  📧 Email
💳 תשלום ממתין         📲 WhatsApp  📧 Email
```

#### 7.2.3 School Coordinator Notification Preferences

When a `school_coordinator` logs in for the first time, the onboarding flow must include a notification preferences step:

```
────────────────────────────────────────────────────────────
הגדרת העדפות קבלת התראות (רכז/ת)
────────────────────────────────────────────────────────────
✅ ביטול שיעור (מורה לא יגיע)    📲 WhatsApp  📧 Email
✅ הרשמה חדשה אושרה             📧 Email
✅ מינוי תלמיד למצוינות          📧 Email
✅ תזכורת איסוף כלי              📧 Email
✅ בקשת לוח זמנים חדש            📧 Email
```

Coordinator notification preferences stored in `users/{coordinatorId}/notificationPreferences` — same structure as other users.

---

## 8. GAP-08 — Excellence Track: Parent Acceptance Flow in Family Hub

### 8.1 Problem Statement

SDD-PS §5.4 defines the excellence track nomination → offer → enrollment pipeline at a logical level, but no UX flow exists for the parent's side. When a teacher nominates a student, the parent currently has no in-app mechanism to view the offer, understand what it entails, or accept/decline — the SDD only says "send offer via WhatsApp/email."

### 8.2 Required Flow

#### 8.2.1 Excellence Track Notification Card in Family Hub

When `enrollment.excellenceTrackNominated === true`, the `PlayingSchoolChildCard` (GAP-03) shows a call-to-action strip:

```
⭐  [שם המורה] ממליץ/ה על [שם הילד] לתוכנית המצוינות!
    [קרא/י עוד והחליט/י]  →
```

Clicking → opens `ExcellenceTrackOfferModal`.

#### 8.2.2 `ExcellenceTrackOfferModal` Component

**File:** `src/components/harmonia/excellence-track-offer-modal.tsx`

```
┌────────────────────────────────────────────────────────────────────┐
│  ⭐  הזמנה למסלול מצוינות                                          │
├────────────────────────────────────────────────────────────────────┤
│  [שם הילד] הוזמן/ה לקחת חלק במסלול מצוינות לנגינה                │
│  בקונסרבטוריון [שם הקונסרבטוריון].                                 │
│                                                                    │
│  מה כלול:                                                          │
│  ✓ שיעורים פרטיים שבועיים בקונסרבטוריון                           │
│  ✓ השתתפות בתזמורת בית הספר                                       │
│  ✓ [אפשרות מלגה — if applicable]                                  │
│                                                                    │
│  לוח זמנים:  [יום + שעה]                                          │
│  מורה:       [שם המורה] — [ביוגרפיה קצרה]                        │
│  עלות:       ₪[XXX] לחודש  / ₪[YYY] לשנה                        │
│  [אפשרות: 10 תשלומים חודשיים]                                     │
│                                                                    │
│  [מלגה זמינה? כפתור: בדוק זכאות למלגה]                          │
├────────────────────────────────────────────────────────────────────┤
│  הערת המורה:                                                       │
│  "[teacherNominationNote from group lesson]"                       │
├────────────────────────────────────────────────────────────────────┤
│  [כפתור ראשי: אני רוצה להירשם!]   [כפתור משני: לא בשלב זה]       │
└────────────────────────────────────────────────────────────────────┘
```

#### 8.2.3 Acceptance Action

On "אני רוצה להירשם":
1. Call `enrollInExcellenceTrack(enrollmentId)` cloud function.
2. The cloud function creates a new standard `Enrollment` (individual conservatory lesson) linked to the original Playing School `enrollmentId`.
3. If `scholarshipCheck === true` (auto-trigger): route to `ScholarshipApplicationFlow` (SDD-17 pattern).
4. Otherwise: route to standard `enrollment-wizard.tsx` at the conservatorium/teacher/scheduling steps, **pre-filling** instrument, conservatoriumId, parentDetails, studentDetails from the Playing School enrollment.
5. Student `accountType` upgrades from `PLAYING_SCHOOL` → `EXCELLENCE` → on first individual lesson completion → `FULL`.

On "לא בשלב זה":
1. Call `declineExcellenceTrackOffer(enrollmentId, 'PARENT_DECLINE')`.
2. Set `enrollment.excellenceTrackStatus = 'DECLINED'`.
3. Show a soft message: "ניתן לחזור ולהצטרף בעתיד — פנו אל המורה".
4. Card reverts to standard Playing School card (no CTA strip).

#### 8.2.4 Admin Offer Configuration

Before the offer is sent to the parent, the admin must configure its details in `/dashboard/admin/playing-school`:

**New modal:** `ExcellenceTrackOfferConfigModal` — appears when admin clicks "שלח הצעה" next to a nominated student.

Required fields:
- Proposed teacher (from existing teacher roster — auto-suggested based on instrument)
- Proposed lesson day + time
- Monthly fee / annual fee
- Scholarship eligibility (checkbox: "student may qualify for financial aid")
- Personal message from teacher (pre-filled from nomination note, editable)

On "שלח הצעה": call `sendExcellenceTrackOffer(enrollmentId, offerDetails)` → triggers WhatsApp + email to parent + shows notification in Family Hub.

---

## 9. GAP-09 — Admin: Enrollment Token Generation & Sharing UI

### 9.1 Problem Statement

SDD-PS §8.1 defines `generateEnrollmentToken(partnershipId)` as a cloud function, but the admin UI at `/dashboard/admin/playing-school` has no mechanism for the admin to:
1. Generate or regenerate the enrollment token.
2. Preview the enrollment page as a parent would see it.
3. Share the link via WhatsApp, copy to clipboard, or generate a QR code for the school.
4. See how many parents have used the link (conversion tracking).

### 9.2 Required Admin UI Components

#### 9.2.1 Token Management Panel

In the Partnership detail view (`/dashboard/admin/playing-school/[partnershipId]`), add a "הרשמת הורים" section:

```
┌────────────────────────────────────────────────────────────────────┐
│  🔗  קישור הרשמה להורים                                            │
├────────────────────────────────────────────────────────────────────┤
│  קישור פעיל:                                                       │
│  https://app.harmonia.co.il/enroll/playing-school/[token]          │
│  [העתק]  [QR קוד]  [שלח ב-WhatsApp לרכז/ת]                       │
│                                                                    │
│  תוקף:  עד [תאריך] (תום שנת הלימודים)                            │
│  שימוש: [X] הורים פתחו  |  [Y] הרשמות הושלמו  (Z% המרה)          │
│                                                                    │
│  [כפתור: צור קישור חדש] — מבטל את הקישור הקודם                  │
│  [כפתור: תצוגה מקדימה — איך ההורה רואה את הדף]                  │
└────────────────────────────────────────────────────────────────────┘
```

#### 9.2.2 QR Code Generation

Use `qrcode` npm package (already a common Next.js dependency) to generate a downloadable QR code PNG:

```typescript
// Accessible via: GET /api/ps/qr?token=[token]
// Returns: image/png — for printing and distributing at school
```

QR code image downloads as `playing-school-[schoolName]-[academicYear].png`.

#### 9.2.3 WhatsApp Share to School Coordinator

Clicking "שלח ב-WhatsApp לרכז/ת" constructs and opens:

```
https://wa.me/[coordinatorPhone]?text=שלום%20[coordinatorName],%20להלן%20קישור%20ההרשמה%20לתוכנית%20בית%20ספר%20מנגן%20לשנת%20הלימודים%20[year]:%20[enrollmentURL]
```

#### 9.2.4 Conversion Funnel Analytics

New Firestore document: `school_partnerships/{id}/analytics`:

```typescript
type PartnershipAnalytics = {
  tokenOpens: number;       // incremented each time enrollment page is loaded with this token
  enrollmentsStarted: number; // Step 1 completed
  enrollmentsCompleted: number; // Payment confirmed
  lastOpenedAt: string;
  lastEnrollmentAt: string;
};
```

Display as a small "funnel widget" in the admin token management panel.

#### 9.2.5 Bulk Token Distribution

New bulk action for admins managing multiple partnerships:

**Route:** `/dashboard/admin/playing-school/distribute`

Table of all active partnerships with:
- School name
- Token link
- Coordinator WhatsApp status (✅ sent / ⏳ not sent)
- [שלח לכולם] — batch WhatsApp messages to all coordinators who haven't received the link.

---

## 10. GAP-10 — School Coordinator Account Invitation Flow

### 10.1 Problem Statement

SDD-PS §3.1 defines the `school_coordinator` role and permissions, but no mechanism exists to:
1. Invite a person to become a school coordinator from the admin UI.
2. Have them create/activate their account securely.
3. Onboard them with their school context pre-loaded.

Open Question #3 in SDD-PS (coordinator authentication method) remains unresolved. This gap specifies a concrete resolution.

### 10.2 Resolution: Email Invitation with Magic Link

**Decision:** School coordinators use **Email/password with a magic-link first-login** (not Google SSO, as school domains in Israel vary and many use private municipal domains; not one-time-link per term, as coordinators need persistent access for multi-year programs).

#### 10.2.1 Admin: Invite Coordinator UI

In the Partnership edit form (`/dashboard/admin/playing-school/[partnershipId]/edit`), the "Coordinator" section shows:

```
┌────────────────────────────────────────────────────────────────────┐
│  רכז/ת בית הספר                                                    │
├────────────────────────────────────────────────────────────────────┤
│  שם:    [שם הרכז/ת]        *                                       │
│  אימייל: [כתובת אימייל]    *                                       │
│  טלפון:  [נייד]            *                                       │
│                                                                    │
│  [כפתור: שלח הזמנה →]                                             │
│                                                                    │
│  סטטוס: ✅ פעיל מ-[תאריך] / ⏳ הזמנה נשלחה / ❌ לא הוזמן        │
└────────────────────────────────────────────────────────────────────┘
```

#### 10.2.2 Invitation Cloud Function

```typescript
// src/lib/cloud-functions/school-partnership.ts

async function inviteSchoolCoordinator(
  partnershipId: string,
  coordinatorDetails: {
    name: string;
    email: string;
    phone: string;
  }
): Promise<{ inviteToken: string; inviteUrl: string }> {
  // 1. Create User record with role='school_coordinator', status='INVITED'
  // 2. Generate secure invite token (UUID v4, stored in users/{id}/inviteToken)
  // 3. Set token expiry: 7 days
  // 4. Send email to coordinatorDetails.email:
  //    Subject: "הזמנה לנהל את תוכנית בית ספר מנגן ב[schoolName]"
  //    Body: link to /accept-invite/[token]
  // 5. Send WhatsApp if phone provided (Twilio)
  // 6. Return { inviteToken, inviteUrl }
}
```

#### 10.2.3 Coordinator Onboarding Route

**Route:** `/accept-invite/[inviteToken]` (public, no auth required)

Steps:
1. **Validate token** — resolves to a `school_coordinator` user record.
2. **Set password** — "בחר/י סיסמה לחשבונך".
3. **Phone verification** — OTP via SMS (Israeli standard for auth trust).
4. **Consent** — data processing agreement acknowledgment (required per PDPPA §12.1).
5. **Redirect** to `/dashboard/school` — coordinator dashboard, school context pre-loaded.

#### 10.2.4 Coordinator Dashboard Onboarding Checklist

First login shows an onboarding checklist:

```
ברוכ/ה הבא/ה לפורטל רכז/ת בית ספר מנגן!
────────────────────────────────────────────────────────────
☐  עיין/י ברשימת התלמידים הרשומים
☐  אשר/י את לוח הזמנים של השיעורים
☐  הגדר/י חגים ואירועי בית ספר שישפיעו על השיעורים
☐  הכר/י את המורה: [שם מורה] | [טלפון] | [כפתור: שלח/י הודעה]
────────────────────────────────────────────────────────────
[כפתור: התחל/י]
```

Checklist items are tracked in `users/{coordinatorId}/onboardingState`.

---

## 11. Cross-Cutting: i18n Coverage for All New Surfaces

All components and pages introduced in GAP-01 through GAP-10 must be covered by translation keys in all four locale files:
- `src/messages/he.json` (Hebrew — primary, RTL)
- `src/messages/ar.json` (Arabic — RTL)
- `src/messages/ru.json` (Russian — LTR)
- `src/messages/en.json` (English — LTR)

### New i18n Namespaces Required

| Namespace | Covers |
|---|---|
| `PlayingSchool.finder` | GAP-02 school discovery page |
| `PlayingSchool.wizard` | GAP-04 enrollment wizard (extends existing) |
| `PlayingSchool.familyHub` | GAP-03 Family Hub cards |
| `PlayingSchool.excellence` | GAP-08 excellence track offer modal |
| `PlayingSchool.billing` | GAP-06 billing section |
| `PlayingSchool.notifications` | GAP-07 notification preferences labels |
| `PlayingSchool.coordinator.onboarding` | GAP-10 coordinator first-login flow |
| `PlayingSchool.admin.tokenPanel` | GAP-09 token management panel |

All new user-facing strings in `PlayingSchool.wizard` must be added via i18n keys — **no hardcoded Hebrew strings** in component files.

---

## 12. Security & Privacy Addendum

### 12.1 Public Token Security

The enrollment token (`/enroll/playing-school/[token]`) is publicly accessible. It must be treated as a **shareable but not secret** link:
- Token encodes `partnershipId` only — not `conservatoriumId` or any financial data.
- Tokens are **rate-limited** at the API gateway: max 60 requests/hour per IP.
- Token can be **regenerated** by admin (invalidates the old token, renders old links dead).
- All token resolutions are logged to `audit_log` collection with IP, timestamp, and user agent.

### 12.2 School Coordinator Data Scope Enforcement

The `school_coordinator` Firestore rules must enforce strict school-scope isolation:

```
// Firestore rules
match /conservatoria/{cId}/playing_school_enrollments/{eId} {
  allow read: if isSchoolCoordinator() && 
    resource.data.schoolSymbol == 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.schoolSymbol;
  allow write: if false; // coordinators are read-only on enrollment data
}
```

### 12.3 Minor Data — PDPPA Compliance Checkpoint

All new collections introduced in this SDD (playing_school_interest_leads, PartnershipAnalytics) must be reviewed against PDPPA (Israel) requirements:
- `playing_school_interest_leads` contains parent PII (name, phone, email) — requires consent checkbox on the interest form.
- Analytics data (tokenOpens, enrollmentsStarted) must be aggregate-only — no individual IP logging in analytics documents.
- Coordinator invite tokens stored in Firestore must be **one-way hashed** (SHA-256) — not stored in plaintext.

---

## 13. Implementation Priority & Phase Assignment

This SDD defines 10 gaps. The recommended implementation order within the existing 5-phase roadmap:

| Gap | Insert Into Phase | Rationale |
|---|---|---|
| GAP-04 (Wizard Backend) | Phase 2 | Blocks all enrollment — P0 |
| GAP-09 (Token UI) | Phase 2 | Admin can't distribute links without this |
| GAP-10 (Coordinator Invite) | Phase 2 | Coordinator dashboard is unusable without an account |
| GAP-01 (Registration Form Branch) | Phase 2 | Core discoverability |
| GAP-02 (School Finder Page) | Phase 2 | Organic enrollment path |
| GAP-05 (Student Auto-Creation) | Phase 2 | Needed for teacher attendance lists |
| GAP-03 (Family Hub Cards) | Phase 3 | Parent ongoing engagement |
| GAP-06 (Billing Dashboard) | Phase 3 | Financial transparency |
| GAP-07 (Notification Prefs) | Phase 3 | Communication control |
| GAP-08 (Excellence Track Flow) | Phase 4 | Aligns with existing Phase 4 excellence work |

---

## 14. Acceptance Criteria Summary

| Gap | Acceptance Criteria |
|---|---|
| GAP-01 | Parent selecting "Playing School" in enrollment wizard is routed to the correct partnership page within 2 clicks. |
| GAP-02 | Parent can find their child's school by name in under 10 seconds; schools with no active program show an interest form. |
| GAP-03 | Parent sees a Playing School card per enrolled child in Family Hub within 24h of enrollment confirmation. |
| GAP-04 | End-to-end: parent completes wizard → Cardcom payment → enrollment record created → WhatsApp confirmation received, with zero mock code remaining. |
| GAP-05 | A student Firestore user document is created within 5 seconds of payment confirmation; student sees simplified dashboard on first login. |
| GAP-06 | Playing School invoice appears in parent billing history; receipt PDF downloadable for SCHOOL_FEES and CARDCOM payment methods. |
| GAP-07 | Parent can toggle WhatsApp vs. Email per Playing School notification event type; preferences are respected by the notification dispatcher. |
| GAP-08 | Parent receives in-app notification of excellence track nomination; completing the acceptance flow creates a linked standard conservatory enrollment. |
| GAP-09 | Admin can generate, preview, and share enrollment token via QR or WhatsApp in one click; conversion funnel is visible per partnership. |
| GAP-10 | School coordinator receives email + WhatsApp invitation, sets password, completes OTP, and lands on their school dashboard with full context pre-loaded. |

---

*End of SDD-PS2 — Playing School 360° Integration Gap Specification*
*Next SDD in series: SDD-PS3 — Playing School Year-End Reporting & Municipality Billing Automation (planned)*
