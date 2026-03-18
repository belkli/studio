# SOFTWARE DESIGN DOCUMENT
## Internationalization (i18n) Complete Fix
### Lyriosa Music Conservatory Platform
**Full Translation Coverage: HE · EN · AR · RU**

---

| Attribute | Value |
|---|---|
| Document Type | Software Design Document (SDD) |
| Project | Lyriosa Studio — i18n Complete Fix |
| Target Languages | Hebrew (he), English (en), Arabic (ar), Russian (ru) |
| Framework | Next.js 14 · next-intl · React |
| Scope | 154 affected files · ~1,952 hardcoded Hebrew lines |
| Priority | **CRITICAL — Platform-wide blocking issue** |
| Version | 1.0 |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Solution Architecture](#3-solution-architecture)
4. [Detailed Change Specifications](#4-detailed-change-specifications)
5. [Translation File Specifications](#5-translation-file-specifications)
6. [Implementation Plan](#6-implementation-plan)
7. [Testing Requirements](#7-testing-requirements)
8. [Appendix — Complete File Inventory](#8-appendix--complete-file-inventory)
9. [Summary](#9-summary)

---

## 1. Executive Summary

The Lyriosa platform was built with Hebrew as the hardcoded default language across the majority of its components. Although the internationalization infrastructure using `next-intl` is correctly configured with routing support for four locales (`he`, `en`, `ar`, `ru`) and four translation JSON files, the actual component code bypasses this infrastructure entirely. The result is that switching to English, Arabic, or Russian renders a mixed-language UI — translated navigation and shared strings alongside Hebrew-hardcoded labels, validation messages, toasts, placeholders, and business logic text.

This document provides a complete, structured design specification for:
- Migrating all hardcoded text to the next-intl translation system
- Adding the two missing translation namespaces (`NewForm`, `TrialBooking`)
- Fixing a structural issue in the shared `Combobox` UI component
- Supplying full translation entries across all four language files for every new key

### Scope Summary

| Dimension | Count | Notes |
|---|---|---|
| App page files with hardcoded Hebrew | 61 | `src/app/[locale]/**` |
| Component files with hardcoded Hebrew | 93 | `src/components/**` |
| Total hardcoded Hebrew lines | ~1,952 | Labels, toasts, placeholders, validation |
| Missing translation namespaces | 2 | `NewForm`, `TrialBooking` |
| Translation files to update | 4 | en.json, he.json, ar.json, ru.json |
| UI shared components affected | 2 | `combobox.tsx`, `status-badge.tsx` |
| Components needing new `useTranslations()` | ~128 | Currently 0% i18n coverage |

---

## 2. Current State Analysis

### 2.1 Translation Infrastructure (Correctly In Place)

The following i18n foundations are already implemented and do **not** require changes:

- `next-intl` routing configured in `src/i18n/routing.ts` with `locales: ['he','en','ar','ru']` and `defaultLocale: 'he'`
- Locale-aware request handler in `src/i18n/request.ts` — correctly imports the right JSON per locale
- `src/app/[locale]/` directory structure with dynamic locale segment
- Four message files in `src/messages/` — all currently in sync with 891–892 keys each
- Language switcher component (`src/components/language-switcher.tsx`) — already implemented
- `useTranslations()` hook already used in **70 of 237** TSX files

### 2.2 Core Problem: Hardcoded Hebrew Bypasses i18n

Despite the infrastructure being in place, the vast majority of component files — particularly in `src/components/dashboard/harmonia/`, `src/components/harmonia/`, `src/components/forms/`, and most app pages — contain Hebrew text as literal string values. These strings appear in:

- **JSX text content:** e.g., `<CardTitle>כניסה למערכת</CardTitle>`
- **Prop string values:** e.g., `placeholder="בחר ילד/ה..."`
- **Toast notifications:** e.g., `toast({ title: "התחברות מוצלחת" })`
- **Zod validation messages:** e.g., `z.string().min(1, "חובה לבחור תלמיד.")`
- **Conditional strings:** e.g., `loading ? "מתחבר..." : "התחבר"`
- **Data-layer status keys:** Hebrew string keys used as object lookup keys (`status-badge.tsx`)

### 2.3 Missing Translation Namespaces

Two namespaces are actively referenced by components using `useTranslations()` but do **not exist** in any of the four message JSON files:

| Missing Namespace | Used In | Keys Needed |
|---|---|---|
| `NewForm` | `src/components/forms/new-form.tsx`, `src/components/forms/exam-registration-form.tsx`, `src/app/[locale]/dashboard/forms/new/page.tsx` | ~20 keys (types, validation, labels) |
| `TrialBooking` | `src/components/harmonia/trial-booking-widget.tsx`, `src/app/[locale]/try/page.tsx` | ~20 keys (steps, labels, success states) |

These missing namespaces cause runtime errors or silent failures when the locale is not Hebrew, as the `t()` function returns `undefined` or the raw key path.

### 2.4 Structural Issue: Combobox UI Component

The shared `Combobox` component (`src/components/ui/combobox.tsx`) has hardcoded Hebrew **default prop values**. Because this is a generic UI primitive used across the entire application, every instance that relies on these defaults renders Hebrew regardless of locale:

```tsx
placeholder = "בחר פריט...",
searchPlaceholder = "חפש פריט...",
notFoundMessage = "לא נמצאו פריטים.",
// inline: "טוען..." loading text
```

### 2.5 One Extraneous Key in HE (Minor)

The Hebrew message file contains one key not present in English: `Navigation.trialLesson`. This key should be added to all four files to maintain parity.

---

## 3. Solution Architecture

### 3.1 Design Principles

- **Zero regression:** All changes are purely additive to message JSON files; component refactoring replaces hardcoded strings with `t()` calls
- **Namespace grouping:** New translation keys are grouped into logical namespaces matching the component hierarchy
- **Prop-based fallback for UI primitives:** The `Combobox` component receives translated strings as props from parent components rather than calling `useTranslations()` internally
- **Status key normalization:** `status-badge` lookup keys will migrate from Hebrew string keys to enum-style English keys to support all locales
- **Consistent validation:** All Zod schema messages use `t()` calls at schema construction time

### 3.2 Change Categories

| Category | Description | Est. Files |
|---|---|---|
| **CAT-1** | Add `NewForm` and `TrialBooking` namespaces to all 4 message files | 4 JSON files |
| **CAT-2** | Add missing translation keys to existing namespaces (or new namespaces) for all 128 untranslated components | 4 JSON files + up to 128 `.tsx` files |
| **CAT-3** | Fix Combobox Hebrew defaults; fix status-badge key normalization | 2 `.tsx` files |
| **CAT-4** | Migrate `login-form.tsx` from fully hardcoded Hebrew to `useTranslations('Auth')` | 1 `.tsx` + 4 JSON |
| **CAT-5** | Migrate `dynamic-form`, `new-form`, `exam-registration-form`, `recital-form`, `kenes-form` | 5 `.tsx` + 4 JSON |
| **CAT-6** | Migrate all 67 components in `src/components/dashboard/harmonia/` | 67 `.tsx` + 4 JSON |
| **CAT-7** | Migrate all components in `src/components/harmonia/` | 9 `.tsx` + 4 JSON |
| **CAT-8** | Migrate all 61 app pages with hardcoded Hebrew | 61 `.tsx` + 4 JSON |
| **CAT-9** | Migrate `enrollment-wizard.tsx` | 1 `.tsx` + 4 JSON |
| **CAT-10** | Migrate `walkthrough-manager.tsx` step descriptions | 1 `.tsx` + 4 JSON |

---

## 4. Detailed Change Specifications

### 4.1 CAT-1: Add Missing Namespaces — `NewForm` & `TrialBooking`

#### 4.1.1 `NewForm` Namespace

Add to all four message files (`en.json`, `he.json`, `ar.json`, `ru.json`):

```json
"NewForm": {
  "loading": "Loading...",
  "selectionTitle": "Create New Form",
  "formType": "Form Type",
  "selectType": "Select form type...",
  "selectStudent": "Select Student",
  "selectStudentPlaceholder": "Select a student...",
  "pleaseSelectStudent": "Please select a student to continue.",
  "successTitle": "{type} form created successfully",
  "successDesc": "The form has been created and is ready for submission.",
  "types": {
    "recital": "Recital",
    "kenes": "Kenes",
    "exam_registration": "Exam Registration"
  },
  "validation": {
    "required": "This field is required.",
    "requiredComposer": "Composer is required.",
    "requiredTitle": "Title is required.",
    "invalidDuration": "Duration must be in MM:SS format.",
    "requiredGenre": "Genre is required.",
    "requiredInstrument": "Instrument is required.",
    "requiredLevel": "Exam level is required.",
    "requiredType": "Exam type is required.",
    "minRepertoire": "At least {min} repertoire items are required.",
    "maxRepertoire": "A maximum of {max} repertoire items is allowed.",
    "requiredDeclaration": "You must accept the declaration."
  },
  "compositionItem": "Composition {index}",
  "deleteItem": "Delete item",
  "composer": "Composer",
  "selectComposer": "Search or select a composer..."
}
```

#### 4.1.2 `TrialBooking` Namespace

Add to all four message files:

```json
"TrialBooking": {
  "title": "Book a Trial Lesson",
  "subtitle": "Take your first step in music with a guided trial session.",
  "instrument": "Select Instrument",
  "instrumentPlaceholder": "Choose an instrument...",
  "teacher": "Select Teacher",
  "teacherPlaceholder": "Choose a teacher...",
  "availableSlots": "Available Times",
  "noSlots": "No available slots for this date.",
  "steps": {
    "instrument": "Instrument",
    "teacher": "Teacher",
    "schedule": "Schedule",
    "details": "Details",
    "payment": "Payment"
  },
  "details": {
    "name": "Full Name",
    "phone": "Phone Number",
    "email": "Email Address"
  },
  "payment": {
    "title": "Payment",
    "price": "Trial lesson fee: {price}₪"
  },
  "success": {
    "title": "Booking Confirmed!",
    "confirmation": "A confirmation has been sent to your email.",
    "info": "Arrive 5 minutes before your lesson."
  }
}
```

---

### 4.2 CAT-3: UI Primitive Fixes

#### 4.2.1 Fix: `src/components/ui/combobox.tsx`

**Problem:** Hebrew hardcoded as default prop values in a shared primitive component.

**Solution:** Remove the Hebrew default values. Props will default to empty strings; all callers must pass translated strings explicitly.

| Current (Hebrew Default) | Change To |
|---|---|
| `placeholder = "בחר פריט..."` | `placeholder = ""` — callers must pass translated value |
| `searchPlaceholder = "חפש פריט..."` | `searchPlaceholder = ""` |
| `notFoundMessage = "לא נמצאו פריטים."` | `notFoundMessage = ""` |
| `"טוען..."` inline loading text | Add prop: `loadingMessage = ""` |

All callers of `<Combobox>` across the codebase must be updated to pass the appropriate translated string via the `t()` hook in the parent component. Run a codemod search for `<Combobox` to identify all call sites.

#### 4.2.2 Fix: `src/components/ui/status-badge.tsx`

**Problem:** The `statusMap` object uses Hebrew string literals as lookup keys (e.g., `'טיוטה'`, `'מאושר'`). The labels themselves are already translated via `t()` — the issue is that the keys are Hebrew.

**Short-term (no change required now):** The Hebrew keys are only used for lookup, not displayed. This is acceptable as long as all status values originate from Hebrew-keyed database records.

**Long-term recommended solution:** Migrate status value storage to English enum keys (e.g., `'draft'`, `'pending_teacher'`, `'approved'`) and update the `statusMap` keys accordingly. Document as known technical debt.

---

### 4.3 CAT-4: Login Form — `src/components/auth/login-form.tsx`

**23 Hebrew lines — component is 100% hardcoded with no `useTranslations()` call.**

Add at component top:
```tsx
const t = useTranslations('Auth');
```

| Location | Current Hebrew | New i18n Key |
|---|---|---|
| `<CardTitle>` | `כניסה למערכת` | `Auth.title` |
| `<CardDescription>` | `התחבר לחשבונך כדי להמשיך` | `Auth.subtitle` |
| `<TabsTrigger>` | `אימייל וסיסמה` | `Auth.emailTab` |
| `<TabsTrigger>` | `קישור קסום` | `Auth.magicTab` |
| `<Label>` email | `אימייל` | `Auth.email` |
| `<Label>` password | `סיסמה` | `Auth.password` |
| Forgot password link | `שכחת סיסמה?` | `Auth.forgotPassword` |
| Button loading/idle | `מתחבר... / התחבר` | `Auth.loggingIn` / `Auth.login` |
| Magic link button | `שולח... / שלח קישור קסום` | `Auth.sending` / `Auth.sendMagicLink` |
| Social login label | `או התחבר עם` | `Auth.orContinueWith` |
| Register CTA | `אין לך חשבון?` | `Auth.noAccount` |
| Register link | `הרשם כאן` | `Auth.registerHere` |
| Toast: missing email | `אימייל חסר / יש להזין כתובת אימייל.` | `Auth.toast.missingEmailTitle` / `.Desc` |
| Toast: success | `התחברות מוצלחת / ברוך הבא, {name}!` | `Auth.toast.successTitle` / `.Desc` |
| Toast: pending | `חשבון ממתין לאישור / חשבונך עדיין לא אושר...` | `Auth.toast.pendingTitle` / `.Desc` |
| Toast: failed | `התחברות נכשלה / לא נמצא משתמש...` | `Auth.toast.failedTitle` / `.Desc` |
| Toast: magic link sent | `קישור קסום נשלח! / בדוק את תיבת הדואר...` | `Auth.toast.magicTitle` / `.Desc` |

---

### 4.4 CAT-5: Forms Components

#### 4.4.1 `src/components/forms/dynamic-form.tsx`

| Current Hebrew | New i18n Key |
|---|---|
| `'שדה זה הוא חובה.'` (Zod message) | `Forms.validation.required` |
| `'שדה חובה'` (Zod message) | `Forms.validation.required` |
| `"בחר..."` (SelectValue placeholder) | `Forms.validation.select` |
| `"הגש לאישור"` (Button) | `Forms.submitForApproval` |

#### 4.4.2 `src/components/forms/SignatureCanvas.tsx`

| Current Hebrew | New i18n Key |
|---|---|
| `"חתום/י כאן"` (placeholder text) | `Forms.signature.signHere` |
| `"נקה"` (clear button) | `Forms.signature.clear` |
| `"אשר חתימה"` (confirm button) | `Forms.signature.confirm` |

#### 4.4.3 `src/components/forms/new-form.tsx`

Already uses `useTranslations('NewForm')`. Will work once **CAT-1** adds the namespace. **No code changes needed — only JSON files.**

#### 4.4.4 `src/components/forms/exam-registration-form.tsx`

Already uses `useTranslations('NewForm')`. Requires additional keys in the `NewForm` namespace (all covered in §4.1.1 above):
- `NewForm.validation.requiredComposer`, `requiredTitle`, `invalidDuration`, `requiredGenre`
- `NewForm.validation.requiredInstrument`, `requiredLevel`, `requiredType`
- `NewForm.validation.minRepertoire`, `maxRepertoire`, `requiredDeclaration`
- `NewForm.compositionItem`, `deleteItem`, `composer`, `selectComposer`

#### 4.4.5 `src/components/forms/kenes-form.tsx` & `recital-form.tsx`

These forms contain Hebrew academic year formatting logic (`תשפ"...`) and hardcoded label maps. The academic year generation uses a Hebrew calendar formula — this should remain as data logic but all UI labels must be externalized:

- `kenes-form.tsx`: toast title `'טיוטה נשמרה!'` → `Forms.toast.draftSaved`
- `kenes-form.tsx`: size map (`'Small': 'קטנות'` etc.) → move to `Forms.sizes.small`, `.medium`, `.large`
- `recital-form.tsx`: school option label format → `Forms.schoolOption` template key

---

### 4.5 CAT-6: Dashboard Lyriosa Components (67 files)

This is the largest category. All components need:
1. `import { useTranslations } from 'next-intl';`
2. `const t = useTranslations('Namespace');`
3. All Hebrew literals replaced with `t('key')` calls
4. Zod schemas moved inside the component function body so `t()` is accessible at schema construction time

#### Component Group → Namespace Mapping

| Component Group | Files | Namespace | Approx. New Keys |
|---|---|---|---|
| Lesson Management | `book-lesson-wizard`, `reschedule-lesson-dialog`, `cancel-lesson-dialog`, `sick-leave-modal`, `lesson-detail-dialog` | `LessonManagement` (new) | ~60 |
| Teacher Management | `teacher-dashboard`, `teacher-profile-editor`, `teacher-reports-dashboard`, `teacher-payroll-view` | `TeacherDashboard` (new) | ~45 |
| Student Management | `student-profile-content`, `student-practice-panel`, `student-billing-dashboard`, `age-upgrade-modal` | `StudentDashboard` (new) | ~40 |
| Schedule & Availability | `schedule-calendar`, `availability-grid`, `master-schedule-calendar`, `admin-calendar-panel` | `ScheduleCalendar` (new) | ~50 |
| Forms & Approvals | `form-builder`, `announcement-composer`, `admin-command-center` | `FormBuilder` (new) | ~35 |
| Payments & Billing | `parent-payment-panel`, `manage-payment-method-dialog`, `pricing-settings`, `cancellation-policy-settings` | `PaymentComponents` (new) | ~40 |
| Notifications | `notification-preferences`, `notification-audit-log`, `parent-notification-panel` | `NotificationSettings` (new) | ~30 |
| Events & Performances | `event-form`, `event-details`, `performance-booking-dashboard`, `performance-profile-editor`, `sound-check-scheduler` | `EventManagement` (new) | ~45 |
| Learning & Practice | `lms-lesson-note-panel`, `practice-log-form`, `practice-coach`, `practice-video-upload-form`, `sheet-music-viewer` | `LearningManagement` (new) | ~40 |
| Admin Dashboards | `admin-makeup-dashboard`, `admin-payroll-panel`, `admin-reports-dashboard`, `admin-branches-dashboard`, `instrument-rental-dashboard`, `substitute-assignment-panel` | `AdminDashboard` (new) | ~70 |
| AI & Messaging | `ai-matchmaker-form`, `rescheduling-chat-widget`, `ai-alerts-card`, `messaging-interface`, `promote-slot-dialog` | `AIComponents` (new) | ~35 |
| Misc Dialogs & Widgets | `family-hub`, `assign-repertoire-dialog`, `assign-performer-dialog`, `assign-musician-dialog`, `room-management-dialog`, `exam-tracker-panel`, `send-quote-dialog`, `weekly-digest-card`, `today-snapshot-card`, `recent-announcements-card`, `key-metrics-bar` | `DashboardWidgets` (new) | ~60 |

#### Priority Sub-Specification: `book-lesson-wizard.tsx` (26 Hebrew lines)

| Current Hebrew | New Key |
|---|---|
| `"חובה לבחור תלמיד."` (Zod) | `LessonManagement.book.validation.student` |
| `"חובה לבחור כלי נגינה."` (Zod) | `LessonManagement.book.validation.instrument` |
| `"חובה לבחור מורה."` (Zod) | `LessonManagement.book.validation.teacher` |
| `"חובה לבחור שעה."` (Zod) | `LessonManagement.book.validation.time` |
| `"השיעור נקבע בהצלחה!"` (toast) | `LessonManagement.book.successTitle` |
| `"בחר ילד/ה..."` (placeholder) | `LessonManagement.book.selectStudent` |
| `"בחר כלי..."` (placeholder) | `LessonManagement.book.selectInstrument` |
| `"בחר מורה..."` (placeholder) | `LessonManagement.book.selectTeacher` |
| `"בחר אורך..."` (placeholder) | `LessonManagement.book.selectDuration` |
| `"30 דקות / 45 דקות / 60 דקות"` | `LessonManagement.book.duration30/45/60` |
| `"הזמן שיעור"` (submit button) | `LessonManagement.book.submit` |
| `"לא נמצאו שעות פנויות..."` (empty state) | `LessonManagement.book.noSlots` |
| `"אין חבילה פעילה"` (alert title) | `LessonManagement.book.noPackageTitle` |
| `"לא נמצאה חבילת שיעורים פעילה..."` (alert desc) | `LessonManagement.book.noPackageDesc` |

---

### 4.6 CAT-7: Public Lyriosa Components (`src/components/harmonia/`)

| Component | Hebrew Lines | Namespace |
|---|---|---|
| `ai-help-assistant.tsx` | 20 | `HelpAssistant` (extend existing) |
| `aid-application-wizard.tsx` | 38 | `AidApplication` (**new**) |
| `available-slots-marketplace.tsx` | 12 | `AvailableNow` (extend existing) |
| `donation-landing-page.tsx` | 35 | `DonatePage` (extend existing) |
| `help-center.tsx` | various | `HelpAssistant` (extend existing) |
| `musicians-for-hire.tsx` | various | `MusiciansForHire` (extend existing) |
| `open-day-landing.tsx` | 10 | `OpenDay` (extend existing) |
| `public-event-page.tsx` | 13 | `PublicEvents` (**new**) |
| `slot-promotion-card.tsx` | 12 | `AvailableNow` (extend existing) |
| `trial-booking-widget.tsx` | — | No code change — add `TrialBooking` JSON (CAT-1) |

---

### 4.7 CAT-8: App Pages (61 files in `src/app/[locale]/`)

Most app pages are thin wrappers rendering components. Hebrew in these files typically comes from:
- Page-level title/description text not delegated to a component
- Admin pages with inline table columns or filter options
- Validation schemas defined at page level

#### High-Priority App Pages

| Page | Hebrew Lines | Action |
|---|---|---|
| `dashboard/users/page.tsx` | **85** | Add `useTranslations('UsersPage')`; extract role labels, validation, toast strings |
| `dashboard/forms/[id]/page.tsx` | **58** | Add `useTranslations('FormsPage')`; extract form status labels and actions |
| `about/page.tsx` | **44** | Add `useTranslations('AboutPage')`; extract city geocoding label, contact label |
| `dashboard/teacher/student/[id]/page.tsx` | **49** | Extend `StudentDashboard` namespace |
| `dashboard/approvals/page.tsx` | **36** | Add `useTranslations('ApprovalsPage')`; extract all approval workflow labels |
| `dashboard/admin/scholarships/page.tsx` | **32** | Add `useTranslations('Scholarships')`; extract scholarship form labels |
| `contact/page.tsx` | **30** | Add `useTranslations('ContactPage')`; extract form labels |
| `dashboard/ministry-export/page.tsx` | 21 | Extend `Ministry` namespace |
| `dashboard/ministry/page.tsx` | 27 | Extend `Ministry` namespace |
| `dashboard/ai/page.tsx` | 18 | Add `AIPage` namespace |
| All remaining 51 app pages | ~500 total | Extend appropriate existing or new namespaces |

---

### 4.8 CAT-9 & CAT-10: Remaining Components

#### `src/components/enrollment/enrollment-wizard.tsx` (11 Hebrew lines)

This component already uses `useTranslations` with multiple namespaces. Remaining Hebrew is in `defaultValue` fallback props and a few inline strings:

- **Remove** all `defaultValue: 'Hebrew...'` from `t()` calls — these mask missing keys and prevent runtime errors from surfacing
- Add missing keys to `EnrollmentWizard` namespace: admin role label, `/חודש` suffix, final step button text

#### `src/components/dashboard/walkthrough-manager.tsx` (30 Hebrew lines)

The walkthrough uses driver.js and passes step descriptions as strings. These must be provided as translated strings:

- Add a `Walkthrough` namespace to all four message files
- Move all step `title` and `description` strings to `Walkthrough.steps.{stepId}.title` / `.description`
- In the component, call `useTranslations('Walkthrough')` and build the steps array using `t()`

---

## 5. Translation File Specifications

### 5.1 New Namespaces Required (add to all 4 files)

| Namespace | Approx. Keys | Status |
|---|---|---|
| `NewForm` | ~25 | 🔴 Missing — causes runtime errors |
| `TrialBooking` | ~22 | 🔴 Missing — causes runtime errors |
| `Auth` | ~20 | 🟠 New |
| `LessonManagement` | ~80 | 🟠 New |
| `TeacherDashboard` | ~55 | 🟠 New |
| `StudentDashboard` | ~50 | 🟠 New |
| `ScheduleCalendar` | ~55 | 🟠 New |
| `FormBuilder` | ~40 | 🟠 New |
| `PaymentComponents` | ~45 | 🟠 New |
| `NotificationSettings` | ~35 | 🟠 New |
| `EventManagement` | ~50 | 🟠 New |
| `LearningManagement` | ~45 | 🟠 New |
| `AdminDashboard` | ~80 | 🟠 New |
| `AIComponents` | ~40 | 🟠 New |
| `DashboardWidgets` | ~65 | 🟠 New |
| `AidApplication` | ~45 | 🟠 New |
| `PublicEvents` | ~20 | 🟠 New |
| `UsersPage` | ~30 | 🟠 New |
| `AboutPage` | ~15 | 🟠 New |
| `ApprovalsPage` | ~25 | 🟠 New |
| `Scholarships` | ~30 | 🟠 New |
| `ContactPage` | ~20 | 🟠 New |
| `AIPage` | ~20 | 🟠 New |
| `Walkthrough` | ~30 | 🟠 New |

**Total new keys across all 4 files: ~900+ keys per file**

### 5.2 Existing Namespaces Requiring Extension

| Existing Namespace | Extensions Needed |
|---|---|
| `Forms` | Add: `signature.signHere`, `signature.clear`, `signature.confirm`, `submitForApproval`, `validation.select`, `toast.draftSaved`, `sizes.small/medium/large`, `schoolOption` |
| `EnrollmentWizard` | Add: `adminRoleLabel`, `perMonth`, `finalStep` |
| `DonatePage` | Extend with all missing labels from `donation-landing-page.tsx` |
| `MusiciansForHire` | Extend with all missing labels from `musicians-for-hire.tsx` |
| `HelpAssistant` | Extend with `ai-help-assistant.tsx` and `help-center.tsx` missing labels |
| `AvailableNow` | Extend with `available-slots-marketplace.tsx` and `slot-promotion-card.tsx` labels |
| `OpenDay` | Extend with `open-day-landing.tsx` missing labels |
| `Navigation` | Add: `trialLesson` (already in HE, missing in EN/AR/RU) |
| `Ministry` | Extend with ministry-export page missing labels |
| `Payroll` | Extend with `teacher-payroll-view.tsx` and `admin-payroll-panel.tsx` labels |
| `Reports` | Extend with `academic-reports.tsx` labels |
| `AlumniPage` | Extend with `alumni-portal.tsx` labels |
| `MessagesPage` | Extend with `messaging-interface.tsx` labels |
| `StudentBilling` | Extend with `student-billing-dashboard.tsx` labels |
| `FormsPage` | Extend with `forms-list.tsx` and `forms/[id]/page.tsx` labels |

### 5.3 RTL Considerations for AR and HE

When adding Arabic translations, the following must be verified:

- **String interpolations** with names/numbers must work correctly in RTL context (e.g., `'ברוך הבא, {name}!'` — ensure the interpolation is RTL-safe)
- **Date/time formatting** in `t()` calls should use locale-aware formatters — `next-intl` provides `useFormatter()` for this
- **Currency formatting:** ₪ symbol placement differs by locale; use `useFormatter().number()` with `currency` option
- **City geocoding map** in `about/page.tsx` has both Hebrew and English city names as keys — this is acceptable as a data lookup table, not UI text

---

## 6. Implementation Plan

### 6.1 Phase Breakdown

| Phase | Scope | Priority | Est. Effort |
|---|---|---|---|
| **Phase 1** | CAT-1 (NewForm, TrialBooking namespaces) + CAT-3 (Combobox fix) — unblocks runtime errors | 🔴 CRITICAL | 0.5 day |
| **Phase 2** | CAT-4 (Login Form) + CAT-5 (Forms Components) — user-facing auth and forms | 🔴 HIGH | 1.5 days |
| **Phase 3** | CAT-7 (Public Lyriosa components) — public-facing marketing/booking pages | 🔴 HIGH | 1 day |
| **Phase 4** | CAT-8 high-priority app pages (users, approvals, about, contact, ministry) | 🔴 HIGH | 1.5 days |
| **Phase 5** | CAT-6 Part A: Lesson, Teacher, Student component groups | 🟠 MEDIUM | 2 days |
| **Phase 6** | CAT-6 Part B: Schedule, Payments, Notifications, Events | 🟠 MEDIUM | 2 days |
| **Phase 7** | CAT-6 Part C: Learning, Admin dashboards, AI, Widgets | 🟠 MEDIUM | 2 days |
| **Phase 8** | CAT-8 remaining 51 app pages | 🟠 MEDIUM | 2 days |
| **Phase 9** | CAT-9 (Enrollment) + CAT-10 (Walkthrough) + minor fixes | 🟡 LOW | 0.5 day |
| **Phase 10** | Full QA pass — language switcher test all 4 locales across all routes | ✅ REQUIRED | 1 day |

**Total estimated effort: ~14 developer days**

### 6.2 Developer Workflow for Each File

1. Open the component file and identify all Hebrew literals (search for Unicode range `[\u05D0-\u05EA]`)
2. Determine the appropriate namespace (check existing namespaces first; create new only if no logical home exists)
3. Add `useTranslations('Namespace')` to the component (or `await getTranslations()` in server components)
4. Replace each Hebrew literal with `t('key')` and add the key to `en.json` under the correct namespace
5. Add translations for the key in `he.json` (original Hebrew), `ar.json`, and `ru.json`
6. For Zod schemas: move schema creation **inside the component function body** so `t()` is accessible at schema construction time
7. Run the app with `locale=en` to verify all strings render in English
8. Run with `locale=ar` and `locale=ru` to verify correct strings and RTL layout

### 6.3 Tooling Recommendations

- **i18n-ally** VSCode extension — highlights untranslated strings and missing keys in-editor
- **grep scan:** `grep -r '[\u05D0-\u05EA]' src/ --include='*.tsx'` — quick scan to track remaining Hebrew
- **next-intl TypeScript strict mode** — enable to catch missing keys at compile time
- **Automated parity test:** add a Vitest test that imports all 4 message files and asserts key parity across all locales

---

## 7. Testing Requirements

### 7.1 Automated Tests

| Test | Description | Pass Criteria |
|---|---|---|
| Key Parity Test | Assert that all keys in `en.json` exist in `he.json`, `ar.json`, and `ru.json` | Zero missing keys across all files |
| No Hebrew in Components | grep scan for Hebrew unicode range in `src/components` and `src/app` (excl. `messages/`) | Zero matches |
| Namespace Existence Test | For each `useTranslations('X')` call, verify `X` exists in `en.json` | 100% namespace resolution |
| Combobox Prop Test | Assert Combobox renders no Hebrew text when no props passed | Renders empty string or generic placeholder |
| RTL Layout Test | Snapshot test for key pages in `he`/`ar` locales to verify layout direction | `dir=rtl` applied correctly |

### 7.2 Manual QA Checklist

- [ ] **Login page:** switch to EN → verify all labels in English; switch to AR → verify RTL layout; switch to RU → verify Russian
- [ ] **Book Lesson Wizard:** all 4 locales → placeholders, validation messages, toast notifications
- [ ] **Trial booking widget (`/try`):** all 4 locales → step titles, form labels, success state
- [ ] **New Form creation (`/dashboard/forms/new`):** all 4 locales → type selection, student selection
- [ ] **Dashboard navigation:** sidebar labels in all 4 locales
- [ ] **About page:** map labels in all 4 locales; city geocoding lookup works with non-Hebrew input
- [ ] **Instrument rental dashboard:** condition labels (`מצוין`, `טוב`, etc.) in all 4 locales
- [ ] **Exam tracker:** requirement descriptions translated or replaced with structured data format
- [ ] **Combobox dropdowns:** no Hebrew placeholder text visible in EN/AR/RU locales
- [ ] **Enrollment wizard:** all steps, validation messages, and final submit button in all 4 locales
- [ ] **Walkthrough tour:** all step titles and descriptions in all 4 locales
- [ ] **Toast notifications:** login toasts, save toasts, booking toasts — all 4 locales
- [ ] **Form validation errors:** required field messages, format errors — all 4 locales

---

## 8. Appendix — Complete File Inventory

Legend: `●` = New namespace needed &nbsp; `○` = Extend existing namespace

### `src/components/auth/`
- `●` `login-form.tsx` → Add `Auth` namespace

### `src/components/ui/`
- `○` `combobox.tsx` → Remove Hebrew defaults, require translated props from callers
- `○` `status-badge.tsx` → Document as known debt; migrate to English enum keys in future

### `src/components/forms/`
- `○` `dynamic-form.tsx` → Extend `Forms` namespace
- `○` `SignatureCanvas.tsx` → Extend `Forms.signature` namespace
- `○` `new-form.tsx` → No code change; add `NewForm` namespace to JSON files (CAT-1)
- `○` `exam-registration-form.tsx` → Extend `NewForm` namespace with validation keys
- `○` `kenes-form.tsx` → Extend `Forms` namespace with toast and label keys
- `○` `recital-form.tsx` → Extend `Forms` namespace with school option label
- `○` `save-status-bar.tsx` → Already partially translated; verify completion

### `src/components/enrollment/`
- `○` `enrollment-wizard.tsx` → Extend `EnrollmentWizard` namespace; remove `defaultValue` fallbacks

### `src/components/harmonia/` (public-facing)
- `○` `ai-help-assistant.tsx` → Extend `HelpAssistant` namespace
- `●` `aid-application-wizard.tsx` → New `AidApplication` namespace
- `○` `available-slots-marketplace.tsx` → Extend `AvailableNow` namespace
- `○` `donation-landing-page.tsx` → Extend `DonatePage` namespace
- `○` `help-center.tsx` → Extend `HelpAssistant` namespace
- `○` `musicians-for-hire.tsx` → Extend `MusiciansForHire` namespace
- `○` `open-day-landing.tsx` → Extend `OpenDay` namespace
- `●` `public-event-page.tsx` → New `PublicEvents` namespace
- `○` `slot-promotion-card.tsx` → Extend `AvailableNow` namespace
- `○` `trial-booking-widget.tsx` → No code change; add `TrialBooking` JSON (CAT-1)

### `src/components/dashboard/harmonia/` — Lesson & Schedule
- `●` `book-lesson-wizard.tsx` → New `LessonManagement` namespace
- `●` `reschedule-lesson-dialog.tsx` → Extend `LessonManagement`
- `●` `cancel-lesson-dialog.tsx` → Extend `LessonManagement`
- `●` `sick-leave-modal.tsx` → Extend `LessonManagement`
- `●` `lesson-detail-dialog.tsx` → Extend `LessonManagement`
- `●` `schedule-calendar.tsx` → New `ScheduleCalendar` namespace
- `●` `availability-grid.tsx` → Extend `ScheduleCalendar`
- `●` `master-schedule-calendar.tsx` → Extend `ScheduleCalendar`
- `●` `admin-calendar-panel.tsx` → Extend `ScheduleCalendar`

### `src/components/dashboard/harmonia/` — Teacher & Student
- `●` `teacher-dashboard.tsx` → New `TeacherDashboard` namespace
- `●` `teacher-profile-editor.tsx` → Extend `TeacherDashboard`
- `●` `teacher-reports-dashboard.tsx` → Extend `TeacherDashboard`
- `●` `teacher-payroll-view.tsx` → Extend `TeacherDashboard` / `Payroll`
- `●` `student-profile-content.tsx` → New `StudentDashboard` namespace
- `●` `student-practice-panel.tsx` → Extend `StudentDashboard`
- `●` `student-billing-dashboard.tsx` → Extend `StudentBilling` (existing)
- `●` `age-upgrade-modal.tsx` → Extend `StudentDashboard`

### `src/components/dashboard/harmonia/` — Admin & Finance
- `●` `admin-command-center.tsx` → New `AdminDashboard` namespace
- `●` `admin-makeup-dashboard.tsx` → Extend `AdminDashboard`
- `●` `admin-payroll-panel.tsx` → Extend `Payroll` (existing)
- `●` `admin-reports-dashboard.tsx` → Extend `Reports` (existing)
- `●` `admin-branches-dashboard.tsx` → Extend `Branches` (existing)
- `●` `admin-waitlist-dashboard.tsx` → Extend `Waitlist` (existing)
- `●` `instrument-rental-dashboard.tsx` → Extend `AdminDashboard`
- `●` `substitute-assignment-panel.tsx` → Extend `AdminDashboard`

### `src/components/dashboard/harmonia/` — Payments & Notifications
- `●` `parent-payment-panel.tsx` → New `PaymentComponents` namespace
- `●` `manage-payment-method-dialog.tsx` → Extend `PaymentComponents`
- `●` `pricing-settings.tsx` → Extend `PricingSettings` (existing)
- `●` `cancellation-policy-settings.tsx` → Extend `PaymentComponents`
- `●` `notification-preferences.tsx` → New `NotificationSettings` namespace
- `●` `notification-audit-log.tsx` → Extend `NotificationSettings`
- `●` `parent-notification-panel.tsx` → Extend `NotificationSettings`

### `src/components/dashboard/harmonia/` — Events & Learning
- `●` `event-form.tsx` → New `EventManagement` namespace
- `●` `event-details.tsx` → Extend `EventManagement`
- `●` `events-list.tsx` → Extend `EventManagement`
- `●` `performance-booking-dashboard.tsx` → Extend `EventManagement`
- `●` `performance-profile-editor.tsx` → Extend `EventManagement`
- `●` `sound-check-scheduler.tsx` → Extend `EventManagement`
- `●` `lms-lesson-note-panel.tsx` → New `LearningManagement` namespace
- `●` `practice-log-form.tsx` → Extend `LearningManagement`
- `●` `practice-coach.tsx` → Extend `LearningManagement`
- `●` `practice-video-upload-form.tsx` → Extend `LearningManagement`
- `●` `sheet-music-viewer.tsx` → Extend `LearningManagement`

### `src/components/dashboard/harmonia/` — Misc Dialogs & Widgets
- `●` `form-builder.tsx` → New `FormBuilder` namespace
- `●` `announcement-composer.tsx` → Extend `FormBuilder`
- `●` `ai-matchmaker-form.tsx` → New `AIComponents` namespace
- `●` `rescheduling-chat-widget.tsx` → Extend `AIComponents`
- `●` `ai-alerts-card.tsx` → Extend `AIComponents`
- `●` `messaging-interface.tsx` → Extend `MessagesPage` (existing)
- `●` `family-hub.tsx` → New `DashboardWidgets` namespace
- `●` `assign-repertoire-dialog.tsx` → Extend `DashboardWidgets`
- `●` `assign-performer-dialog.tsx` → Extend `DashboardWidgets`
- `●` `assign-musician-dialog.tsx` → Extend `DashboardWidgets`
- `●` `room-management-dialog.tsx` → Extend `DashboardWidgets`
- `●` `exam-tracker-panel.tsx` → Extend `DashboardWidgets`
- `●` `send-quote-dialog.tsx` → Extend `DashboardWidgets`
- `●` `promote-slot-dialog.tsx` → Extend `DashboardWidgets`
- `●` `weekly-digest-card.tsx` → Extend `DashboardWidgets`
- `●` `today-snapshot-card.tsx` → Extend `DashboardWidgets`
- `●` `recent-announcements-card.tsx` → Extend `DashboardWidgets`
- `●` `key-metrics-bar.tsx` → Extend `DashboardWidgets`
- `●` `academic-reports.tsx` → Extend `Reports` (existing)
- `●` `alumni-portal.tsx` → Extend `AlumniPage` (existing)

### `src/components/dashboard/` (top-level)
- `●` `walkthrough-manager.tsx` → New `Walkthrough` namespace
- `○` `forms-list.tsx` → Extend `FormsPage` (existing)
- `○` `admin/notifications/page.tsx` → Extend `NotificationSettings`

### `src/app/[locale]/` — High Priority Pages
- `●` `dashboard/users/page.tsx` (85 lines) → New `UsersPage` namespace
- `●` `dashboard/teacher/student/[id]/page.tsx` (49 lines) → Extend `StudentDashboard`
- `●` `dashboard/forms/[id]/page.tsx` (58 lines) → Extend `FormsPage`
- `●` `about/page.tsx` (44 lines) → New `AboutPage` namespace
- `●` `dashboard/approvals/page.tsx` (36 lines) → New `ApprovalsPage` namespace
- `●` `dashboard/admin/scholarships/page.tsx` (32 lines) → New `Scholarships` namespace
- `●` `contact/page.tsx` (30 lines) → New `ContactPage` namespace
- `●` `dashboard/ministry/page.tsx` (27 lines) → Extend `Ministry`
- `●` `dashboard/ministry-export/page.tsx` (21 lines) → Extend `Ministry`
- `●` `dashboard/ai/page.tsx` (18 lines) → New `AIPage` namespace
- `○` All remaining 51 pages with Hebrew → identify and extend/create namespaces accordingly

---

## 9. Summary

The Lyriosa platform has a fully functional i18n infrastructure but has not yet connected the majority of its UI components to that infrastructure. The issue is categorically a **missing migration step** — approximately 128 component and page files containing ~1,952 hardcoded Hebrew strings that bypass the `next-intl` translation system entirely.

The fix is well-defined and mechanical: for each file, identify Hebrew literals, assign them to an appropriate translation namespace, replace the literal with a `t('key')` call, and supply the translated string in all four message files. The two special structural issues (missing `NewForm`/`TrialBooking` namespaces and the Hebrew-defaulted `Combobox` primitive) must be addressed first as they currently cause runtime failures.

### Before / After

| Metric | Current State | Target State |
|---|---|---|
| Files with i18n coverage | 70 / 237 **(30%)** | 237 / 237 **(100%)** |
| Hardcoded Hebrew lines | ~1,952 | **0** |
| Missing namespaces | 2 (`NewForm`, `TrialBooking`) | **0** |
| Translation key count | ~891 keys × 4 files | **~1,800+ keys × 4 files** |
| Language switcher functional | Navigation only | **Full platform** |
| Estimated dev effort | — | **~14 days** |
