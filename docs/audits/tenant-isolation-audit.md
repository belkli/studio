# Security Audit: Tenant Isolation Violations

**Date:** 2026-03-14
**Severity:** CRITICAL
**Status:** Open — must fix before any demo deployment

## Summary

**22 files, 37+ violations** where data is filtered by `role` only without checking `conservatoriumId`.
Any conservatorium admin can see ALL teachers/students/lessons across ALL 85 conservatoriums.

## The Fix Pattern

Every `users.filter(u => u.role === 'teacher')` must become:
```tsx
users.filter(u => u.role === 'teacher' && (
  u.conservatoriumId === user.conservatoriumId || user.role === 'site_admin'
))
```

## Violations by File

### A. Users filtered by role without tenant check (22 locations)

| File | Line | Code |
|------|------|------|
| academic-reports.tsx | 21 | `users.filter(u => u.role === 'student')` |
| academic-reports.tsx | 22 | `users.filter(u => u.role === 'teacher')` |
| admin-finance-dashboard.tsx | 35 | `users.filter(u => u.role === 'teacher')` |
| admin-finance-dashboard.tsx | 86 | `users.filter(u => u.role === 'student' && u.approved).length` |
| admin-makeup-dashboard.tsx | 114 | `users.filter(u => u.role === 'student' && u.approved)` |
| admin-payroll-panel.tsx | 104 | `users.filter(user => user.role === 'teacher')` |
| assign-musician-dialog.tsx | 28 | `users.filter(u => u.role === 'teacher' && ...)` |
| assign-performer-dialog.tsx | 40 | `users.filter(u => u.role === 'student' && u.approved)` |
| book-lesson-wizard.tsx | 211 | `users.filter(u => u.role === 'teacher' && u.availability)` |
| book-lesson-wizard.tsx | 464 | `users.filter(u => u.role === 'teacher')` |
| book-lesson-wizard.tsx | 576 | `users.filter(u => u.role === 'teacher').forEach(...)` |
| exam-tracker-panel.tsx | 75 | `users.filter(u => u.role === 'student')` |
| instrument-rental-dashboard.tsx | 54 | `users.filter(u => u.role === 'student' && u.approved)` |
| key-metrics-bar.tsx | 15 | `users.filter(u => u.role === 'student' && u.approved).length` |
| master-schedule-calendar.tsx | 59 | `users.filter(u => u.role === 'teacher')` |
| reports/academic-reports.tsx | 19 | `users.filter(u => u.role === 'student')` |
| reports/academic-reports.tsx | 20 | `users.filter(u => u.role === 'teacher')` |
| reports/financial-reports.tsx | 70 | `users.filter(u => u.role === 'teacher')` |
| reports/operational-reports.tsx | 17 | `users.filter(u => u.role === 'teacher')` |
| reports/teacher-reports.tsx | 16 | `users.filter(u => u.role === 'teacher')` |
| schedule-redesign.tsx | 57 | `users.filter(entry => entry.role === 'teacher')` |
| substitute-assignment-panel.tsx | 31 | `users.filter(u => u.role === 'teacher')` |

### B. Lessons filtered without tenant check (15 locations)

| File | Line | Issue |
|------|------|-------|
| admin-makeup-dashboard.tsx | 122,127 | lessons.filter without conservatorium |
| admin-payroll-panel.tsx | 107 | teacherLessons no conservatorium check |
| availability-grid.tsx | 41 | lessons by teacherId only |
| book-lesson-wizard.tsx | 224,523 | dayLessons no conservatorium |
| key-metrics-bar.tsx | 21 | lessonsThisWeek no conservatorium |
| master-schedule-calendar.tsx | 81 | lessons.filter no conservatorium |
| reports/financial-reports.tsx | 88 | lessons.filter no conservatorium |
| reports/operational-reports.tsx | 29-65 | 6 lesson filters no conservatorium |

### C. Files that DO filter correctly (for reference)

- admin-command-center.tsx — `u.conservatoriumId === user.conservatoriumId`
- admin-branches-dashboard.tsx — `b.conservatoriumId === user.conservatoriumId`
- forms-list.tsx — `f.conservatoriumId === user.conservatoriumId`
- alumni-portal.tsx — `item.conservatoriumId === user.conservatoriumId`

## Recommended Fix Strategy

Create a shared utility:
```tsx
// src/lib/tenant-filter.ts
export function tenantFilter<T extends { conservatoriumId?: string }>(
  items: T[],
  user: { conservatoriumId: string; role: string }
): T[] {
  if (user.role === 'site_admin' || user.role === 'ministry_director') return items;
  return items.filter(item => item.conservatoriumId === user.conservatoriumId);
}
```

Then replace all 37+ violations with:
```tsx
const teachers = tenantFilter(users, user).filter(u => u.role === 'teacher');
```
