# Design: Data Import & Legal Compliance Sprint

**Date:** 2026-03-08
**Status:** Approved
**Author:** Architect

---

## Overview

Four parallel tracks to:
1. Import 267 new teachers (10 conservatoriums) into mock and SQL seed
2. Patch website URLs for 12 conservatoriums
3. Achieve full LEGAL-READINESS.md compliance via document analysis, standard contract authoring, and technical implementation
4. QA gate — typecheck, ESLint, unit tests, Playwright e2e, build

---

## Track 1 — New Teacher Import

### Scope
10 CSV files in `docs/data/new/teachers/`, ~267 teachers total:

| CSV file | Conservatorium | `cons-id` | `a-uuid` |
|----------|---------------|-----------|---------|
| אשדוד | אקדמא | cons-2 | a1000000-0000-0000-0000-000000000002 |
| באר שבע | קונסרבטוריון באר שבע | cons-7 | a1000000-0000-0000-0000-000000000007 |
| בית שמש | קונסרבטוריון בית שמש | cons-9 | a1000000-0000-0000-0000-000000000009 |
| ברנר | מרכז המוסיקה ברנר | cons-10 | a1000000-0000-0000-0000-000000000010 |
| בת ים | קונסרבטוריון בת-ים | cons-11 | a1000000-0000-0000-0000-000000000011 |
| גליל עליון | קלור גליל עליון | cons-14 | a1000000-0000-0000-0000-000000000014 |
| דימונה | קונסרבטוריון דימונה | cons-13 | a1000000-0000-0000-0000-000000000013 |
| הרצליה | מרכז תאו הרצליה | cons-17 | a1000000-0000-0000-0000-000000000017 |
| זכרון יעקב | זמארין זכרון יעקב | cons-18 | a1000000-0000-0000-0000-000000000018 |
| ערבה | מרכז קהילה ערבה | cons-16 | a1000000-0000-0000-0000-000000000016 |

### CSV Schema
```
First Name, Last Name, Department, Instruments, Description (JSON: {"he":"..."})
```

### ID Scheme
- **Teacher UUIDs:** Continue from `c1000000-0000-0000-0000-000000000069` (68 already in seed.sql)
- **Email:** `teacher-{consNumericId}-{NNNN}@harmonia.local` (e.g. `teacher-7-0001@harmonia.local`)
- **Avatar:** `https://i.pravatar.cc/150?u=teacher-{consId}-{seq}` (deterministic, no real photos in CSV)

### Translation
- Offline script using Anthropic Claude Haiku (same pattern as `scripts/translate-compositions.mjs`)
- Translates: `firstName`, `lastName`, `bio` from Hebrew → en/ar/ru
- Output: `scripts/teachers/generated-teachers.json`

### Outputs
1. **`scripts/import-teachers.mjs`** — new script: reads CSVs → calls Claude Haiku → writes JSON + SQL
2. **`scripts/teachers/generated-teachers.json`** — intermediate generated data (committed)
3. **`scripts/db/seed.sql`** — append `INSERT INTO users` + `INSERT INTO teacher_profiles` blocks for all 267 teachers
4. **`src/lib/data.ts`** — extend `directoryTeacherUsers` array with all 267 teachers as `User` objects
5. **`src/lib/data.ts`** — update conservatorium `leadingTeam[]` / `departments[]` from Department column

### Availability Generation
Teachers get realistic generated availability slots (2–3 slots/week, SUN–THU, 14:00–21:00 range). Same pattern as existing `dir-teacher-001..071`.

---

## Track 2 — Website URL Patch

### Scope
12 conservatoriums from `docs/data/new/site/גירוד מורים ממרכז המוסיקה - אתרים (1).csv`:

| City | URL |
|------|-----|
| אור עקיבא | https://tsahgertner.wixsite.com/musicoa |
| אשדוד | https://www.akadma.co.il/ |
| אשקלון | https://ironitash.org.il/konser-ashkelon/ |
| באר שבע | https://cons-bs.my.canva.site/conservatory-beer-sheva |
| בית שמש | https://www.matnasbs.org.il/52/ |
| בת ים | https://www.tarbut-batyam.co.il/?CategoryID=405 |
| גבעתיים | https://www.kehilatayim.org.il/62/ |
| דימונה | https://www.matnas-dimona.org.il/page.php?type=matClass&id=909 |
| גליל עליון | https://clore.galil-elion.org.il/מוסיקה/ |
| ערבה | https://arava.smarticket.co.il/חוגי_קונסרבטוריון_ערבה__ |
| הרצליה | https://teo.org.il/conservatory/ |
| זכרון יעקב | https://www.zamarin.org.il/html5/?_id=14760&did=4688&G=14760 |

