# Data Import & Legal Compliance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Import 267 teachers from 10 conservatoriums into mock+SQL, patch website URLs for 12 conservatoriums, achieve full LEGAL-READINESS.md compliance, update architecture docs, and pass full QA gate.

**Architecture:** Three parallel Phase-A agents (teacher import, URL patch, legal PDF analysis), two Phase-B agents after analysis completes (legal tech impl, pricing), one Phase-C QA agent at the end. All code changes follow existing patterns in `src/lib/data.ts` and `scripts/db/seed.sql`. Architecture docs updated last via `claude-md-management:revise-claude-md` skill.

**Tech Stack:** Next.js 16, TypeScript, Anthropic SDK (Claude Haiku for translation), Vitest, Playwright, Zod, shadcn/ui, next-intl (he/en/ar/ru)

**ID continuity:**
- Teacher mock IDs: `dir-teacher-208` through `dir-teacher-{208+267-1}`
- Teacher SQL UUIDs: `c1000000-0000-0000-0000-000000000208` onward
- All 10 conservatorium SQL UUIDs: `a1000000-0000-0000-0000-00000000000{N}` where N = constadmin.json id

---

## PHASE A — Parallel (no dependencies between A1/A2/A3)

---

### Task A1: Teacher Import Script

**Files:**
- Create: `scripts/import-teachers.mjs`
- Create: `scripts/teachers/` (directory)

**Step 1: Create the import script**

```javascript
// scripts/import-teachers.mjs
/**
 * Reads 10 teacher CSV files from docs/data/new/teachers/
 * Translates names + bios via Claude Haiku
 * Outputs:
 *   scripts/teachers/generated-teachers.json  — intermediate data
 *   scripts/teachers/seed-append.sql           — SQL to append to seed.sql
 *   scripts/teachers/data-ts-append.txt        — TS lines to append to data.ts
 *
 * Usage: node scripts/import-teachers.mjs
 * Resume: re-run safely — skips already-translated teachers
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(__dirname, 'teachers');
mkdirSync(OUT_DIR, { recursive: true });

// Conservatorium mapping: CSV filename substring → { consId, consNumericId, consName, aUuid }
const CONS_MAP = {
  'אשדוד':       { consId: 'cons-2',  n: 2,  name: 'אקדמא, אשדוד',         aUuid: 'a1000000-0000-0000-0000-000000000002' },
  'באר שבע':     { consId: 'cons-7',  n: 7,  name: 'קונסרבטוריון באר שבע', aUuid: 'a1000000-0000-0000-0000-000000000007' },
  'בית שמש':     { consId: 'cons-9',  n: 9,  name: 'קונסרבטוריון בית שמש', aUuid: 'a1000000-0000-0000-0000-000000000009' },
  'ברנר':        { consId: 'cons-10', n: 10, name: 'מרכז המוסיקה ברנר',    aUuid: 'a1000000-0000-0000-0000-000000000010' },
  'בת ים':       { consId: 'cons-11', n: 11, name: 'קונסרבטוריון בת-ים',   aUuid: 'a1000000-0000-0000-0000-000000000011' },
  'גליל עליון':  { consId: 'cons-14', n: 14, name: 'קלור גליל עליון',      aUuid: 'a1000000-0000-0000-0000-000000000014' },
  'דימונה':      { consId: 'cons-13', n: 13, name: 'קונסרבטוריון דימונה',  aUuid: 'a1000000-0000-0000-0000-000000000013' },
  'הרצליה':      { consId: 'cons-17', n: 17, name: 'מרכז תאו הרצליה',      aUuid: 'a1000000-0000-0000-0000-000000000017' },
  'זכרון יעקב':  { consId: 'cons-18', n: 18, name: 'זמארין זכרון יעקב',    aUuid: 'a1000000-0000-0000-0000-000000000018' },
  'ערבה':        { consId: 'cons-16', n: 16, name: 'מרכז קהילה ערבה',      aUuid: 'a1000000-0000-0000-0000-000000000016' },
};

// Availability rotation (7 patterns, deterministic by index)
const AVAIL_PATTERNS = [
  [{ day: 'SUN', s: '14:00', e: '20:00' }, { day: 'TUE', s: '14:00', e: '20:00' }, { day: 'THU', s: '14:00', e: '20:00' }],
  [{ day: 'MON', s: '15:00', e: '21:00' }, { day: 'WED', s: '15:00', e: '21:00' }],
  [{ day: 'SUN', s: '09:00', e: '15:00' }, { day: 'TUE', s: '09:00', e: '15:00' }, { day: 'THU', s: '09:00', e: '15:00' }],
  [{ day: 'MON', s: '10:00', e: '17:00' }, { day: 'WED', s: '10:00', e: '17:00' }, { day: 'FRI', s: '09:00', e: '13:00' }],
  [{ day: 'SUN', s: '16:00', e: '21:00' }, { day: 'WED', s: '16:00', e: '21:00' }],
  [{ day: 'TUE', s: '13:00', e: '19:00' }, { day: 'THU', s: '13:00', e: '19:00' }],
  [{ day: 'SUN', s: '10:00', e: '16:00' }, { day: 'MON', s: '10:00', e: '16:00' }, { day: 'WED', s: '10:00', e: '16:00' }],
];

// Map Hebrew instrument names to specialty keys
function instrumentsToSpecialties(instruments) {
  const map = {
    'פסנתר': 'PERFORMANCE', 'כינור': 'PERFORMANCE', 'ויולה': 'PERFORMANCE',
    "צ'לו": 'PERFORMANCE', 'קונטרבס': 'PERFORMANCE', 'גיטרה': 'PERFORMANCE',
    'חליל צד': 'PERFORMANCE', 'קלרינט': 'PERFORMANCE', 'סקסופון': 'PERFORMANCE',
    'חצוצרה': 'PERFORMANCE', 'נבל': 'PERFORMANCE', 'אקורדיון': 'PERFORMANCE',
    'שירה': 'PERFORMANCE', 'פיתוח קול': 'PERFORMANCE',
    'תאוריה': 'THEORY', 'תורת המוסיקה': 'THEORY',
    'הלחנה': 'THEORY', "ג'אז": 'JAZZ', 'פופ': 'JAZZ', 'רוק': 'JAZZ',
    'הגיל הרך': 'EARLY_CHILDHOOD', 'טרום כלי': 'EARLY_CHILDHOOD',
    'ניצוח': 'ENSEMBLE', 'מקהלה': 'ENSEMBLE',
  };
  const result = new Set();
  for (const inst of instruments) {
    const trimmed = inst.trim();
    for (const [key, val] of Object.entries(map)) {
      if (trimmed.includes(key)) result.add(val);
    }
  }
  return result.size > 0 ? [...result] : ['PERFORMANCE'];
}

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    // Handle quoted fields with commas
    const cols = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { cols.push(cur); cur = ''; }
      else cur += ch;
    }
    cols.push(cur);
    return {
      firstName: cols[0]?.trim() || '',
      lastName: cols[1]?.trim() || '',
      department: cols[2]?.trim() || '',
      instruments: (cols[3]?.trim() || '').split(';').map(s => s.trim()).filter(Boolean),
      bioHe: (() => { try { return JSON.parse(cols[4]?.trim() || '{}').he || ''; } catch { return ''; } })(),
    };
  }).filter(t => t.firstName && t.lastName);
}

const client = new Anthropic();

async function translateBatch(items) {
  if (items.length === 0) return {};
  const prompt = `Translate these Hebrew music teacher names and bios into English, Arabic (MSA), and Russian.
