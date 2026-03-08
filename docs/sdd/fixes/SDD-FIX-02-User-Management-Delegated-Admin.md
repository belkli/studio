# SDD-FIX-02: User Management — Delegated Admin Role & Edit Form Fixes

**PDF Issue:** #4  
**Priority:** P0  
**Status:** ✅ Page exists — role missing, edit forms incomplete

---

## 1. Overview

Four distinct problems in the Manage Users section:
1. **RTL title bug** — the page title/header is misaligned in Hebrew.
2. **Missing role: Delegated Admin** — a new role needed between Admin and Teacher, with configurable menu access.
3. **Teacher edit form** — does not show instruments the teacher teaches.
4. **Parent edit form** — does not allow linking parent ↔ students (manage kids).
5. **Student edit form** — shows teacher/duration info read-only; admin cannot add/remove teacher assignments.

---

## 2. RTL Title Fix

### Location
`src/app/[locale]/dashboard/users/page.tsx` and its heading component.

### Fix
```tsx
// Replace any hardcoded text-left or left-aligned title wrapper:
<div className="flex flex-col gap-1">
  <h1 className="text-2xl font-bold text-start">  {/* text-start = RTL-aware */}
    {t('ManageUsers.title')}
  </h1>
  <p className="text-muted-foreground text-start">
    {t('ManageUsers.subtitle')}
  </p>
</div>
```

Ensure the page's container does not apply `text-left` globally. If the users table has a fixed `dir="ltr"` ancestor, remove it.

---

## 3. New Role: Delegated Admin

### 3.1 Role Definition

```typescript
// src/lib/types.ts — add to UserRole enum:
export type UserRole =
  | 'SITE_ADMIN'
  | 'CONSERVATORIUM_ADMIN'
  | 'DELEGATED_ADMIN'     // ← NEW
  | 'TEACHER'
  | 'PARENT'
  | 'STUDENT_OVER_13'
  | 'STUDENT_UNDER_13';
```

### 3.2 Menu Permission Model

A `DELEGATED_ADMIN` can access any subset of the admin menu **except** document signing. The allowed sections are stored per-user in Firestore/mock data.

```typescript
// New type:
export interface DelegatedAdminPermissions {
  userId: string;
  allowedSections: AdminSection[];
}

export type AdminSection =
  | 'users'
  | 'registrations'
  | 'approvals'
  | 'announcements'
  | 'events'
  | 'scheduling'
  | 'rooms'
  | 'rentals'
  | 'scholarships'
  | 'donations'
  | 'reports'
  | 'payroll'
  | 'open-day'
  | 'performances'
  | 'alumni'
  | 'conservatorium-profile'
  // NOTE: 'sign-documents' is intentionally EXCLUDED — delegated admins may never sign
```

### 3.3 Data Model Extension

In mock data (`src/lib/mock-data.ts` or `useAuth.tsx`):
```typescript
// Add to User model:
delegatedAdminPermissions?: AdminSection[]; // only populated when role === 'DELEGATED_ADMIN'
```

### 3.4 Admin UI — Creating/Editing a Delegated Admin

When an Admin edits a user whose role is set to `DELEGATED_ADMIN`, a new section appears in the edit form: **"Menu Access"** — a checklist of all `AdminSection` values (human-readable labels).

```tsx
// In UserEditDialog.tsx:
{editingUser.role === 'DELEGATED_ADMIN' && (
  <div className="space-y-3">
    <Label>{t('ManageUsers.delegatedPermissions')}</Label>
    <p className="text-sm text-muted-foreground">
      {t('ManageUsers.delegatedPermissionsHint')}
    </p>
    {ALL_ADMIN_SECTIONS.map(section => (
      <div key={section} className="flex items-center gap-3">
        <Checkbox
          id={section}
          checked={permissions.includes(section)}
          onCheckedChange={(checked) => togglePermission(section, checked)}
        />
        <Label htmlFor={section} className="cursor-pointer">
          {t(`AdminSections.${section}`)}
        </Label>
      </div>
    ))}
    <p className="text-xs text-destructive">
      {t('ManageUsers.signDocumentsExcluded')}
    </p>
  </div>
)}
```

### 3.5 Navigation Guard for Delegated Admin

In the admin sidebar component, filter menu items based on role + permissions:

```tsx
// src/components/layout/admin-sidebar.tsx
const { user } = useAuth();

const visibleSections = useMemo(() => {
  if (user.role === 'CONSERVATORIUM_ADMIN' || user.role === 'SITE_ADMIN') {
    return ALL_ADMIN_SECTIONS;
  }
  if (user.role === 'DELEGATED_ADMIN') {
    return user.delegatedAdminPermissions ?? [];
  }
  return [];
}, [user]);

// Then filter the nav items array:
const navItems = ALL_NAV_ITEMS.filter(item =>
  visibleSections.includes(item.section)
);
```

---

## 4. Teacher Edit Form — Show Instruments

### Problem
When admin clicks "Edit" on a teacher user, the edit modal/form does not display or allow editing of the instruments the teacher teaches.

### Location
`src/components/dashboard/admin/UserEditDialog.tsx` (or similar).

