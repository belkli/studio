# Harmonia E2E Test Suite

End-to-end tests for the Harmonia music conservatory platform using [Playwright](https://playwright.dev).

## Prerequisites

- Node.js 18+
- Chromium browser binaries: `npx playwright install chromium`
- The development server is started automatically by the test runner

## Running Tests

```bash
# Run all tests headlessly (starts dev server automatically)
npm run e2e

# Open the interactive Playwright UI (recommended for development)
npm run e2e:ui

# Run a specific spec file
npx playwright test e2e/landing.spec.ts

# Run tests in headed mode (see the browser)
npx playwright test --headed

# Show the last HTML report
npx playwright show-report
```

## Test Files

| File | Description |
|------|-------------|
| `landing.spec.ts` | Public landing page — hero section, stats bar, search inputs, persona cards, RTL/LTR locale switching |
| `register.spec.ts` | Registration flow — enrollment wizard, playing-school token wizard, school registration |
| `dashboard.spec.ts` | Dashboard pages — all protected routes verified accessible under dev auth bypass |
| `api.spec.ts` | API routes — `/api/bootstrap` response shape, `/api/auth/login` and `/api/auth/logout` |
| `public-pages.spec.ts` | All public pages — status codes, main content visibility, locale prefixes (he/en/ar/ru) |
| `playing-school.spec.ts` | Playing School feature — public page, enrollment token wizard, admin management pages |

## Architecture Notes

### Port

The dev server runs on **port 9002** (`next dev --turbopack -p 9002`). The `playwright.config.ts`
`baseURL` and `webServer.url` are both set to `http://localhost:9002`.

### Locale Routing

The app uses `next-intl` with:
- `defaultLocale: 'he'` (Hebrew)
- `localePrefix: 'as-needed'`

This means Hebrew pages are served at their bare paths (`/`, `/about`) with no prefix.
Other locales use a prefix (`/en/about`, `/ar/about`, `/ru/about`).

### Auth Dev Bypass

`src/proxy.ts` sets `isDevBypass = true` when:
```
process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY
```

In dev bypass mode, all `/dashboard/*` routes are accessible without a real Firebase
session cookie. The proxy injects synthetic claims (`role: 'site_admin'`). Dashboard
tests rely on this behavior and will fail if `FIREBASE_SERVICE_ACCOUNT_KEY` is set
in the local environment.

### API Bootstrap

`GET /api/bootstrap` returns all platform data in one call. When no database adapter
is configured (no `DATABASE_URL`, `SUPABASE_URL`, or `DB_BACKEND` env var), it falls
back to the in-memory mock seed automatically, making it safe to run without a database.

## CI Usage

Set `CI=true` to:
- Forbid `.only` tests
- Retry failed tests up to 2 times
- Run with a single worker (sequential)

```bash
CI=true npm run e2e
```

## Configuration

See `playwright.config.ts` at the project root for the full configuration.
The HTML report is written to `playwright-report/` after each run.
