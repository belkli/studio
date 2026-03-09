import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const ruDir = 'src/messages/ru';
const enDir = 'src/messages/en';

function countKeys(o) {
  let n = 0;
  for (const k of Object.keys(o)) {
    if (typeof o[k] === 'object' && o[k] !== null) n += countKeys(o[k]);
    else n++;
  }
  return n;
}

function getMissing(en, ru, p) {
  const m = [];
  for (const k of Object.keys(en)) {
    const f = p ? p + '.' + k : k;
    if (!(k in ru)) {
      if (typeof en[k] === 'object') m.push(...getMissing(en[k], {}, f));
      else m.push(f);
    } else if (typeof en[k] === 'object' && en[k] !== null) {
      m.push(...getMissing(en[k], ru[k] || {}, f));
    }
  }
  return m;
}

const files = readdirSync(enDir).filter(f => f.endsWith('.json'));
let tot = 0;
const breakdown = [];
for (const f of files) {
  const en = JSON.parse(readFileSync(join(enDir, f), 'utf8'));
  const rp = join(ruDir, f);
  const ru = existsSync(rp) ? JSON.parse(readFileSync(rp, 'utf8')) : {};
  const m = getMissing(en, ru);
  const t = countKeys(en);
  if (m.length > 0) {
    breakdown.push({ file: f, missing: m.length, total: t });
    console.log(`${f}: ${m.length} missing / ${t} total`);
  }
  tot += m.length;
}
console.log('\nTOTAL MISSING:', tot);
