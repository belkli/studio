/**
 * Teacher import script: reads 10 Hebrew CSV files, translates teacher data via Claude Haiku,
 * and produces three output files:
 *   scripts/teachers/generated-teachers.json   — array of teacher objects
 *   scripts/teachers/seed-append.sql           — SQL INSERT blocks + website UPDATEs
 *   scripts/teachers/data-ts-append.txt        — TypeScript object literals for data.ts
 *
 * Usage: node scripts/import-teachers.mjs
 * Resume-safe: skips already-processed dirIds from generated-teachers.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// Conservatorium mapping
// ---------------------------------------------------------------------------
const CONS_MAP = [
  { keyword: 'אשדוד',        consId: 'cons-2',  n: 2,  name: 'אקדמא, אשדוד',             aUuid: 'a1000000-0000-0000-0000-000000000002' },
  { keyword: 'באר שבע',      consId: 'cons-7',  n: 7,  name: 'קונסרבטוריון באר שבע',      aUuid: 'a1000000-0000-0000-0000-000000000007' },
  { keyword: 'בית שמש',      consId: 'cons-9',  n: 9,  name: 'קונסרבטוריון בית שמש',      aUuid: 'a1000000-0000-0000-0000-000000000009' },
  { keyword: 'ברנר',         consId: 'cons-10', n: 10, name: 'מרכז המוסיקה ברנר',         aUuid: 'a1000000-0000-0000-0000-000000000010' },
  { keyword: 'בת ים',        consId: 'cons-11', n: 11, name: 'קונסרבטוריון בת-ים',        aUuid: 'a1000000-0000-0000-0000-000000000011' },
  { keyword: 'גליל עליון',   consId: 'cons-14', n: 14, name: 'קלור גליל עליון',           aUuid: 'a1000000-0000-0000-0000-000000000014' },
  { keyword: 'דימונה',       consId: 'cons-13', n: 13, name: 'קונסרבטוריון דימונה',       aUuid: 'a1000000-0000-0000-0000-000000000013' },
  { keyword: 'הרצליה',       consId: 'cons-17', n: 17, name: 'מרכז תאו הרצליה',           aUuid: 'a1000000-0000-0000-0000-000000000017' },
  { keyword: 'זכרון יעקב',   consId: 'cons-18', n: 18, name: 'זמארין זכרון יעקב',         aUuid: 'a1000000-0000-0000-0000-000000000018' },
  { keyword: 'ערבה',         consId: 'cons-16', n: 16, name: 'מרכז קהילה ערבה',           aUuid: 'a1000000-0000-0000-0000-000000000016' },
];

const CSV_DIR = join(ROOT, 'docs/data/new/teachers');
const OUT_DIR = join(__dirname, 'teachers');

mkdirSync(OUT_DIR, { recursive: true });

const GENERATED_FILE = join(OUT_DIR, 'generated-teachers.json');
const SQL_FILE       = join(OUT_DIR, 'seed-append.sql');
const TS_FILE        = join(OUT_DIR, 'data-ts-append.txt');

const GLOBAL_SEQ_START = 208;

// ---------------------------------------------------------------------------
// UUID / ID helpers
// ---------------------------------------------------------------------------
function uuidFromSeq(n) {
  return `c1000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
}
function dirId(seq) {
  return `dir-teacher-${String(seq).padStart(3, '0')}`;
}

// ---------------------------------------------------------------------------
// Availability patterns (7 rotating)
// ---------------------------------------------------------------------------
const AVAILABILITY_PATTERNS = [
  [{ dayOfWeek: 'SUN', startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'TUE', startTime: '14:00', endTime: '20:00' }],
  [{ dayOfWeek: 'MON', startTime: '15:00', endTime: '21:00' }, { dayOfWeek: 'WED', startTime: '15:00', endTime: '21:00' }],
  [{ dayOfWeek: 'TUE', startTime: '14:00', endTime: '19:00' }, { dayOfWeek: 'THU', startTime: '14:00', endTime: '19:00' }],
  [{ dayOfWeek: 'SUN', startTime: '09:00', endTime: '14:00' }, { dayOfWeek: 'WED', startTime: '09:00', endTime: '14:00' }],
  [{ dayOfWeek: 'MON', startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'THU', startTime: '14:00', endTime: '20:00' }],
  [{ dayOfWeek: 'SUN', startTime: '16:00', endTime: '21:00' }, { dayOfWeek: 'TUE', startTime: '16:00', endTime: '21:00' }, { dayOfWeek: 'THU', startTime: '16:00', endTime: '21:00' }],
  [{ dayOfWeek: 'MON', startTime: '08:00', endTime: '13:00' }, { dayOfWeek: 'WED', startTime: '08:00', endTime: '13:00' }, { dayOfWeek: 'FRI', startTime: '08:00', endTime: '13:00' }],
];

// ---------------------------------------------------------------------------
// CSV parser (handles quoted commas + double-quote escaping)
// ---------------------------------------------------------------------------
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  function parseLine(line) {
    const cols = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (ch === ',' && !inQuote) {
        cols.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur);
    return cols;
  }

  const headers = parseLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] ?? '').trim(); });
    return obj;
  }).filter(row => row['First Name'] && row['First Name'] !== '-');
}

// ---------------------------------------------------------------------------
// Anthropic client
// ---------------------------------------------------------------------------
const client = new Anthropic();

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function translateBatch(items) {
  // items: [{ firstName, lastName, bio, instruments }]
  const prompt = `You are a translator. Translate the following Hebrew teacher data into English (en), Arabic/Modern Standard (ar), and Russian (ru).

Return ONLY a JSON array (no markdown, no explanation) with one object per input item, in the same order.
Each object must have:
  "firstNameEn", "firstNameAr", "firstNameRu",
  "lastNameEn", "lastNameAr", "lastNameRu",
  "bioEn", "bioAr", "bioRu",
  "instrumentsEn" (array of translated instrument names),
  "instrumentsAr" (array),
  "instrumentsRu" (array)

Items:
${JSON.stringify(items, null, 2)}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });

  let text = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]';
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/m, '');
  return JSON.parse(text);
}

// ---------------------------------------------------------------------------
// Load existing teachers for resume support
// ---------------------------------------------------------------------------
let existingTeachers = [];
if (existsSync(GENERATED_FILE)) {
  try {
    existingTeachers = JSON.parse(readFileSync(GENERATED_FILE, 'utf8'));
    console.log(`Resuming: ${existingTeachers.length} teachers already processed`);
  } catch { existingTeachers = []; }
}
const existingDirIds = new Set(existingTeachers.map(t => t.dirId));

// ---------------------------------------------------------------------------
// Discover and parse all CSVs
// ---------------------------------------------------------------------------
import { readdirSync } from 'fs';

const csvFiles = readdirSync(CSV_DIR).filter(f => f.endsWith('.csv'));

// Build flat list of all raw teachers (deterministic order by cons keyword, then row order)
// This ensures seq numbers are stable across resumes
const allRawTeachers = [];

for (const cons of CONS_MAP) {
  const file = csvFiles.find(f => f.includes(cons.keyword));
  if (!file) {
    console.warn(`  WARNING: No CSV found for keyword "${cons.keyword}"`);
    continue;
  }
  const csvText = readFileSync(join(CSV_DIR, file), 'utf8');
  const rows = parseCSV(csvText);
  console.log(`  ${cons.consId}: ${rows.length} rows in ${file}`);
  for (const row of rows) {
    allRawTeachers.push({ ...row, cons });
  }
}

console.log(`\nTotal raw teachers across all CSVs: ${allRawTeachers.length}`);

// Assign seq numbers deterministically
const allRawWithSeq = allRawTeachers.map((raw, i) => ({
  ...raw,
  seq: GLOBAL_SEQ_START + i,
}));

// Filter out already-processed
const toProcess = allRawWithSeq.filter(r => !existingDirIds.has(dirId(r.seq)));
console.log(`Teachers needing translation: ${toProcess.length}`);

// ---------------------------------------------------------------------------
// Translate in batches of 20
// ---------------------------------------------------------------------------
const BATCH_SIZE = 20;
const newTeachers = [];

for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
  const batch = toProcess.slice(i, i + BATCH_SIZE);
  console.log(`\nTranslating batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toProcess.length / BATCH_SIZE)} (${batch.length} teachers)...`);

  const items = batch.map(raw => {
    const bioHe = (() => {
      try {
        const parsed = JSON.parse(raw['Description (JSON)'] || '{}');
        return parsed.he || '';
      } catch { return ''; }
    })();
    const instrumentsHe = (raw['Instruments'] || '').split(';').map(s => s.trim()).filter(Boolean);
    return {
      firstName: raw['First Name'],
      lastName: raw['Last Name'] === '-' ? '' : raw['Last Name'],
      bio: bioHe,
      instruments: instrumentsHe,
    };
  });

  let translations;
  try {
    translations = await translateBatch(items);
  } catch (err) {
    console.warn(`  Translation failed: ${err.message} — using fallback`);
    translations = items.map(item => ({
      firstNameEn: item.firstName, firstNameAr: item.firstName, firstNameRu: item.firstName,
      lastNameEn: item.lastName,  lastNameAr: item.lastName,  lastNameRu: item.lastName,
      bioEn: item.bio, bioAr: item.bio, bioRu: item.bio,
      instrumentsEn: item.instruments, instrumentsAr: item.instruments, instrumentsRu: item.instruments,
    }));
  }

  for (let j = 0; j < batch.length; j++) {
    const raw = batch[j];
    const tr = translations[j] || {};
    const seq = raw.seq;
    const cons = raw.cons;

    const firstNameHe = raw['First Name'];
    const lastNameHe  = raw['Last Name'] === '-' ? '' : raw['Last Name'];
    const bioHe = (() => {
      try {
        const parsed = JSON.parse(raw['Description (JSON)'] || '{}');
        return parsed.he || '';
      } catch { return ''; }
    })();
    const instrumentsHe = (raw['Instruments'] || '').split(';').map(s => s.trim()).filter(Boolean);

    const teacher = {
      seq,
      dirId: dirId(seq),
      uuid: uuidFromSeq(seq),
      consId: cons.consId,
      consN: cons.n,
      consName: cons.name,
      aUuid: cons.aUuid,
      email: `teacher-${cons.n}-${String(allRawWithSeq.findIndex(r => r.seq === seq) - allRawWithSeq.findIndex(r => r.cons.consId === cons.consId) + 1).padStart(4, '0')}@harmonia.local`,
      firstNameHe,
      lastNameHe,
      firstNames: { he: firstNameHe, en: tr.firstNameEn || firstNameHe, ar: tr.firstNameAr || firstNameHe, ru: tr.firstNameRu || firstNameHe },
      lastNames:  { he: lastNameHe,  en: tr.lastNameEn  || lastNameHe,  ar: tr.lastNameAr  || lastNameHe,  ru: tr.lastNameRu  || lastNameHe  },
      bioHe,
      bio: { he: bioHe, en: tr.bioEn || bioHe, ar: tr.bioAr || bioHe, ru: tr.bioRu || bioHe },
      instrumentsHe,
      instruments: {
        he: instrumentsHe,
        en: tr.instrumentsEn || instrumentsHe,
        ar: tr.instrumentsAr || instrumentsHe,
        ru: tr.instrumentsRu || instrumentsHe,
      },
      availability: AVAILABILITY_PATTERNS[seq % 7],
    };

    newTeachers.push(teacher);
  }

  // Save progress after each batch
  const allSoFar = [...existingTeachers, ...newTeachers];
  writeFileSync(GENERATED_FILE, JSON.stringify(allSoFar, null, 2));
  console.log(`  Saved progress: ${allSoFar.length} teachers total`);
  await sleep(300);
}

// ---------------------------------------------------------------------------
// Final combined list
// ---------------------------------------------------------------------------
const allTeachers = [...existingTeachers, ...newTeachers];
// Re-sort by seq to ensure correct ordering
allTeachers.sort((a, b) => a.seq - b.seq);
writeFileSync(GENERATED_FILE, JSON.stringify(allTeachers, null, 2));
console.log(`\nGenerated ${allTeachers.length} teachers → ${GENERATED_FILE}`);

// ---------------------------------------------------------------------------
// Generate SQL
// ---------------------------------------------------------------------------
function sqlStr(s) {
  return s.replace(/'/g, "''");
}

const sqlLines = [];
sqlLines.push('-- ============================================================');
sqlLines.push('-- AUTO-GENERATED: Teacher users + profiles (seq 208+)');
sqlLines.push('-- ============================================================');
sqlLines.push('');

// Build per-conservatorium email counters for sequential email generation
const consEmailCounters = {};

// Re-process in order to assign per-cons email numbers
const teachersForSql = [...allTeachers].sort((a, b) => a.seq - b.seq);
for (const t of teachersForSql) {
  if (!consEmailCounters[t.consId]) consEmailCounters[t.consId] = 1;
  t.emailForSql = `teacher-${t.consN}-${String(consEmailCounters[t.consId]).padStart(4, '0')}@harmonia.local`;
  consEmailCounters[t.consId]++;
}

// Group by conservatorium for comments
const byCons = {};
for (const t of teachersForSql) {
  if (!byCons[t.consId]) byCons[t.consId] = [];
  byCons[t.consId].push(t);
}

for (const [consId, teachers] of Object.entries(byCons)) {
  sqlLines.push(`-- ${teachers[0].consName} (${consId})`);
  sqlLines.push('INSERT INTO users (id, conservatorium_id, email, role, first_name, first_name_i18n, last_name, last_name_i18n, national_id, phone, avatar_url, is_active)');
  sqlLines.push('VALUES');
  const userRows = teachers.map((t, idx) => {
    const firstNameI18n = JSON.stringify(t.firstNames).replace(/'/g, "''");
    const lastNameI18n  = JSON.stringify(t.lastNames).replace(/'/g, "''");
    const comma = idx < teachers.length - 1 ? ',' : '';
    return `  ('${t.uuid}', '${t.aUuid}', '${sqlStr(t.emailForSql)}', 'TEACHER', '${sqlStr(t.firstNameHe)}', '${firstNameI18n}'::jsonb, '${sqlStr(t.lastNameHe)}', '${lastNameI18n}'::jsonb, NULL, NULL, NULL, TRUE)${comma}`;
  });
  sqlLines.push(...userRows);
  sqlLines.push('ON CONFLICT (id) DO NOTHING;');
  sqlLines.push('');

  sqlLines.push('INSERT INTO teacher_profiles (user_id, bio, instruments, specialties, avatar_url, available_for_new_students, lesson_durations)');
  sqlLines.push('VALUES');
  const profileRows = teachers.map((t, idx) => {
    const bioJson = JSON.stringify(t.bio).replace(/'/g, "''");
    const instrumentsArr = t.instrumentsHe.map(i => `"${i.replace(/"/g, '\\"')}"`).join(',');
    const comma = idx < teachers.length - 1 ? ',' : '';
    return `  ('${t.uuid}', '${bioJson}'::jsonb, ARRAY[${instrumentsArr ? instrumentsArr : ''}]::TEXT[], ARRAY[]::TEXT[], NULL, TRUE, ARRAY[30,45,60])${comma}`;
  });
  sqlLines.push(...profileRows);
  sqlLines.push('ON CONFLICT (user_id) DO NOTHING;');
  sqlLines.push('');
}

// Website UPDATEs
sqlLines.push('-- ============================================================');
sqlLines.push('-- Website URL updates for conservatoriums');
sqlLines.push('-- ============================================================');
sqlLines.push(`UPDATE conservatoriums SET website = 'https://tsahgertner.wixsite.com/musicoa' WHERE id = 'a1000000-0000-0000-0000-000000000001';`);
sqlLines.push(`UPDATE conservatoriums SET website = 'https://www.akadma.co.il/' WHERE id = 'a1000000-0000-0000-0000-000000000002';`);
sqlLines.push(`UPDATE conservatoriums SET website = 'https://ironitash.org.il/konser-ashkelon/' WHERE id = 'a1000000-0000-0000-0000-000000000006';`);
sqlLines.push(`UPDATE conservatoriums SET website = 'https://cons-bs.my.canva.site/conservatory-beer-sheva' WHERE id = 'a1000000-0000-0000-0000-000000000007';`);
sqlLines.push(`UPDATE conservatoriums SET website = 'https://www.matnasbs.org.il/52/' WHERE id = 'a1000000-0000-0000-0000-000000000009';`);
sqlLines.push(`UPDATE conservatoriums SET website = 'https://www.tarbut-batyam.co.il/?CategoryID=405' WHERE id = 'a1000000-0000-0000-0000-000000000011';`);
sqlLines.push(`UPDATE conservatoriums SET website = 'https://www.kehilatayim.org.il/62/' WHERE id = 'a1000000-0000-0000-0000-000000000012';`);
sqlLines.push(`UPDATE conservatoriums SET website = 'https://www.matnas-dimona.org.il/page.php?type=matClass&id=909&ht=&bc=' WHERE id = 'a1000000-0000-0000-0000-000000000013';`);
sqlLines.push(`UPDATE conservatoriums SET website = 'https://clore.galil-elion.org.il/' WHERE id = 'a1000000-0000-0000-0000-000000000014';`);
sqlLines.push(`UPDATE conservatoriums SET website = 'https://arava.smarticket.co.il/' WHERE id = 'a1000000-0000-0000-0000-000000000016';`);
sqlLines.push(`UPDATE conservatoriums SET website = 'https://teo.org.il/conservatory/' WHERE id = 'a1000000-0000-0000-0000-000000000017';`);
sqlLines.push(`UPDATE conservatoriums SET website = 'https://www.zamarin.org.il/html5/?_id=14760&did=4688&G=14760' WHERE id = 'a1000000-0000-0000-0000-000000000018';`);

writeFileSync(SQL_FILE, sqlLines.join('\n') + '\n');
console.log(`SQL written → ${SQL_FILE}`);

// ---------------------------------------------------------------------------
// Generate TypeScript data-ts-append.txt
// ---------------------------------------------------------------------------
const tsLines = [];
tsLines.push('// AUTO-GENERATED: directoryTeacherUsers append (seq 208+)');
tsLines.push('// Paste these lines into the directoryTeacherUsers array in src/lib/data.ts');
tsLines.push('');

for (const t of teachersForSql) {
  const fullName = t.lastNameHe ? `${t.firstNameHe} ${t.lastNameHe}` : t.firstNameHe;
  const bioShort = t.bioHe.length > 80 ? t.bioHe.slice(0, 77) + '...' : t.bioHe;
  const avail = t.availability.map(a =>
    `{ dayOfWeek: '${a.dayOfWeek}' as const, startTime: '${a.startTime}', endTime: '${a.endTime}' }`
  ).join(', ');
  const instruments = t.instrumentsHe.map(instr =>
    `{ instrument: '${instr.replace(/'/g, "\\'")}', teacherName: '${fullName.replace(/'/g, "\\'")}', yearsOfStudy: 10 }`
  ).join(', ');

  const line = `    { id: '${t.dirId}', name: '${fullName.replace(/'/g, "\\'")}', email: '${sqlStr(t.emailForSql)}', role: 'teacher' as const, conservatoriumId: '${t.consId}', conservatoriumName: '${t.consName.replace(/'/g, "\\'")}', avatarUrl: 'https://i.pravatar.cc/150?u=${t.dirId}', bio: '${bioShort.replace(/'/g, "\\'")}', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [${avail}], instruments: [${instruments || `{ instrument: 'לא צוין', teacherName: '${fullName.replace(/'/g, "\\'")}', yearsOfStudy: 10 }`}], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },`;
  tsLines.push(line);
}

writeFileSync(TS_FILE, tsLines.join('\n') + '\n');
console.log(`TypeScript data written → ${TS_FILE}`);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n=== Summary ===');
console.log(`Total teachers: ${allTeachers.length}`);
const counts = {};
for (const t of allTeachers) counts[t.consId] = (counts[t.consId] || 0) + 1;
for (const [c, n] of Object.entries(counts).sort()) console.log(`  ${c}: ${n}`);
