# i18n Audit Report

**Date:** 2026-03-06
**Auditor:** i18n Agent
**Scope:** Harmonia Platform -- All 4 locales (he, en, ar, ru)

---

## 1. Executive Summary

The Harmonia platform has a solid i18n infrastructure using `next-intl` with split-file message bundles per locale. Translation key parity across all 4 locales is **100%** -- no missing keys were detected by the automated audit. However, significant work remains: **71 component/page files still contain ~397 hardcoded Hebrew lines** that bypass the translation system. Additionally, the `User.preferredLanguage` field referenced in SDD-15 is **not implemented** in the codebase.

| Metric | Value |
|--------|-------|
| Supported locales | `he` (default), `en`, `ar`, `ru` |
| Root JSON keys per locale | 834 |
| Split files per locale | 8 (`admin`, `billing`, `common`, `enrollment`, `forms`, `public`, `settings`, `student`) |
| Missing keys (split files) | **0** |
| Missing keys (root files) | **0** |
| Untranslated values (EN in non-EN locales) | **0** |
| Files with hardcoded Hebrew | **71** |
| Total hardcoded Hebrew lines | **~397** |
| Extra keys (HE not in EN) | 1 (`RecitalForm.teacherDetails` in `forms.json`) |

---

## 2. Translation Key Parity

### 2.1 Split Files (src/messages/{locale}/*.json)

All 8 split files have perfect key parity across all 4 locales:

| File | EN keys | HE keys | AR keys | RU keys | Status |
|------|---------|---------|---------|---------|--------|
| admin.json | parity | parity | parity | parity | OK |
| billing.json | parity | parity | parity | parity | OK |
| common.json | parity | parity | parity | parity | OK |
| enrollment.json | parity | parity | parity | parity | OK |
| forms.json | parity | parity (+1 extra) | parity | parity | OK (minor) |
| public.json | parity | parity | parity | parity | OK |
| settings.json | parity | parity | parity | parity | OK |
| student.json | parity | parity | parity | parity | OK |

**Minor:** `he/forms.json` has 1 extra key (`RecitalForm.teacherDetails`) not present in other locales. Non-breaking since EN is the fallback base.

### 2.2 Root Files (src/messages/{locale}.json)

All 4 root files are in perfect parity with 834 keys each.

### 2.3 Untranslated Values

Zero English-value fallbacks were detected in he, ar, or ru locale files. All strings appear to be properly translated.

---

## 3. Hardcoded Hebrew Strings (Not Using i18n)

**71 files** contain **~397 lines** of hardcoded Hebrew that bypass `useTranslations()`. These render in Hebrew regardless of the active locale.

### Top 20 Files by Hebrew Line Count

| File | Hebrew Lines | Priority |
|------|-------------|----------|
| `src/app/[locale]/dashboard/teacher/student/[id]/page.tsx` | 49 | HIGH |
| `src/app/[locale]/dashboard/forms/[id]/page.tsx` | 33 | HIGH |
| `src/components/dashboard/harmonia/exam-tracker-panel.tsx` | 17 | MEDIUM |
| `src/components/dashboard/harmonia/assign-repertoire-dialog.tsx` | 16 | MEDIUM |
| `src/components/dashboard/harmonia/assign-performer-dialog.tsx` | 12 | MEDIUM |
| `src/components/dashboard/harmonia/practice-coach.tsx` | 12 | MEDIUM |
| `src/components/dashboard/harmonia/practice-video-upload-form.tsx` | 12 | MEDIUM |
| `src/components/dashboard/harmonia/form-builder.tsx` | 11 | MEDIUM |
| `src/components/dashboard/harmonia/reschedule-lesson-dialog.tsx` | 11 | MEDIUM |
| `src/components/dashboard/harmonia/school-partnership-dashboard.tsx` | 11 | MEDIUM |
| `src/app/[locale]/dashboard/settings/conservatorium/page.tsx` | 10 | MEDIUM |
| `src/components/dashboard/harmonia/rescheduling-chat-widget.tsx` | 10 | MEDIUM |
| `src/components/dashboard/harmonia/sound-check-scheduler.tsx` | 10 | MEDIUM |
| `src/components/dashboard/harmonia/multimedia-feedback-card.tsx` | 8 | LOW |
| `src/components/dashboard/harmonia/promote-slot-dialog.tsx` | 8 | LOW |
| `src/components/dashboard/harmonia/schedule-calendar.tsx` | 8 | LOW |
| `src/components/harmonia/playing-school-finder.tsx` | 8 | LOW |
| `src/components/dashboard/harmonia/cancel-lesson-dialog.tsx` | 6 | LOW |
| `src/components/dashboard/harmonia/ministry-inbox-panel.tsx` | 6 | LOW |
| `src/components/payments/InstallmentSelector.tsx` | 6 | LOW |

**Remediation:** Each file needs `useTranslations()` wired in, with hardcoded Hebrew moved to translation keys. See SDD-i18n-Complete-Fix.md for the detailed migration plan (~14 developer days).

---

## 4. Locale Routing

### 4.1 Configuration