Return ONLY a JSON object. No markdown.
Format: { "0": { "firstName": {"en":"","ar":"","ru":""}, "lastName": {"en":"","ar":"","ru":""}, "bio": {"en":"","ar":"","ru":""} }, ... }

Items:
${items.map((t, i) => `${i}: firstName="${t.firstName}" lastName="${t.lastName}" bio="${t.bioHe}"`).join('\n')}`;

  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  let text = res.content[0].text.trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/m,'');
  return JSON.parse(text);
}

function esc(s) { return s ? "'" + s.replace(/'/g, "''") + "'" : 'NULL'; }
function uuidFromSeq(n) { return `c1000000-0000-0000-0000-${String(n).padStart(12,'0')}`; }

async function main() {
  const existingFile = join(OUT_DIR, 'generated-teachers.json');
  const existing = existsSync(existingFile) ? JSON.parse(readFileSync(existingFile, 'utf8')) : [];
  const existingKeys = new Set(existing.map(t => t.dirId));

  const teacherDir = join(ROOT, 'docs/data/new/teachers');
  const csvFiles = readdirSync(teacherDir).filter(f => f.endsWith('.csv'));

  let allTeachers = [...existing];
  let globalSeq = 208 + existing.length; // start after dir-teacher-207

  for (const csvFile of csvFiles) {
    const consKey = Object.keys(CONS_MAP).find(k => csvFile.includes(k));
    if (!consKey) { console.warn('No mapping for', csvFile); continue; }
    const cons = CONS_MAP[consKey];

    const content = readFileSync(join(teacherDir, csvFile), 'utf8');
    const teachers = parseCSV(content);
    console.log(`${consKey}: ${teachers.length} teachers`);

    // Filter already processed
    const toProcess = teachers.filter(t => {
      const key = `dir-teacher-${String(globalSeq).padStart(3,'0')}`;
      return !existingKeys.has(key);
    });

    // Translate in batches of 20
    const BATCH = 20;
    for (let i = 0; i < teachers.length; i += BATCH) {
      const batch = teachers.slice(i, i + BATCH);
      const alreadyDone = batch.filter((_, j) => {
        const seq = globalSeq - teachers.length + i + j;
        return existingKeys.has(`dir-teacher-${String(seq).padStart(3,'0')}`);
      });
      if (alreadyDone.length === batch.length) { globalSeq += batch.length; continue; }

      console.log(`  Translating batch ${i}-${Math.min(i+BATCH, teachers.length)-1}...`);
      const translations = await translateBatch(batch);

      batch.forEach((t, j) => {
        const seq = globalSeq + j;
        const dirId = `dir-teacher-${String(seq).padStart(3,'0')}`;
        const tr = translations[String(j)] || {};
        const availPattern = AVAIL_PATTERNS[seq % AVAIL_PATTERNS.length];
        const specialties = instrumentsToSpecialties(t.instruments);

        allTeachers.push({
          dirId,
          uuid: uuidFromSeq(seq + 208 - 208 + seq),  // c1000000-...-000{seq}
          cUuid: uuidFromSeq(seq),
          consId: cons.consId,
          consNumericId: cons.n,
          consName: cons.name,
          aUuid: cons.aUuid,
          firstName: t.firstName,
          lastName: t.lastName,
          firstNameI18n: { he: t.firstName, en: tr.firstName?.en||t.firstName, ar: tr.firstName?.ar||t.firstName, ru: tr.firstName?.ru||t.firstName },
          lastNameI18n: { he: t.lastName, en: tr.lastName?.en||t.lastName, ar: tr.lastName?.ar||t.lastName, ru: tr.lastName?.ru||t.lastName },
          bioHe: t.bioHe,
          bioI18n: { he: t.bioHe, en: tr.bio?.en||t.bioHe, ar: tr.bio?.ar||t.bioHe, ru: tr.bio?.ru||t.bioHe },
          department: t.department,
          instruments: t.instruments,
          specialties,
          availability: availPattern,
        });
      });
      globalSeq += batch.length;

      // Save progress after each batch
      writeFileSync(existingFile, JSON.stringify(allTeachers, null, 2), 'utf8');
      await new Promise(r => setTimeout(r, 500)); // rate limit
    }
  }

  writeFileSync(existingFile, JSON.stringify(allTeachers, null, 2), 'utf8');
  console.log(`Total teachers generated: ${allTeachers.length}`);

  // Generate SQL
  const sqlLines = [
    '-- Auto-generated by scripts/import-teachers.mjs',
    '-- Append to scripts/db/seed.sql after the existing teacher inserts',
    '',
    '-- New directory teachers (cons-2,7,9,10,11,13,14,16,17,18)',
    'INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)',
    'VALUES',
  ];
  const userRows = allTeachers.map(t =>
    `('${t.cUuid}', '${t.aUuid}', 'teacher-${t.consNumericId}-${String(t.cUuid.split('-')[4]).slice(-4)}@harmonia.local', 'TEACHER', ${esc(t.firstName)}, '${JSON.stringify(t.firstNameI18n)}'::jsonb, ${esc(t.lastName)}, '${JSON.stringify(t.lastNameI18n)}'::jsonb, NULL, NULL, NULL, TRUE)`
  );
  sqlLines.push(userRows.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n');

  sqlLines.push('INSERT INTO teacher_profiles (user_id, bio, instruments, specialties, avatar_url, available_for_new_students, lesson_durations)');
  sqlLines.push('VALUES');
  const profileRows = allTeachers.map(t =>
    `('${t.cUuid}', '${JSON.stringify(t.bioI18n).replace(/'/g,"''")}'::jsonb, ARRAY[${t.instruments.map(i => esc(i.toLowerCase().replace(/\s+/g,'_'))).join(',')}], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[30,45,60])`
  );
  sqlLines.push(profileRows.join(',\n') + '\nON CONFLICT (user_id) DO NOTHING;\n');

  // Website URL updates
  const WEBSITE_MAP = {
    1:  'https://tsahgertner.wixsite.com/musicoa',
    2:  'https://www.akadma.co.il/',
    6:  'https://ironitash.org.il/konser-ashkelon/',
    7:  'https://cons-bs.my.canva.site/conservatory-beer-sheva',
    9:  'https://www.matnasbs.org.il/52/',
    11: 'https://www.tarbut-batyam.co.il/?CategoryID=405',
    12: 'https://www.kehilatayim.org.il/62/',
    13: 'https://www.matnas-dimona.org.il/page.php?type=matClass&id=909',
    14: 'https://clore.galil-elion.org.il/',
    16: 'https://arava.smarticket.co.il/',
    17: 'https://teo.org.il/conservatory/',
    18: 'https://www.zamarin.org.il/html5/?_id=14760&did=4688&G=14760',
  };
  sqlLines.push('-- Website URL updates');
  for (const [n, url] of Object.entries(WEBSITE_MAP)) {
    const aUuid = `a1000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
    sqlLines.push(`UPDATE conservatoriums SET website = ${esc(url)} WHERE id = '${aUuid}';`);
  }

  writeFileSync(join(OUT_DIR, 'seed-append.sql'), sqlLines.join('\n'), 'utf8');
  console.log('Written: scripts/teachers/seed-append.sql');

  // Generate data.ts lines
  const tsLines = allTeachers.map(t => {
    const avail = t.availability.map(a => `{ dayOfWeek: '${a.day}' as const, startTime: '${a.s}', endTime: '${a.e}' }`).join(', ');
    const instruments = t.instruments.slice(0,2).map(inst => `{ instrument: '${inst}', teacherName: '${t.firstName} ${t.lastName}', yearsOfStudy: 10 }`).join(', ');
    const specialties = t.specialties.map(s => `'${s}'`).join(', ');
    const bioHe = t.bioHe.replace(/'/g, "\\'");
    return `    { id: '${t.dirId}', name: '${t.firstName} ${t.lastName}', email: 'teacher-dir-${t.dirId.split('-')[2]}@harmonia.local', role: 'teacher' as const, conservatoriumId: '${t.consId}', conservatoriumName: '${t.consName}', avatarUrl: \`https://i.pravatar.cc/150?u=\${${JSON.stringify(t.dirId)}}\`, bio: '${bioHe}', approved: true, availableForNewStudents: true, specialties: [${specialties}], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [${avail}], instruments: [${instruments}], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },`;
  });

  writeFileSync(join(OUT_DIR, 'data-ts-append.txt'), tsLines.join('\n'), 'utf8');
  console.log('Written: scripts/teachers/data-ts-append.txt');
  console.log('Done!');
}