### Fix

Add an `instruments` section to the teacher edit form. The list of available instruments comes from the conservatorium's defined instrument list (see SDD-FIX-04 for instrument settings).

```tsx
{editingUser.role === 'TEACHER' && (
  <div className="space-y-3">
    <Label>{t('ManageUsers.teacherInstruments')}</Label>
    <InstrumentMultiSelect
      conservatoriumId={editingUser.conservatoriumId}
      value={editingUser.instruments ?? []}
      onChange={(instruments) => updateField('instruments', instruments)}
    />
  </div>
)}
```

The `InstrumentMultiSelect` component:
- Fetches available instruments from `conservatorium.availableInstruments` (see SDD-FIX-04).
- Renders as a scrollable checklist with search.
- Saves selected instruments to `user.instruments: string[]`.

---

## 5. Parent Edit Form — Manage Kids (Link Students)

### Problem
When editing a parent user, there is no UI to connect or disconnect student profiles to/from the parent.

### Fix

Add a "Linked Students" section:

```tsx
{editingUser.role === 'PARENT' && (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <Label>{t('ManageUsers.linkedStudents')}</Label>
      <Button size="sm" variant="outline" onClick={() => setShowStudentPicker(true)}>
        {t('ManageUsers.addStudent')}
      </Button>
    </div>
    
    {/* Existing linked students */}
    {linkedStudents.map(student => (
      <div key={student.id} className="flex items-center justify-between p-2 border rounded">
        <span>{student.firstName} {student.lastName}</span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => unlinkStudent(student.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    ))}
    
    {linkedStudents.length === 0 && (
      <p className="text-sm text-muted-foreground">{t('ManageUsers.noLinkedStudents')}</p>
    )}
  </div>
)}
```

**Student picker dialog**: searchable list of all `STUDENT_*` users in the same conservatorium that do not yet have a parent assigned.

**Data updates on link/unlink**:
- `parent.childIds.push(studentId)`
- `student.parentId = parentId`

---

## 6. Student Edit Form — Full Teacher Management

### Problem
When editing a student, the admin can see teacher/duration but cannot add new teacher assignments or remove existing ones.

### Current State
The edit modal renders teacher info as read-only text.

### Fix

Replace read-only teacher display with a full editable `TeacherAssignmentList`:

```tsx
{(editingUser.role === 'STUDENT_OVER_13' || editingUser.role === 'STUDENT_UNDER_13') && (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <Label>{t('ManageUsers.teacherAssignments')}</Label>
      <Button size="sm" variant="outline" onClick={addTeacherAssignment}>
        {t('ManageUsers.addTeacher')}
      </Button>
    </div>
    
    {editingUser.teacherAssignments?.map((assignment, i) => (
      <TeacherAssignmentRow
        key={i}
        assignment={assignment}
        conservatoriumId={editingUser.conservatoriumId}
        onChange={(updated) => updateTeacherAssignment(i, updated)}
        onRemove={() => removeTeacherAssignment(i)}
      />
    ))}
  </div>
)}
```

**`TeacherAssignmentRow` fields:**
- Teacher (dropdown: teachers in same conservatorium)
- Instrument (dropdown: teacher's instruments)
- Duration (dropdown: 30 / 45 / 60 min)
- Day of week (dropdown)
- Time (time picker)

**Data model for assignment:**
```typescript
interface TeacherAssignment {
  teacherId: string;
  instrument: string;
  lessonDurationMinutes: 30 | 45 | 60;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string; // "HH:MM"
}
```

---

## 7. i18n Keys Required

Add to `src/messages/{locale}/ManageUsers.json`:
```json
{
  "title": "ניהול משתמשים",
  "subtitle": "ניהול משתמשים, הרשאות ובקשות הצטרפות.",
  "delegatedPermissions": "הרשאות תפריט",
  "delegatedPermissionsHint": "בחר אילו מדורים במערכת מנהל זה יכול לנהל.",
  "signDocumentsExcluded": "חתימה על מסמכים: לא זמין למנהל מאוחיין.",
  "teacherInstruments": "כלים שמלמד",
  "linkedStudents": "תלמידים מקושרים",
  "addStudent": "הוסף תלמיד",
  "noLinkedStudents": "אין תלמידים מקושרים.",
  "teacherAssignments": "שיוך מורים",
  "addTeacher": "הוסף מורה"
}
```

---

## 8. Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Admin opens Manage Users in Hebrew | Title and subtitle are right-aligned, no LTR bleed |
| 2 | Admin creates user with role = Delegated Admin | "Menu Access" checklist appears; "Sign Documents" is absent from list |
| 3 | Delegated Admin logs in | Only permitted sections appear in admin sidebar |
| 4 | Delegated Admin tries to navigate to `/admin/sign-documents` directly | Redirected to 403/dashboard |
| 5 | Admin edits a Teacher | Instruments section visible; can add/remove instruments |
| 6 | Admin edits a Parent | Linked Students section visible; can add/remove students |
| 7 | Admin edits a Student | Teacher assignments editable; can add, edit, remove |
| 8 | Removing a student link from parent | `student.parentId` cleared; `parent.childIds` updated |
