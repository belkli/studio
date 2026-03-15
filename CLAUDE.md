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

## RTL / i18n / UX Standards (MANDATORY)

These patterns prevent the most common bugs. Violating them causes RTL breaks, English text in Hebrew UI, and unreadable charts.

### RTL Layout
- Every page-level root container: `<div dir={isRtl ? 'rtl' : 'ltr'}>` where `isRtl = locale === 'he' || locale === 'ar'`
- `<Tabs dir={isRtl ? 'rtl' : 'ltr'}>` — `dir` goes on the Tabs PRIMITIVE, NEVER on `<TabsList>`
- All `<TableHead>` elements: must have `className="text-start"`
- All `<TableCell>` displaying labels: must have `className="text-start"`
- `<DropdownMenuContent align="end">` in all tables and toolbars
- Use logical CSS: `ms-`/`me-` not `ml-`/`mr-`, `ps-`/`pe-` not `pl-`/`pr-`, `text-start`/`text-end` not `text-left`/`text-right`

### i18n
- Date formatting: `toLocaleDateString(locale)` — never hardcode locale, never call without locale arg
- Currency: always use `₪` symbol — never `ILS`
- Enum values: NEVER render directly to users — always use `useTranslations()` to get display label
- Mock data primary language is Hebrew — all `type`, `displayName`, `instrument`, `name` fields in data.ts must be Hebrew strings

### Charts (Recharts)
- Pie/Donut charts with Hebrew labels: NEVER use inline `label` prop on `<Pie>` — Hebrew text overflows slice boundaries
- Always use `<Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />` inside `<PieChart>` instead

### Date Pickers
- `<input type="month">` and native date pickers: always `dir="ltr"` (browser-native, language-independent)
- Add a Hebrew display label alongside the input: `new Date(value + '-01').toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })`
- react-day-picker / Calendar: RTL swap IconLeft/IconRight via `components` prop — do NOT wrap in `<div dir="ltr">`

### site_admin Scoped Views
- Admin panels that should show one conservatorium at a time: add conservatorium dropdown selector defaulting to `user?.conservatoriumId`
- `effectiveConsId = isSiteAdmin ? selectedConsId : (user?.conservatoriumId ?? '')`