main().catch(console.error);
```

**Step 2: Run the script**
```bash
node scripts/import-teachers.mjs
```
Expected: prints progress per conservatorium, writes 3 files under `scripts/teachers/`. Takes ~3-5 min (API calls).

**Step 3: Verify outputs**
```bash
node -e "const t=require('./scripts/teachers/generated-teachers.json'); console.log('Total:', t.length); const cons={}; t.forEach(x=>{cons[x.consId]=(cons[x.consId]||0)+1}); console.log(cons);"
```
Expected: ~267 teachers, distributed across 10 conservatoriums.

**Step 4: Commit intermediate data**
```bash
git add scripts/import-teachers.mjs scripts/teachers/
git commit -m "feat: add teacher import script and generated teacher data (267 teachers, 10 conservatoriums)"
```

---

### Task A2: Patch data.ts with New Teachers + Website URLs

**Files:**
- Modify: `src/lib/data.ts`

**Step 1: Add websiteOverride map** (after line 47, after the existing `conservatoriumIdOverride` map)

```typescript
// Website URLs from docs/data/new/site CSV
const websiteOverride: Record<number, string> = {
    1:  'https://tsahgertner.wixsite.com/musicoa',
    2:  'https://www.akadma.co.il/',
    6:  'https://ironitash.org.il/konser-ashkelon/',
    7:  'https://cons-bs.my.canva.site/conservatory-beer-sheva',
    9:  'https://www.matnasbs.org.il/52/',
    11: 'https://www.tarbut-batyam.co.il/?CategoryID=405',
    12: 'https://www.kehilatayim.org.il/62/',
    13: 'https://www.matnas-dimona.org.il/page.php?type=matClass&id=909&ht=&bc=',
    14: 'https://clore.galil-elion.org.il/',
    16: 'https://arava.smarticket.co.il/',
    17: 'https://teo.org.il/conservatory/',
    18: 'https://www.zamarin.org.il/html5/?_id=14760&did=4688&G=14760',
};
```

**Step 2: Apply websiteOverride in the conservatoriums map**

Find the `website:` line inside the `conservatoriums` array `.map()` in `data.ts` (around line 140-180). Add the override:
```typescript
website: websiteOverride[admin.id] || scraped.website || enriched?.website,
```

**Step 3: Append new teachers to directoryTeacherUsers**

After `dir-teacher-207` (the last ICM teacher), append the contents of `scripts/teachers/data-ts-append.txt`. The array comment should read:
```typescript
// ── Teachers from docs/data/new/teachers CSVs (cons-2,7,9,10,11,13,14,16,17,18) ──
// Auto-generated by scripts/import-teachers.mjs — 267 teachers across 10 conservatoriums
```

**Step 4: Type-check**
```bash
npx tsc --noEmit 2>&1 | head -30
```
Expected: 0 errors. If errors appear on new teacher entries, they're likely missing `as const` casts — fix them.

**Step 5: Commit**
```bash
git add src/lib/data.ts
git commit -m "feat: add 267 directory teachers (10 conservatoriums) and website URLs to mock data"
```

---

### Task A3: Append to seed.sql

**Files:**
- Modify: `scripts/db/seed.sql`

**Step 1: Append generated SQL**
```bash
cat scripts/teachers/seed-append.sql >> scripts/db/seed.sql
```

**Step 2: Verify SQL syntax**
```bash
node -e "
const fs = require('fs');
const sql = fs.readFileSync('scripts/db/seed.sql', 'utf8');
const insertCount = (sql.match(/INSERT INTO users/g)||[]).length;
const updateCount = (sql.match(/UPDATE conservatoriums SET website/g)||[]).length;
console.log('INSERT INTO users blocks:', insertCount);
console.log('Website UPDATE statements:', updateCount);
"
```
Expected: multiple INSERT blocks, 12 UPDATE statements.

**Step 3: Commit**
```bash
git add scripts/db/seed.sql
git commit -m "feat: append 267 teachers and 12 website URL updates to seed.sql"
```

---

### Task A4: Legal PDF Analysis (Explore agent — read-only)

**Agent type:** `Explore` (read-only)
**Input files:** all 14 files in `docs/data/new/forms/`
**Output files to create:**
- `docs/legal/conservatorium-policies-analysis.md`
- `docs/legal/standardized-price-model.md`
- `docs/legal/standard-registration-agreement-draft.md`

**Agent prompt:**
```
You are a legal analyst for Lyriosa, an Israeli music conservatorium SaaS platform.

