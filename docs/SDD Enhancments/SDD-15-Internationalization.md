# SDD-15: Internationalization & Localization (i18n / L10n)

**Module:** 15  
**Dependencies:** All modules (cross-cutting concern)  
**Priority:** P3 — Foundational architecture decision; must be wired in from day one even if only Hebrew ships first

---

## 1. Overview & Rationale

Israel's music conservatoriums serve a genuinely multilingual population. A conservatorium in Haifa may have students from Russian-immigrant families, Arab students from nearby towns, new olim from English-speaking countries, and native Hebrew speakers — all in the same building, all needing the same system. 

The wrong approach: build everything in Hebrew, then retrofit translations later. That causes double work and broken layouts (especially for RTL/LTR conflicts between Hebrew/Arabic vs. English/Russian).

The right approach: wire i18n in from day one as infrastructure, ship Hebrew first, and add languages one by one as they're translated. This SDD defines that infrastructure and the specific considerations for each supported language.

---

## 2. Supported Languages & Directionality

| Code | Language | Script | Direction | Priority |
|------|----------|--------|-----------|----------|
| `he` | Hebrew | Hebrew | RTL ← | Default / P0 |
| `ar` | Arabic | Arabic | RTL ← | P1 |
| `en` | English | Latin | LTR → | P2 |
| `ru` | Russian | Cyrillic | LTR → | P2 |

### 2.1 Why These Four

- **Hebrew (`he`):** Official language, all UI defaults to this
- **Arabic (`ar`):** ~20% of Israel's population; strong presence in conservatoriums in mixed cities (Haifa, Jaffa, Acre, Nazareth). Also RTL, which makes this the "second native language" in terms of layout complexity
- **Russian (`ru`):** ~1 million Russian-speaking olim in Israel. Many are musically educated, enrolled as students and parents. High-value demographic
- **English (`en`):** International teachers, English-speaking olim, parents who haven't yet mastered Hebrew

---

## 3. Technical Architecture

### 3.1 Library Choice: `next-intl`

For a Next.js App Router project, `next-intl` is the standard:

```bash
npm install next-intl
```

```
src/
├── i18n/
│   ├── routing.ts          # locale definitions and default
│   └── request.ts          # locale detection per request
├── messages/
│   ├── he.json             # Hebrew (source of truth)
│   ├── ar.json             # Arabic
│   ├── en.json             # English
│   └── ru.json             # Russian
├── middleware.ts            # locale routing middleware
└── app/
    └── [locale]/           # locale-prefixed routes
        ├── layout.tsx
        └── ...
```

### 3.2 URL Structure

```
https://app.harmonia.co.il/he/dashboard    (Hebrew — default, can omit prefix)
https://app.harmonia.co.il/ar/dashboard    (Arabic)
https://app.harmonia.co.il/en/dashboard    (English)
https://app.harmonia.co.il/ru/dashboard    (Russian)
```

The public musician marketplace (Module 13) uses the same pattern:
```
https://musicians.harmonia.co.il/he        (Hebrew landing)
https://musicians.harmonia.co.il/en        (English — for international event organizers)
```

### 3.3 Locale Detection Priority

1. User's saved preference in their profile (`User.preferredLanguage`)
2. Browser `Accept-Language` header
3. Conservatorium's configured default language
4. System default: `he`

### 3.4 Message File Structure

Messages are organized by module, using nested keys:

```json
// he.json (source of truth — all keys defined here first)
{
  "common": {
    "save": "שמור",
    "cancel": "ביטול",
    "confirm": "אישור",
    "loading": "טוען...",
    "error": "אירעה שגיאה",
    "success": "הפעולה בוצעה בהצלחה"
  },
  "nav": {
    "dashboard": "לוח בקרה",
    "schedule": "לוח זמנים",
    "forms": "טפסים",
    "billing": "חיובים",
    "messages": "הודעות"
  },
  "auth": {
    "login": {
      "title": "כניסה למערכת",
      "emailLabel": "כתובת אימייל",
      "passwordLabel": "סיסמה",
      "submitButton": "כניסה",
      "forgotPassword": "שכחת סיסמה?"
    }
  },
  "scheduling": {
    "bookLesson": "הזמן שיעור",
    "cancelLesson": "בטל שיעור",
    "reschedule": "שנה מועד",
    "upcomingLessons": "שיעורים קרובים",
    "noLessonsScheduled": "אין שיעורים מתוכננים"
  }
  // ... all other modules
}
```

