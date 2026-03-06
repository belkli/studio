import fs from 'node:fs';
import path from 'node:path';
import { getLocaleDir, readTranslationFile, writeTranslationFile } from './utils.mjs';

const TARGET_LOCALES = ['he', 'ar', 'ru'];
const EN_DIR = getLocaleDir('en');
const EN_FILES = fs.readdirSync(EN_DIR).filter((file) => file.endsWith('.json')).sort();
const TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
const CACHE_PATH = path.resolve(process.cwd(), 'scripts', 'i18n', '.machine-translation-cache.json');
const PLACEHOLDER_RE = /\{[^}]+\}/g;
const MOJIBAKE_RE = /[ÃÂÐÑ×ØÙ�]/;

const SCRIPT_RULES = {
  he: {
    target: /[\u0590-\u05FF]/,
    other: [/[\u0600-\u06FF]/, /[\u0400-\u04FF]/],
  },
  ar: {
    target: /[\u0600-\u06FF]/,
    other: [/[\u0590-\u05FF]/, /[\u0400-\u04FF]/],
  },
  ru: {
    target: /[\u0400-\u04FF]/,
    other: [/[\u0590-\u05FF]/, /[\u0600-\u06FF]/],
  },
};

const ALLOWED_LATIN_TOKENS = /(?:AI|CSV|PDF|JPG|PNG|URL|OAuth|Google|Microsoft|Cardcom|CardCom|PeleCard|HYP|Hebcal|NVDA|JAWS|VoiceOver|WhatsApp|YouTube|Vimeo|IS|WCAG|CVC|PCI-DSS|ILS|Hilan|Merav|Yamaha|OTP|SMS|Harmonia|Harmony|Apple)/gi;