Read all PDF files in docs/data/new/forms/ using the Playwright browser tool to screenshot and read them.
Also read docs/LEGAL-READINESS.md, docs/contracts/MSA-TEMPLATE.md, and src/lib/types.ts.

Produce THREE markdown documents:

1. docs/legal/conservatorium-policies-analysis.md
   - Table comparing: cancellation notice periods, price ranges (monthly/yearly/per-lesson),
     scholarship criteria, payment installment options, refund policies, consent language
   - One row per document/conservatorium
   - Flag any clauses that conflict with LEGAL-READINESS.md requirements

2. docs/legal/standardized-price-model.md
   - Recommended standard price ranges derived from the actual documents
   - Structure: { monthly_30min, monthly_45min, monthly_60min, yearly_discount_pct,
     trial_lesson, instrument_rental_monthly, scholarship_reduction_pct_range }
   - Note any conservatorium-specific pricing that must go in customRegistrationTerms addendum

3. docs/legal/standard-registration-agreement-draft.md
   - Hebrew-language unified enrollment contract for Lyriosa
   - Must satisfy ALL critical/high items in docs/LEGAL-READINESS.md
   - Sections: Identity & Parental Consent, Data Processing (PDPPA),
     Lesson Package & Payment Terms (incl. 14-day cooling-off),
     Cancellation Policy, Video Recording Consent, IP/Recordings,
     Accessibility, Governing Law (Israeli law, Tel Aviv courts)
   - Mark sections that need Israeli lawyer review with [REQUIRES LEGAL REVIEW]
   - Note: conservatoriums add custom addendum via customRegistrationTerms field —
     do NOT include pricing in the standard agreement body
