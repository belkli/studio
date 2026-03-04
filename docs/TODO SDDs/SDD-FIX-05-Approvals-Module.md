# SDD-FIX-05: Approvals Module — RTL, "For Your Treatment" Logic, Bulk Actions & i18n

**PDF Issue:** #6  
**Priority:** P0  
**Status:** ✅ Page exists — multiple bugs

---

## 1. Overview

Four bugs in the Approvals module:
1. **RTL layout issues** — table/header elements misaligned in Hebrew.
2. **"For Your Treatment" tab** shows nothing — items waiting for the current admin appear only under "All Open Items".
3. **Bulk (multiple) actions** are not working.
4. **Missing i18n key** — `Status.REVISION_REQUIRED` crashes in Hebrew locale.

---

## 2. RTL Layout Fix

### Location
`src/app/[locale]/dashboard/approvals/page.tsx` and table components.

### Common RTL Issues to Check

```tsx
// 1. Page header
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold text-start">{t('Approvals.title')}</h1>
    <p className="text-muted-foreground text-start">{t('Approvals.subtitle')}</p>
  </div>
</div>

// 2. Table column header alignment — use text-start not text-left
<TableHead className="text-start">{t('Approvals.col_student')}</TableHead>

// 3. Action buttons on table rows — in RTL, actions should be on the LEFT (inline-start)
<TableCell className="text-start">
  <div className="flex gap-2 justify-start">
    <ApproveButton />
    <RejectButton />
  </div>
</TableCell>

// 4. Status badge — ensure it renders inline, not block:
<Badge variant="outline" className="whitespace-nowrap">
  {t(`Status.${item.status}`)}
</Badge>
```

### Tabs RTL Fix

The tab list (`ממתינים לאישור` / `מאושרים`) must render right-to-left:
```tsx
<Tabs defaultValue="pending" dir={isRtl ? 'rtl' : 'ltr'}>
  <TabsList className="w-full">
    <TabsTrigger value="pending" className="flex-1">
      {t('Approvals.tab_pending')}
    </TabsTrigger>
    <TabsTrigger value="approved" className="flex-1">
      {t('Approvals.tab_approved')}
    </TabsTrigger>
  </TabsList>
```

---

## 3. "For Your Treatment" Tab Logic Fix

### Problem
The "בטיפולך" (For Your Treatment) sub-tab/filter shows no items, while "כל הפניות הפתוחות" (All Open Items) shows everything including items awaiting the current admin.

### Root Cause
The filter logic for "For Your Treatment" is either:
a) Matching on the wrong field (e.g., `assignedTo` vs `pendingApprovalBy`), or
b) Not populated at all in mock data.

### Fix — Filter Logic

```typescript
// Approvals page filter:
const forYourTreatment = approvals.filter(item => {
  const currentUserId = authUser.id;
  const currentUserRole = authUser.role;
  
  // An item is "for your treatment" if:
  // 1. It's in PENDING status AND
  // 2. It requires action from the current user's role or is directly assigned
  
  if (item.status !== 'PENDING' && item.status !== 'REVISION_REQUIRED') return false;
  
  // Direct assignment
  if (item.assignedToUserId === currentUserId) return true;
  
  // Role-based assignment (unassigned items for admins)
  if (
    (currentUserRole === 'CONSERVATORIUM_ADMIN' || currentUserRole === 'DELEGATED_ADMIN') &&
    item.requiredApproverRole === 'CONSERVATORIUM_ADMIN' &&
    !item.assignedToUserId
  ) return true;
  
  return false;
});
```

### Mock Data Fix

Ensure mock approval items have the `requiredApproverRole` field:
```json
{
  "id": "approval-1",
  "type": "recital_form",
  "status": "PENDING",
  "studentId": "student-1",
  "submittedAt": "2026-02-01",
  "requiredApproverRole": "CONSERVATORIUM_ADMIN",
  "assignedToUserId": null,
  "conservatoriumId": "cons-1"
}
```

---

## 4. Bulk (Multiple) Actions Fix

### Problem
The "Multiple Actions" (`פעולות מרובות`) button/feature does not work — selecting multiple rows and applying an action has no effect.

### Root Cause Analysis

