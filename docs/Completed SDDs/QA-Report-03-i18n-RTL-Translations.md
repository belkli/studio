# QA Report — Part 3: Internationalization, RTL & Translation Issues

---

## Overview

| Locale | Total Keys | Missing Keys | Status |
|--------|-----------|-------------|--------|
| Hebrew (he) | 2,618 | 0 | ✅ Complete (source) |
| English (en) | 2,563 | 0 | ✅ Complete |
| Arabic (ar) | 2,597 | **13** | ⚠️ Mostly complete |
| Russian (ru) | 1,545 | **1,063** | 🔴 ~41% missing |

---

## CRITICAL — I18N-01: Russian Locale Missing 1,063 Translation Keys (41%)

**Severity:** 🔴 Critical  
**File:** `src/messages/ru.json`

**Issue:**  
The Russian locale is missing an entire 41% of translation keys. **23 complete feature sections** have zero Russian translations. Users who switch to Russian will see broken UI with raw translation key identifiers (e.g., `AcademicReports.avgMinutesTitle`) instead of text.

**Missing sections in Russian:**
```
AcademicReports, AdminCalendarPanel, AdminMakeupDashboard, AnnouncementComposer,
ApprovalsPage, CancellationPolicySettings, CoordinatorInvite, EventDetails,
EventForm, FormBuilder, NotificationAuditLog, ParentNotificationPanel, ParentPayment,
PerformanceBooking, PerformanceProfileEditor, PracticeLogForm, RoomManagementDialog,
SheetMusicViewer, SickLeaveModal, SubstituteAssignmentPanel, TeacherPayroll,
TeacherReports, WeeklyDigestCard
```

**Fix:**  
Add all missing keys to `src/messages/ru.json`. Here is a sample of the required additions (the full set of 1,063 keys must be translated):

```json
// src/messages/ru.json — ADD these top-level sections:
{
  "AcademicReports": {
    "avgMinutesTitle": "Среднее время занятий",
    "avgMinutesDesc": "Среднее количество минут в неделю",
    "avgMinutesProp": "Среднее",
    "chartInstrumentTitle": "Занятия по инструментам",
    "chartTeacherTitle": "Занятия по преподавателям",
    "colStudent": "Ученик",
    "colTeacher": "Преподаватель",
    "colTotalMinutes": "Итого минут",
    "engagementRateTitle": "Уровень вовлеченности",
    "engagementRateDesc": "% учеников с практикой на этой неделе",
    "lowEngagementTitle": "Низкая вовлеченность",
    "lowEngagementDesc": "Ученики без практики более 7 дней",
    "minutesUnit": "мин",
    "repertoireTitle": "Репертуар",
    "repertoireDesc": "Общее количество произведений в репертуаре",
    "tooltipAvgMinutes": "Среднее время",
    "tooltipEngagement": "Вовлеченность"
  },
  "TeacherPayroll": {
    // ... (all keys from en.json TeacherPayroll section)
  }
  // ... all 23 missing sections
}
```

**Interim fix** — add a fallback to Hebrew/English for missing keys in `src/i18n/request.ts`:

```ts
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;
    if (!locale || !routing.locales.includes(locale as any)) {
        locale = routing.defaultLocale;
    }
    
    const messages = (await import(`../messages/${locale}.json`)).default;
    
    // Fallback to English for missing keys
    const fallbackMessages = (await import('../messages/en.json')).default;
    
    return {
        locale,
        messages: deepMerge(fallbackMessages, messages), // fallback to EN
    };
});

function deepMerge(base: any, override: any): any {
    const result = { ...base };
    for (const key of Object.keys(override)) {
        if (typeof override[key] === 'object' && !Array.isArray(override[key])) {
            result[key] = deepMerge(base[key] || {}, override[key]);
        } else {
            result[key] = override[key];
        }
    }
    return result;
}
```

---

## HIGH — I18N-02: Arabic Locale Missing 13 PlayingSchool Keys

**Severity:** 🟠 High  
**File:** `src/messages/ar.json`

**Issue:**  
The Arabic locale is missing 13 keys all within the `PlayingSchool.finder` and `PlayingSchool.wizard` sections:

```
PlayingSchool.finder.allInstruments
PlayingSchool.finder.filterByInstrument
PlayingSchool.finder.instruments.cello
PlayingSchool.finder.instruments.drums
PlayingSchool.finder.instruments.flute
PlayingSchool.finder.instruments.guitar
PlayingSchool.finder.instruments.piano
PlayingSchool.finder.instruments.violin
PlayingSchool.finder.instruments.voice
PlayingSchool.finder.instrumentsLabel
PlayingSchool.finder.sendAnotherMessage
PlayingSchool.finder.sending
PlayingSchool.wizard.backToFinder
```