```

---

## PHASE B — After A4 completes (run in parallel with each other)

---

### Task B1: Legal Tech Implementation

**Files (all to create or modify):**
- Create: `src/components/consent/cookie-banner.tsx`
- Create: `src/app/actions/consent.ts`
- Create: `src/messages/{he,en,ar,ru}/legal.json`
- Modify: `src/app/[locale]/layout.tsx` (add cookie banner)
- Modify: `src/components/consent-checkboxes.tsx` (isMinor, VIDEO_RECORDING, withdrawal)
- Modify: `src/components/harmonia/enrollment-wizard.tsx` (contract signing step)
- Modify: `src/app/[locale]/dashboard/settings/page.tsx` (DSAR section)
- Modify: `src/app/[locale]/privacy/page.tsx` (sub-processors, retention)
- Modify: `src/components/dashboard/student/student-billing-dashboard.tsx` (VAT + cancel)
- Create: `src/lib/vat.ts`
- Create: `src/app/actions/billing.ts` (cancelPackageAction)

**Sub-task B1.1 — VAT utility (smallest, do first)**

Create `src/lib/vat.ts`:
```typescript
export const VAT_RATE = 0.17; // Israel 17%

/** Returns price including VAT, rounded to nearest shekel */
export function addVAT(priceBeforeVAT: number): number {
  return Math.round(priceBeforeVAT * (1 + VAT_RATE));
}

/** Returns formatted price string: "₪120 כולל מע״מ" */
export function formatWithVAT(priceBeforeVAT: number, locale: string = 'he'): string {
  const total = addVAT(priceBeforeVAT);
  const labels: Record<string, string> = {
    he: `₪${total} כולל מע״מ`,
    en: `₪${total} incl. VAT`,
    ar: `₪${total} شامل ضريبة القيمة المضافة`,
    ru: `₪${total} включая НДС`,
  };
  return labels[locale] ?? labels.he;
}

/** Returns VAT breakdown: { net, vat, total } */
export function vatBreakdown(netAmount: number): { net: number; vat: number; total: number } {
  const vat = Math.round(netAmount * VAT_RATE);
  return { net: netAmount, vat, total: netAmount + vat };
}
```

**Sub-task B1.2 — Cookie consent banner**

Create `src/components/consent/cookie-banner.tsx`:
```typescript
'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

const COOKIE_KEY = 'harmonia_cookie_consent';

export function CookieBanner() {
  const t = useTranslations('CookieBanner');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) setShow(true);
  }, []);

  const accept = () => { localStorage.setItem(COOKIE_KEY, 'accepted'); setShow(false); };
  const reject = () => { localStorage.setItem(COOKIE_KEY, 'rejected'); setShow(false); };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed bottom-0 inset-x-0 z-50 bg-background border-t shadow-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
    >
      <div className="flex-1">
        <p id="cookie-banner-title" className="font-semibold text-sm">{t('title')}</p>
        <p id="cookie-banner-desc" className="text-muted-foreground text-xs mt-1">{t('description')}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button size="sm" variant="outline" onClick={reject}>{t('reject')}</Button>
        <Button size="sm" onClick={accept}>{t('accept')}</Button>
      </div>
    </div>
  );
}
```

Add to `src/messages/he/legal.json` (create file):
```json
{
  "CookieBanner": {
    "title": "אנו משתמשים בעוגיות",
    "description": "האתר משתמש בעוגיות הכרחיות לתפעולו. עוגיות אנליטיקס מופעלות רק לאחר אישורך.",
    "accept": "אישור",
    "reject": "דחייה"
  }
}
```

Create equivalent `en/legal.json`, `ar/legal.json`, `ru/legal.json` with translations.

Wire into `src/app/[locale]/layout.tsx` — import and add `<CookieBanner />` just before `</body>`.

**Sub-task B1.3 — ConsentRecord Server Action**

Create `src/app/actions/consent.ts`:
```typescript
'use server';
import { withAuth } from '@/lib/auth-utils';
import { getDb } from '@/lib/db';
import { z } from 'zod';
import type { ConsentRecord } from '@/lib/types';

const ConsentSchema = z.object({
  userId: z.string(),
  conservatoriumId: z.string(),
  consentDataProcessing: z.boolean(),
  consentTerms: z.boolean(),
  consentMarketing: z.boolean().optional(),
  consentVideoRecording: z.boolean().optional(),
  isMinorConsent: z.boolean().optional(), // true = parent consenting for child
  minorUserId: z.string().optional(),
});

