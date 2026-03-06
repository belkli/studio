import fs from 'node:fs';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/i18n/fix-source-mojibake.mjs <file...>');
  process.exit(1);
}

function looksMojibake(s) {
  return /[ÃÐ×ØÙÑ]/.test(s);
}

function scoreReadable(s) {
  let score = 0;
  if (/[\u0590-\u05FF]/.test(s)) score += 4;
  if (/[\u0600-\u06FF]/.test(s)) score += 4;
  if (/[\u0400-\u04FF]/.test(s)) score += 4;
  if (/[A-Za-z]/.test(s)) score += 1;
  if (/\?\?\?/.test(s)) score -= 3;
  return score;
}

function decodeMaybe(s) {
  if (!looksMojibake(s)) return s;
  let best = s;
  let bestScore = scoreReadable(s);
  let curr = s;
  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = Buffer.from(curr, 'latin1').toString('utf8');
      const sc = scoreReadable(decoded);
      if (sc > bestScore) {
        best = decoded;
        bestScore = sc;
      }
      curr = decoded;
    } catch {
      break;
    }
  }
  return best;
}

function fixFile(path) {
  const input = fs.readFileSync(path, 'utf8');
  let out = '';
  let i = 0;
  let changed = 0;

  while (i < input.length) {
    const ch = input[i];
    if (ch !== '"' && ch !== "'" && ch !== '`') {
      out += ch;
      i += 1;
      continue;
    }

    const quote = ch;
    out += quote;
    i += 1;
    let content = '';

    while (i < input.length) {
      const c = input[i];
      if (c === '\\') {
        // keep escapes as-is in buffer
        content += input.slice(i, i + 2);
        i += 2;
        continue;
      }
      if (c === quote) {
        break;
      }
      content += c;
      i += 1;
    }

    const fixed = decodeMaybe(content);
    if (fixed !== content) changed += 1;
    out += fixed;

    if (i < input.length && input[i] === quote) {
      out += quote;
      i += 1;
    }
  }

  if (changed > 0) fs.writeFileSync(path, out, 'utf8');
  return changed;
}

let total = 0;
for (const file of files) {
  const c = fixFile(file);
  total += c;
  console.log(`[fix-source-mojibake] ${file}: ${c}`);
}
console.log(`[fix-source-mojibake] total changed literals: ${total}`);
