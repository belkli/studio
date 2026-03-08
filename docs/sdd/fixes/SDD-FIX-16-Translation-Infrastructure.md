# SDD-FIX-16: Translation Infrastructure — NodeJS Scripts & Encoding Fix

**PDF Issue:** #22  
**Priority:** P0

---

## 1. Problem

Translation files are being modified using PowerShell scripts, which corrupt UTF-8 Hebrew/Arabic characters into gibberish (e.g., `×©×œ×•×ž` instead of `שלום`). This is a critical infrastructure issue.

**Root cause:** PowerShell on Windows uses `UTF-16 LE` encoding by default. JSON files written with PowerShell lose the correct multi-byte encoding of non-ASCII characters.

---

## 2. Rule: All Translation Work Must Use NodeJS

**File:** `scripts/i18n/` directory — all scripts in this directory must be `.mjs` or `.js` with `"type": "module"`.

---

## 3. NodeJS Translation Scripts

### 3.1 Base Script: Safe JSON Writer

```javascript
// scripts/i18n/utils.mjs
import fs from 'fs';
import path from 'path';

/**
 * Safely write a JSON translation file with proper UTF-8 encoding.
 * NEVER use fs.writeFileSync without explicit utf8 — this is the only safe wrapper.
 */
export function writeTranslationFile(filePath, data) {
  const json = JSON.stringify(data, null, 2);
  // Explicitly specify utf8 encoding — never rely on system default
  fs.writeFileSync(filePath, json, { encoding: 'utf8' });
  console.log(`✅ Written: ${filePath}`);
}

export function readTranslationFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }));
}

export function getLocaleDir(locale) {
  return path.resolve(process.cwd(), 'src', 'messages', locale);
}

export const SUPPORTED_LOCALES = ['he', 'en', 'ru', 'ar'];
```

### 3.2 Script: Add Translation Key

```javascript
// scripts/i18n/add-key.mjs
// Usage: node scripts/i18n/add-key.mjs Namespace.key.path "Hebrew value" "English value" "Russian value" "Arabic value"
import { readTranslationFile, writeTranslationFile, getLocaleDir, SUPPORTED_LOCALES } from './utils.mjs';
import path from 'path';

const [,, keyPath, ...values] = process.argv;

if (!keyPath || values.length < 2) {
  console.error('Usage: node add-key.mjs Namespace.key "he value" "en value" [ru value] [ar value]');
  process.exit(1);
}

const [namespace, ...keys] = keyPath.split('.');
const leafKey = keys.join('.');
const localeValues = { he: values[0], en: values[1], ru: values[2], ar: values[3] };

for (const locale of SUPPORTED_LOCALES) {
  const filePath = path.join(getLocaleDir(locale), `${namespace}.json`);
  
  let data = {};
  try {
    data = readTranslationFile(filePath);
  } catch (e) {
    // File may not exist yet
  }
  
  // Deep set using key path
  setNestedKey(data, leafKey, localeValues[locale] ?? localeValues.en);
  writeTranslationFile(filePath, data);
}

function setNestedKey(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}
```

### 3.3 Script: Audit Missing Keys

```javascript
// scripts/i18n/audit.mjs
// Finds keys present in 'en' but missing in other locales
import { readTranslationFile, getLocaleDir, SUPPORTED_LOCALES } from './utils.mjs';
import fs from 'fs';
import path from 'path';

const enDir = getLocaleDir('en');
const files = fs.readdirSync(enDir).filter(f => f.endsWith('.json'));

let totalMissing = 0;

for (const file of files) {
  const enData = readTranslationFile(path.join(enDir, file));
  const enKeys = flattenKeys(enData);
  
  for (const locale of SUPPORTED_LOCALES.filter(l => l !== 'en')) {
    const localeDir = getLocaleDir(locale);
    let localeData = {};
    try {
      localeData = readTranslationFile(path.join(localeDir, file));
    } catch (e) {}
    
    const localeKeys = flattenKeys(localeData);
    const missing = enKeys.filter(k => !localeKeys.includes(k));
    
    if (missing.length > 0) {
      console.log(`\n⚠️  ${file} [${locale}] — ${missing.length} missing keys:`);
      missing.forEach(k => console.log(`   - ${k}`));
      totalMissing += missing.length;
    }
  }
}

console.log(`\n📊 Total missing translations: ${totalMissing}`);

function flattenKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    return typeof v === 'object' && v !== null ? flattenKeys(v, fullKey) : [fullKey];
  });
}
```

### 3.4 Script: Batch Add Status Keys (immediate fix for issue #6)

```javascript
// scripts/i18n/add-status-keys.mjs
import { readTranslationFile, writeTranslationFile, getLocaleDir } from './utils.mjs';
import path from 'path';

const STATUS_TRANSLATIONS = {
  PENDING:            { he: 'ממתין לאישור',      en: 'Pending',           ru: 'Ожидание',        ar: 'قيد الانتظار' },
  APPROVED:           { he: 'מאושר',              en: 'Approved',          ru: 'Одобрено',        ar: 'موافق عليه' },
  REJECTED:           { he: 'נדחה',               en: 'Rejected',          ru: 'Отклонено',       ar: 'مرفوض' },
  REVISION_REQUIRED:  { he: 'נדרש תיקון',         en: 'Revision Required', ru: 'Требует правок',  ar: 'يتطلب مراجعة' },
  DRAFT:              { he: 'טיוטה',              en: 'Draft',             ru: 'Черновик',        ar: 'مسودة' },
  CANCELLED:          { he: 'בוטל',               en: 'Cancelled',         ru: 'Отменено',        ar: 'ملغى' },
  COMPLETED:          { he: 'הושלם',              en: 'Completed',         ru: 'Завершено',       ar: 'مكتمل' },
};

const LOCALES = ['he', 'en', 'ru', 'ar'];

for (const locale of LOCALES) {
  const filePath = path.join(getLocaleDir(locale), 'common.json');
  let data = {};
  try { data = readTranslationFile(filePath); } catch (e) {}
  
  if (!data.Status) data.Status = {};
  
  for (const [key, translations] of Object.entries(STATUS_TRANSLATIONS)) {
    data.Status[key] = translations[locale] ?? translations.en;
  }
  
  writeTranslationFile(filePath, data);
}
console.log('✅ Status keys added to all locales');
```

---

## 4. package.json Scripts

Add these to `package.json`:
```json
{
  "scripts": {
    "i18n:audit": "node scripts/i18n/audit.mjs",
    "i18n:add-key": "node scripts/i18n/add-key.mjs",
    "i18n:fix-status": "node scripts/i18n/add-status-keys.mjs",
    "i18n:validate": "node scripts/i18n/audit.mjs && echo 'All translations complete'"
  }
}
```

---

## 5. CI Check

Add to `.github/workflows/ci.yml` (or equivalent):
```yaml
- name: Validate translations
  run: npm run i18n:audit
  # Fail CI if there are missing translations above threshold
```

---

## 6. Immediate Remediation

Run the following immediately to fix the most critical missing keys:
```bash
node scripts/i18n/add-status-keys.mjs
node scripts/i18n/audit.mjs    # check what else is missing
```

---

## Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Run `npm run i18n:audit` | Output lists all missing translation keys |
| 2 | Run `npm run i18n:fix-status` | Status keys added to all 4 locale files |
| 3 | Open `src/messages/he/common.json` in text editor | Hebrew characters render correctly (not garbled) |
| 4 | Run `node scripts/i18n/add-key.mjs Common.test "בדיקה" "Test"` | Key added to he + en files |
| 5 | No PowerShell translation script exists in repo | PR review blocks any `.ps1` writing translation files |