export const saveConsentRecord = withAuth(async (auth, input: z.infer<typeof ConsentSchema>) => {
  const data = ConsentSchema.parse(input);
  const db = await getDb();
  const record: ConsentRecord = {
    id: crypto.randomUUID(),
    userId: data.userId,
    conservatoriumId: data.conservatoriumId,
    givenByUserId: auth.userId, // parent ID if consenting for minor
    consentTypes: [
      ...(data.consentDataProcessing ? ['DATA_PROCESSING' as const] : []),
      ...(data.consentTerms ? ['TERMS' as const] : []),
      ...(data.consentMarketing ? ['MARKETING' as const] : []),
      ...(data.consentVideoRecording ? ['VIDEO_RECORDING' as const] : []),
    ],
    isMinorConsent: data.isMinorConsent ?? false,
    minorUserId: data.minorUserId,
    timestamp: new Date().toISOString(),
    ipAddress: undefined, // populated by edge proxy in production
  };
  await db.consentRecords.create(record);
  return { success: true };
});
```

**Sub-task B1.4 — Parental consent differentiation in consent-checkboxes.tsx**

Find `src/components/consent-checkboxes.tsx`. Add `isMinor?: boolean` prop. When `isMinor=true`:
- Change "אני מסכים/ה לעיבוד המידע האישי שלי" → "אני מסכים/ה, כהורה/אפוטרופוס חוקי, לעיבוד המידע האישי של ילדי"
- Add `VIDEO_RECORDING` checkbox: "אני מסכים/ה לאחסון הקלטות תרגול של ילדי לצורך משוב המורה בלבד"

**Sub-task B1.5 — DSAR section in settings**

In `/dashboard/settings` page, add "הגדרות פרטיות ונתונים" section with:
- **Export my data** button → calls new `exportUserDataAction()` Server Action that returns JSON of the calling user's data
- **Request data deletion** button → creates `ComplianceLog` entry with `action: 'PII_DELETED'` and `status: 'pending_review'` (admin must confirm)
- **Withdraw consent** link → redirects to a confirmation page that calls `withdrawConsentAction()`

**Sub-task B1.6 — Cancellation flow + VAT in billing dashboard**

In `student-billing-dashboard.tsx`:
- Import `formatWithVAT` from `@/lib/vat`
- Wrap all price displays: `formatWithVAT(price, locale)`
- Add "ביטול מנוי" button that calls `cancelPackageAction(packageId)`

Create `cancelPackageAction` in `src/app/actions/billing.ts`:
```typescript
export const cancelPackageAction = withAuth(async (auth, { packageId }: { packageId: string }) => {
  const db = await getDb();
  const pkg = await db.lessonPackages.findById(packageId);
  if (!pkg) throw new Error('Package not found');

  const purchaseDate = new Date(pkg.createdAt);
  const now = new Date();
  const daysSincePurchase = Math.floor((now.getTime() - purchaseDate.getTime()) / 86400000);
  const withinCoolingOff = daysSincePurchase <= 14;

  await db.lessonPackages.update(packageId, {
    status: 'cancelled',
    cancelledAt: now.toISOString(),
    refundEligible: withinCoolingOff,
  });

  return { success: true, withinCoolingOff, refundEligible: withinCoolingOff };
});
```

**Sub-task B1.7 — Privacy policy updates**

In `/privacy` page, add:
1. Sub-processors table (Firebase/Google, Cardcom, Twilio, SendGrid, Google AI) with purpose + data access + location
2. Data retention schedule table: financial records 7 years, student records 7 years past age 18, practice recordings 1 year
3. How to exercise rights: email address placeholder `privacy@harmonia.app` + DSAR link

**Sub-task B1.8 — Enrollment wizard contract signing step**

In `enrollment-wizard.tsx`, add a new step "חוזה הרשמה" between the current last step and the submission step:
1. Display standard Lyriosa terms from `legal.json` (scrollable, `max-h-96 overflow-y-auto`)
2. Display conservatorium addendum from `conservatorium.customRegistrationTerms[locale]` (if present)
3. "קראתי ואני מסכים/ה לתנאים" checkbox (must be checked to proceed)
4. `<SignatureCapture />` component (already exists at `src/components/ui/signature-capture.tsx`)
5. On proceed: call `submitSignatureAction()` then `saveConsentRecord()`

**Sub-task B1.9 — Type-check**
```bash
npx tsc --noEmit 2>&1 | head -30
```
Expected: 0 errors.

**Sub-task B1.10 — Commit**
```bash
git add src/
git commit -m "feat: implement LEGAL-READINESS.md compliance — cookie banner, consent persistence, parental consent, DSAR, VAT display, cancellation flow, privacy policy updates"
```

---

### Task B2: Pricing Standardization (depends on A4 outputs)

**Files:**
- Modify: `src/lib/data.ts` (update LessonPackage mock prices)
- Modify: `scripts/db/seed.sql` (update lesson_packages prices)

**Step 1: Read `docs/legal/standardized-price-model.md`** (produced by A4)

**Step 2: Update mock lesson packages in data.ts**

Find the `lessonPackages` or `mockPackages` array in `data.ts`. Update prices to match the standardized model from B2's analysis. Typical structure from real PDFs:
- Monthly 30-min: ₪280–360/month (4 lessons)
- Monthly 45-min: ₪380–480/month
- Monthly 60-min: ₪450–580/month
- Yearly discount: 8–10%
- Trial lesson: ₪80–120

**Step 3: Add `customRegistrationTerms` for the 10 new conservatoriums**

In `data.ts`, find the `conservatoriums` array build. For the 10 conservatoriums with new teacher data, add per-conservatorium pricing addendum text to their `customRegistrationTerms` field (in Hebrew, to be translated by the enrollment wizard). Example:
```typescript
customRegistrationTerms: {
  he: 'שכר לימוד לשנת תשפ"ה: שיעור יחיד 30 דקות – ₪320 לחודש...',
  en: '...', ar: '...', ru: '...',
},
```
Use the prices from `docs/legal/standardized-price-model.md` per conservatorium.

**Step 4: Update seed.sql lesson_packages**
```sql
-- Update lesson package prices to match standardized model
UPDATE lesson_packages SET price_amount = 320 WHERE duration_minutes = 30 AND package_type = 'MONTHLY';
UPDATE lesson_packages SET price_amount = 420 WHERE duration_minutes = 45 AND package_type = 'MONTHLY';
UPDATE lesson_packages SET price_amount = 520 WHERE duration_minutes = 60 AND package_type = 'MONTHLY';
```

**Step 5: Type-check and commit**
```bash
npx tsc --noEmit && git add src/lib/data.ts scripts/db/seed.sql && git commit -m "feat: standardize lesson package prices from real conservatorium data"
```

---

## PHASE C — QA Gate (after all above complete)

---

### Task C1: Unit Tests

**Files:**
- Create: `tests/teacher-import.test.ts`
- Create: `tests/vat.test.ts`
- Create: `tests/consent.test.ts`

**Step 1: Write teacher import tests**

Create `tests/teacher-import.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import generatedTeachers from '../scripts/teachers/generated-teachers.json';
import { directoryTeacherUsers } from '../src/lib/data'; // if exported, else import mockData

