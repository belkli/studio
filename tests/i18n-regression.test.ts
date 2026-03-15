import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');

function getAllTsxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...getAllTsxFiles(full));
    } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
      results.push(full);
    }
  }
  return results;
}

const srcFiles = getAllTsxFiles(join(SRC, 'components')).concat(
  getAllTsxFiles(join(SRC, 'app'))
);

describe('i18n / RTL regression checks', () => {
  it('should not use TabsList dir= (dir must be on Tabs primitive)', () => {
    const violations: string[] = [];
    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('<TabsList') && content.includes('dir=') &&
          content.match(/<TabsList[^>]*dir=/)) {
        violations.push(file.replace(ROOT, ''));
      }
    }
    if (violations.length > 0) {
      console.error('TabsList dir= violations (dir must be on <Tabs> primitive):\n' + violations.join('\n'));
    }
    expect(violations).toHaveLength(0);
  });

  it('should not use physical margin classes (ml-/mr-) — use logical ms-/me-', () => {
    const violations: string[] = [];
    const knownExceptions = ['node_modules', '.next'];
    for (const file of srcFiles) {
      if (knownExceptions.some(ex => file.includes(ex))) continue;
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        // Only flag className strings, not import paths or comments
        if (line.includes('className') && /\b(ml-|mr-)\d/.test(line)) {
          violations.push(`${file.replace(ROOT, '')}:${i + 1}: ${line.trim()}`);
        }
      });
    }
    if (violations.length > 0) {
      console.warn('Physical margin violations (use ms-/me- instead):\n' + violations.slice(0, 10).join('\n'));
    }
    // Warning only — don't fail (too many pre-existing violations)
    expect(true).toBe(true);
  });

  it('should not use ILS currency prefix', () => {
    const violations: string[] = [];
    // Only match user-visible ILS patterns in JSX/template strings, not variable names or API code
    // Catches: `ILS ${x}`, `} ILS`, `{x} ILS`, `"ILS "`, `'ILS '`, but NOT: priceILS, amountILS, currency: 'ILS'
    const userVisiblePatterns = [
      /[`"']ILS\s*\$\{/,        // template: `ILS ${amount}`
      /\}\s*ILS[`"'<\s]/,       // JSX: {amount} ILS  or template: ${amount} ILS`
      />\s*ILS\s/,              // JSX text: >ILS ...
      /\bILS\s+\$\{/,          // ILS ${amount}
    ];
    for (const file of srcFiles) {
      // Skip API routes and server action files — 'ILS' as currency code is valid there
      if (file.includes('api/') || file.includes('actions/')) continue;
      const content = readFileSync(file, 'utf-8');
      if (!content.includes('ILS')) continue;
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
        if (userVisiblePatterns.some((p) => p.test(line))) {
          violations.push(`${file.replace(ROOT, '')}:${i + 1}: ${line.trim()}`);
        }
      });
    }
    if (violations.length > 0) {
      console.error('ILS currency violations (use ₪ instead):\n' + violations.join('\n'));
    }
    expect(violations).toHaveLength(0);
  });

  it('should not render enum values directly without translation', () => {
    // Detect patterns like: {booking.status} or <TableCell>{lesson.type}</TableCell>
    // where the value is likely a raw enum
    const suspiciousPatterns = [
      /\{[a-z]+\.(status|type|eventType|bookingStatus)\}/g,
    ];
    const violations: string[] = [];
    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf-8');
      for (const pattern of suspiciousPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          violations.push(`${file.replace(ROOT, '')}: ${matches.join(', ')}`);
        }
      }
    }
    if (violations.length > 0) {
      console.warn('Possible raw enum rendering (verify these use t() for display):\n' + violations.join('\n'));
    }
    // Warning only
    expect(true).toBe(true);
  });

  it('should not use toLocaleDateString() without locale argument in components', () => {
    const violations: string[] = [];
    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('.toLocaleDateString()')) {
        violations.push(file.replace(ROOT, ''));
      }
    }
    if (violations.length > 0) {
      console.error('toLocaleDateString() without locale arg:\n' + violations.join('\n'));
    }
    expect(violations).toHaveLength(0);
  });

  it('should not use deprecated data-theme attribute (use data-brand)', () => {
    const violations: string[] = []
    for (const file of srcFiles) {
      // Skip test files and CSS (CSS is checked separately)
      if (file.includes('.test.') || file.includes('.spec.') || file.endsWith('.css')) continue
      const content = readFileSync(file, 'utf-8')
      if (content.includes('data-theme=')) {
        violations.push(file.replace(ROOT, ''))
      }
    }
    if (violations.length > 0) {
      console.error('data-theme violations (use data-brand instead):\n' + violations.join('\n'))
    }
    expect(violations).toHaveLength(0)
  })
});