**Fix:**  
Add to `src/messages/ar.json` under the `PlayingSchool` section:

```json
{
  "PlayingSchool": {
    "finder": {
      "allInstruments": "جميع الآلات",
      "filterByInstrument": "تصفية حسب الآلة",
      "instrumentsLabel": "الآلة الموسيقية",
      "sendAnotherMessage": "إرسال رسالة أخرى",
      "sending": "جارٍ الإرسال...",
      "instruments": {
        "piano": "بيانو",
        "guitar": "غيتار",
        "violin": "كمان",
        "cello": "تشيلو",
        "flute": "فلوت",
        "drums": "طبول",
        "voice": "غناء"
      }
    },
    "wizard": {
      "backToFinder": "العودة إلى البحث"
    }
  }
}
```

---

## HIGH — I18N-03: Hebrew Has 55 Keys Not Present in English

**Severity:** 🟠 High  
**Files:** `src/messages/he.json`, `src/messages/en.json`

**Issue:**  
Hebrew has 55 extra keys that don't exist in English. This means these features/strings are **untranslated** in English, Arabic, and Russian. Users of non-Hebrew locales won't see these UI strings at all.

**Fix:**  
Audit the 55 extra Hebrew keys and add them to `en.json`, `ar.json`, and `ru.json`. Run this script to identify them:

```bash
node -e "
const he = require('./src/messages/he.json');
const en = require('./src/messages/en.json');

function getKeys(obj, prefix='') {
    return Object.entries(obj).flatMap(([k,v]) => {
        const key = prefix ? prefix+'.'+k : k;
        return typeof v === 'object' ? getKeys(v, key) : [key];
    });
}
const heKeys = new Set(getKeys(he));
const enKeys = new Set(getKeys(en));
const extra = [...heKeys].filter(k => !enKeys.has(k));
console.log(extra.join('\n'));
"
```

---

## HIGH — I18N-04: Multiple Components With Hardcoded Hebrew Text

**Severity:** 🟠 High

**Issue:**  
Several components contain hardcoded Hebrew strings bypassing the i18n system entirely. This affects all non-Hebrew users.

**Files and instances:**

1. `src/app/dashboard/forms/[id]/page.tsx` — Entire page in hardcoded Hebrew (orphan file):
   ```tsx
   toast({ title: "הטופס אושר", description: `הטופס של ${form.studentName} אושר...` })
   ```

2. `src/app/[locale]/apply/matchmaker/page.tsx` (line 18):
   ```tsx
   © 2026 קונסרבטוריון "הרמוניה". כל הזכויות שמורות למשרד החינוך.
   ```

3. Form approval history in `src/app/dashboard/forms/[id]/page.tsx`:
   ```tsx
   <p>הטופס הוגש על ידי {form.studentName}</p>
   <p>ממתין לאישור של {form.teacherDetails?.name || 'המורה'} (מורה)</p>
   ```

**Fix:**  
Move all hardcoded strings into the appropriate namespace in `en.json`/`he.json`/etc., then use `useTranslations()` to render them:

```tsx
// Replace:
toast({ title: "הטופס אושר", description: `הטופס של ${form.studentName} אושר...` })
// With:
toast({ title: t('formApproved'), description: t('formApprovedDesc', { name: form.studentName }) })
```

---

## HIGH — I18N-05: RTL — Multiple Components Using `mr-*`/`ml-*` Instead of `me-*`/`ms-*`

**Severity:** 🟠 High

**Issue:**  
Tailwind's `me-` (margin-end) and `ms-` (margin-start) are RTL-aware. Using `mr-` (margin-right) and `ml-` (margin-left) produces **mirrored layouts** in RTL mode: icons appear on the wrong side of text, spacing is inverted, etc.

**Affected components (30+ instances):**

| File | Examples |
|------|---------|
| `student-practice-panel.tsx` | `mr-2`, `mr-1` (badge icons) |
| `exam-tracker-panel.tsx` | `mr-1`, `mr-2` (badge icons) |
| `alumni-portal.tsx` | `mr-2` (button icons) |
| `ministry-inbox-panel.tsx` | `mr-2`, `ml-auto` |
| `parent-notification-panel.tsx` | `mr-2` |
| `ai-matchmaker-form.tsx` | `mr-2`, `ml-2` |
| `open-day-landing.tsx` | `ml-2` |
| `school-partnership-dashboard.tsx` | `mr-2`, `ml-2` |
| `multimedia-feedback-card.tsx` | `pr-4` (scroll area) |
| `promote-slot-dialog.tsx` | `pr-2` |

**Fix — Global search & replace:**