### Approach
Add a `websiteOverride: Record<number, string>` map at the top of `src/lib/data.ts` (same pattern as `conservatoriumIdOverride` on line 45). The conservatoriums map applies it when building `Conservatorium` objects.

Also add `UPDATE conservatoriums SET website = '...' WHERE id = '...'` statements to `scripts/db/seed.sql`.

---

## Track 3 — Legal Compliance

### Product Decision
**Model chosen:** Harmonia Standard + optional per-conservatorium addendum.
- Harmonia owns and maintains the master registration agreement
- Conservatoriums can add custom clauses as an addendum via `customRegistrationTerms` field
- The Harmonia core terms cannot be overridden by conservatoriums
- One lawyer review covers all conservatoriums

### 3A — Legal Document Analysis (Explore agent, read-only)

**Input:** 14 files in `docs/data/new/forms/`:
- Registration forms: `גליון-הרשמה-*`, `__גליון-הרשמה-*`
- Bylaws/regulations: `תקנון לימודים`, `תקנון-ונהלי-רישום`, `תקנון-קונס-תשפד`, `תקנון הקונסרבטוריון למוסיקה אשכול`, `תקנון מרכז קהילה ערבה`, `תקנון_מוזיכלי_לאתר`, `takanon(1)`
- Prices: `שכר לימוד.pdf`, `מידע לנרשם.pdf`, `1724791471...pdf` (multiple price sheets)
- Scholarship: `טופס בקשה למלגה.pdf`
- Privacy: `Privacy-Policy.pdf`
- Opening letter: `מכתב-פתיחת-שנה-תשפד.pdf`

**Uses:** Playwright browser to open PDFs, take screenshots, extract text

**Outputs:**
1. `docs/legal/conservatorium-policies-analysis.md` — structured comparison:
   - Cancellation windows (notice period required)
   - Price ranges (monthly, yearly, per-lesson, instrument rental)
   - Scholarship eligibility criteria
   - What consent language each form already collects
   - Any PDPPA-relevant clauses already present
2. `docs/legal/standardized-price-model.md` — normalized pricing schema
3. `docs/legal/standard-registration-agreement-draft.md` — unified Harmonia enrollment contract draft (he only in analysis phase; full i18n in 3B)

### 3B — Legal Tech Implementation (code agent)

Implements all 15 gaps from `docs/LEGAL-READINESS.md` in priority order:

