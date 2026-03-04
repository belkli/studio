# SDD-FIX-03: UI Micro-Fixes — Announcements, Form Checkboxes & Composer Translation

**PDF Issues:** #3, #7, #18  
**Priority:** P1  
**Status:** ✅ Components exist — layout/translation bugs

---

## 1. Issue #3 — Announcements: Checkbox Spacing

### Problem
In the Announcements send form, the checkboxes for delivery channels (App notification, Email, SMS) render with labels immediately touching the checkbox — no gap.

### Location
`src/app/[locale]/dashboard/announcements/page.tsx` or `AnnouncementForm.tsx`.

### Fix
Find the checkbox group for delivery channels. Ensure each item uses the shadcn pattern with proper gap:

```tsx
// WRONG (likely current):
<div className="flex items-center">
  <Checkbox id="email" />
  <Label htmlFor="email">אימייל</Label>
</div>

// CORRECT:
<div className="flex items-center gap-2.5">   {/* gap-2.5 = 10px */}
  <Checkbox id="email" />
  <Label htmlFor="email" className="cursor-pointer leading-none">
    {t('Announcements.channelEmail')}
  </Label>
</div>
```

Apply the same `gap-2.5` fix to ALL checkbox groups in the file. Also ensure the channel checkboxes container has `space-y-3` between items:

```tsx
<div className="space-y-3">
  {DELIVERY_CHANNELS.map(channel => (
    <div key={channel.id} className="flex items-center gap-2.5">
      <Checkbox
        id={channel.id}
        checked={selectedChannels.includes(channel.id)}
        onCheckedChange={...}
      />
      <Label htmlFor={channel.id} className="cursor-pointer">
        {t(`Announcements.channel_${channel.id}`)}
      </Label>
    </div>
  ))}
</div>
```

---

## 2. Issue #7 — Form Editing: School Details Checkboxes Not Aligned

### Problem
In the student form editing view (recital/ministry form), the "School Details" section has two checkboxes (`משתתפ/ת במגמה` and `במגמת מוזיקה`) that are misaligned — likely one is offset or has incorrect margin.

### Location
`src/components/forms/FormView.tsx` or the recital form component.

### Fix
Ensure both checkboxes are inside a consistent flex container:

```tsx
// School details section checkboxes:
<div className="grid grid-cols-2 gap-4">
  <div className="flex items-center gap-2.5">
    <Checkbox id="musicMajor" checked={form.isMusicMajor} onCheckedChange={...} />
    <Label htmlFor="musicMajor">{t('Forms.isMusicMajor')}</Label>
  </div>
  <div className="flex items-center gap-2.5">
    <Checkbox id="musicStream" checked={form.inMusicStream} onCheckedChange={...} />
    <Label htmlFor="musicStream">{t('Forms.inMusicStream')}</Label>
  </div>
</div>
```

The key fix is `items-center` on the flex container — without it, the checkbox and label have different baseline alignments when the label wraps.

---

## 3. Issue #7 & #18 — Composer/Composition Selection Empty + Not Translated

### Problem
When editing a recital/ministry form, the "Composer" dropdown shows nothing even when a composer is selected. Additionally, composer and composition names are not translated (shown in their original language regardless of UI locale).

### Root Cause Analysis

**A) Selection appears empty:**
The composer data likely uses an `id` field for value binding, but the dropdown renders `label` — and the binding is using the wrong field. 

Find the composer select component. Check:
```tsx
// Likely bug:
<Select value={form.composerId}>
  <SelectTrigger>{/* shows nothing because value doesn't match displayed text */}</SelectTrigger>
  <SelectContent>
    {composers.map(c => (
      <SelectItem key={c.id} value={c.name}> {/* value=name but form stores id */}
        {c.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// Fix — be consistent: store id, display name:
<Select value={form.composerId} onValueChange={(id) => setComposerId(id)}>
  <SelectContent>
    {composers.map(c => (
      <SelectItem key={c.id} value={c.id}>  {/* value=id */}
        {getComposerDisplayName(c, locale)}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**B) Composer/Composition names not translated:**

Add a `translations` map to the composer data model:

```typescript
interface Composer {
  id: string;
  names: {
    he: string;
    en: string;
    ru?: string;
    ar?: string;
  };
}

interface Composition {
  id: string;
  composerId: string;
  titles: {
    he: string;
    en: string;
    ru?: string;
    ar?: string;
  };
}

// Helper:
function getComposerDisplayName(composer: Composer, locale: string): string {
  return composer.names[locale] ?? composer.names.en ?? composer.names.he;
}
```

Update mock data (in `useAuth.tsx` or `data.json`) to include both `he` and `en` entries for all composers. Standard classical composers:
```json
{
  "id": "beethoven",
  "names": { "he": "בטהובן", "en": "Beethoven", "ru": "Бетховен" }
},
{
  "id": "mozart",
  "names": { "he": "מוצרט", "en": "Mozart", "ru": "Моцарт" }
},
{
  "id": "bach",
  "names": { "he": "באך", "en": "Bach", "ru": "Бах" }
},
{
  "id": "chopin",
  "names": { "he": "שופן", "en": "Chopin", "ru": "Шопен" }
},
{
  "id": "brahms",
  "names": { "he": "ברהמס", "en": "Brahms", "ru": "Брамс" }
},
{
  "id": "handel",
  "names": { "he": "הנדל", "en": "Handel", "ru": "Гендель" }
},
{
  "id": "schumann",
  "names": { "he": "שומן", "en": "Schumann", "ru": "Шуман" }
}
```

**C) Composition select depends on composer select:**
The composition dropdown must be disabled until a composer is selected, then populate only compositions by that composer:

```tsx
<Select
  value={form.compositionId}
  onValueChange={(id) => setCompositionId(id)}
  disabled={!form.composerId}
>
  <SelectContent>
    {compositions
      .filter(c => c.composerId === form.composerId)
      .map(c => (
        <SelectItem key={c.id} value={c.id}>
          {getCompositionTitle(c, locale)}
        </SelectItem>
      ))}
  </SelectContent>
</Select>
```

**D) Missing i18n key for `Status.REVISION_REQUIRED`** (also mentioned in issue #6):

```
// src/messages/he/common.json (or Status.json):
{
  "Status": {
    "REVISION_REQUIRED": "נדרש תיקון",
    "PENDING": "ממתין לאישור",
    "APPROVED": "מאושר",
    "REJECTED": "נדחה",
    "DRAFT": "טיוטה"
  }
}
```

---

## 4. Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Open Announcements form | Checkboxes have visible gap from labels (≥8px) |
| 2 | Send announcement | All channel checkboxes operable, labels clearly associated |
| 3 | Open form edit, School Details section | Both checkboxes vertically centered with their labels |
| 4 | Select a composer in form | Dropdown shows composer name in current locale |
| 5 | Composer selected → open Composition dropdown | Only compositions by that composer appear; names translated |
| 6 | Switch locale to English while form open | Composer and composition names change to English |
| 7 | Status badge shows `REVISION_REQUIRED` | Renders "נדרש תיקון" in Hebrew, not raw key |
