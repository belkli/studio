# HARMONIA — SDD-i18n-PROFILES: Multilingual Public Profiles
## About Us / Contact Us — Full Translation Architecture

**Version 1.0 | February 2026**
**Classification:** Internal – Product & Engineering
**Authors:** Expert Architect & Product Manager
**Scope:** Conservatorium public profile, teacher directory profiles, admin/staff bios
**Affected Routes:** `/about`, `/contact`, `/dashboard/settings/conservatorium/profile`, `/dashboard/teacher/profile`

---

## 1. Executive Summary

The Lyriosa platform supports four locales — Hebrew (`he`), English (`en`), Arabic (`ar`), and Russian (`ru`) — via `next-intl`. The system's UI chrome (navigation labels, button text, form labels) switches correctly when a user changes language.

However, **the content of public profiles does not switch**. Every piece of user-generated text — the conservatorium's "About Us" paragraph, manager biographies, department names, teacher bios, opening hours, branch names — is entered once, assumed to be in Hebrew, and displayed in Hebrew regardless of the active locale. A Russian-speaking parent viewing the About page sees the entire conservatorium description in Hebrew. An Arabic-speaking user on the Contact page sees Hebrew content inside an Arabic-layout UI — a jarring and exclusionary experience.

This SDD defines the complete architecture for user-generated content (UGC) translation across all public-facing profile surfaces:

1. **The data model** — what fields need multilingual storage and how
2. **The translation engine** — how content is translated (AI-assisted, with human override)
3. **The admin editing UI** — a redesigned profile editor that makes translation status visible and actionable
4. **The public rendering layer** — exactly how `about/page.tsx` and `contact/page.tsx` resolve localized content at render time
5. **The teacher profile** — extending the teacher editor with the same translation pattern
6. **Operational rules** — when translation is triggered, how stale translations are detected, and what happens when content changes

---

## 2. Root Cause Analysis

### 2.1 The Six Specific Bugs

A code audit of the current implementation reveals six distinct failures:

**Bug 1: `useLocale` is imported but never used on the About page.**

```typescript
// about/page.tsx — line 2
import { useTranslations, useLocale } from 'next-intl';
// ...
const tNav = useTranslations('Navigation');
const tHome = useTranslations('HomePage');
// ← useLocale() is NEVER called. The locale is never read.
```

The component renders `cons.about` directly for every visitor regardless of their language.

**Bug 2: `ConservatoriumTranslations` type covers only 5 of the 12 translatable fields.**

The current type definition:

```typescript
export type ConservatoriumTranslations = {
  [locale: string]: {
    about?: string;
    openingHours?: string;
    departments?: { name: string }[];
    programs?: string[];
    manager?: { bio?: string };
  };
};
```

Fields that are **displayed publicly but have no translation slot**:
- `manager.role` (title shown in the dialog and contact page)
- `pedagogicalCoordinator.bio`
- `pedagogicalCoordinator.role`
- `branchesInfo[].name`
- `branchesInfo[].address`
- `departments[].headTeacher` (teacher name, not translatable, but role label is)
- `ensembles[]` (ensemble names shown in profile)

**Bug 3: `translateProfileContent` is a stub that returns mock data.**

```typescript
// src/app/actions/translate.ts
const translations: ConservatoriumTranslations = {
    en: {
        about: content.about ? `[AI English Translation] ${content.about}` : undefined,
        // ← Prefix "[AI English Translation]" shipped to production users
    },
```

No Gemini API call is made. The mock output would appear verbatim on the public About page.

**Bug 4: The "Translations" tab in the admin editor is read-only — admins cannot override AI output.**

The current translations tab renders:
```tsx
<p className="text-sm text-muted-foreground border rounded-lg p-2 bg-background">
    {(formData.translations as any)[lang]?.about || 'No translation available'}
</p>
```
This is a `<p>` tag, not an editable input. If the AI translation is wrong (e.g., mistranslates "Conservatorium" as a generic word in Arabic), the admin has no way to fix it.

**Bug 5: The teacher profile editor has zero translation support.**

`TeacherProfileEditor` has a single `bio` Textarea with no locale tabs, no auto-translate button, and no `user.translations` type in the data model. Teacher biographies — which appear in the About page teacher grid tooltip — are always Hebrew.

**Bug 6: Hardcoded Hebrew UI labels inside profile rendering components.**

Components like `ConservatoriumDialog` and `ConservatoriumInfo` contain hardcoded Hebrew strings for structural labels:

```tsx
// about/page.tsx
<h4 className="font-semibold text-sm mb-2">פרטי יצירת קשר</h4>  // ← hardcoded
<h4 className="font-semibold text-sm">הנהלה</h4>               // ← hardcoded
<h4 className="font-semibold text-sm">אודות</h4>               // ← hardcoded
```

These are structural labels (not UGC), so they belong in the i18n message files, not in component JSX.

### 2.2 The Translation Architecture Gap

The existing approach treats translation as an admin afterthought (a separate "Translations" tab that admins rarely visit). What is needed is a **translation-first content model** where:
- Every free-text field that appears publicly has a defined multilingual storage slot
- Translations are generated automatically when content is saved
- Stale translations are flagged and the admin is prompted to refresh them
- Admins can override AI output field by field
- The public rendering layer always selects the best available content for the active locale

---

## 3. Data Model Changes

### 3.1 Expanded `ConservatoriumTranslations` Type

Replace the existing type in `src/lib/types.ts`:

```typescript
/**
 * Stores locale-specific overrides for all user-generated text fields
 * on the conservatorium public profile.
 *
 * The primary language (Hebrew) is stored on the Conservatorium object
 * itself (e.g., cons.about). This map stores translations for all other
 * supported locales: 'en', 'ar', 'ru'.
 *
 * Fields marked optional: if absent, the renderer falls back to the
 * Hebrew source field or the next available locale.
 */
export type ConservatoriumProfileTranslation = {
  about?: string;
  openingHours?: string;
  programs?: string[];
  ensembles?: string[];
  manager?: {
    role?: string;      // job title, e.g. "Director"
    bio?: string;       // personal bio paragraph
  };
  pedagogicalCoordinator?: {
    role?: string;
    bio?: string;
  };
  departments?: Array<{
    name: string;       // translated department name
  }>;
  branchesInfo?: Array<{
    name: string;       // translated branch name
    address?: string;   // translated/localized address description
  }>;
};

export type ConservatoriumTranslations = {
  en?: ConservatoriumProfileTranslation;
  ar?: ConservatoriumProfileTranslation;
  ru?: ConservatoriumProfileTranslation;
};

// Add translation metadata for stale detection
export type TranslationMeta = {
  lastTranslatedAt: string;      // ISO timestamp of last AI translation run
  sourceHash: string;            // SHA-256 of concatenated source fields at translation time
  translatedBy: 'AI' | 'HUMAN'; // 'HUMAN' if admin manually edited a field
  aiModel: string;               // e.g. 'gemini-1.5-flash'
  overrides?: {                  // tracks which fields an admin manually edited
    [locale: string]: string[];  // e.g. { ar: ['about', 'manager.role'] }
  };
};
```