```bash
# In all .tsx files, replace directional margins with logical ones:
# mr- → me-  (margin-end)
# ml- → ms-  (margin-start)  
# pl- → ps-  (padding-start)
# pr- → pe-  (padding-end)
```

For icon-in-button patterns:
```tsx
// Before (broken in RTL):
<Save className="w-4 h-4 mr-2" /> Save

// After (RTL-safe):
<Save className="w-4 h-4 me-2" /> Save
```

For the `ml-auto` badge pattern (push-to-end):
```tsx
// Before:
<Badge className="ml-auto" />

// After (works in both directions):
<Badge className="ms-auto" />
```

---

## MEDIUM — I18N-06: RTL — ArrowLeft Icon Used for "Next" in LTR Mode

**Severity:** 🟡 Medium  
**File:** `src/components/dashboard/harmonia/ai-matchmaker-form.tsx` (line 212, 179)

**Issue:**  
The AI matchmaker form uses `<ArrowLeft />` for the "Next" and "Book Trial" buttons. In Hebrew (RTL), left = forward, which is correct. But in English/Russian (LTR), left = back, which is wrong.

```tsx
// CURRENT (broken for LTR):
<>{t('nextBtn')} <ArrowLeft className="w-4 h-4 ml-2" /></>
<Button>{t('bookTrialBtn')} <ArrowLeft className="w-4 h-4 ml-2" /></Button>
```

**Fix:**  
```tsx
import { useLocale } from 'next-intl';
const locale = useLocale();
const isRtl = locale === 'he' || locale === 'ar';

// Use ArrowRight for LTR, ArrowLeft for RTL:
{isRtl ? <ArrowLeft className="w-4 h-4 ms-2" /> : <ArrowRight className="w-4 h-4 ms-2" />}
```

Or use the CSS logical approach with Tailwind's `rtl:` variant:
```tsx
<ArrowRight className="w-4 h-4 ms-2 rtl:hidden" />
<ArrowLeft className="w-4 h-4 ms-2 ltr:hidden" />
```

---

## MEDIUM — I18N-07: Playing School Finder Search Input Has Hardcoded `pl-10` (LTR Only)

**Severity:** 🟡 Medium  
**File:** `src/components/harmonia/playing-school-finder.tsx` (line 113)

**Issue:**  
The search input has `pl-10` (padding-left 10) hardcoded, which is meant to leave space for a search icon positioned on the left. In RTL, the icon would be on the right, making the text overlap the icon.

```tsx
<Input className="pl-10 h-14 text-lg ..." />  // ← LTR only
```

**Fix:**  
```tsx
<Input className="ps-10 h-14 text-lg ..." />  // ps- = padding-start (RTL-aware)
```

And ensure the icon is also positioned with `start-*` instead of `left-*`:
```tsx
// Icon wrapper:
<div className="absolute start-3 top-1/2 -translate-y-1/2">
    <Search className="text-muted-foreground h-5 w-5" />
</div>
```

---

## LOW — I18N-08: Missing `hreflang` Tags for SEO/Geo

**Severity:** 🟢 Low  
**File:** `src/app/[locale]/layout.tsx`

**Issue:**  
No `hreflang` alternate link tags are set. Search engines cannot discover locale variants of pages, hurting SEO for Hebrew, Arabic, Russian, and English users.

**Fix:**  
```tsx
// src/app/[locale]/layout.tsx
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{locale: string}> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'HomePage' });
    
    return {
        title: t('title'),
        alternates: {
            languages: {
                'he': '/he',
                'en': '/en',
                'ar': '/ar',
                'ru': '/ru',
                'x-default': '/',
            },
        },
    };
}
```

---

## LOW — I18N-09: Driver.js Walkthrough Text Is All Hebrew (No i18n)

**Severity:** 🟢 Low  
**File:** `src/hooks/use-walkthrough.tsx` (the legacy, non-i18n version)

**Issue:**  
The old walkthrough hook has all walkthrough step text hardcoded in Hebrew. While this file should be deleted (see BUG-01), if it's kept as a fallback, it will show Hebrew text to English/Arabic/Russian users.

The new `walkthrough-manager.tsx` correctly uses `useTranslations('Walkthrough')`. Ensure `Walkthrough.*` keys exist in all four language files.

**Fix:**  
```bash
# Check if Walkthrough keys exist in all locales:
python3 -c "
import json
for locale in ['en','he','ar','ru']:
    with open(f'src/messages/{locale}.json') as f:
        d = json.load(f)
    has_walkthrough = 'Walkthrough' in d
    print(f'{locale}: Walkthrough section = {has_walkthrough}')
"
```

Add missing `Walkthrough` sections to any locale that lacks them.
