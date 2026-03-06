// Usage: node scripts/i18n/add-key.mjs Namespace.key.path "Hebrew value" "English value" "Russian value" "Arabic value"
import path from 'path';
import { readTranslationFile, writeTranslationFile, getLocaleDir, SUPPORTED_LOCALES } from './utils.mjs';

const [, , keyPath, ...values] = process.argv;

if (!keyPath || values.length < 2) {
  console.error('Usage: node scripts/i18n/add-key.mjs Namespace.key "he value" "en value" [ru value] [ar value]');
  process.exit(1);
}

const [namespace, ...keys] = keyPath.split('.');

if (!namespace || keys.length === 0) {
  console.error('Invalid key path. Expected format: Namespace.path.to.key');
  process.exit(1);
}

const localeValues = { he: values[0], en: values[1], ru: values[2], ar: values[3] };

for (const locale of SUPPORTED_LOCALES) {
  const filePath = path.join(getLocaleDir(locale), `${namespace.toLowerCase()}.json`);

  let data = {};
  try {
    data = readTranslationFile(filePath);
  } catch (error) {
    // File may not exist yet.
  }

  setNestedKey(data, [namespace, ...keys].join('.'), localeValues[locale] ?? localeValues.en);
  writeTranslationFile(filePath, data);
}

function setNestedKey(obj, keyPathToSet, value) {
  const parts = keyPathToSet.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}
