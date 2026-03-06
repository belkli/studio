import fs from 'node:fs';
import path from 'node:path';
import { getLocaleDir, readTranslationFile, writeTranslationFile } from './utils.mjs';

const TARGET_LOCALES = ['he', 'ar', 'ru'];
const MOJIBAKE_MARKERS = /[\u00C2\u00C3\u00D0\u00D1\u00D7\u00D8\u00D9\uFFFD]/g;
const QUESTION_BURST = /\?{3,}/g;

function looksSuspicious(value) {
  if (!value || typeof value !== 'string') return false;
  return MOJIBAKE_MARKERS.test(value) || QUESTION_BURST.test(value);
}

function tryRepairString(value) {
  try {
    const repaired = Buffer.from(value, 'latin1').toString('utf8');
    return repaired && repaired !== value ? repaired : value;
  } catch {
    return value;
  }
}

function walkAndRepair(node, counters) {
  if (typeof node === 'string') {
    counters.totalStrings++;
    if (!looksSuspicious(node)) return node;

    const repaired = tryRepairString(node);
    if (!looksSuspicious(repaired)) {
      counters.repaired++;
      return repaired;
    }

    counters.unresolved++;
    return node;
  }

  if (Array.isArray(node)) {
    return node.map((item) => walkAndRepair(item, counters));
  }

  if (node && typeof node === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      out[key] = walkAndRepair(value, counters);
    }
    return out;
  }

  return node;
}

for (const locale of TARGET_LOCALES) {
  const localeDir = getLocaleDir(locale);
  const files = fs.readdirSync(localeDir).filter((file) => file.endsWith('.json'));
  let localeStrings = 0;
  let localeRepaired = 0;
  let localeUnresolved = 0;

  for (const file of files) {
    const filePath = path.join(localeDir, file);
    const data = readTranslationFile(filePath);
    const stats = { totalStrings: 0, repaired: 0, unresolved: 0 };
    const normalized = walkAndRepair(data, stats);

    localeStrings += stats.totalStrings;
    localeRepaired += stats.repaired;
    localeUnresolved += stats.unresolved;

    writeTranslationFile(filePath, normalized);
  }

  console.log(`[${locale}] strings=${localeStrings} repaired=${localeRepaired} unresolved=${localeUnresolved}`);
}
