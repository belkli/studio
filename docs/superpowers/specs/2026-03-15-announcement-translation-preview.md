# Announcement Composer — Translation Preview UX Spec

**Author:** UX & Accessibility Agent
**Date:** 2026-03-15
**Status:** Design Decision
**Component:** `src/components/dashboard/harmonia/announcement-composer.tsx`

---

## 1. Current State

The announcement composer allows admins to write title+body in their locale, click "Auto-translate", and see translations for en/ar/ru below the form in a flat stacked list. Translations are currently **read-only** — no inline editing, no RTL-specific rendering, no per-locale expansion.

---

## 2. Design Decisions

### D1: Translations are editable inline

**Decision:** Yes, translations should be editable inline after auto-translate.

**Rationale:** Admins with bilingual staff often want to tweak a phrase without re-running the full translation. Making them editable reduces friction.

**UX signal for overrides:** A small visual indicator distinguishes auto-translated vs. manually edited content:
- Auto-translated: light muted border, small "AI" badge
- Manually edited: indigo border-start accent, "Edited" badge replaces "AI"

### D2: Show all 4 locales, but mark which are active

**Decision:** Always show all 4 locale previews. If the conservatorium only has students using 2 locales, the unused ones are shown with reduced opacity and a note: "No students use this language."

**Rationale:** Admin may not know student demographics precisely. Showing all locales avoids accidental omission. The dimmed treatment prevents cognitive overload for irrelevant locales.

### D3: Layout — Accordion, not side-by-side

