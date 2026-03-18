# Full Visual Audit — Screenshot All Screens

This Playwright test suite navigates every route in the Lyriosa application,
clicks through all major tabs, and captures full-page screenshots for visual QA.

---

## Prerequisites

| Requirement | Details |
|---|---|
| Node packages installed | `npm install` |
| Playwright browsers installed | `npx playwright install chromium` |
| Dev server running | `npm run dev` — listens on **port 9002** |
| Firebase auth bypassed | Do **NOT** set `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env.local`. The proxy auto-injects a `site_admin` session in dev mode. |

---

## Running the screenshots

### Full audit (all ~100 screenshots)

```bash
npx playwright test e2e/full-audit/screenshot-all-screens.spec.ts --project=chromium
```

### Run a single describe block

```bash
# Only public pages
npx playwright test e2e/full-audit/screenshot-all-screens.spec.ts --project=chromium -g "01 — Public Pages"

# Only alumni (known flaky area)
npx playwright test e2e/full-audit/screenshot-all-screens.spec.ts --project=chromium -g "10 — Alumni Portal"

# Only reports tabs
npx playwright test e2e/full-audit/screenshot-all-screens.spec.ts --project=chromium -g "13 — Reports"
```

### View the Playwright HTML report after the run

```bash
npx playwright show-report
```

---

## Output location

All screenshots are written to:

```
docs/screenshots/full-audit/
```

The directory is created automatically if it does not exist.

### Screenshot naming convention

| Prefix range | Section |
|---|---|
| 01–22 | Public pages (landing, about, login, etc.) |
| 30 | Dashboard root |
| 31–35 | Schedule & book-lesson wizard |
| 40–43 | Communications (messages, notifications, announcements, what's new) |
| 50–55 | Billing (admin finance, parent billing, financial aid) |
| 60–67 | Teacher portal (dashboard, student profile, availability, payroll, exams) |
| 70–76 | Student portal (repertoire, practice, progress) |
| 80–81 | Events |
| 90–93 | Library & forms |
| 100–105 | Alumni portal — one screenshot per tab + mobile |
| 110–111 | Ministry inbox & export |
| 120–122 | Makeups, master schedule, AI reschedule |
| 130–133 | Reports — all four tabs |
| 140–148 | Settings (general + all sub-pages) |
| 150–152 | User management + approvals queue |
| 160–176 | Admin command center + all sub-pages |
| 180–184 | Family, AI, enroll, school, profile |
| 190–192 | RTL verification (he/en/ar side-by-side) |
| 200–203 | Mobile key pages (390px) |

---

## What to look for in the screenshots

### Layout integrity
- No overflowing text beyond card/container boundaries
- No broken flexbox/grid layouts at desktop (1280x800) or mobile (390x844)
- Sidebars and headers visible, not collapsed or missing

### RTL correctness (files 01, 03, 190, 192)
- Hebrew (`he`) and Arabic (`ar`) pages should have `dir="rtl"` on `<html>` or
  the main container
- Text must flow right-to-left
- Sidebar must appear on the **right** side in Hebrew/Arabic dashboard views
- Buttons, icons and form controls must be mirrored
- Look for any `ml-`/`mr-` remnants that broke RTL — they appear as unexpected
  gaps or misaligned icons

### Dev-bypass auth
- None of the `/dashboard/*` screenshots should show the login page
- If you see `/login` in the URL, `FIREBASE_SERVICE_ACCOUNT_KEY` is set — unset
  it and re-run

### Tab completeness (alumni, reports, users)
- Alumni portal: `100` through `103` should show four distinct tab panels —
  directory, profile, masterclasses, and review
- Reports: `130` through `133` should show four distinct chart panels
- Users: `150` (approved) and `151` (pending) should contain different tables

### Forms — empty state only
- `81-events-new`, `92-form-detail`, `93-form-new`: forms should render with
  empty inputs. Do not fill or submit; just verify they render without errors.

### Mobile screenshots (05, 32, 51, 53, 104, 200–203)
- Sidebars should collapse (hamburger menu visible instead)
- Cards should stack vertically, not overflow horizontally
- Touch targets (buttons) should be large enough to tap

### Known flaky pages
| Page | Common issue | Mitigation already applied |
|---|---|---|
| `/dashboard/alumni` | Tabs delay mounting while `useAuth` loads | `waitForSelector('[role="tablist"]')` + 500 ms pause |
| `/dashboard/reports` | Dynamic import delays chart render | `networkidle` + 500 ms pause |
| `/dashboard/schedule/book` | Wizard requires `useSearchParams` inside Suspense | Screenshot initial state only; step clicks are best-effort |
| Any dynamic-import page | Skeleton flash before content | 400 ms stabilisation pause applied globally |

---

## Updating screenshots after UI changes

After an intentional UI change, review the diff in `docs/screenshots/full-audit/`
with your git diff tool or any image diff utility, then commit the new baseline
screenshots together with the code change.

```bash
git add docs/screenshots/full-audit/
git commit -m "chore: update visual baseline after <feature>"
```

---

## Troubleshooting

**"Target page, context or browser has been closed"**
The dev server likely crashed or is too slow. Increase `test.setTimeout` in the
spec file or run with `--workers=1` to serialise tests.

**All dashboard screenshots show the login page**
The `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable is set. Unset it:
```bash
unset FIREBASE_SERVICE_ACCOUNT_KEY
npm run dev
```

**Screenshot directories not created**
The `beforeAll` hook creates `docs/screenshots/full-audit/` automatically.
If it fails (permissions), create it manually:
```bash
mkdir -p docs/screenshots/full-audit
```

**Tab clicks find no element**
The Hebrew translation key used in the tab trigger may differ from the regex in
`clickTabAndShot`. Open the page manually, inspect the rendered tab text, and
update the regex in the spec file to match.