Check `src/app/[locale]/dashboard/approvals/page.tsx`:

```typescript
// Likely bug: selectedIds state not being read by action handler
const [selectedIds, setSelectedIds] = useState<string[]>([]);

// Incorrect (action ignores selectedIds):
const handleBulkAction = (action: string) => {
  // Bug: operates on a single item or does nothing
  console.log('action', action);
};

// Fix:
const handleBulkAction = async (action: 'approve' | 'reject' | 'request_revision') => {
  if (selectedIds.length === 0) {
    toast({ description: t('Approvals.selectItemsFirst'), variant: 'destructive' });
    return;
  }
  
  // Apply action to each selected item
  for (const id of selectedIds) {
    await updateApprovalStatus(id, action);
  }
  
  setSelectedIds([]);
  toast({ description: t('Approvals.bulkActionSuccess', { count: selectedIds.length }) });
};
```

### Checkbox Selection Logic

Ensure the row checkbox properly updates `selectedIds`:

```tsx
<Checkbox
  checked={selectedIds.includes(item.id)}
  onCheckedChange={(checked) => {
    setSelectedIds(prev =>
      checked
        ? [...prev, item.id]
        : prev.filter(id => id !== item.id)
    );
  }}
/>
```

Select-all checkbox:
```tsx
<Checkbox
  checked={selectedIds.length === currentPageItems.length && currentPageItems.length > 0}
  onCheckedChange={(checked) => {
    setSelectedIds(checked ? currentPageItems.map(i => i.id) : []);
  }}
/>
```

### Bulk Actions Toolbar

Show a contextual toolbar when items are selected:

```tsx
{selectedIds.length > 0 && (
  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-4 animate-in slide-in-from-top-2">
    <span className="text-sm font-medium">
      {t('Approvals.selectedCount', { count: selectedIds.length })}
    </span>
    <div className="flex gap-2 ms-auto">
      <Button size="sm" variant="default" onClick={() => handleBulkAction('approve')}>
        <Check className="h-4 w-4 me-1" />
        {t('Approvals.approve')}
      </Button>
      <Button size="sm" variant="outline" onClick={() => handleBulkAction('request_revision')}>
        <RotateCcw className="h-4 w-4 me-1" />
        {t('Approvals.requestRevision')}
      </Button>
      <Button size="sm" variant="destructive" onClick={() => handleBulkAction('reject')}>
        <X className="h-4 w-4 me-1" />
        {t('Approvals.reject')}
      </Button>
    </div>
  </div>
)}
```

---

## 5. Missing i18n Key Fix

### Error
`MISSING_MESSAGE: Could not resolve 'Status.REVISION_REQUIRED' in messages for locale 'he'`

### Fix — Add to ALL locale files

Using the NodeJS translation script (see SDD-FIX-16), add to `src/messages/he/common.json`:

```json
{
  "Status": {
    "PENDING": "ממתין לאישור",
    "APPROVED": "מאושר",
    "REJECTED": "נדחה",
    "REVISION_REQUIRED": "נדרש תיקון",
    "DRAFT": "טיוטה",
    "CANCELLED": "בוטל",
    "COMPLETED": "הושלם",
    "WAITING_FOR_ADMIN": "ממתין למנהל",
    "WAITING_FOR_TEACHER": "ממתין למורה",
    "WAITING_FOR_PARENT": "ממתין להורה",
    "WAITING_FOR_STUDENT": "ממתין לתלמיד"
  }
}
```

And equivalent entries in `en/`, `ru/`, `ar/`.

---

## 6. Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Open Approvals in Hebrew | Page title right-aligned, table columns RTL, status badges inline |
| 2 | Click "בטיפולך" tab | Items requiring current admin action appear |
| 3 | "All Open Items" tab | Shows all pending regardless of assignee |
| 4 | Select 2 items via checkbox | Bulk actions toolbar appears with count |
| 5 | Click "Approve" in bulk toolbar | Both items move to Approved; toast confirms "2 items approved" |
| 6 | Select-all checkbox | Selects all items on current page |
| 7 | Form with REVISION_REQUIRED status | Renders "נדרש תיקון" badge — no console error |
| 8 | Deselect items | Bulk toolbar disappears |