Add `translationMeta` to the `Conservatorium` type:

```typescript
export type Conservatorium = {
  // ... existing fields unchanged ...
  translations?: ConservatoriumTranslations;
  translationMeta?: TranslationMeta;   // NEW
};
```

### 3.2 `User` Type Extension — Teacher and Admin Bios

The `User` type does not currently have a translations field. Add:

```typescript
export type UserProfileTranslation = {
  bio?: string;          // translated teacher/admin biography
  role?: string;         // translated role/title label
};

export type UserTranslations = {
  en?: UserProfileTranslation;
  ar?: UserProfileTranslation;
  ru?: UserProfileTranslation;
};
```

Add to `User` type in `src/lib/types.ts`:

```typescript
export type User = {
  // ... existing fields unchanged ...
  translations?: UserTranslations;         // NEW — teacher/admin bio translations
  translationMeta?: TranslationMeta;       // NEW — same metadata shape
};
```

### 3.3 `TeacherDirectoryProfile` Extension

The `TeacherDirectoryProfile` embedded type (used in `cons.teachers[]`) also needs translation support for the role label displayed in the About page teacher grid:

```typescript
export type TeacherDirectoryProfile = {
  name: string;
  role?: string;        // existing — Hebrew role label
  photoUrl?: string;
  bio?: string;         // existing — Hebrew bio (shown in tooltip)
  roleTranslations?: {  // NEW — per-locale role labels
    en?: string;
    ar?: string;
    ru?: string;
  };
  bioTranslations?: {   // NEW
    en?: string;
    ar?: string;
    ru?: string;
  };
};
```

### 3.4 Source Hash Computation

The `sourceHash` in `TranslationMeta` is computed from the concatenation of all translatable source fields. This allows detecting when content has changed since the last translation run:

```typescript
// src/lib/utils/translation-hash.ts

import { createHash } from 'crypto';
import type { Conservatorium } from '@/lib/types';

export function computeConservatoriumSourceHash(cons: Partial<Conservatorium>): string {
  const sourceFields = [
    cons.about ?? '',
    cons.openingHours ?? '',
    cons.manager?.role ?? '',
    cons.manager?.bio ?? '',
    cons.pedagogicalCoordinator?.role ?? '',
    cons.pedagogicalCoordinator?.bio ?? '',
    (cons.departments ?? []).map(d => d.name).join('|'),
    (cons.programs ?? []).join('|'),
    (cons.ensembles ?? []).join('|'),
    (cons.branchesInfo ?? []).map(b => `${b.name}|${b.address ?? ''}`).join('||'),
  ].join('\n---\n');

  return createHash('sha256').update(sourceFields, 'utf8').digest('hex').slice(0, 16);
}

export function computeUserSourceHash(bio?: string, role?: string): string {
  return createHash('sha256')
    .update(`${bio ?? ''}|${role ?? ''}`, 'utf8')
    .digest('hex')
    .slice(0, 16);
}
```

---

## 4. Translation Engine

### 4.1 Replace the Stub — Real Gemini Integration

Replace `src/app/actions/translate.ts` entirely:

```typescript
'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  ConservatoriumTranslations,
  ConservatoriumProfileTranslation,
  Conservatorium,
  UserTranslations,
} from '@/lib/types';
import { computeConservatoriumSourceHash, computeUserSourceHash } from '@/lib/utils/translation-hash';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ── Supported target locales ──────────────────────────────────────────────────
const TARGET_LOCALES = ['en', 'ar', 'ru'] as const;
type TargetLocale = typeof TARGET_LOCALES[number];

const LOCALE_NAMES: Record<TargetLocale, string> = {
  en: 'English',
  ar: 'Arabic (Modern Standard, right-to-left)',
  ru: 'Russian',
};
```

#### 4.1.1 Conservatorium Translation Function

```typescript
export async function translateConservatoriumProfile(
  cons: Partial<Conservatorium>,
  locales: TargetLocale[] = ['en', 'ar', 'ru'],
  existingTranslations?: ConservatoriumTranslations,
  existingOverrides?: TranslationMeta['overrides']
): Promise<{
  success: boolean;
  translations?: ConservatoriumTranslations;
  meta?: Omit<TranslationMeta, 'overrides'>;
  error?: string;
}> {

  // Build the structured source payload
  const sourcePayload = {
    about: cons.about,
    openingHours: cons.openingHours,
    managerRole: cons.manager?.role,
    managerBio: cons.manager?.bio,
    pedagogicalCoordinatorRole: cons.pedagogicalCoordinator?.role,
    pedagogicalCoordinatorBio: cons.pedagogicalCoordinator?.bio,
    departments: cons.departments?.map(d => d.name) ?? [],
    programs: cons.programs ?? [],
    ensembles: cons.ensembles ?? [],
    branchNames: cons.branchesInfo?.map(b => b.name) ?? [],
    branchAddresses: cons.branchesInfo?.map(b => b.address ?? '') ?? [],
  };

  const prompt = `
You are a professional translator specializing in music education and cultural institutions in Israel.