### 3.5 Translation Workflow

The translation pipeline uses a **source-first approach**:

1. Developer writes new UI copy in Hebrew (`he.json`) as part of feature development
2. A CI check fails if any key exists in `he.json` but is missing from other locale files (uses a placeholder flag: `"__UNTRANSLATED__"`)
3. Translation tasks are created (manually or via a translation management platform like Phrase or Lokalise)
4. Native speakers review and submit translations
5. PR updates the locale files; CI validates all keys are present

**Untranslated key fallback:** If a translation is missing, the system falls back to Hebrew (not English), since Hebrew is the operating language of the institution.

---

## 4. RTL / LTR Layout Handling

### 4.1 The Core Challenge

Hebrew and Arabic are both RTL. English and Russian are LTR. The same component must mirror itself correctly based on the active locale.

### 4.2 Tailwind CSS RTL Strategy

Using the `tailwindcss-rtl` plugin or Tailwind v3.3's built-in logical properties:

```tsx
// ❌ Wrong — hardcoded direction
<div className="text-right pr-4 border-l">

// ✅ Correct — logical properties, direction-agnostic
<div className="text-end pe-4 border-s">
```

Logical property mapping:
| Physical (avoid) | Logical (use) | RTL result | LTR result |
|-----------------|---------------|-----------|-----------|
| `text-left` | `text-start` | right-aligned | left-aligned |
| `text-right` | `text-end` | left-aligned | right-aligned |
| `pl-4` | `ps-4` | padding-right | padding-left |
| `pr-4` | `pe-4` | padding-left | padding-right |
| `border-l` | `border-s` | right border | left border |

### 4.3 HTML `dir` and `lang` Attributes

Set at the `<html>` level in `app/[locale]/layout.tsx`:

```tsx
export default function RootLayout({ children, params: { locale } }) {
  const direction = ['he', 'ar'].includes(locale) ? 'rtl' : 'ltr';
  return (
    <html lang={locale} dir={direction}>
      <body>{children}</body>
    </html>
  );
}
```

This ensures all browser-native behaviors (form input alignment, scrollbar position, focus order) automatically respect direction.

### 4.4 Mixed-Direction Content

Some content will always be mixed — for example, a Hebrew sentence containing a music composition title in English (e.g., "נגנת את Moonlight Sonata יפה מאוד"):

```tsx
// Wrap inline foreign-language content with explicit direction
<span dir="ltr" className="font-medium">Moonlight Sonata</span>
```

Numbers, dates, and times are also LTR regardless of UI language — handled by the `Intl` API automatically.

---

## 5. Language-Specific Considerations

### 5.1 Hebrew (`he`) — Default

- All system notifications, emails, and SMS default to Hebrew
- Date format: `DD/MM/YYYY` (Israeli standard)
- Currency: `₪` prefix, no space: `₪120`
- Phone format: `05X-XXXXXXX`
- The Hebrew UI is the **design source of truth** — all other languages adapt to its layout

### 5.2 Arabic (`ar`)

- Also RTL — layout is nearly identical to Hebrew
- **Font:** Use a font that covers both Hebrew and Arabic scripts. Recommended: `Noto Sans Hebrew` + `Noto Sans Arabic`, or the unified `Noto Sans` family
- **Numeral system:** Arabic-Indic numerals (٠١٢٣...) vs. Western (0123...). Israeli Arabic typically uses Western numerals in mixed contexts — default to Western, but allow override
- **Ministry forms:** Some forms may require Arabic translation for Arab-Israeli institutions. This is content translation, handled per-form by admin
- **Keyboard consideration:** Arabic input requires IME support — standard in all modern browsers/OS, no special handling needed

### 5.3 Russian (`ru`)

- LTR — layouts flip to standard LTR when Russian is selected
- **Font:** Standard system fonts cover Cyrillic; no special font loading needed
- **Names:** Russian names often have Patronymic (отчество) in addition to first/last. The `User` model should include an optional `middleName` field
- **Date format:** `DD.MM.YYYY` (Russian standard, similar to Israeli)
- **Cultural note:** Russian-speaking parents in Israel are often very engaged with their children's education and respond well to formal, detailed communication — the weekly digest (Module 14C) is particularly valuable for this demographic

### 5.4 English (`en`)

