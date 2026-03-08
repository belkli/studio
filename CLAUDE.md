# Harmonia — Claude Code Context

## Key Patterns

### Internal links
Always use `<Link>` from `@/i18n/routing`, never `<a href>` — ESLint enforces this (`@next/next/no-html-link-for-pages`).

### Server Actions in tests
Files with `'use server'` cannot be imported in Vitest. Extract pure logic functions and test those instead.

### Cookie banner / localStorage SSR
Use lazy `useState(() => checkLocalStorage())` where the function guards `typeof window === 'undefined'`. Avoid `useState(false)` + `useEffect` — causes React hydration mismatch.

### PDF extraction (Windows)
`pdftoppm` is not available. Use Python `pypdf` library for text extraction from Hebrew PDFs.

### data.ts size warning
`src/lib/data.ts` exceeds 500KB — triggers Babel "generator deoptimisation" note. This is non-fatal; ignore it.

### Teacher ID continuity
Before adding teachers, grep `scripts/db/seed.sql` for the max `c1000000-` UUID to find the next available seq number.

### Translation scripts
`scripts/translate-compositions.mjs` is the canonical pattern for Claude Haiku batch translation: batch of 20, resume-safe (skip already-processed IDs by loading output file on startup).

### Playwright localStorage reset
Use `await page.evaluate(() => localStorage.removeItem('key'))` before each test that depends on first-visit state.
