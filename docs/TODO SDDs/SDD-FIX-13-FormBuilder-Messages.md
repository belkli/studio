# SDD-FIX-13: Form Builder Enhancement & Messages — New Conversation

**PDF Issues:** #16, #17  
**Priority:** P0

---

## 1. Form Builder Enhancement (Issue #16)

### Problem
The current form builder cannot create forms as complex as the recital form (which has conditional fields, multiple sections, file uploads, e-signatures). Forms submitted through approvals are visible there but not in the Forms section.

---

## 1.1 Forms Visibility Fix

### Problem
In the Forms section (`/dashboard/forms`), submitted forms do not appear — but they do appear in Approvals. The two views use different data sources or filters.

### Root Cause
Check `src/app/[locale]/dashboard/forms/page.tsx`:

```typescript
// Bug: filtering only forms with status === 'draft'
const forms = allForms.filter(f => f.status === 'draft');

// Fix: show all forms for the current user/admin:
const forms = allForms.filter(f => {
  if (authUser.role === 'CONSERVATORIUM_ADMIN') {
    return f.conservatoriumId === authUser.conservatoriumId;
  }
  if (authUser.role === 'TEACHER') {
    return f.teacherId === authUser.id || f.assignedToTeacherId === authUser.id;
  }
  if (authUser.role === 'STUDENT_OVER_13' || authUser.role === 'PARENT') {
    return f.submittedByUserId === authUser.id || f.studentId === authUser.studentId;
  }
  return false;
});
```

---

## 1.2 Form Builder — Extended Field Types

Add the following field types to the dynamic form builder:

```typescript
type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'           // single select
  | 'multiselect'      // multiple select
  | 'checkbox'         // boolean
  | 'checkbox_group'   // multiple checkboxes
  | 'radio'            // single choice radio
  | 'file_upload'      // document/image upload
  | 'signature'        // e-signature pad
  | 'composer_select'  // special: composer + composition combined
  | 'teacher_select'   // special: teacher from conservatorium
  | 'instrument_select'// special: instrument from conservatorium list
  | 'separator'        // visual divider
  | 'heading'          // section heading
  | 'info_text'        // read-only informational block
  | 'conditional_group';// group that shows/hides based on another field
```

### Conditional Logic

```typescript
interface FormField {
  id: string;
  type: FormFieldType;
  label: { he: string; en: string };
  required: boolean;
  order: number;
  
  // For select/radio/checkbox_group:
  options?: { value: string; label: { he: string; en: string } }[];
  
  // Conditional visibility:
  showIf?: {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_empty';
    value: string | boolean;
  };
  
  // Validation:
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
}
```

### Recital Form Template

Pre-built template that reproduces the existing recital form using the builder:

```typescript
const RECITAL_FORM_TEMPLATE: FormField[] = [
  { id: 'student_details', type: 'heading', label: { he: 'פרטי התלמיד/ה', en: 'Student Details' }, order: 1 },
  { id: 'student_name', type: 'text', label: { he: 'שם מלא', en: 'Full Name' }, required: true, order: 2 },
  { id: 'grade', type: 'select', label: { he: 'כיתה', en: 'Grade' }, required: true, order: 3,
    options: [{ value: '1', label: { he: 'א\'', en: '1st' }}, /* ... */] },
  { id: 'is_music_major', type: 'checkbox', label: { he: 'משתתפ/ת במגמה', en: 'Music Major' }, required: false, order: 4 },
  { id: 'in_music_stream', type: 'checkbox', label: { he: 'במגמת מוזיקה', en: 'Music Stream' }, required: false, order: 5 },
  
  { id: 'instrument_section', type: 'heading', label: { he: 'פרטי כלי הנגינה', en: 'Instrument Details' }, order: 10 },
  { id: 'instrument', type: 'instrument_select', label: { he: 'כלי נגינה', en: 'Instrument' }, required: true, order: 11 },
  { id: 'teacher', type: 'teacher_select', label: { he: 'שם המורה', en: 'Teacher' }, required: true, order: 12 },
  { id: 'years_with_teacher', type: 'number', label: { he: 'שנות לימוד עם המורה', en: 'Years with Teacher' }, required: true, order: 13,
    validation: { min: 0, max: 30 } },
  { id: 'total_years', type: 'number', label: { he: 'שנות לימוד', en: 'Years of Study' }, required: true, order: 14 },
  
  { id: 'repertoire_section', type: 'heading', label: { he: 'רפרטואר', en: 'Repertoire' }, order: 20 },
  { id: 'repertoire_items', type: 'multiselect', label: { he: 'יצירות', en: 'Pieces' }, required: true, order: 21 },
  // Note: repertoire is dynamically built using composer_select rows — implement as repeatable group
  
  { id: 'signature', type: 'signature', label: { he: 'חתימה', en: 'Signature' }, required: true, order: 30 },
];
```