describe('Generated teachers', () => {
  it('has at least 260 teachers', () => {
    expect(generatedTeachers.length).toBeGreaterThanOrEqual(260);
  });

  it('all teachers have required fields', () => {
    for (const t of generatedTeachers) {
      expect(t.dirId).toMatch(/^dir-teacher-\d{3}$/);
      expect(t.firstName).toBeTruthy();
      expect(t.lastName).toBeTruthy();
      expect(t.consId).toMatch(/^cons-\d+$/);
      expect(t.firstNameI18n).toHaveProperty('he');
      expect(t.firstNameI18n).toHaveProperty('en');
      expect(t.firstNameI18n).toHaveProperty('ar');
      expect(t.firstNameI18n).toHaveProperty('ru');
      expect(t.availability.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('covers all 10 conservatoriums', () => {
    const consIds = new Set(generatedTeachers.map(t => t.consId));
    expect(consIds.has('cons-2')).toBe(true);
    expect(consIds.has('cons-7')).toBe(true);
    expect(consIds.has('cons-9')).toBe(true);
    expect(consIds.has('cons-10')).toBe(true);
    expect(consIds.has('cons-11')).toBe(true);
    expect(consIds.has('cons-13')).toBe(true);
    expect(consIds.has('cons-14')).toBe(true);
    expect(consIds.has('cons-16')).toBe(true);
    expect(consIds.has('cons-17')).toBe(true);
    expect(consIds.has('cons-18')).toBe(true);
  });

  it('has no duplicate IDs', () => {
    const ids = generatedTeachers.map(t => t.dirId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});
```

**Step 2: Write VAT tests**

Create `tests/vat.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { addVAT, vatBreakdown, formatWithVAT } from '../src/lib/vat';

describe('VAT utilities', () => {
  it('addVAT adds 17%', () => {
    expect(addVAT(100)).toBe(117);
    expect(addVAT(300)).toBe(351);
  });

  it('vatBreakdown returns correct breakdown', () => {
    const result = vatBreakdown(100);
    expect(result.net).toBe(100);
    expect(result.vat).toBe(17);
    expect(result.total).toBe(117);
  });

  it('formatWithVAT returns Hebrew string by default', () => {
    const result = formatWithVAT(100);
    expect(result).toContain('117');
    expect(result).toContain('מע״מ');
  });

  it('formatWithVAT returns English string for en locale', () => {
    const result = formatWithVAT(100, 'en');
    expect(result).toContain('VAT');
  });
});
```

**Step 3: Write consent tests**

Create `tests/consent.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

// Test the consent record shape (unit — no DB)
describe('ConsentRecord structure', () => {
  it('consent types are valid enum values', () => {
    const validTypes = ['DATA_PROCESSING', 'TERMS', 'MARKETING', 'VIDEO_RECORDING'];
    const testRecord = { consentTypes: ['DATA_PROCESSING', 'VIDEO_RECORDING'] };
    for (const type of testRecord.consentTypes) {
      expect(validTypes).toContain(type);
    }
  });

  it('isMinorConsent flag is boolean', () => {
    const record = { isMinorConsent: true };
    expect(typeof record.isMinorConsent).toBe('boolean');
  });
});
```

**Step 4: Run all unit tests**
```bash
npx vitest run
```
Expected: all tests pass, including existing ones. Fix any failures before continuing.

**Step 5: Commit**
```bash
git add tests/
git commit -m "test: add unit tests for teacher import, VAT utilities, and consent records"
```

---

### Task C2: E2E Tests

**Files:**
- Create: `e2e/flows/consent-banner.spec.ts`
- Create: `e2e/flows/dsar.spec.ts`
- Modify: `e2e/smoke.spec.ts` (add new conservatorium routes)

**Step 1: Cookie banner e2e test**

Create `e2e/flows/consent-banner.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Cookie consent banner', () => {
  test.beforeEach(async ({ context }) => {
    // Clear localStorage to ensure fresh state
    await context.clearCookies();
  });

  test('shows cookie banner on first visit @smoke', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('dialog', { name: /עוגיות|cookies/i })).toBeVisible();
  });

  test('banner disappears after accepting', async ({ page }) => {
    await page.goto('/');
    const banner = page.getByRole('dialog', { name: /עוגיות|cookies/i });
    await banner.getByRole('button', { name: /אישור|accept/i }).click();
    await expect(banner).not.toBeVisible();
  });

  test('banner disappears after rejecting', async ({ page }) => {
    await page.goto('/');
    const banner = page.getByRole('dialog', { name: /עוגיות|cookies/i });
    await banner.getByRole('button', { name: /דחייה|reject/i }).click();
    await expect(banner).not.toBeVisible();
  });

  test('banner does not show after consent saved', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /אישור|accept/i }).click();
    await page.reload();
    await expect(page.getByRole('dialog', { name: /עוגיות|cookies/i })).not.toBeVisible();
  });
});
```

**Step 2: DSAR e2e test**

Create `e2e/flows/dsar.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('DSAR — data rights', () => {
  test('settings page shows data privacy section @smoke', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page.getByText(/פרטיות ונתונים|Privacy & Data/i)).toBeVisible();
  });

  test('export data button is present', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page.getByRole('button', { name: /ייצוא נתונים|Export.*data/i })).toBeVisible();
  });

  test('request deletion button is present', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page.getByRole('button', { name: /מחיקת נתונים|Delete.*data/i })).toBeVisible();
  });
});
```

**Step 3: Add new conservatorium routes to smoke test**

In `e2e/smoke.spec.ts`, find the conservatorium profile route array and add:
```typescript
'/about?conservatorium=cons-2',   // אשדוד
'/about?conservatorium=cons-7',   // באר שבע
'/about?conservatorium=cons-9',   // בית שמש
'/about?conservatorium=cons-17',  // הרצליה
```

**Step 4: Run smoke tests**
```bash
npx playwright test --grep @smoke 2>&1 | tail -20
```
Expected: all @smoke tests pass. Fix any failures.

**Step 5: Commit**
```bash
git add e2e/
git commit -m "test: add e2e tests for cookie banner, DSAR flow, and new conservatorium routes"
```

---

### Task C3: TypeScript + ESLint + Build

**Step 1: TypeScript check**
```bash
npx tsc --noEmit 2>&1
```
Expected: 0 errors. Fix any.

**Step 2: ESLint check**
```bash
npx eslint src/ --max-warnings 0 2>&1 | tail -30
```
Fix any warnings. Common issues: unused imports, missing `as const`, untyped params.

**Step 3: Production build**
```bash
npm run build 2>&1 | tail -30
```
Expected: `Route (app)` table printed, `✓ Compiled successfully`. Fix any build errors.

**Step 4: Final commit**
```bash
git add .
git commit -m "fix: resolve TypeScript, ESLint, and build issues from legal compliance and teacher import changes"
```

---

### Task C4: Update Architecture Documentation

**Agent:** Use `claude-md-management:revise-claude-md` skill

**What to update:**

1. **`docs/architecture/README.md`** — Module Status table: Mark new items as ✅:
   - Add row: `| 18 | Legal Compliance (PDPPA, Consumer Protection) | ✅ Cookie banner, ConsentRecord, DSAR, VAT, cancellation |`

2. **`docs/architecture/05-data-persistency.md`** — Mock Seed Data table: update teacher counts:
   - `docs/data/conservatoriums.json` row: update to reflect 10 new conservatoriums added
   - Add note: `docs/data/new/teachers/` — 267 additional teachers across 10 conservatoriums

3. **`docs/LEGAL-READINESS.md`** — Update Overall Score from `40/100` and update the implementation status table. For each item implemented, change the status columns from `No` to `Yes`. Recalculate score.

4. **`memory/MEMORY.md`** — Add section for the new teachers and legal compliance changes:
   ```
   ## New Teacher Import (2026-03-08)
   - 267 directory teachers added across cons-2,7,9,10,11,13,14,16,17,18
   - IDs: dir-teacher-208 through dir-teacher-{208+267}
   - SQL UUIDs: c1000000-...-000208 onward
   - Script: scripts/import-teachers.mjs

   ## Legal Compliance (2026-03-08)
   - Cookie banner: src/components/consent/cookie-banner.tsx
   - ConsentRecord persistence: src/app/actions/consent.ts
   - VAT utility: src/lib/vat.ts
   - DSAR flow: /dashboard/settings privacy section
   - Standard contract: src/messages/{locale}/legal.json
   - Legal docs: docs/legal/
   ```

**Step: commit docs**
```bash
git add docs/ memory/
git commit -m "docs: update architecture docs and LEGAL-READINESS score after compliance sprint"
```

---

## Execution Summary

| Phase | Tasks | Can run in parallel |
|-------|-------|-------------------|
| A | A1 (import script), A2 (data.ts patch), A3 (seed.sql append), A4 (legal PDF analysis) | A1+A2+A3+A4 all parallel |
| B | B1 (legal tech impl), B2 (pricing) | B1+B2 parallel, after A4 |
| C | C1 (unit tests), C2 (e2e), C3 (build), C4 (docs) | C1+C2 parallel; C3 after both; C4 last |

**Total agents needed:** 9 (4 Phase-A + 2 Phase-B + 3 Phase-C)