const HARD_OVERRIDES = {
  'â‚ª': '₪',
  'â‚ª{price}': '₪{price}',
  '₪': '₪',
  '₪{price}': '₪{price}',
};

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeForLookup(value) {
  return value
    .replace(PLACEHOLDER_RE, '{}')
    .replace(/[^\p{L}\p{N}{}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function looksCorrupted(value) {
  if (typeof value !== 'string' || !value) return false;
  return MOJIBAKE_RE.test(value) || value.includes('â‚ª');
}

function hasLatinWords(value) {
  return /[A-Za-z]{2,}/.test(value);
}

function hasWrongScript(locale, value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  const rules = SCRIPT_RULES[locale];
  if (!rules) return false;

  const stripped = value
    .replace(PLACEHOLDER_RE, '')
    .replace(/[A-Za-z0-9₪€$%+\-_/.,:;()[\]"'!?& ]+/g, '')
    .trim();

  if (!stripped) return false;

  const hasTarget = rules.target.test(stripped);
  const hasOther = rules.other.some((range) => range.test(stripped));
  return hasOther && !hasTarget;
}


function latinRatio(value) {
  const text = value
    .replace(PLACEHOLDER_RE, '')
    .replace(ALLOWED_LATIN_TOKENS, '')
    .replace(/[^A-Za-z\p{L}]+/gu, '');

  if (!text) return 0;
  const latinChars = (text.match(/[A-Za-z]/g) || []).length;
  return latinChars / text.length;
}

function hasEnglishNoise(locale, value) {
  if (typeof value !== 'string' || !value.trim()) return false;

  const cleaned = value.replace(PLACEHOLDER_RE, '').replace(ALLOWED_LATIN_TOKENS, '');
  const latinWords = cleaned.match(/[A-Za-z]{2,}/g) || [];
  if (latinWords.length === 0) return false;

  const ratio = latinRatio(cleaned);

  if (locale === 'ru') {
    return latinWords.length >= 1 || ratio > 0.08;
  }

  if (locale === 'he' || locale === 'ar') {
    return latinWords.length >= 3 && ratio > 0.35;
  }

  return false;
}

function shouldTranslate(locale, localeValue, enValue) {
  if (typeof enValue !== 'string') return false;
  if (typeof localeValue !== 'string') return true;
  if (!localeValue.trim()) return true;
  if (looksCorrupted(localeValue)) return true;
  if (hasWrongScript(locale, localeValue)) return true;
  if (hasEnglishNoise(locale, localeValue)) return true;
  if (localeValue === enValue) return true;

  // Keep legitimate existing localized values.
  if (hasLatinWords(localeValue) && localeValue === localeValue.normalize('NFKC')) {
    return false;
  }

  return false;
}

function buildMemory(locale) {
  const exact = new Map();
  const normalized = new Map();

  for (const file of EN_FILES) {
    const enData = readTranslationFile(path.join(EN_DIR, file));
    const localePath = path.join(getLocaleDir(locale), file);

    let localeData = {};
    try {
      localeData = readTranslationFile(localePath);
    } catch {
      localeData = {};
    }

    walk(enData, localeData, '', (enValue, localeValue) => {
      if (typeof enValue !== 'string') return;
      if (typeof localeValue !== 'string') return;
      if (!localeValue.trim()) return;
      if (localeValue === enValue) return;
      if (looksCorrupted(localeValue)) return;
      if (hasWrongScript(locale, localeValue)) return;
      if (hasEnglishNoise(locale, localeValue)) return;

      if (!exact.has(enValue)) {
        exact.set(enValue, localeValue);
      }

      const normalizedKey = normalizeForLookup(enValue);
      if (normalizedKey && !normalized.has(normalizedKey)) {
        normalized.set(normalizedKey, localeValue);
      }
    });
  }

  return { exact, normalized };
}

function walk(enNode, localeNode, prefix, visitor) {
  if (typeof enNode === 'string') {
    visitor(enNode, localeNode, prefix);
    return;
  }

  if (Array.isArray(enNode)) {
    return;
  }

  if (!isRecord(enNode)) {
    return;
  }

  for (const [key, enValue] of Object.entries(enNode)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    const localeValue = isRecord(localeNode) ? localeNode[key] : undefined;
    walk(enValue, localeValue, nextPrefix, visitor);
  }
}

function protectPlaceholders(value) {
  const placeholders = [];
  const text = value.replace(PLACEHOLDER_RE, (match) => {
    const index = placeholders.push(match) - 1;
    return `__PH_${index}__`;
  });
  return { text, placeholders };
}

function restorePlaceholders(value, placeholders) {
  let out = value;

  out = out.replace(/__\s*PH_(\d+)\s*__/g, (_, idx) => {
    const parsed = Number(idx);
    return Number.isInteger(parsed) && parsed >= 0 && parsed < placeholders.length
      ? placeholders[parsed]
      : _;
  });

  out = out.replace(/__\s*P\s*H\s*[_\s]*(\d+)\s*__/gi, (_, idx) => {
    const parsed = Number(idx);
    return Number.isInteger(parsed) && parsed >= 0 && parsed < placeholders.length
      ? placeholders[parsed]
      : _;
  });

  return out;
}

function shouldSkipApi(text) {
  if (!text.trim()) return true;
  if (HARD_OVERRIDES[text]) return true;
  if (/^https?:\/\//i.test(text)) return true;
  if (/^[^A-Za-z\p{L}\p{N}]*$/u.test(text)) return true;
  if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(text.trim())) return true;
  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeCache(cache) {
  fs.writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
}

async function machineTranslate(text, targetLocale, cache) {
  const cacheKey = `${targetLocale}::${text}`;
  if (typeof cache[cacheKey] === 'string' && cache[cacheKey].trim()) {
    return cache[cacheKey];
  }

  if (HARD_OVERRIDES[text]) {
    cache[cacheKey] = HARD_OVERRIDES[text];
    return cache[cacheKey];
  }

  if (shouldSkipApi(text)) {
    cache[cacheKey] = text;
    return text;
  }

  const { text: protectedText, placeholders } = protectPlaceholders(text);

  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'en',
    tl: targetLocale,
    dt: 't',
    q: protectedText,
  });

  const url = `${TRANSLATE_ENDPOINT}?${params.toString()}`;

  let lastError = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'user-agent': 'harmonia-i18n-sync/1.0' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const translated = Array.isArray(payload?.[0])
        ? payload[0].map((segment) => (Array.isArray(segment) ? segment[0] : '')).join('')
        : '';

      const restored = restorePlaceholders(translated || text, placeholders).trim();
      const finalValue = restored || text;
      cache[cacheKey] = finalValue;
      return finalValue;
    } catch (error) {
      lastError = error;
      await sleep(300 * (attempt + 1));
    }
  }

  console.warn(`[${targetLocale}] translate fallback to EN after retries: ${text}`);
  if (lastError) {
    console.warn(`  reason: ${String(lastError.message || lastError)}`);
  }
  cache[cacheKey] = text;
  return text;
}

function deepMergeLocale(localeNode, enNode, resolver) {
  if (typeof enNode === 'string') {
    return resolver(enNode, localeNode);
  }

  if (Array.isArray(enNode)) {
    return Array.isArray(localeNode) ? localeNode : enNode;
  }

  if (!isRecord(enNode)) {
    return localeNode ?? enNode;
  }

  const out = isRecord(localeNode) ? { ...localeNode } : {};
  for (const [key, enValue] of Object.entries(enNode)) {
    out[key] = deepMergeLocale(out[key], enValue, resolver);
  }
  return out;
}

async function run() {
  const cache = readCache();

  for (const locale of TARGET_LOCALES) {
    const memory = buildMemory(locale);
    const needed = new Set();

    for (const file of EN_FILES) {
      const enData = readTranslationFile(path.join(EN_DIR, file));
      let localeData = {};
      try {
        localeData = readTranslationFile(path.join(getLocaleDir(locale), file));
      } catch {
        localeData = {};
      }

      walk(enData, localeData, '', (enValue, localeValue) => {
        if (shouldTranslate(locale, localeValue, enValue)) {
          needed.add(enValue);
        }
      });
    }

    const dictionary = new Map();
    let fromMemory = 0;
    let fromApi = 0;

    for (const enValue of needed) {
      if (memory.exact.has(enValue)) {
        dictionary.set(enValue, memory.exact.get(enValue));
        fromMemory += 1;
        continue;
      }

      const normalized = normalizeForLookup(enValue);
      if (normalized && memory.normalized.has(normalized)) {
        dictionary.set(enValue, memory.normalized.get(normalized));
        fromMemory += 1;
        continue;
      }

      const translated = await machineTranslate(enValue, locale, cache);
      dictionary.set(enValue, translated);
      fromApi += 1;
    }

    let changedFiles = 0;
    let translatedEntries = 0;

    for (const file of EN_FILES) {
      const enPath = path.join(EN_DIR, file);
      const localePath = path.join(getLocaleDir(locale), file);

      const enData = readTranslationFile(enPath);
      let localeData = {};
      try {
        localeData = readTranslationFile(localePath);
      } catch {
        localeData = {};
      }

      const merged = deepMergeLocale(localeData, enData, (enValue, localeValue) => {
        if (!shouldTranslate(locale, localeValue, enValue)) {
          return localeValue;
        }

        translatedEntries += 1;
        return dictionary.get(enValue) ?? enValue;
      });

      const before = JSON.stringify(localeData);
      const after = JSON.stringify(merged);
      if (before !== after) {
        writeTranslationFile(localePath, merged);
        changedFiles += 1;
      }
    }

    console.log(
      `[${locale}] needed=${needed.size} memory=${fromMemory} api=${fromApi} translated_entries=${translatedEntries} files_changed=${changedFiles}`
    );
  }

  writeCache(cache);
  console.log('Translation sync complete.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