---

## 2. Messages — New Conversation Ability (Issue #17)

### Problem
If a user (teacher, parent, student) hasn't received a message yet, the Messages section is empty with no way to compose a new message. The "Compose" or "New Message" button is missing.

### Fix

**Add "New Message" button to messages page header:**

```tsx
// src/app/[locale]/dashboard/messages/page.tsx
<div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-bold text-start">{t('Messages.title')}</h1>
  <div className="flex gap-2">
    <Button onClick={() => setShowNewMessage(true)}>
      <PenSquare className="h-4 w-4 me-2" />
      {t('Messages.newMessage')}
    </Button>
    {/* For teachers: */}
    {authUser.role === 'TEACHER' && (
      <Button variant="outline" onClick={() => setShowNewGroup(true)}>
        <Users className="h-4 w-4 me-2" />
        {t('Messages.newGroup')}
      </Button>
    )}
  </div>
</div>
```

**New Message Dialog:**
```tsx
<Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{t('Messages.composeTitle')}</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <UserSearchSelect
        label={t('Messages.to')}
        value={recipient}
        onChange={setRecipient}
        scope={getMessageableUsers(authUser)} // teachers can message their students, admins can message all
      />
      <Textarea
        placeholder={t('Messages.messagePlaceholder')}
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        rows={4}
      />
    </div>
    <DialogFooter>
      <Button onClick={sendNewMessage} disabled={!recipient || !messageText.trim()}>
        {t('Messages.send')}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**New Group Dialog (teachers only):**
```tsx
<Dialog open={showNewGroup}>
  <DialogContent>
    <DialogTitle>{t('Messages.createGroup')}</DialogTitle>
    <Input placeholder={t('Messages.groupName')} value={groupName} onChange={...} />
    <UserMultiSelect
      label={t('Messages.addMembers')}
      value={groupMembers}
      onChange={setGroupMembers}
      scope="my_students"  // teacher can only add their own students/parents
    />
    <Button onClick={createGroup}>{t('Messages.create')}</Button>
  </DialogContent>
</Dialog>
```

**Empty state fix:**
```tsx
{conversations.length === 0 && (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="font-semibold mb-2">{t('Messages.noMessages')}</h3>
    <p className="text-muted-foreground mb-4">{t('Messages.noMessagesHint')}</p>
    <Button onClick={() => setShowNewMessage(true)}>
      {t('Messages.startConversation')}
    </Button>
  </div>
)}
```

---

## Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Admin opens Forms section | All submitted forms visible (not just drafts) |
| 2 | Form builder — add "signature" field type | Signature pad renders in form preview |
| 3 | Form builder — add conditional field | Field appears/disappears based on trigger field value |
| 4 | Recital form template available | Can be selected as starting template |
| 5 | Teacher opens Messages with 0 conversations | Empty state with "Start Conversation" button |
| 6 | Teacher clicks "New Message" | Dialog opens with user search |
| 7 | Teacher clicks "New Group" | Group creation dialog with student multi-select |
| 8 | Message sent to student | Appears in both teacher's and student's conversation list |
