# SDD-FIX-04: Registration Enhancement — Instruments, Packages, Teacher Assignment & ID

**PDF Issues:** #5, #25, #26  
**Priority:** P0  
**Status:** 🆕 Net-new features + ✅ existing bugs

---

## 1. Overview

Six gaps in the registration system:
1. Admin registration does not auto-select the admin's conservatorium.
2. No settings screen to define which instruments a conservatorium offers.
3. Admin registration lacks teacher assignment or AI-suggestion.
4. No place for admin to define lesson packages.
5. ID number (ת"ז) is not mandatory in user records.
6. "Available Now" page layout issues and missing location-based filtering.

---

## 2. Auto-Select Conservatorium in Admin Registration

### Problem
When an Admin or Delegated Admin opens the "Register New Student" form, the conservatorium field is blank — the admin must search and select. This is redundant (admins only manage their own conservatorium) and error-prone.

### Fix

In the registration form component used by admins (`src/app/[locale]/dashboard/users/new/page.tsx` or `AdminRegisterForm.tsx`):

```tsx
const { user: adminUser } = useAuth();

// On mount, pre-populate conservatorium:
const [conservatoriumId, setConservatoriumId] = useState(
  adminUser.conservatoriumId  // pre-fill from admin's profile
);

// Render the conservatorium field as read-only for non-SITE_ADMIN:
{adminUser.role === 'SITE_ADMIN' ? (
  <ConservatoriumSelect value={conservatoriumId} onChange={setConservatoriumId} />
) : (
  <div className="p-3 bg-muted rounded-md text-sm">
    {adminUser.conservatoriumName}
    <input type="hidden" value={conservatoriumId} />
  </div>
)}
```

---

## 3. Conservatorium Instrument Settings

### 3.1 New Settings Screen

**Route:** `/dashboard/settings/instruments`  
**Access:** CONSERVATORIUM_ADMIN, DELEGATED_ADMIN (with permission)

**UI Layout:**
```
[+ Add Instrument]

┌──────────────────────────────────────────────────┐
│  Instrument     | Teachers  | Active | Actions   │
├─────────────────┴───────────┴────────┴───────────┤
│  פסנתר          | 3         | ✅     | Edit/Del  │
│  כינור          | 2         | ✅     | Edit/Del  │
│  חליל           | 1         | ✅     | Edit/Del  │
│  גיטרה          | 0         | ⚠️     | Edit/Del  │
└──────────────────────────────────────────────────┘
```

**Data model:**
```typescript
interface ConservatoriumInstrument {
  id: string;
  conservatoriumId: string;
  names: {
    he: string;
    en: string;
    ru?: string;
    ar?: string;
  };
  isActive: boolean;
  teacherCount: number; // derived field
  availableForRegistration: boolean;
  availableForRental: boolean;
}
```

**Add/Edit dialog fields:**
- Instrument name (Hebrew) — required
- Instrument name (English) — required  
- Instrument name (Russian) — optional
- Instrument name (Arabic) — optional
- Available in registration form — toggle
- Available for rental — toggle

### 3.2 Propagation

Once instruments are defined here:
- **Registration wizard** (public): shows only this conservatorium's active instruments in the "Instrument" step.
- **Teacher profile**: instruments dropdown limited to conservatorium's list.
- **Room assignment** (SDD-FIX-10): instrument taxonomy sourced from this list.
- **Available Now** page (issue #26): filters use this list.

### 3.3 Mock Data

Add to `useAuth.tsx` or `data.json`:
```json
"conservatoriumInstruments": [
  { "id": "piano", "conservatoriumId": "cons-1", "names": {"he": "פסנתר", "en": "Piano"}, "isActive": true },
  { "id": "violin", "conservatoriumId": "cons-1", "names": {"he": "כינור", "en": "Violin"}, "isActive": true },
  { "id": "flute", "conservatoriumId": "cons-1", "names": {"he": "חליל", "en": "Flute"}, "isActive": true },
  { "id": "guitar", "conservatoriumId": "cons-1", "names": {"he": "גיטרה", "en": "Guitar"}, "isActive": true },
  { "id": "cello", "conservatoriumId": "cons-1", "names": {"he": "צ'לו", "en": "Cello"}, "isActive": true },
  { "id": "drums", "conservatoriumId": "cons-1", "names": {"he": "תופים", "en": "Drums"}, "isActive": true },
  { "id": "saxophone", "conservatoriumId": "cons-1", "names": {"he": "סקסופון", "en": "Saxophone"}, "isActive": true },
  { "id": "clarinet", "conservatoriumId": "cons-1", "names": {"he": "קלרינט", "en": "Clarinet"}, "isActive": true }
]
```

---

## 4. Teacher Assignment in Admin Registration

### 4.1 Problem
Unlike the self-registration wizard (which has a Teacher Match step), the admin registration form has no way to assign a teacher to the new student.

### 4.2 Fix — Add Teacher Assignment Step

After personal details and instrument selection, add a "Teacher Assignment" step to the admin registration form:

```tsx
<div className="space-y-4">
  <Label>{t('AdminReg.assignTeacher')}</Label>
  
  {/* Manual selection */}
  <div className="space-y-2">
    <p className="text-sm font-medium">{t('AdminReg.manualAssign')}</p>
    <TeacherSelect
      conservatoriumId={conservatoriumId}
      instrument={selectedInstrument}
      value={selectedTeacherId}
      onChange={setSelectedTeacherId}
    />
  </div>
  
  <Separator />
  
  {/* AI suggestion */}
  <div className="space-y-2">
    <p className="text-sm font-medium">{t('AdminReg.aiSuggest')}</p>
    <p className="text-xs text-muted-foreground">{t('AdminReg.aiSuggestHint')}</p>
    
    {/* Day preference checkboxes */}
    <DayPreferenceSelector value={dayPrefs} onChange={setDayPrefs} />
    
    {/* Time range */}
    <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
    
    <Button
      variant="outline"
      onClick={runAiSuggestion}
      disabled={isLoadingSuggestion}
    >
      {isLoadingSuggestion ? <Loader2 className="animate-spin" /> : <Sparkles />}
      {t('AdminReg.getSuggestion')}
    </Button>
    
    {aiSuggestion && (
      <SuggestedTeacherCard
        teacher={aiSuggestion}
        onAccept={() => setSelectedTeacherId(aiSuggestion.id)}
      />
    )}
  </div>
</div>
```

**AI suggestion logic** (reuse existing `src/ai/flows/` flow or create new one):
```typescript
// src/ai/flows/suggest-teacher.ts
export async function suggestTeacher(params: {
  conservatoriumId: string;
  instrument: string;
  dayPreferences: number[];
  timeRange: { start: string; end: string };
}): Promise<Teacher | null> {
  // Find teachers who teach the instrument
  // Filter by availability matching day + time preferences
  // Return teacher with most matching slots and lowest current load
}
```

---

## 5. Package Management

### 5.1 New Settings Screen

**Route:** `/dashboard/settings/packages`  
**Access:** CONSERVATORIUM_ADMIN

**Package types:**
- Monthly subscription (X lessons per month)
- Semester package (Y lessons total)
- Single lesson (ad-hoc)
- Annual package

**Data model:**
```typescript
interface LessonPackage {
  id: string;
  conservatoriumId: string;
  names: { he: string; en: string; ru?: string; ar?: string };
  type: 'monthly' | 'semester' | 'annual' | 'single';
  lessonCount: number | null; // null = unlimited (monthly)
  durationMinutes: 30 | 45 | 60;
  priceILS: number;
  isActive: boolean;
  instruments?: string[]; // null/empty = applies to all instruments
  notes?: string;
}
```

**UI — Package list with add/edit:**
```
[+ Create Package]

┌──────────────────────────────────────────────────────────────────┐
│ Package Name     | Type      | Lessons | Duration | Price | Act │
├──────────────────┼───────────┼─────────┼──────────┼───────┼─────┤
│ מנוי חודשי        | Monthly   | 4/month | 45 min   | ₪500  | ✅  │
│ חבילת סמסטר      | Semester  | 16      | 45 min   | ₪1800 | ✅  │
│ שיעור בודד        | Single    | 1       | 45 min   | ₪150  | ✅  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Package Display in Registration

During registration, after the student selects an instrument and lesson duration, show available packages:

```tsx
<div className="space-y-3">
  <Label>{t('Reg.selectPackage')}</Label>
  {packages
    .filter(p => p.isActive && (!p.durationMinutes || p.durationMinutes === selectedDuration))
    .map(pkg => (
      <PackageCard
        key={pkg.id}
        package={pkg}
        selected={selectedPackageId === pkg.id}
        onSelect={() => setSelectedPackageId(pkg.id)}
      />
    ))}
</div>
```

---

## 6. Mandatory ID Number (ת.ז.)

### Problem
The ID field (`nationalId` / ת.ז.) is not validated as mandatory for any role. For legal compliance in Israel, it is required for all persons (students, parents, teachers, admins).

### Fix — Validation in All User Forms

**In user creation/registration forms:**
```typescript
// src/lib/validation/user-schema.ts
import { z } from 'zod';

const israeliIdRegex = /^\d{9}$/;

export const userBaseSchema = z.object({
  nationalId: z
    .string()
    .regex(israeliIdRegex, 'ID must be exactly 9 digits')
    .refine(validateIsraeliId, 'Invalid Israeli ID number'),
  // ... other fields
});

// Israeli ID checksum validation (Luhn-like):
function validateIsraeliId(id: string): boolean {
  if (id.length !== 9) return false;
  const digits = id.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let d = digits[i] * ((i % 2) + 1);
    if (d > 9) d -= 9;
    sum += d;
  }
  return sum % 10 === 0;
}
```

**UI — Add ID field to ALL forms where missing:**

Check and add to:
- `src/app/[locale]/register/` — public registration wizard
- `src/app/[locale]/dashboard/users/new/` — admin registration
- `src/components/dashboard/admin/UserEditDialog.tsx` — user edit

```tsx
<FormField
  control={form.control}
  name="nationalId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t('Common.nationalId')} *</FormLabel>
      <FormControl>
        <Input
          {...field}
          placeholder="000000000"
          maxLength={9}
          inputMode="numeric"
          pattern="\d{9}"
          dir="ltr"  // IDs are always LTR regardless of locale
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## 7. Issue #26 — Available Now: Layout & Location Filters

### Problem
The Available Now page is not centred, lacks city/distance filtering, and when filtered by a conservatorium only shows all instruments (not the admin-defined list).

### Fix

**A — Center the page layout:**
```tsx
// src/app/[locale]/available-now/page.tsx
<main className="container mx-auto max-w-5xl px-4 py-8">
```

**B — Add location filters (matching About Us page):**
```tsx
<div className="flex flex-wrap gap-3 mb-6">
  <CitySelect value={cityFilter} onChange={setCityFilter} />
  <DistanceSelect value={distanceFilter} onChange={setDistanceFilter} />
  <ConservatoriumSelect value={consFilter} onChange={setConsFilter} />
  <InstrumentSelect
    conservatoriumId={consFilter}  // filtered by selected conservatorium
    value={instrumentFilter}
    onChange={setInstrumentFilter}
  />
  <DurationSelect value={durationFilter} onChange={setDurationFilter} />
</div>
```

**C — Instrument filter respects conservatorium's configured instruments:**
When `consFilter` is set, `InstrumentSelect` fetches from `conservatoriumInstruments` where `conservatoriumId = consFilter`. Otherwise shows all instruments across the platform.

---

## 8. Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Admin opens "New Registration" form | Conservatorium pre-filled, read-only (unless SITE_ADMIN) |
| 2 | Admin navigates to Settings → Instruments | Instrument list screen renders with add/edit/delete |
| 3 | Admin adds instrument "Harp" in Hebrew + English | Instrument appears in registration wizard for that conservatorium |
| 4 | Admin registration — Teacher step | Manual select + AI suggest by day/time works |
| 5 | Admin navigates to Settings → Packages | Package management screen with create/edit |
| 6 | Public registration wizard reaches Package step | Shows only active packages for that conservatorium |
| 7 | Registration form submitted without ID | Validation error: "ID required" |
| 8 | Registration form submitted with invalid ID | Validation error: "Invalid Israeli ID" |
| 9 | Available Now page loads | Content centred, city/distance/instrument filters visible |
| 10 | Available Now — filter by conservatorium | Instrument dropdown shows only that conservatorium's instruments |