**Decision:** Use `Accordion` with each locale as an item. The source locale (admin's current locale) is shown first and expanded by default. Other locales are collapsed but expandable.

**Rationale for accordion over side-by-side:**
- Side-by-side requires 4 columns — unusable on mobile (375px)
- Side-by-side creates reading confusion between RTL and LTR content
- Accordion lets admin focus on one translation at a time
- Accordion scales cleanly from 2 to 10+ locales

### D4: No "Send test notification" button (defer)

**Decision:** Defer to a later sprint. The preview within the composer is sufficient for v1. A test notification feature requires backend notification infrastructure that is not yet built.

### D5: Partial translation failure — show partial preview

**Decision:** If translation fails for one locale (e.g., API error for Russian), show the successfully translated locales and display an error badge + retry button on the failed locale.

**Rationale:** Blocking the entire send because one translation failed is too aggressive. Admin can still send to the locales that succeeded, or retry the failed one.

---

## 3. Component Layout

### Composer Form (unchanged)

```
+-------------------------------------------------+
| Announcement Composer                           |
| Send announcements to students, parents, ...    |
+-------------------------------------------------+
| Title:    [________________________________]    |
| Body:     [________________________________]    |
|           [________________________________]    |
|           [________________________________]    |
|                                                 |
| [Languages icon] Auto-translate                 |
|   AI translations may need review.              |
+-------------------------------------------------+
```

### Translation Preview (new design — Accordion)

```
+-------------------------------------------------+
| Translation Preview                              |
+-------------------------------------------------+
| v  Hebrew (source)                          [AI] |
|    +-----------------------------------------+  |
|    | Title: [editable input, RTL]            |  |
|    | Body:  [editable textarea, RTL]         |  |
|    +-----------------------------------------+  |
|                                                  |
| >  English                                  [AI] |
|                                                  |
| >  Arabic                              [Edited] |
|                                                  |
| >  Russian                         [! Retry]    |
|    (Translation failed. Click to retry.)         |
+-------------------------------------------------+
```

### Expanded Locale Item

```
+-------------------------------------------------+
| v  Arabic                               [Edited]|
|    +-----------------------------------------+  |
|    | dir="rtl"                               |  |
|    | Title: [editable input]                 |  |
|    | Body:  [editable textarea, 4 rows]      |  |
|    |                                         |  |
|    | [Revert to AI translation]              |  |
|    +-----------------------------------------+  |
+-------------------------------------------------+
```

### Mobile (375px)

Accordion is already mobile-friendly — full-width, one locale at a time. No layout changes needed.

---

## 4. Interaction Details

### Edit flow
1. Admin types title + body in source locale
2. Clicks "Auto-translate" button
3. Translation preview section appears below as an Accordion
4. Source locale is expanded first (non-editable — it's the form fields above)
5. Admin expands any locale to review
6. Admin edits a field -> badge changes from "AI" to "Edited", border accent changes
7. "Revert to AI translation" link appears in edited locale items

### Revert flow
1. Admin clicks "Revert to AI translation" on an edited locale
2. Fields reset to the last auto-translated values
3. Badge reverts to "AI", border accent removed

### Retry flow (partial failure)
1. One locale shows error badge with "Retry" button
2. Admin clicks "Retry" -> spinner on that locale only
3. On success: locale content populates, badge becomes "AI"
4. On repeated failure: toast with error message, locale stays in error state

### Submit flow
1. Admin clicks "Send Announcement"
2. Payload includes: source content + translations object (with any manual edits)
3. `translatedByAI: true` flag set if any AI translation was used
4. `manuallyEdited: ['ar']` array tracks which locales were hand-edited

---

## 5. RTL Behavior

**Critical:** Each locale preview must render in its own text direction.

| Locale | Direction |
|--------|-----------|
| he | RTL |
| en | LTR |
| ar | RTL |
| ru | LTR |

Implementation: Each accordion item's content area gets `dir={localeDir}` where:
```ts
const localeDir = (lang === 'he' || lang === 'ar') ? 'rtl' : 'ltr';
```

The accordion trigger (locale name + badge) follows the **page's** direction, not the locale's direction. Only the content area (title input, body textarea) flips.

---

## 6. Empty State — No Translations Yet

Before clicking "Auto-translate":

```
+-------------------------------------------------+
| Translation Preview                              |
|                                                  |
|   (Languages icon, muted)                        |
|   Click "Auto-translate" above to generate       |
|   translations for all locales.                  |
+-------------------------------------------------+
```

After translations are cleared (form reset):
- Translation preview section is hidden entirely (back to initial state)

---

## 7. Accessibility

- **Accordion**: uses `Accordion` from shadcn/ui (Radix primitive), keyboard-navigable by default
- **Editable fields**: proper `<label>` elements per locale (`aria-label={t('translationTitle', { locale: lang })}`)
- **Badge distinction**: "AI" vs "Edited" badges use both color AND text (not color-only)
- **Error state**: error badge includes `role="alert"` and descriptive text
- **Retry button**: `aria-label={t('retryTranslation', { locale: lang })}`
- **Revert link**: `aria-label={t('revertToAI', { locale: lang })}`
- **Focus**: after expanding an accordion item, focus moves to the first editable field in that locale

---

## 8. i18n String Keys

### Namespace: `AnnouncementComposer`

Already existing keys (keep):
- `title`, `description`
- `formLabels.title`, `formLabels.body`, `formLabels.targetAudience`, `formLabels.channels`
- `placeholders.title`, `placeholders.body`, `placeholders.targetAudience`
- `audiences.*`, `channels.*`, `errors.*`
- `autoTranslateBtn`, `autoTranslating`, `autoTranslateSuccess`, `autoTranslateError`
- `aiDisclaimer`, `translationPreviewTitle`
- `submitBtn`, `successToast`, `successDesc`, `noPermission`

New keys needed:
- `translationPreviewEmpty` — "Click 'Auto-translate' above to generate translations for all locales."
- `localeNames.he` — "Hebrew"
- `localeNames.en` — "English"
- `localeNames.ar` — "Arabic"
- `localeNames.ru` — "Russian"
- `sourceLocale` — "(source)"
- `aiBadge` — "AI"
- `editedBadge` — "Edited"
- `revertToAI` — "Revert to AI translation"
- `retryTranslation` — "Retry"
- `translationFailed` — "Translation failed. Click to retry."
- `translationTitle` — "Title in {locale}"
- `translationBody` — "Body in {locale}"
- `noStudentsInLocale` — "No students use this language"
- `manuallyEditedLocales` — "You manually edited {locales}"

---

## 9. Component Summary

| Component | Pattern | Notes |
|-----------|---------|-------|
| Translation preview | `Accordion` (multi, collapsible) | Replace current flat stacked list |
| Locale item content | `Input` + `Textarea` + `dir` attribute | Each locale gets its own direction |
| Badge | `Badge` variant="outline" | "AI" (muted) or "Edited" (indigo) |
| Error state | `Badge` variant="destructive" + `Button` retry | Per-locale error handling |
| Revert link | `Button` variant="link" size="sm" | Only visible when locale is manually edited |

---

## 10. Product Requirements (PM)

### User Stories

**US-1:** As a conservatorium admin, I want to edit the AI-generated translations before publishing an announcement, so that I can fix errors or improve wording without losing the AI baseline.

**US-2:** As a conservatorium admin, I want to retry the translation if the API fails, so that I'm not stuck without translations due to a transient network error.

**US-3:** As a conservatorium admin, I want to publish an announcement even if translation fails, so that Hebrew-speaking users are not blocked by a translation issue.

**US-4:** As a conservatorium admin, I want to see which translations are AI-generated vs. manually edited, so that I know which ones to double-check.

**US-5:** As a parent/student reading an announcement in Arabic/Russian/English, I want to know if the translation was machine-generated, so that I understand there may be minor inaccuracies.

### Acceptance Criteria (PM additions)

**AC-PM1: Publish without translations fallback**
- Given all translations failed
- When admin clicks "Send Announcement"
- Then the announcement is published with Hebrew content only
- And a confirmation dialog warns: "This announcement will be sent in Hebrew only. Continue?"

**AC-PM2: AI disclaimer shown to recipients**
- Given an announcement with `translatedByAI: true` on the Arabic locale
- When a parent reads it in Arabic
- Then a subtle footer note appears: "This translation was automatically generated and may contain inaccuracies"

**AC-PM3: Stale translation warning**
- Given an admin who generated translations and then modified the Hebrew title
- When they look at the translation panel
- Then a warning appears: "Source text has changed since translations were generated. Re-translate?"

### Edge Cases

| Edge Case | Handling |
|-----------|---------|
| Admin auto-translates, then changes the Hebrew body significantly | Show yellow warning: "Source text changed. Translations may be outdated." with re-translate button |
| Translation API rate limited | Toast: "Translation service is temporarily busy. Try again in a moment." No auto-retry. |
| Very long announcement body (>5000 chars) | Truncate preview to first 500 chars with "Show full" expander. Full text stored. |
| RTL rendering in Arabic preview | Arabic card textarea must have `dir="rtl"`. English and Russian cards have `dir="ltr"`. |
| Announcement already published, admin wants to edit translations | Not v1. Announcements are immutable after send. |

### State Machine for Translation Panel

```
IDLE (no translations generated)
  |-- admin clicks "Auto-translate" --> TRANSLATING

TRANSLATING (loading spinner)
  |-- all 3 succeed --> TRANSLATED
  |-- partial success --> PARTIAL_TRANSLATED
  |-- all fail --> TRANSLATION_FAILED

TRANSLATED (all 3 languages available, editable)
  |-- admin edits a field --> TRANSLATED (with editedByHuman flag per language)
  |-- admin changes source Hebrew text --> STALE_WARNING

PARTIAL_TRANSLATED (some languages available)
  |-- admin clicks retry on failed language --> TRANSLATING (single language)
  |-- admin publishes --> Hebrew + available translations

TRANSLATION_FAILED
  |-- admin clicks retry --> TRANSLATING
  |-- admin publishes without translations --> Hebrew only

STALE_WARNING (source text changed)
  |-- admin clicks "Re-translate all" --> TRANSLATING
  |-- admin dismisses warning --> TRANSLATED (unchanged translations)
```

### v1 vs v2

**v1 (ship now):**
- Editable translation cards (title + body per language)
- "AI-generated" / "Manually edited" badge per language
- Retry button on failure
- Publish without translations fallback
- Stale warning when source text changes
- AI disclaimer on recipient view

**v2 (future):**
- Per-language re-translate button (re-translate just one language)
- Translation memory: reuse previous translations for similar phrases
- Post-publish translation editing (within grace period)
- Quality scoring via back-translation check

### Data Model Change (for Architect)

```typescript
// Current
translations?: { en?: AnnouncementContent; ar?: AnnouncementContent; ru?: AnnouncementContent };
translatedByAI?: boolean; // single flag for all

// Proposed
translations?: {
  en?: AnnouncementContent & { translatedByAI: boolean; editedByHuman: boolean };
  ar?: AnnouncementContent & { translatedByAI: boolean; editedByHuman: boolean };
  ru?: AnnouncementContent & { translatedByAI: boolean; editedByHuman: boolean };
};
```

### API Response Change (for Architect)

`translateAnnouncement()` should return per-locale results for partial failure handling:
```typescript
{
  results: {
    en: { success: boolean; content?: AnnouncementContent; error?: string };
    ar: { success: boolean; content?: AnnouncementContent; error?: string };
    ru: { success: boolean; content?: AnnouncementContent; error?: string };
  }
}
```

### Security Considerations
- AI-generated translations must be sanitized for XSS before rendering
- Rate limit translation API calls: max 5 calls per announcement per minute
- Translation content subject to same tenant isolation as the announcement itself

---

## 11. Security UX Addendum — PII Detection Warning (SEC-CONSTRAINT-4)

### Problem

When an admin clicks "Auto-translate", the announcement body is sent to Google's Gemini AI for translation. If the body contains PII (phone numbers, national ID numbers, email addresses), that PII is transmitted to an external service. Admins may not realize this.

### Design Decision: Pre-translation PII scan with blocking warning

**Decision:** Before sending text to the translation API, run a client-side regex scan for common PII patterns. If PII is detected, show a blocking warning dialog that the admin must acknowledge before translation proceeds.

**Rationale:** This is a data-protection requirement. The warning must be explicit because (a) Israeli PDPPA requires informed consent for data transmission to third parties, and (b) admins may paste parent phone numbers or student ID numbers into announcement bodies without thinking about the translation pipeline.

### PII Detection Patterns

```typescript
const PII_PATTERNS = [
  { type: 'phone', regex: /(?:\+972|0)[- ]?\d{1,2}[- ]?\d{3}[- ]?\d{4}/g },
  { type: 'israeliId', regex: /\b\d{9}\b/g },
  { type: 'email', regex: /[\w.-]+@[\w.-]+\.\w{2,}/g },
];
```

The scan runs on the combined title + body text before the `translateAnnouncement()` call.

### Warning Dialog UX

```
+---------------------------------------------------+
| (ShieldAlert icon, amber)                          |
|                                                    |
|  Personal information detected                     |
|                                                    |
|  Your announcement appears to contain:             |
|  - Phone number (1 match)                          |
|  - Email address (2 matches)                       |
|                                                    |
|  Auto-translate sends this text to Google AI       |
|  for processing. Consider removing personal        |
|  information before translating.                   |
|                                                    |
|  [Remove PII & translate]  [Translate anyway]      |
|                             [Cancel]               |
+---------------------------------------------------+
```

### Interaction Flow

1. Admin clicks "Auto-translate"
2. Client-side PII scan runs on title + body
3. **No PII detected:** proceed directly to translation (no dialog)
4. **PII detected:** show `AlertDialog` with findings
   - "Remove PII & translate" — not implemented in v1; button is disabled with tooltip "Coming in a future update". Included in wireframe for future intent.
   - "Translate anyway" — admin acknowledges the risk, translation proceeds. Log acknowledgment to `ConsentRecord`.
   - "Cancel" — returns to composer, no translation triggered.

### State Machine Update

Add a new transition from IDLE:

```
IDLE (no translations generated)
  |-- admin clicks "Auto-translate" --> PII_CHECK

PII_CHECK (client-side scan, instant)
  |-- no PII found --> TRANSLATING
  |-- PII found --> PII_WARNING_SHOWN

PII_WARNING_SHOWN (dialog open)
  |-- admin clicks "Translate anyway" --> TRANSLATING (log consent)
  |-- admin clicks "Cancel" --> IDLE
```

### Accessibility

- `AlertDialog` from shadcn/ui (Radix) — traps focus, Escape to cancel
- PII type list uses `<ul>` with `role="list"` for screen readers
- "Translate anyway" button has `aria-label={t('translateDespitePii')}`
- Warning icon is decorative (`aria-hidden="true"`), the heading conveys meaning

### i18n Keys (new)

Namespace: `AnnouncementComposer`

- `piiWarningTitle` — "Personal information detected"
- `piiWarningDesc` — "Your announcement appears to contain:"
- `piiWarningFooter` — "Auto-translate sends this text to Google AI for processing. Consider removing personal information before translating."
- `piiTypePhone` — "Phone number ({count} match)"
- `piiTypeEmail` — "Email address ({count} matches)"
- `piiTypeId` — "ID number ({count} matches)"
- `translateDespitePii` — "Translate anyway"
- `removePiiAndTranslate` — "Remove PII & translate"
- `removePiiComingSoon` — "Coming in a future update"
- `cancelTranslation` — "Cancel"

### Component Summary

| Component | Pattern | Notes |
|-----------|---------|-------|
| PII warning | `AlertDialog` | Blocking, must acknowledge before translate |
| PII list | `<ul>` inside AlertDialog body | One `<li>` per PII type found |
| "Translate anyway" | `AlertDialogAction` | Logs consent, proceeds to TRANSLATING |
| "Cancel" | `AlertDialogCancel` | Returns to IDLE |
| "Remove PII" | `Button` disabled | v2 feature — disabled with tooltip |

---

## UI/UX Pro Max Review (Main Session)

**Design System Applied:** Data-Dense Dashboard · Harmonia palette · shadcn/ui

### UX Quality Checklist

| Check | Status |
|---|---|
| 44px touch targets on "Translate", "Publish", per-locale retry buttons | ⚠️ enforce |
| `blur` validation on editable translation fields | ⚠️ missing from spec — add |
| Loading state on "Auto-translate" button (async API call) | ✅ implied, specify explicitly |
| `prefers-reduced-motion` on accordion open/close | ⚠️ add |
| Character count on translated body textarea | ⚠️ add — push notifications have char limits |
| `role="alert"` on per-locale failure state | ⚠️ add |
| Stale translation warning is visually distinct from error | ⚠️ clarify: amber for stale, red for error |

### Accordion Item: Precise Component Spec

```tsx
<AccordionItem value={locale}>
  <AccordionTrigger className="hover:no-underline">
    <div className="flex items-center gap-3 w-full">
      {/* Flag or language code */}
      <span className="text-sm font-medium w-8 shrink-0">{localeLabel}</span>
      {/* Status badge */}
      {isError && <Badge variant="destructive" className="text-xs">{t('translationFailed')}</Badge>}
      {isStale && <Badge variant="outline" className="text-xs border-amber-400 text-amber-600">{t('translationStale')}</Badge>}
      {isEdited && <Badge variant="secondary" className="text-xs">{t('manuallyEdited')}</Badge>}
      {isAI && !isEdited && !isStale && <Badge variant="outline" className="text-xs">{t('aiGenerated')}</Badge>}
      {/* Preview of title — truncated */}
      <span className="text-sm text-muted-foreground truncate ms-auto pe-2">{translation?.title}</span>
    </div>
  </AccordionTrigger>
  <AccordionContent>
    {/* dir set per locale */}
    <div dir={isRtlLocale(locale) ? 'rtl' : 'ltr'} className="space-y-3">
      <Input value={title} onChange={...} onBlur={validate} />
      <div className="relative">
        <Textarea value={body} onChange={...} onBlur={validate} />
        <span className="absolute bottom-2 end-2 text-xs text-muted-foreground tabular-nums">
          {body.length}/500
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={revert}>{t('revertToAI')}</Button>
    </div>
  </AccordionContent>
</AccordionItem>
```

### Stale vs Error States (Visual Distinction)

- **Stale** (source text changed after translation): amber `⚠ Outdated` badge + amber left border on accordion item. Non-blocking — admin can publish with stale translation.
- **Error** (API failed): red `✗ Failed` badge + red left border + inline retry button. Non-blocking — admin can publish without this locale (falls back to Hebrew).
- **Edited** (human override): gray `✎ Edited` badge. No border change. Revert link available.
- **AI fresh**: subtle `✦ AI` badge in muted color. No border.

### Auto-translate Button States

```
Default:      [✦ Auto-translate all]
Loading:      [⟳ Translating...] (disabled, spinner)  
Partial fail: [⟳ Retry failed (2)]
All done:     [✓ Translated] (disabled, green icon)
```

The button text should update in real-time as locales complete (streaming feel even if batch).

### Push Notification Character Limits (NEW — missing from spec)

Push notifications have platform limits: iOS/Android typically 100 chars for title, 250 for body. Add:
- Soft warning at 80% of limit: amber character counter
- Hard block at 100%: counter turns red, cannot type more
- This applies to ALL locales independently (Hebrew can be more compact than English for same meaning)

Add to `AnnouncementComposer` i18n namespace:
```json
"charLimitWarning": "קרוב למגבלת התווים",
"charLimitExceeded": "חרגת ממגבלת התווים"
```
