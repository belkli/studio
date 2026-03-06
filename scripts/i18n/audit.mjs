// Finds keys present in "en" but missing in other locales.
import fs from 'fs';
import path from 'path';
import { readTranslationFile, getLocaleDir, SUPPORTED_LOCALES } from './utils.mjs';

const enDir = getLocaleDir('en');
const files = fs.readdirSync(enDir).filter((file) => file.endsWith('.json'));

let totalMissing = 0;

for (const file of files) {
  const enData = readTranslationFile(path.join(enDir, file));
  const enKeys = flattenKeys(enData);

  for (const locale of SUPPORTED_LOCALES.filter((l) => l !== 'en')) {
    const localeDir = getLocaleDir(locale);
    let localeData = {};
    try {
      localeData = readTranslationFile(path.join(localeDir, file));
    } catch (error) {
      // Locale file may not exist yet.
    }

    const localeKeys = flattenKeys(localeData);
    const missing = enKeys.filter((key) => !localeKeys.includes(key));

    if (missing.length > 0) {
      console.log(`\n${file} [${locale}] - ${missing.length} missing keys:`);
      missing.forEach((key) => console.log(`  - ${key}`));
      totalMissing += missing.length;
    }
  }
}

console.log(`\nTotal missing translations: ${totalMissing}`);

function flattenKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    return isRecord(value) ? flattenKeys(value, fullKey) : [fullKey];
  });
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