Translate the following JSON object (representing a music conservatorium's public profile written in Hebrew) into ${locales.map(l => LOCALE_NAMES[l]).join(', ')}.

RULES:
1. Return ONLY a valid JSON object. No markdown, no code fences, no preamble.
2. Preserve proper nouns (names of people, instrument names, specific place names) as-is.
3. For Arabic: use Modern Standard Arabic, right-to-left appropriate phrasing.
4. Keep tone professional yet warm — this is public-facing educational content.
5. If a field is null or empty string, set it to null in the output.
6. Arrays must have the same number of items as the input array, in the same order.
7. The output JSON must have this exact structure:
{
  "en": { <translated fields> },
  "ar": { <translated fields> },
  "ru": { <translated fields> }
}

Source (Hebrew):
${JSON.stringify(sourcePayload, null, 2)}

Output JSON:`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim()
      .replace(/^```json\s*/i, '').replace(/\s*```$/, ''); // strip fences if present

    const raw = JSON.parse(text) as Record<string, any>;

    // Map raw AI output back to ConservatoriumProfileTranslation shape
    const mapLocale = (locale: TargetLocale): ConservatoriumProfileTranslation => {
      const r = raw[locale] ?? {};
      const output: ConservatoriumProfileTranslation = {};

      if (r.about) output.about = r.about;
      if (r.openingHours) output.openingHours = r.openingHours;
      if (r.managerRole || r.managerBio) output.manager = {
        role: r.managerRole ?? undefined,
        bio: r.managerBio ?? undefined,
      };
      if (r.pedagogicalCoordinatorRole || r.pedagogicalCoordinatorBio) {
        output.pedagogicalCoordinator = {
          role: r.pedagogicalCoordinatorRole ?? undefined,
          bio: r.pedagogicalCoordinatorBio ?? undefined,
        };
      }
      if (r.departments?.length) {
        output.departments = r.departments.map((name: string) => ({ name }));
      }
      if (r.programs?.length) output.programs = r.programs;
      if (r.ensembles?.length) output.ensembles = r.ensembles;
      if (r.branchNames?.length) {
        output.branchesInfo = r.branchNames.map((name: string, i: number) => ({
          name,
          address: r.branchAddresses?.[i] ?? undefined,
        }));
      }

      // Preserve any fields the admin has manually overridden (don't overwrite them)
      const overriddenFields = existingOverrides?.[locale] ?? [];
      if (overriddenFields.length > 0 && existingTranslations?.[locale]) {
        const existing = existingTranslations[locale]!;
        for (const field of overriddenFields) {
          if (field === 'about' && existing.about) output.about = existing.about;
          if (field === 'openingHours' && existing.openingHours) output.openingHours = existing.openingHours;
          if (field === 'manager.role' && existing.manager?.role) {
            output.manager = { ...output.manager, role: existing.manager.role };
          }
          if (field === 'manager.bio' && existing.manager?.bio) {
            output.manager = { ...output.manager, bio: existing.manager.bio };
          }
          // ... repeat for other overrideable fields
        }
      }

      return output;
    };

    const translations: ConservatoriumTranslations = {};
    for (const locale of locales) translations[locale] = mapLocale(locale);

    const meta: Omit<TranslationMeta, 'overrides'> = {
      lastTranslatedAt: new Date().toISOString(),
      sourceHash: computeConservatoriumSourceHash(cons),
      translatedBy: 'AI',
      aiModel: 'gemini-1.5-flash',
    };

    return { success: true, translations, meta };

  } catch (err: any) {
    console.error('[translateConservatoriumProfile]', err);
    return { success: false, error: err.message ?? 'Translation failed' };
  }
}
```

#### 4.1.2 Teacher / User Bio Translation Function

```typescript
export async function translateUserBio(
  bio: string,
  role?: string,
  locales: TargetLocale[] = ['en', 'ar', 'ru']
): Promise<{
  success: boolean;
  translations?: UserTranslations;
  meta?: Omit<TranslationMeta, 'overrides'>;
  error?: string;
}> {
  const prompt = `
Translate the following music teacher's biography and job title from Hebrew to ${locales.map(l => LOCALE_NAMES[l]).join(', ')}.

Return ONLY valid JSON in this structure, no markdown:
{
  "en": { "bio": "...", "role": "..." },
  "ar": { "bio": "...", "role": "..." },
  "ru": { "bio": "...", "role": "..." }
}

Hebrew bio: ${bio}
Hebrew role/title: ${role ?? ''}
`;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim()
      .replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    const raw = JSON.parse(text);

    const translations: UserTranslations = {};
    for (const locale of locales) {
      if (raw[locale]) translations[locale] = {
        bio: raw[locale].bio || undefined,
        role: raw[locale].role || undefined,
      };
    }

    return {
      success: true,
      translations,
      meta: {
        lastTranslatedAt: new Date().toISOString(),
        sourceHash: computeUserSourceHash(bio, role),
        translatedBy: 'AI',
        aiModel: 'gemini-1.5-flash',
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
```

### 4.2 Auto-Translate Trigger Policy

Translations must be triggered automatically — admins should not need to remember to click "Translate." The rules are:

| Event | Auto-Translate Triggered? | Behavior |
|---|---|---|
| Admin saves profile for the first time | ✅ Yes | Triggered immediately after save; user sees loading indicator |
| Admin saves profile and source hash has changed | ✅ Yes | Stale fields are re-translated; admin-overridden fields are preserved |
| Admin saves profile and source hash is unchanged | ❌ No | Existing translations are kept; no API call |
| Admin manually edits a translation field | 🔒 Lock that field | That field is marked as `HUMAN` override; future AI runs skip it |
| Admin clicks "Reset to AI translation" on a locked field | ✅ Yes | Re-runs AI for that field only; removes the override lock |

#### Implementation in `handleSave`

```typescript
const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSaving(true);

  try {
    const newHash = computeConservatoriumSourceHash(formData);
    const existingHash = currentCons.translationMeta?.sourceHash;
    const needsTranslation = newHash !== existingHash;

    // 1. Save the profile first
    await updateConservatorium({ ...currentCons, ...formData } as Conservatorium);

    toast({ title: 'Profile saved' });

    // 2. If content changed, auto-translate in background
    if (needsTranslation) {
      setIsTranslating(true);
      toast({
        title: 'Auto-translating…',
        description: 'Generating EN / AR / RU translations via Gemini AI.',
      });

      const result = await translateConservatoriumProfile(
        formData,
        ['en', 'ar', 'ru'],
        formData.translations,
        formData.translationMeta?.overrides
      );

      if (result.success && result.translations) {
        const updated: Conservatorium = {
          ...currentCons,
          ...formData,
          translations: result.translations,
          translationMeta: {
            ...result.meta!,
            overrides: formData.translationMeta?.overrides ?? {},
          },
        };
        await updateConservatorium(updated);
        setFormData(updated);
        toast({ title: 'Translations updated' });
      } else {
        toast({ variant: 'destructive', title: 'Auto-translation failed', description: result.error });
      }
    }
  } finally {
    setIsSaving(false);
    setIsTranslating(false);
  }
};
```

---

## 5. Admin Profile Editor — Redesign

### 5.1 The Core UX Problem

The current "Translations" tab is a **dead end**: admins enter Hebrew content in the "Basic Info" tab, then must navigate to a completely separate "Translations" tab to see what was generated (if they even know to look). The tab shows read-only output and gives no indication of translation freshness or coverage.

The redesigned editor follows a **"write once, review inline"** pattern:
- Every free-text input field has a small expandable panel below it showing the translated versions for EN / AR / RU.
- Translation status is visible at a glance (✅ fresh, ⚠️ stale, 🔒 manually overridden, ❌ missing).
- Admins can click into any translated field to override it — immediately marking that field as a human override.

### 5.2 New `TranslatedFieldInput` Component

**File:** `src/components/dashboard/harmonia/translated-field-input.tsx`

This is a wrapper around any text input or textarea that adds an inline translation preview/edit panel.

```tsx
interface TranslatedFieldInputProps {
  label: string;
  sourceValue: string;
  onSourceChange: (value: string) => void;
  translations: Record<string, string | undefined>;  // { en: '...', ar: '...', ru: '...' }
  onTranslationChange: (locale: string, value: string) => void;
  overrides: string[];                               // locales with human override
  onToggleOverride: (locale: string) => void;
  isTextarea?: boolean;
  rows?: number;
  placeholder?: string;
  isStalemark?: boolean;  // true if sourceHash has changed since last translation
}
```

#### Visual Design

```
┌──────────────────────────────────────────────────────────────┐
│ About Us (description)                           [עברית 🇮🇱]  │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ קונסרבטוריון ותיק ומוביל בעיר...                       │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ Translations    ⚠️ Content changed — translations may be     │
│                    stale. [Re-translate now]                  │
│ ┌──────────────────────────────────────────────────────┐     │
│ │ 🇬🇧 English                            [✅ AI] [edit] │     │
│ │   A leading conservatorium in the city...            │     │
│ ├──────────────────────────────────────────────────────┤     │
│ │ 🇸🇦 Arabic                             [🔒 Human]    │     │
│ │   قونسرڤاتوار رائد في المدينة...        [reset to AI]│     │
│ ├──────────────────────────────────────────────────────┤     │
│ │ 🇷🇺 Russian                            [❌ Missing]   │     │
│ │   [translate now]                                    │     │
│ └──────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

**Status badge logic:**
- **✅ AI** — field has an AI translation, source hash matches current content
- **⚠️ Stale** — field has a translation but source hash has changed
- **🔒 Human** — admin has manually edited this field; AI runs skip it
- **❌ Missing** — no translation exists for this locale/field

#### Implementation Sketch

```tsx
export function TranslatedFieldInput({
  label, sourceValue, onSourceChange,
  translations, onTranslationChange,
  overrides, onToggleOverride,
  isTextarea, rows, placeholder, isStalemark
}: TranslatedFieldInputProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingLocale, setEditingLocale] = useState<string | null>(null);

  const LOCALE_FLAGS: Record<string, string> = {
    en: '🇬🇧', ar: '🇸🇦', ru: '🇷🇺'
  };
  const LOCALE_NAMES: Record<string, string> = {
    en: 'English', ar: 'Arabic', ru: 'Russian'
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {isTextarea ? (
        <Textarea
          rows={rows}
          value={sourceValue}
          onChange={e => onSourceChange(e.target.value)}
          placeholder={placeholder}
          dir="rtl"
          className="rounded-xl"
        />
      ) : (
        <Input
          value={sourceValue}
          onChange={e => onSourceChange(e.target.value)}
          placeholder={placeholder}
          dir="rtl"
          className="rounded-xl"
        />
      )}

      {/* Translation toggle */}
      <button
        type="button"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
        onClick={() => setExpanded(!expanded)}
      >
        <Languages className="h-3 w-3" />
        {expanded ? 'Hide translations' : 'Show translations (EN / AR / RU)'}
        {isStalemark && <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-300">⚠️ Stale</Badge>}
      </button>

      {expanded && (
        <div className="border rounded-xl overflow-hidden divide-y divide-border bg-muted/10">
          {(['en', 'ar', 'ru'] as const).map(locale => {
            const value = translations[locale];
            const isOverride = overrides.includes(locale);
            const isEditing = editingLocale === locale;

            return (
              <div key={locale} className="p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    {LOCALE_FLAGS[locale]} {LOCALE_NAMES[locale]}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isOverride ? (
                      <>
                        <Badge className="text-[10px] bg-violet-100 text-violet-700 border-0">🔒 Human</Badge>
                        <button
                          type="button"
                          className="text-[10px] text-muted-foreground hover:text-destructive"
                          onClick={() => onToggleOverride(locale)}
                        >reset to AI</button>
                      </>
                    ) : value ? (
                      <Badge className="text-[10px] bg-green-100 text-green-700 border-0">✅ AI</Badge>
                    ) : (
                      <Badge className="text-[10px] bg-red-100 text-red-700 border-0">❌ Missing</Badge>
                    )}
                    {!isEditing && (
                      <button
                        type="button"
                        className="text-[10px] text-primary hover:underline"
                        onClick={() => setEditingLocale(locale)}
                      >edit</button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-1">
                    {isTextarea ? (
                      <Textarea
                        rows={rows ?? 3}
                        dir={locale === 'ar' ? 'rtl' : 'ltr'}
                        value={value ?? ''}
                        onChange={e => {
                          onTranslationChange(locale, e.target.value);
                          if (!isOverride) onToggleOverride(locale); // mark as human override
                        }}
                        className="text-sm rounded-lg"
                        autoFocus
                      />
                    ) : (
                      <Input
                        dir={locale === 'ar' ? 'rtl' : 'ltr'}
                        value={value ?? ''}
                        onChange={e => {
                          onTranslationChange(locale, e.target.value);
                          if (!isOverride) onToggleOverride(locale);
                        }}
                        className="text-sm rounded-lg"
                        autoFocus
                      />
                    )}
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => setEditingLocale(null)}
                    >Done</button>
                  </div>
                ) : (
                  <p
                    dir={locale === 'ar' ? 'rtl' : 'ltr'}
                    className="text-xs text-muted-foreground leading-relaxed"
                  >
                    {value || <span className="italic">No translation — will use Hebrew fallback</span>}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

### 5.3 Redesigned Conservatorium Profile Editor

**File:** `src/app/[locale]/dashboard/settings/conservatorium/profile/page.tsx`

The redesigned editor removes the separate "Translations" tab and integrates `TranslatedFieldInput` wherever the admin sees a translatable text field.

#### Layout Change: Remove "Translations" Tab

The `TabsList` loses the "Translations" tab. Instead, each editable text field gains the inline translation panel. The tabs become:

```
[Basic Info] [Contact] [Location] [Team] [Social] [Media]
```

#### Basic Info Tab — With Inline Translations

```tsx
<TabsContent value="basic">
  <Card>
    <CardHeader>
      <CardTitle>Basic Information</CardTitle>
      {isStaleMark && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4" />
          Content has changed since last translation.
          <button type="button" onClick={handleAutoTranslate} className="underline font-medium ml-auto">
            Re-translate now
          </button>
        </div>
      )}
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name (Hebrew — primary)</Label>
          <Input value={formData.name ?? ''} onChange={e => update('name', e.target.value)} dir="rtl" />
        </div>
        <div className="space-y-2">
          <Label>Name (English)</Label>
          <Input value={formData.nameEn ?? ''} onChange={e => update('nameEn', e.target.value)} dir="ltr" />
          <p className="text-xs text-muted-foreground">
            Note: Arabic and Russian names are auto-derived from the Hebrew name by the translation engine.
          </p>
        </div>
      </div>

      <TranslatedFieldInput
        label="About Us (description)"
        isTextarea
        rows={5}
        sourceValue={formData.about ?? ''}
        onSourceChange={v => update('about', v)}
        translations={{
          en: formData.translations?.en?.about,
          ar: formData.translations?.ar?.about,
          ru: formData.translations?.ru?.about,
        }}
        onTranslationChange={(locale, value) => updateTranslation(locale, 'about', value)}
        overrides={getOverrides('about')}
        onToggleOverride={locale => toggleOverride(locale, 'about')}
        isStalemark={isStaleMark}
        placeholder="Write a short description about the conservatorium..."
      />
    </CardContent>
  </Card>
</TabsContent>
```

#### Team Tab — With Inline Translations

```tsx
{/* Manager bio — with translation */}
<TranslatedFieldInput
  label="Manager Role / Title"
  sourceValue={formData.manager?.role ?? ''}
  onSourceChange={v => updateManager('role', v)}
  translations={{
    en: formData.translations?.en?.manager?.role,
    ar: formData.translations?.ar?.manager?.role,
    ru: formData.translations?.ru?.manager?.role,
  }}
  onTranslationChange={(locale, value) => updateNestedTranslation(locale, 'manager.role', value)}
  overrides={getOverrides('manager.role')}
  onToggleOverride={locale => toggleOverride(locale, 'manager.role')}
  placeholder="e.g. Director, מנהל"
/>

<TranslatedFieldInput
  label="Manager Bio"
  isTextarea
  rows={2}
  sourceValue={formData.manager?.bio ?? ''}
  onSourceChange={v => updateManager('bio', v)}
  translations={{
    en: formData.translations?.en?.manager?.bio,
    ar: formData.translations?.ar?.manager?.bio,
    ru: formData.translations?.ru?.manager?.bio,
  }}
  onTranslationChange={(locale, value) => updateNestedTranslation(locale, 'manager.bio', value)}
  overrides={getOverrides('manager.bio')}
  onToggleOverride={locale => toggleOverride(locale, 'manager.bio')}
/>
```

#### Contact Tab — Opening Hours Translation

```tsx
<TranslatedFieldInput
  label="Opening Hours"
  sourceValue={formData.openingHours ?? ''}
  onSourceChange={v => update('openingHours', v)}
  translations={{
    en: formData.translations?.en?.openingHours,
    ar: formData.translations?.ar?.openingHours,
    ru: formData.translations?.ru?.openingHours,
  }}
  onTranslationChange={(locale, value) => updateTranslation(locale, 'openingHours', value)}
  overrides={getOverrides('openingHours')}
  onToggleOverride={locale => toggleOverride(locale, 'openingHours')}
  placeholder="e.g. א׳-ה׳ 14:00-20:00"
/>
```

#### State Management Helpers

```typescript
// Translation state updaters — add to the editor component

const updateTranslation = (locale: string, field: string, value: string) => {
  setFormData(prev => ({
    ...prev,
    translations: {
      ...prev.translations,
      [locale]: {
        ...prev.translations?.[locale as keyof ConservatoriumTranslations],
        [field]: value,
      },
    },
  }));
};

const updateNestedTranslation = (locale: string, path: string, value: string) => {
  // e.g. path = 'manager.role'
  const [parent, child] = path.split('.');
  setFormData(prev => ({
    ...prev,
    translations: {
      ...prev.translations,
      [locale]: {
        ...prev.translations?.[locale as keyof ConservatoriumTranslations],
        [parent]: {
          ...(prev.translations?.[locale as keyof ConservatoriumTranslations] as any)?.[parent],
          [child]: value,
        },
      },
    },
  }));
};

const toggleOverride = (locale: string, field: string) => {
  setFormData(prev => {
    const currentOverrides = prev.translationMeta?.overrides ?? {};
    const localeOverrides = currentOverrides[locale] ?? [];
    const isCurrentlyOverridden = localeOverrides.includes(field);

    return {
      ...prev,
      translationMeta: {
        ...prev.translationMeta!,
        overrides: {
          ...currentOverrides,
          [locale]: isCurrentlyOverridden
            ? localeOverrides.filter(f => f !== field)   // remove override
            : [...localeOverrides, field],               // add override
        },
      },
    };
  });
};

const getOverrides = (field: string): string[] => {
  const overrides = formData.translationMeta?.overrides ?? {};
  return Object.keys(overrides).filter(locale => overrides[locale]?.includes(field));
};

// Stale detection
const isStaleMark = useMemo(() => {
  if (!formData.translationMeta?.sourceHash) return false;
  const currentHash = computeConservatoriumSourceHash(formData);
  return currentHash !== formData.translationMeta.sourceHash;
}, [formData]);
```

### 5.4 Translation Coverage Summary Panel

Add a **translation coverage card** to the top of the profile editor settings page (above the tabs), so admins immediately see overall status:

```
┌─────────────────────────────────────────────────────────────┐
│ Translation Coverage                      Last run: [date]  │
├─────────────────────────────────────────────────────────────┤
│  🇬🇧 English     ████████████░░  10/12 fields    ⚠️ 2 stale │
│  🇸🇦 Arabic      ████████░░░░░░   8/12 fields    🔒 2 manual│
│  🇷🇺 Russian     ████████████░░  10/12 fields    ✅ Fresh   │
│                                                             │
│  [Re-translate all stale fields]   [Translate missing only] │
└─────────────────────────────────────────────────────────────┘
```

**File:** `src/components/dashboard/harmonia/translation-coverage-card.tsx`

---

## 6. Teacher Profile Editor — Translation Extension

### 6.1 Changes to `teacher-profile-editor.tsx`

The teacher `bio` and `role` fields need the same inline translation treatment.

Add `TranslatedFieldInput` to the teacher profile form:

```tsx
// Replace the existing bio FormField with:
<TranslatedFieldInput
  label="ביוגרפיה קצרה (Biography)"
  isTextarea
  rows={5}
  sourceValue={form.watch('bio') ?? ''}
  onSourceChange={v => form.setValue('bio', v)}
  translations={{
    en: user?.translations?.en?.bio,
    ar: user?.translations?.ar?.bio,
    ru: user?.translations?.ru?.bio,
  }}
  onTranslationChange={(locale, value) => setUserTranslationOverride(locale, 'bio', value)}
  overrides={userBioOverrides}
  onToggleOverride={locale => toggleUserBioOverride(locale, 'bio')}
  placeholder="ספר/י על עצמך, על הניסיון והגישה הפדגוגית שלך..."
/>
```

The `onSubmit` handler for teacher profile is extended to:
1. Save the profile data.
2. If `bio` or `role` has changed (hash check), call `translateUserBio(bio, role)`.
3. Merge result into `user.translations` and `user.translationMeta`.
4. Call `updateUser()` with the full updated user object.

---

## 7. Public Rendering Layer

### 7.1 Content Resolution Utility

**File:** `src/lib/utils/localized-content.ts`

This utility centralizes the locale-aware content resolution logic so it is not duplicated across every component.

```typescript
import type { Conservatorium, ConservatoriumProfileTranslation, User, UserTranslations } from '@/lib/types';

export type SupportedLocale = 'he' | 'en' | 'ar' | 'ru';

/**
 * Returns the best available string for a field given the active locale.
 * Resolution order: locale → fallback locale(s) → source (Hebrew)
 */
export function resolveLocalizedString(
  source: string | undefined,
  translations: Record<string, string | undefined>,
  locale: SupportedLocale,
  fallbackLocale: SupportedLocale = 'en'
): string | undefined {
  if (locale === 'he') return source;
  return translations[locale] ?? translations[fallbackLocale] ?? source;
}

/**
 * Returns a locale-resolved view of a Conservatorium.
 * All string fields on the returned object reflect the active locale.
 * Non-translatable fields (id, email, tel, photoUrls, etc.) are passed through unchanged.
 */
export function getLocalizedConservatorium(
  cons: Conservatorium,
  locale: SupportedLocale
): Conservatorium {
  if (locale === 'he') return cons; // Hebrew is the source, no transformation needed

  const t = cons.translations?.[locale as keyof typeof cons.translations];
  const fallback = cons.translations?.en; // English as fallback for AR/RU if direct translation missing

  const resolve = (
    source: string | undefined,
    translated: string | undefined,
    fallbackTranslated?: string | undefined
  ) => translated ?? fallbackTranslated ?? source;

  return {
    ...cons,
    about: resolve(cons.about, t?.about, fallback?.about),
    openingHours: resolve(cons.openingHours, t?.openingHours, fallback?.openingHours),
    programs: t?.programs ?? fallback?.programs ?? cons.programs,
    ensembles: t?.ensembles ?? fallback?.ensembles ?? cons.ensembles,
    manager: cons.manager ? {
      ...cons.manager,
      role: resolve(cons.manager.role, t?.manager?.role, fallback?.manager?.role),
      bio: resolve(cons.manager.bio, t?.manager?.bio, fallback?.manager?.bio),
    } : undefined,
    pedagogicalCoordinator: cons.pedagogicalCoordinator ? {
      ...cons.pedagogicalCoordinator,
      role: resolve(cons.pedagogicalCoordinator.role, t?.pedagogicalCoordinator?.role, fallback?.pedagogicalCoordinator?.role),
      bio: resolve(cons.pedagogicalCoordinator.bio, t?.pedagogicalCoordinator?.bio, fallback?.pedagogicalCoordinator?.bio),
    } : undefined,
    departments: cons.departments?.map((d, i) => ({
      ...d,
      name: resolve(d.name, t?.departments?.[i]?.name, fallback?.departments?.[i]?.name) ?? d.name,
    })),
    branchesInfo: cons.branchesInfo?.map((b, i) => ({
      ...b,
      name: resolve(b.name, t?.branchesInfo?.[i]?.name, fallback?.branchesInfo?.[i]?.name) ?? b.name,
      address: resolve(b.address, t?.branchesInfo?.[i]?.address, fallback?.branchesInfo?.[i]?.address),
    })),
    // Teacher directory: resolve per-teacher role/bio
    teachers: cons.teachers?.map(teacher => ({
      ...teacher,
      role: locale === 'he'
        ? teacher.role
        : teacher.roleTranslations?.[locale] ?? teacher.roleTranslations?.en ?? teacher.role,
      bio: locale === 'he'
        ? teacher.bio
        : teacher.bioTranslations?.[locale] ?? teacher.bioTranslations?.en ?? teacher.bio,
    })),
  };
}

/**
 * Returns a locale-resolved bio and role for a User (teacher/admin).
 */
export function getLocalizedUserProfile(
  user: User,
  locale: SupportedLocale
): { bio?: string; role?: string } {
  if (locale === 'he') return { bio: user.bio, role: user.role };
  const t = user.translations?.[locale as keyof UserTranslations];
  const fallback = user.translations?.en;
  return {
    bio: t?.bio ?? fallback?.bio ?? user.bio,
    role: t?.role ?? fallback?.role ?? user.role,
  };
}
```

### 7.2 Fix: `about/page.tsx`

**Remove** the unused `useLocale` import placeholder and add actual locale-aware rendering:

```tsx
// BEFORE (broken)
import { useTranslations, useLocale } from 'next-intl';
// useLocale() is never called; cons.about is always rendered as-is

// AFTER (correct)
import { useTranslations, useLocale } from 'next-intl';
import { getLocalizedConservatorium } from '@/lib/utils/localized-content';
import type { SupportedLocale } from '@/lib/utils/localized-content';
```

In `ConservatoriumCard`:

```tsx
// Add locale prop
function ConservatoriumCard({
  cons, distance, onClick, locale
}: {
  cons: Conservatorium; distance?: number; onClick: () => void; locale: SupportedLocale;
}) {
  const localizedCons = getLocalizedConservatorium(cons, locale);
  // Now use localizedCons everywhere instead of cons for text fields:
  // localizedCons.about, localizedCons.departments, etc.
  // Non-text fields (id, tel, email, photoUrls) remain from `cons`
```

In `ConservatoriumDialog`:

```tsx
function ConservatoriumDialog({
  cons, open, onClose, locale
}: {
  cons: Conservatorium | null; open: boolean; onClose: () => void; locale: SupportedLocale;
}) {
  if (!cons) return null;
  const localizedCons = getLocalizedConservatorium(cons, locale);
  // use localizedCons for all text rendering
```

In `AboutPage` (main component):

```tsx
export default function AboutPage() {
  const locale = useLocale() as SupportedLocale; // ← ACTUALLY CALL THIS
  // ...

  // Pass locale down to cards and dialog
  return (
    // ...
    <ConservatoriumCard cons={cons} locale={locale} ... />
    // ...
    <ConservatoriumDialog cons={selectedCons} open={dialogOpen} onClose={...} locale={locale} />
  );
}
```

#### Department Filter Chips — Locale-Aware

The current filter chip list:
```typescript
const ALL_DEPARTMENTS = Array.from(
    new Set(conservatoriums.flatMap(c => c.departments?.map(d => d.name) || []))
).sort();
```

This always produces Hebrew department names. Replace with:

```typescript
// In AboutPage, after locale is resolved:
const ALL_DEPARTMENTS = useMemo(() => {
  const seen = new Set<string>();
  const items: Array<{ sourceKey: string; displayName: string }> = [];

  conservatoriums.forEach(c => {
    c.departments?.forEach((d, i) => {
      const displayName = locale === 'he'
        ? d.name
        : c.translations?.[locale]?.departments?.[i]?.name
          ?? c.translations?.en?.departments?.[i]?.name
          ?? d.name;

      if (!seen.has(d.name)) {
        seen.add(d.name);
        items.push({ sourceKey: d.name, displayName });
      }
    });
  });

  return items.sort((a, b) => a.displayName.localeCompare(b.displayName));
}, [locale]);

// Filter logic now uses sourceKey (always Hebrew) for matching, displayName for rendering:
const deptFilter = useState<string>(''); // stores sourceKey, not display name
// ...
{ALL_DEPARTMENTS.slice(0, 15).map(dept => (
  <button
    key={dept.sourceKey}
    onClick={() => setDeptFilter(deptFilter === dept.sourceKey ? '' : dept.sourceKey)}
    className={...}
  >
    {dept.displayName}
  </button>
))}
```

### 7.3 Fix: `contact/page.tsx` — `ConservatoriumInfo` Component

```tsx
// Add locale prop to ConservatoriumInfo
function ConservatoriumInfo({ cons, locale }: { cons: Conservatorium; locale: SupportedLocale }) {
  const localizedCons = getLocalizedConservatorium(cons, locale);
  // Use localizedCons.about, localizedCons.manager etc. for all text
  // Use cons.tel, cons.email, cons.officialSite (non-translatable) directly
```

In `ContactPage`:
```tsx
export default function ContactPage() {
  const locale = useLocale() as SupportedLocale; // ← add this
  // ...
  <ConservatoriumInfo cons={selectedCons} locale={locale} />
```

### 7.4 Fix: Hardcoded Hebrew UI Labels

All structural labels in the About/Contact page components (not UGC, but UI labels) must move to i18n message files.

#### New i18n keys to add to all locale files

**`src/messages/he.json`** — add under new top-level key `PublicProfiles`:
```json
"PublicProfiles": {
  "contactDetails": "פרטי יצירת קשר",
  "management": "הנהלה",
  "about": "אודות",
  "departments": "מחלקות ותחומי לימוד",
  "programs": "תוכניות לימוד",
  "branches": "שלוחות",
  "teachers": "צוות מורים",
  "contactThisConservatorium": "צור קשר עם קונסרבטוריון זה",
  "officialSite": "אתר רשמי",
  "moreTeachers": "+{count} מורים נוספים",
  "searchPlaceholder": "חיפוש לפי שם עיר, שם קונסרבטוריון...",
  "locationFilterPlaceholder": "מיין לפי עיר...",
  "locating": "מאתר...",
  "sortedByLocation": "ממוין לפי מיקום",
  "currentLocation": "מיקום נוכחי",
  "allFilters": "הכל",
  "clearFilters": "נקה סינון",
  "noResults": "לא נמצאו קונסרבטוריונים תואמים",
  "heroTitle": "מוצאים את הקונסרבטוריון שלכם",
  "heroSubtitle": "רשת הקונסרבטוריונים של הרמוניה — חינוך מוסיקלי מקצועי לכל הגילאים"
}
```

**`src/messages/en.json`** — add:
```json
"PublicProfiles": {
  "contactDetails": "Contact Details",
  "management": "Management",
  "about": "About",
  "departments": "Departments & Study Areas",
  "programs": "Study Programs",
  "branches": "Branches",
  "teachers": "Teaching Staff",
  "contactThisConservatorium": "Contact This Conservatorium",
  "officialSite": "Official Website",
  "moreTeachers": "+{count} more teachers",
  "searchPlaceholder": "Search by city or conservatorium name...",
  "locationFilterPlaceholder": "Sort by city...",
  "locating": "Locating...",
  "sortedByLocation": "Sorted by distance",
  "currentLocation": "Use my location",
  "allFilters": "All",
  "clearFilters": "Clear filters",
  "noResults": "No conservatoriums found",
  "heroTitle": "Find your conservatorium",
  "heroSubtitle": "The Lyriosa conservatorium network — professional music education for all ages"
}
```

(Arabic and Russian equivalents follow the same structure.)

In components:
```tsx
const t = useTranslations('PublicProfiles');
// ...
<h4>{t('contactDetails')}</h4>
<h4>{t('management')}</h4>
// etc.
```

---

## 8. i18n Coverage Verification

### 8.1 Lint Rule for Hardcoded Strings

Add an ESLint rule (or a custom check in CI) that flags JSX text content inside components under `src/app/[locale]/about/` and `src/app/[locale]/contact/` that are not wrapped in `t()` calls:

```javascript
// .eslintrc additions
{
  "rules": {
    "i18next/no-literal-string": ["warn", {
      "includePaths": ["src/app/**/about/**", "src/app/**/contact/**"],
      "markupOnly": true
    }]
  }
}
```

### 8.2 Translation Completeness Test

Add a test to `tests/` that verifies all keys in `he.json` exist in `en.json`, `ar.json`, and `ru.json`:

```typescript
// tests/i18n-completeness.test.ts
import he from '../src/messages/he.json';
import en from '../src/messages/en.json';
import ar from '../src/messages/ar.json';
import ru from '../src/messages/ru.json';

function getAllKeys(obj: any, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && !Array.isArray(v)
      ? getAllKeys(v, prefix ? `${prefix}.${k}` : k)
      : [prefix ? `${prefix}.${k}` : k]
  );
}

describe('i18n completeness', () => {
  const heKeys = getAllKeys(he);
  ['en', 'ar', 'ru'].forEach(locale => {
    const localeKeys = getAllKeys(locale === 'en' ? en : locale === 'ar' ? ar : ru);
    it(`${locale} has all keys from he.json`, () => {
      const missing = heKeys.filter(k => !localeKeys.includes(k));
      expect(missing).toEqual([]);
    });
  });
});
```

---

## 9. Summary of All Files Changed

| File | Change Type | Description |
|---|---|---|
| `src/lib/types.ts` | Extend | Expand `ConservatoriumTranslations`, add `ConservatoriumProfileTranslation`, `TranslationMeta`, `UserTranslations`, `UserProfileTranslation`, `TeacherDirectoryProfile.roleTranslations/bioTranslations` |
| `src/app/actions/translate.ts` | Replace | Replace stub with real Gemini integration — `translateConservatoriumProfile` and `translateUserBio` |
| `src/lib/utils/localized-content.ts` | New | `getLocalizedConservatorium`, `getLocalizedUserProfile`, `resolveLocalizedString` |
| `src/lib/utils/translation-hash.ts` | New | `computeConservatoriumSourceHash`, `computeUserSourceHash` |
| `src/components/dashboard/harmonia/translated-field-input.tsx` | New | Inline translation preview/edit panel component |
| `src/components/dashboard/harmonia/translation-coverage-card.tsx` | New | Top-of-editor translation coverage summary widget |
| `src/app/[locale]/dashboard/settings/conservatorium/profile/page.tsx` | Redesign | Integrate `TranslatedFieldInput` per field; remove Translations tab; add stale detection; auto-translate on save |
| `src/components/dashboard/harmonia/teacher-profile-editor.tsx` | Extend | Add `TranslatedFieldInput` for `bio` and `role`; hook `translateUserBio` into save flow |
| `src/app/[locale]/about/page.tsx` | Fix | Actually call `useLocale()`; pass locale to all child components; use `getLocalizedConservatorium`; locale-aware department filter chips; replace hardcoded labels with `t()` |
| `src/app/[locale]/contact/page.tsx` | Fix | Add `useLocale()`; pass locale to `ConservatoriumInfo`; replace hardcoded labels with `t()` |
| `src/messages/he.json` | Extend | Add `PublicProfiles` namespace |
| `src/messages/en.json` | Extend | Add `PublicProfiles` namespace |
| `src/messages/ar.json` | Extend | Add `PublicProfiles` namespace |
| `src/messages/ru.json` | Extend | Add `PublicProfiles` namespace |
| `tests/i18n-completeness.test.ts` | New | CI test for translation key parity |
| `.eslintrc` | Extend | Lint rule to flag hardcoded strings in public page components |

---

## 10. Acceptance Criteria

| # | Criterion | How to Verify |
|---|---|---|
| AC-01 | A user who switches to Arabic via the language switcher on `/about` sees the conservatorium's "About Us" text in Arabic. | Manual QA — switch locale, inspect card content |
| AC-02 | A Russian speaker on `/contact` selecting a conservatorium sees the manager bio and opening hours in Russian. | Manual QA |
| AC-03 | All structural UI labels on `/about` and `/contact` (headings, button labels, placeholders) are in the active locale — zero hardcoded Hebrew strings remain. | ESLint lint pass; manual spot-check |
| AC-04 | Department filter chips on `/about` display in the active locale's language. | Manual QA — switch to English, check chip labels |
| AC-05 | Admin saves a new "About Us" paragraph → profile is saved → within 10 seconds, translations appear in EN/AR/RU with ✅ AI status badge in the editor. | Manual admin flow |
| AC-06 | Admin manually edits the Arabic "About Us" translation → field shows 🔒 Human badge → subsequent auto-translate run does NOT overwrite the manual edit. | Unit test on `translateConservatoriumProfile` with existing overrides |
| AC-07 | Admin changes the "About Us" content → a ⚠️ Stale banner appears → clicking "Re-translate" refreshes only the changed fields. | Manual admin flow |
| AC-08 | Teacher saves an updated bio → `user.translations` is updated within 10 seconds with EN/AR/RU translations. | Manual teacher profile flow |
| AC-09 | `tests/i18n-completeness.test.ts` passes in CI with zero missing keys across all 4 locale files. | CI pipeline |
| AC-10 | `getLocalizedConservatorium('he')` returns the original object with zero transformation (no performance overhead for Hebrew users). | Unit test |

---

*End of SDD-i18n-PROFILES — Multilingual Public Profiles*
*Depends on: existing next-intl setup, Gemini API key in env (`GEMINI_API_KEY`), `src/lib/types.ts`*
*Next SDD in series: SDD-i18n-02 — Multilingual Form Builder & Notification Templates*
