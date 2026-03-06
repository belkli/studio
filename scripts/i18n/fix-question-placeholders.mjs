import fs from 'node:fs';
import path from 'node:path';

const TARGET_LOCALES = ['he', 'ar', 'ru'];
const TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
const PLACEHOLDER_RE = /\{[^}]+\}/g;
const QUESTION_BURST_RE = /\?{3,}/;
const CACHE_PATH = path.resolve(process.cwd(), 'scripts', 'i18n', '.machine-translation-cache.json');

const enDir = path.resolve(process.cwd(), 'src', 'messages', 'en');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, data) {
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function isRecord(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function protectPlaceholders(value) {
  const placeholders = [];
  const text = value.replace(PLACEHOLDER_RE, (match) => {
    const idx = placeholders.push(match) - 1;
    return `__PH_${idx}__`;
  });
  return { text, placeholders };
}

function restorePlaceholders(value, placeholders) {
  return value.replace(/__\s*PH_(\d+)\s*__/g, (_, idx) => {
    const i = Number(idx);
    return Number.isInteger(i) && i >= 0 && i < placeholders.length ? placeholders[i] : _;
  });
}

function keyToEnglishText(keyPath) {
  const last = keyPath.split('.').pop() || keyPath;
  return last
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function translateFromEnglish(text, targetLocale, cache) {
  const src = String(text || '').trim();
  if (!src) return src;

  const cacheKey = `fixq::${targetLocale}::${src}`;
  if (typeof cache[cacheKey] === 'string' && cache[cacheKey].trim()) {
    return cache[cacheKey];
  }

  const { text: protectedText, placeholders } = protectPlaceholders(src);
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'en',
    tl: targetLocale,
    dt: 't',
    q: protectedText,
  });

  const url = `${TRANSLATE_ENDPOINT}?${params.toString()}`;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'user-agent': 'harmonia-i18n-fixq/1.0' },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const translated = Array.isArray(payload?.[0])
        ? payload[0].map((seg) => (Array.isArray(seg) ? seg[0] : '')).join('')
        : '';

      const out = restorePlaceholders((translated || src).trim(), placeholders) || src;
      cache[cacheKey] = out;
      return out;
    } catch {
      await sleep(250 * (attempt + 1));
    }
  }

  cache[cacheKey] = src;
  return src;
}

async function walkFix(localeNode, enNode, locale, keyPath, cache, stats) {
  if (typeof localeNode === 'string') {
    if (!QUESTION_BURST_RE.test(localeNode)) return localeNode;

    let sourceText = '';
    if (typeof enNode === 'string' && enNode.trim() && !QUESTION_BURST_RE.test(enNode)) {
      sourceText = enNode;
    } else {
      sourceText = keyToEnglishText(keyPath);
    }

    const translated = await translateFromEnglish(sourceText, locale, cache);
    stats.fixed += 1;
    return translated;
  }

  if (Array.isArray(localeNode)) {
    const out = [];
    for (let i = 0; i < localeNode.length; i += 1) {
      out.push(await walkFix(localeNode[i], Array.isArray(enNode) ? enNode[i] : undefined, locale, `${keyPath}[${i}]`, cache, stats));
    }
    return out;
  }

  if (isRecord(localeNode)) {
    const out = {};
    for (const [k, v] of Object.entries(localeNode)) {
      const nextPath = keyPath ? `${keyPath}.${k}` : k;
      const enValue = isRecord(enNode) ? enNode[k] : undefined;
      out[k] = await walkFix(v, enValue, locale, nextPath, cache, stats);
    }
    return out;
  }

  return localeNode;
}

async function run() {
  const cache = readCache();
  const enFiles = fs.readdirSync(enDir).filter((f) => f.endsWith('.json'));

  for (const locale of TARGET_LOCALES) {
    const localeDir = path.resolve(process.cwd(), 'src', 'messages', locale);
    const files = fs.readdirSync(localeDir).filter((f) => f.endsWith('.json'));
    let fixedCount = 0;

    for (const file of files) {
      const localePath = path.join(localeDir, file);
      const localeData = readJson(localePath);

      let enData = {};
      if (enFiles.includes(file)) {
        enData = readJson(path.join(enDir, file));
      }

      const stats = { fixed: 0 };
      const fixedData = await walkFix(localeData, enData, locale, '', cache, stats);

      if (stats.fixed > 0) {
        writeJson(localePath, fixedData);
        fixedCount += stats.fixed;
      }
    }

    console.log(`[fix-question] ${locale}: fixed=${fixedCount}`);
  }

  writeCache(cache);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