- LTR
- **Date format:** Use `DD/MM/YYYY` (not American `MM/DD/YYYY`) since the context is Israel
- **Currency:** Display as `₪120` not `ILS 120` — users are in Israel regardless of UI language
- **Ministry terminology:** Some Israeli music education terms have no direct English equivalent (e.g., the exam level system). These are kept in Hebrew with a parenthetical English explanation: `Aleph Level (beginner/1st year)`

---

## 6. Translatable Content (Beyond UI Strings)

### 6.1 Dynamic Content

Some content is entered by users (teacher bios, announcements, form rejection reasons) and is not automatically translated:

- **Teacher bio:** Teacher fills it in their preferred language. A language tag is displayed to users viewing it in a different language: `[Bio available in Hebrew only]`
- **Lesson notes:** Written by teacher, displayed as-is. No translation.
- **Announcements:** Admin writes them in one language. Can optionally duplicate for another language audience.
- **AI-generated content (Module 10):** The Genkit prompt specifies the output language based on the recipient's preference. The same data → Hebrew draft for one parent, Russian draft for another.

### 6.2 Notification Templates

Every notification template (Module 07) exists in all four languages:

```typescript
{
  type: 'LESSON_REMINDER';
  templates: {
    he: "תזכורת: שיעור {{instrument}} מחר ב-{{time}} עם {{teacherName}}",
    ar: "تذكير: درس {{instrument}} غداً الساعة {{time}} مع {{teacherName}}",
    en: "Reminder: {{instrument}} lesson tomorrow at {{time}} with {{teacherName}}",
    ru: "Напоминание: урок {{instrument}} завтра в {{time}} с {{teacherName}}"
  }
}
```

The system selects the template based on the recipient's `preferredLanguage`.

### 6.3 PDF Generation (Module 08)

All generated PDFs (form approvals, receipts, certificates) are generated in the student's preferred language. PDFs contain:
- Mixed RTL/LTR content handled via a PDF library that supports both (recommended: `pdf-lib` with proper font embedding)
- For forms submitted to the Ministry: Hebrew is always the official language regardless of user preference

---

## 7. Language Switcher UI

A language selector appears in:
- The main navigation header (logged-in users)
- The footer of public pages (`/available-now`, musician marketplace, `/register`)
- The onboarding wizard (prominent, first thing new users see)

```tsx
// Language switcher component
<LanguageSwitcher 
  options={[
    { code: 'he', label: 'עברית', flag: '🇮🇱' },
    { code: 'ar', label: 'العربية', flag: '🇮🇱' },
    { code: 'en', label: 'English', flag: '🌐' },
    { code: 'ru', label: 'Русский', flag: '🌐' }
  ]}
/>
```

Language preference is:
1. Saved to `User.preferredLanguage` (persists across sessions)
2. For non-logged-in users: saved to a cookie

---

## 8. Testing Strategy

| Test Type | Description |
|-----------|-------------|
| Snapshot tests | Every UI component renders correctly in all 4 locales |
| RTL layout tests | Visual regression tests (Chromatic/Percy) comparing RTL vs. LTR renders |
| Missing key detection | CI fails if any locale file is missing a key from `he.json` |
| Overflow tests | All strings tested for text expansion (Russian/Arabic often 20–40% longer than Hebrew) |
| Keyboard navigation | Tab order correct in both RTL and LTR modes |
| PDF generation | Generated PDFs verified in all locales for correct font rendering |

---

## 9. Rollout Plan

| Phase | Languages | Timeline |
|-------|-----------|----------|
| Launch | Hebrew only | Day 1 |
| Phase 2 | + English | 1 month post-launch |
| Phase 3 | + Russian | 2 months post-launch |
| Phase 4 | + Arabic | 3 months post-launch |

Phases 2–4 require: translation of all `he.json` keys, testing, and QA by a native speaker.

---

## 10. UI Components Required

| Component | Description |
|-----------|-------------|
| `LanguageSwitcher` | Dropdown/toggle in nav and footer |
| `DirectionProvider` | Context provider that sets `dir` and exposes direction to components |
| `BilingualText` | Component for displaying text with a language-tagged fallback |
| `LocalizedDate` | Date formatting respecting locale conventions |
| `LocalizedCurrency` | Currency display (₪ prefix, correct decimal separator) |
| `RTLIcon` | Wrapper that mirrors icons horizontally for RTL (e.g., back arrows, chevrons) |