- **File:** `src/i18n/routing.ts`
- **Locales:** `['he', 'en', 'ar', 'ru']`
- **Default locale:** `he`
- **Locale prefix:** `as-needed` (Hebrew served at `/`, others at `/en/`, `/ar/`, `/ru/`)

### 4.2 Routing Behavior

| Route | Locale | Expected |
|-------|--------|----------|
| `/` | `he` | Hebrew at root (no prefix) |
| `/en/` | `en` | English with prefix |
| `/ar/` | `ar` | Arabic with prefix |
| `/ru/` | `ru` | Russian with prefix |
| `/dashboard` | `he` | Hebrew dashboard |
| `/en/dashboard` | `en` | English dashboard |

### 4.3 Request Config

- `src/i18n/request.ts` loads locale-specific split bundles from `src/messages/{locale}/`
- Falls back to English (`en`) as the merge base -- any missing key in a locale will show the English translation
- **Note:** SDD-15 specifies Hebrew as the fallback, but the implementation uses English. This is acceptable since key parity is 100%.

### 4.4 Layout Integration

- `src/app/[locale]/layout.tsx` correctly sets `<html lang={locale} dir={dir}>`
- RTL detection: `locale === 'he' || locale === 'ar'` sets `dir="rtl"`
- Font: Rubik with `hebrew`, `latin`, `cyrillic` subsets loaded via Google Fonts
- Locale validation: `notFound()` returned for invalid locales

---

## 5. User.preferredLanguage Persistence

**Status: NOT IMPLEMENTED**

The `User.preferredLanguage` field specified in SDD-15 (Section 3.3 and Section 7) does **not exist** in the codebase:

- No `preferredLanguage` field found in any TypeScript types, database schema, or component code
- The `users` table in `schema.sql` has no `preferred_language` column
- Locale detection relies solely on URL path segment (next-intl routing)
- There is no cookie-based or profile-based language persistence for non-logged-in users

**Recommendation:** Add `preferred_language VARCHAR(5) DEFAULT 'he'` to the `users` table and wire it into the locale detection chain in `src/i18n/request.ts`.

---

## 6. Translation Quality Notes

### 6.1 Russian Locale

The Russian translations show signs of machine translation with some awkward phrasings:

- `ParentPayment.immediatePayment`: "Иммедиате Оплата" (transliteration, not translation)
- `ParentPayment.requestNo`: "Запрос Нет." (literal translation of "Request No.")
- `ParentPayment.receiptNo`: "Рекеипт Нет." (transliteration of "Receipt No.")
- `ParentPayment.setupAltPayment`: "Сетуп Алтернативе Оплата / Регулярный"
- `TeacherPayroll.noPayrollDataTitle`: "Нет Пайролл Дата" (transliteration)
- `TeacherPayroll.payrollReportTitle`: contains `__Пх_0__` placeholder corruption
- `TeacherPayroll.payslipForMonth`: contains `__Пх_0__` placeholder corruption

**Action Required:** These ~7 Russian keys in `billing.json` need human review and correction.

### 6.2 Arabic Locale

Arabic translations appear grammatically correct and culturally appropriate. One minor issue:

- `Payroll.markAsPaid`: "تحديد كمرفوض" (means "mark as rejected" not "mark as paid") -- **translation error**

### 6.3 Hebrew Locale

Hebrew is the source language. All translations are native and correct.

---

## 7. Instrument Catalog Localization Gap

The `instrument_catalog` table in `seed.sql` stores instrument names as JSONB with all 4 locales, but **all values are English**:

```sql
('piano', '{"he":"Piano","en":"Piano","ar":"Piano","ru":"Piano"}', ...)
```

These should be properly localized:

| ID | Hebrew | Arabic | Russian |
|----|--------|--------|---------|
| piano | פסנתר | بيانو | Фортепиано |
| violin | כינור | كمان | Скрипка |
| guitar | גיטרה | جيتار | Гитара |
| flute | חליל | فلوت | Флейта |
| cello | צ'לו | تشيلو | Виолончель |
| clarinet | קלרינט | كلارينيت | Кларнет |
| trumpet | חצוצרה | بوق | Труба |
| drums | תופים | طبول | Ударные |
| voice | קול/זמרה | غناء | Вокал |

---

## 8. Seed Data Localization Gap

The `conservatoriums.description` field in `seed.sql` contains **Hebrew-only** `about` text in all locale slots (en, ar, ru slots contain Hebrew text instead of translated content). This means the conservatorium descriptions display in Hebrew regardless of the user's locale.

---

## 9. Recommendations (Priority Order)

1. **P0 -- Fix Russian translation corruptions** in `billing.json` (~7 keys)
2. **P0 -- Fix Arabic translation error** (`Payroll.markAsPaid`)
3. **P1 -- Migrate 71 files with hardcoded Hebrew** to `useTranslations()` (~14 dev days)
4. **P1 -- Add `preferred_language` to users table** and wire into locale detection
5. **P2 -- Localize instrument catalog names** (all currently English)
6. **P2 -- Localize conservatorium descriptions** in seed data
7. **P3 -- Fix RTL logical property violations** (see separate RTL audit report)