**CRITICAL (4 items):**
1. **Cookie consent banner** — `src/components/consent/cookie-banner.tsx` (new) + wire into root layout. Uses `localStorage` to persist consent. Non-essential cookies (analytics) blocked until accepted.
2. **`ConsentRecord` persistence** — `src/app/actions/consent.ts` (new Server Action) writes `ConsentRecord` to DB. Wire into enrollment wizard step and cookie banner.
3. **Parental consent differentiation** — Update `consent-checkboxes.tsx` to accept `isMinor?: boolean` prop. Add "I am consenting as legal guardian for my child" variant text. Wire into enrollment wizard based on student `birthDate`.
4. **DSAR flow** — New section in `/dashboard/settings` (all roles): "My Data" — Export Data button (triggers Server Action that packages user's data as JSON) + Delete Request button (creates `ComplianceLog` entry with `PII_DELETED` action for admin review).

**HIGH (3 items):**
5. **VAT display** — Update `student-billing-dashboard.tsx`, package selection screens, invoice views to show prices with 17% VAT included. Add `formatPriceWithVAT(amount)` utility.
6. **Cancellation flow** — Add "Cancel subscription" button to `student-billing-dashboard.tsx`. Implement `cancelPackageAction()` Server Action with 14-day cooling-off period check.
7. **Sub-processors in privacy policy** — Update `/privacy` page to enumerate all sub-processors (Firebase/Google, Cardcom, Twilio, SendGrid, Google AI).

**MEDIUM (4 items):**
8. **VIDEO_RECORDING consent** — Add to `consent-checkboxes.tsx` as a separate checkbox (already defined in `ConsentType` enum). Show when student has practice recording capability.
9. **Enrollment wizard contract signing step** — Add new step to `enrollment-wizard.tsx`: display Harmonia standard terms + conservatorium addendum (from `customRegistrationTerms`) + `signature-capture.tsx` + call `submitSignatureAction()`.
10. **Upload copyright disclaimer** — Add disclaimer text to sheet music upload component.
11. **14-day cooling-off period** — Implement logic in cancellation action: if within 14 days of purchase, offer full refund; otherwise pro-rated.

**LOW (2 items):**
12. **Data retention notice** — Add retention period table to privacy policy (`/privacy` page).
13. **Consent withdrawal** — Add "Withdraw consent" option in DSAR settings section.

**Standard contract i18n:**
- The standard Harmonia registration agreement (from 3A's draft) translated to en/ar/ru using Claude
- Stored in `src/messages/{locale}/legal.json` for rendering in enrollment wizard
- Fallback chain: user's locale → he

### 3C — Pricing Standardization (code agent, depends on 3A)

Based on 3A's `standardized-price-model.md`:
- Update `LessonPackage` mock data in `src/lib/data.ts` with realistic prices (from actual PDF data)
- Add `customRegistrationTerms` per-conservatorium entries for the 10 conservatoriums with new teacher data (pricing addendum text per locale)
- Update `scripts/db/seed.sql` with realistic `lesson_packages` INSERT data

---

## Track 4 — QA Gate

Runs after Tracks 1–3 complete.

**Verification steps (all must pass):**
1. `npx tsc --noEmit` — zero TypeScript errors
2. `npx eslint src/ --max-warnings 0` — zero ESLint warnings
3. `npx vitest run` — all existing unit tests pass
4. Add new unit tests:
   - `tests/teacher-import.test.ts` — validates generated teacher objects have required fields
   - `tests/consent.test.ts` — ConsentRecord persistence, parental consent flag
   - `tests/vat.test.ts` — VAT calculation utility
5. `npx playwright test --grep @smoke` — all smoke tests pass
6. Extend e2e tests:
   - `e2e/smoke.spec.ts` — add routes for new conservatoriums' teacher profiles
   - `e2e/flows/consent-banner.spec.ts` — new: cookie banner accept/reject flow
   - `e2e/flows/dsar.spec.ts` — new: data export + deletion request flow
7. `npm run build` — clean production build, zero errors

---

## Agent Execution Plan

### Phase A (parallel — no dependencies)
- `teacher-import` agent — Track 1
- `site-url-patch` agent — Track 2
- `legal-analyzer` agent — Track 3A (read-only explore)

### Phase B (after 3A completes)
- `legal-tech-impl` agent — Track 3B
- `pricing-standard` agent — Track 3C

### Phase C (after all above complete)
- `qa-verifier` agent — Track 4

---

## Key Files Summary

| File | Change |
|------|--------|
| `scripts/import-teachers.mjs` | NEW — CSV reader + Claude translator + output writer |
| `scripts/teachers/generated-teachers.json` | NEW — intermediate translated teacher data |
| `scripts/db/seed.sql` | APPEND — 267 users + teacher_profiles + cons website URLs |
| `src/lib/data.ts` | EXTEND — directoryTeacherUsers (267 new) + websiteOverride map |
| `src/components/consent/cookie-banner.tsx` | NEW — GDPR-style cookie consent banner |
| `src/app/actions/consent.ts` | NEW — ConsentRecord Server Action |
| `src/components/consent-checkboxes.tsx` | EXTEND — isMinor prop, VIDEO_RECORDING, withdrawal |
| `enrollment-wizard.tsx` | EXTEND — contract signing step |
| `student-billing-dashboard.tsx` | EXTEND — cancellation + VAT display |
| `/privacy` page | EXTEND — sub-processors, retention schedule |
| `src/messages/{locale}/legal.json` | NEW — standard contract text (4 locales) |
| `docs/legal/conservatorium-policies-analysis.md` | NEW — PDF analysis output |
| `docs/legal/standard-registration-agreement-draft.md` | NEW — master contract draft |
| `tests/teacher-import.test.ts` | NEW |
| `tests/consent.test.ts` | NEW |
| `e2e/flows/consent-banner.spec.ts` | NEW |
| `e2e/flows/dsar.spec.ts` | NEW |

---

## Out of Scope

- Cardcom / payment gateway integration (separate track, already planned)
- Formal WCAG audit by certified Israeli consultant (requires human)
- Registering the database with the Israeli Registrar of Databases (requires lawyer)
- MSA execution with individual conservatoriums (requires lawyer)
- Digital signature PDF generation (separate PM plan already exists)
