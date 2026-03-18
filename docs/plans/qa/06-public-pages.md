# QA Plan: Public Pages & Landing

**Domain:** All publicly accessible pages (no authentication required)
**Stack:** Next.js 16, TypeScript, Tailwind, next-intl (4 locales: he/en/ar/ru)
**Locales:** `he` = Hebrew (RTL, default at `/`), `en` = English (LTR, `/en`), `ar` = Arabic (RTL, `/ar`), `ru` = Russian (LTR, `/ru`)
**Mock data:** 85 conservatoriums, 348+ teachers, 71 directory teachers, events
**Cookie consent key:** `harmonia_cookie_consent` in `localStorage`

---

## Table of Contents

1. [Landing Page — Hero Section](#1-landing-page--hero-section)
2. [Landing Page — Stats Bar](#2-landing-page--stats-bar)
3. [Landing Page — Find a Conservatory Search](#3-landing-page--find-a-conservatory-search)
4. [Landing Page — How It Works](#4-landing-page--how-it-works)
5. [Landing Page — Featured Teachers](#5-landing-page--featured-teachers)
6. [Landing Page — Persona Cards](#6-landing-page--persona-cards)
7. [Landing Page — Upcoming Events](#7-landing-page--upcoming-events)
8. [Landing Page — Testimonials](#8-landing-page--testimonials)
9. [Landing Page — Donate / Open Days CTA](#9-landing-page--donate--open-days-cta)
10. [Landing Page — Multi-locale & RTL/LTR](#10-landing-page--multi-locale--rtlltr)
11. [Landing Page — SEO Meta Tags](#11-landing-page--seo-meta-tags)
12. [Landing Page — Mobile Responsive](#12-landing-page--mobile-responsive)
13. [Cookie Consent Banner](#13-cookie-consent-banner)
14. [About / Conservatorium Directory](#14-about--conservatorium-directory)
15. [Conservatorium Public Profile Pages](#15-conservatorium-public-profile-pages)
16. [Contact Page](#16-contact-page)
17. [Donate Page](#17-donate-page)
18. [Open Day Page](#18-open-day-page)
19. [Available Now / Slot Marketplace](#19-available-now--slot-marketplace)
20. [Musicians for Hire Page](#20-musicians-for-hire-page)
21. [Playing School Finder Page](#21-playing-school-finder-page)
22. [Try / Trial Booking Page](#22-try--trial-booking-page)
23. [Apply / Matchmaker Page](#23-apply--matchmaker-page)
24. [Privacy Policy Page](#24-privacy-policy-page)
25. [Accessibility Statement Page](#25-accessibility-statement-page)
26. [Help Center Page](#26-help-center-page)
27. [Alumni & Master Classes Page](#27-alumni--master-classes-page)
28. [Public Navbar & Footer](#28-public-navbar--footer)
29. [Cross-cutting: All Public Pages Load Without Error](#29-cross-cutting-all-public-pages-load-without-error)
30. [Cross-cutting: Public Pages Never Redirect to Login](#30-cross-cutting-public-pages-never-redirect-to-login)

---

## 1. Landing Page — Hero Section

### 1.1 Hero renders with heading and subtitle

**Description:** The hero section must show the H1 heading, subtitle text, badge label, and two CTA buttons.
**Preconditions:** None (no localStorage keys set).
**Steps:**
1. Navigate to `/` (Hebrew default).
2. Wait for `domcontentloaded`.
3. Assert `#hero-heading` is visible.
4. Assert `h1` text is non-empty.
5. Assert subtitle `<p>` text is non-empty.
6. Assert hero badge (`inline-flex` pill with Music icon) is visible.

**Expected results:** All hero elements visible, hero badge shows `heroBadge` translation, H1 shows `heroTitle` translation.
**Locales:** he (at `/`), en (`/en`), ar (`/ar`), ru (`/ru`)
**RTL check:** Hero text alignment is `text-center`; `dir="rtl"` on container for he/ar.
**Accessibility:** `#hero-heading` has `id` linked to `aria-labelledby` on `<section>`. Hero image has `alt=""` (decorative). Badge has `<Music>` aria-hidden icon.
**Mobile:** At 390×844 (iPhone 14) hero text, badge, and CTA buttons must not overflow; buttons must stack/wrap gracefully.
**Mock data:** No data dependency — purely translation content.

---

### 1.2 Hero CTA buttons navigate to correct pages

**Description:** "Register" CTA routes to `/register`; "Find Conservatory" CTA routes to `/about`.
**Preconditions:** None.
**Steps:**
1. Navigate to `/en`.
2. Click the primary "Register" button in hero.
3. Assert URL contains `/register`.
4. Navigate back.
5. Click "Find Conservatory / about" outline button.
6. Assert URL contains `/about`.

**Expected results:** Correct navigation, no full-page reload errors.
**Locales:** All 4 (links are locale-aware via `<Link>` from `@/i18n/routing`).
**Mock data:** None.

---

### 1.3 Hero background image loads

**Description:** The hero background image at `/images/landing-hero.jpg` must load (no broken image).
**Preconditions:** Static file exists in `public/images/`.
**Steps:**
1. Navigate to `/`.
2. Assert network request for `landing-hero.jpg` returns 200.

**Expected results:** No `404` for hero image.
**Locales:** he only (image is locale-independent).

---

## 2. Landing Page — Stats Bar

### 2.1 Stats bar shows 4 stat values

**Description:** The indigo stats bar must render conservatoriumCount, totalLessons, parentSatisfaction, and studentCount.
**Preconditions:** Mock data loaded (85 conservatoriums, multiple students).
**Steps:**
1. Navigate to `/`.
2. Locate the stats bar (`bg-primary` section).
3. Assert 4 `.text-3xl.font-extrabold.text-white` elements are visible.
4. Assert first stat value is numeric (e.g., `85`).
5. Assert second stat contains `,` (locale-formatted large number).
6. Assert third stat contains `%`.
7. Assert fourth stat starts with `+`.

**Expected results:** 4 stats visible, formatted correctly.
**Locales:** All 4 (number formatting changes by locale).
**RTL check:** `divide-x` borders remain correct in RTL (logical direction not affected by `divide-x`).
**Mobile:** 2-column grid at mobile, 4-column at `md`. Verify grid layout at 390px width.
**Mock data:** Requires 85 conservatoriums and at least a few students in mock data.

---

### 2.2 Stats bar conservatoriumCount is non-zero

**Description:** Stat showing number of conservatoriums must be > 0 when mock data is present.
**Preconditions:** Bootstrap mock data loaded.
**Steps:**
1. Navigate to `/`.
2. Assert first stat value text converts to a number > 0.

**Expected results:** Non-zero integer.

---

## 3. Landing Page — Find a Conservatory Search

### 3.1 Search bar renders all inputs

**Description:** The conservatory finder must show a text input, city input, instrument dropdown, and Search button.
**Preconditions:** None.
**Steps:**
1. Navigate to `/`.
2. Scroll to `#find` section.
3. Assert `input[aria-label]` × 2 are visible (search + city).
4. Assert `select[aria-label]` is visible (instrument dropdown).
5. Assert Search button is visible.

**Expected results:** All 4 interactive elements present.
**Locales:** All 4 (placeholder text must render in locale).
**Accessibility:** Each input/select must have `aria-label` attribute.
**Mobile:** Grid inputs stack to single column at <768px.

---

### 3.2 Instrument dropdown is populated

**Description:** The instrument dropdown must contain at least one option beyond the placeholder.
**Preconditions:** Mock data includes active instruments with `availableForRegistration=true`.
**Steps:**
1. Navigate to `/`.
2. Open instrument `<select>`.
3. Assert option count >= 2 (placeholder + at least 1 instrument).

**Expected results:** Instruments populated with locale-appropriate names.
**Locales:** he — names in Hebrew; en — names in English; ar — Arabic or English fallback; ru — Russian or English fallback.

---

### 3.3 Search button navigates to /about with query params

**Description:** Filling search fields and clicking Search must route to `/about` with corresponding query parameters.
**Preconditions:** None.
**Steps:**
1. Navigate to `/en`.
2. Type `Tel Aviv` in the conservatory name/search input.
3. Type `Tel Aviv` in the city input.
4. Click Search button.
5. Assert URL contains `/en/about`.
6. Assert URL contains `search=Tel+Aviv` or `search=Tel%20Aviv`.
7. Assert URL contains `city=Tel+Aviv`.

**Expected results:** URL includes all non-empty query params.
**Locales:** he, en (ru, ar — same logic).
**Mock data:** None required for navigation; query params are pass-through.

---

### 3.4 Featured conservatories grid shows 3 cards

**Description:** The `#find` section must show at most 3 conservatory preview cards.
**Preconditions:** Bootstrap mock data has >= 3 conservatoriums.
**Steps:**
1. Navigate to `/`.
2. Assert conservatory card count in find section = 3 (or fewer if less data).

**Expected results:** Exactly 3 cards (first 3 from uniqueConservatoriums array).
**Locales:** All 4 (names are localized).
**Mock data:** cons-1, cons-2, cons-3 at minimum.

---

### 3.5 "View all" button shows count and links to /about

**Description:** The view-all button text must include the total conservatorium count.
**Preconditions:** At least 1 conservatorium in mock data.
**Steps:**
1. Navigate to `/`.
2. Assert view-all `<Link>` text matches `viewAll` translation with `{count}` substituted.
3. Assert link href points to `/about`.

**Expected results:** Count value is non-zero; link works.
**Locales:** All 4.

---

## 4. Landing Page — How It Works

### 4.1 How It Works section shows 3 steps

**Description:** The `#how` section must render exactly 3 step cards.
**Preconditions:** None.
**Steps:**
1. Navigate to `/`.
2. Assert `#how-heading` is visible.
3. Count dashed-border cards in the section = 3.
4. Assert each card has a step number (`01`, `02`, `03`), title, and description.

**Expected results:** 3 step cards visible, all translated.
**Locales:** All 4.
**Accessibility:** Section has `aria-labelledby="how-heading"`. Icons are presentational (no aria-hidden required since descriptions are separate text).

---

## 5. Landing Page — Featured Teachers

### 5.1 Featured teachers section renders up to 4 cards

**Description:** With default search filters (empty), up to 4 available teachers must be shown.
**Preconditions:** Mock data has at least 4 teachers with `availableForNewStudents=true` and `approved=true`.
**Steps:**
1. Navigate to `/`.
2. Scroll to `#teachers-heading` section.
3. Assert teacher card count is between 1 and 4.
4. Each card must show a name, a role/fallback text, and a "Book trial lesson" button.

**Expected results:** At most 4 teacher cards; no empty placeholders.
**Locales:** All 4 (teacher names/roles localized).
**Accessibility:** `aria-labelledby="teachers-heading"`. Avatar `<img>` has `alt={teacher.name}`. SR-only text on tooltip trigger button.

---

### 5.2 Teacher card "Book trial lesson" button links to /register

**Description:** The CTA on each teacher card must link to the register page.
**Preconditions:** At least 1 teacher card visible.
**Steps:**
1. Navigate to `/en`.
2. Click the first "Book trial lesson" button.
3. Assert URL contains `/en/register`.

**Expected results:** Navigates to register page in correct locale.
**Locales:** he, en, ar, ru.

---

### 5.3 Premium teacher shows star rating

**Description:** Teachers with `teacherRatingAvg > 0` and `teacherRatingCount > 0` must show a star rating badge.
**Preconditions:** teacher-user-1 (מרים כהן) or teacher-user-2 (דוד המלך) have `isPremiumTeacher=true` and rating data.
**Steps:**
1. Navigate to `/`.
2. If a premium teacher card is visible, assert star icon (`Star`) and `x.x (n)` text is visible.

**Expected results:** Star rating shown in amber for teachers with ratings.
**Locales:** he (star icon is universal; number format varies).
**Mock data:** teacher-user-1, teacher-user-2.

---

### 5.4 Teacher recommendation tooltip is accessible

**Description:** The `<Info>` tooltip button next to "Featured Teachers" heading must show tooltip text on hover/focus.
**Preconditions:** None.
**Steps:**
1. Navigate to `/`.
2. Tab-focus or hover over the `<Info>` button next to `#teachers-heading`.
3. Assert tooltip content (`recommendedTeachersTooltip` translation) appears.

**Expected results:** Tooltip renders; SR-only text on button satisfies screen-reader users.
**Accessibility:** `<span className="sr-only">` on tooltip trigger; `role="tooltip"` on `TooltipContent`.

---

## 6. Landing Page — Persona Cards

### 6.1 Persona cards section renders 4 cards

**Description:** The persona cards section must render exactly 4 cards: Admin, Teacher, Parent, Student.
**Preconditions:** Translations loaded.
**Steps:**
1. Navigate to `/`.
2. Assert `#personas-heading` is visible.
3. Assert `[aria-labelledby="personas-heading"] .group` count = 4.

**Expected results:** 4 cards visible.
**Locales:** All 4 (title/description/CTA text translated).

---

### 6.2 Each persona card CTA links to /register

**Description:** All 4 persona card CTAs must use `<Link href="/register">`.
**Preconditions:** None.
**Steps:**
1. Navigate to `/en`.
2. Assert all 4 persona card CTA buttons resolve to `/en/register` href.

**Expected results:** 4 links all pointing to locale-prefixed register.
**Locales:** All 4.

---

### 6.3 Persona card hover state applies CSS transform

**Description:** Hovering a persona card applies `hover:-translate-y-0.5 hover:shadow-md` classes.
**Preconditions:** None.
**Steps:**
1. Navigate to `/`.
2. Hover over first persona card.
3. Assert card has `.hover\\:shadow-md` or computed shadow changes.

**Expected results:** Visual elevation on hover (CSS-only; verify class presence).
**Mobile:** Transform on hover not applicable on touch devices — ensure no broken layout on tap.

---

## 7. Landing Page — Upcoming Events

### 7.1 Events section shows up to 3 upcoming events or fallback

**Description:** The events section must either show up to 3 future event cards or the `eventsFallback` message.
**Preconditions:** Mock data has future-dated events (dates >= today `2026-03-14`).
**Steps:**
1. Navigate to `/`.
2. Assert `#events-heading` is visible.
3. Assert event card count between 0 and 3, OR `eventsFallback` text is visible.

**Expected results:** Consistent with mock data; never shows past events.
**Locales:** All 4 (event titles localized: `event.title.{locale}` with fallbacks).
**Mock data:** At least 1 event with `eventDate` in the future. Verify seed data has future dates.

---

### 7.2 Events section shows fallback when no future events

**Description:** When no events have a future date, the fallback card with `eventsFallback` text must span all 3 columns.
**Preconditions:** No events with future `eventDate` in mock data, OR ensure this is testable state.
**Steps:**
1. Stub or manipulate mock events to have only past dates (e.g., via localStorage or forced test data).
2. Navigate to `/`.
3. Assert single card with `md:col-span-3` appears with fallback text.

**Expected results:** Graceful fallback displayed.
**Locales:** he, en.

---

### 7.3 Event date is formatted using locale

**Description:** Event dates must be formatted with `toLocaleDateString(locale)`.
**Preconditions:** At least 1 future event in mock data.
**Steps:**
1. Navigate to `/` (Hebrew locale).
2. Assert event date text matches a Hebrew locale date format (e.g., `14.3.2026` or regional variant).
3. Navigate to `/en`.
4. Assert same event date text is English locale formatted (e.g., `3/14/2026`).

**Expected results:** Date format differs between he and en.
**Locales:** he, en.

---

## 8. Landing Page — Testimonials

### 8.1 Testimonials section renders 3 quote cards

**Description:** The testimonials section must show exactly 3 testimonial cards with quote, author, and role.
**Preconditions:** Translations include `testimonial1/2/3`, `testimonialAuthor1/2/3`, `testimonialRole1/2/3`.
**Steps:**
1. Navigate to `/`.
2. Assert `#testimonials-heading` is visible.
3. Assert 3 testimonial cards visible.
4. Each card must contain non-empty quote text, author name, and role label.

**Expected results:** 3 cards, all 3 fields populated.
**Locales:** All 4.

---

## 9. Landing Page — Donate / Open Days CTA

### 9.1 Donate section renders with both CTAs

**Description:** The bottom CTA section must show donate button (→ `/donate`) and open-day button (→ `/open-day`).
**Preconditions:** None.
**Steps:**
1. Navigate to `/`.
2. Assert `#donate-heading` visible.
3. Assert Donate CTA `<Link href="/donate">` visible.
4. Assert Open Days CTA `<Link href="/open-day">` visible.

**Expected results:** Both buttons render with correct hrefs.
**Locales:** All 4 (button labels translated).

---

## 10. Landing Page — Multi-locale & RTL/LTR

### 10.1 Default locale (he) is RTL

**Description:** The server-rendered HTML for `/` must include `dir="rtl"`.
**Preconditions:** None.
**Steps:**
1. Make an HTTP GET to `/`.
2. Assert response body contains `dir="rtl"`.

**Expected results:** RTL attribute in SSR HTML.
**Implementation note:** Matches existing `landing.spec.ts` test "page is RTL by default (Hebrew)".

---

### 10.2 English locale (/en) is LTR

**Description:** The `<html>` element at `/en` must have `dir="ltr"`.
**Preconditions:** None.
**Steps:**
1. Navigate to `/en`.
2. Assert `page.locator('html')` has attribute `dir="ltr"`.

**Expected results:** LTR for English.

---

### 10.3 Arabic locale (/ar) is RTL

**Description:** The `<html>` or the root `<div>` must have `dir="rtl"` for `/ar`.
**Preconditions:** None.
**Steps:**
1. Navigate to `/ar`.
2. Assert `page.locator('[dir]').first()` has attribute `dir="rtl"`.

**Expected results:** RTL for Arabic.

---

### 10.4 Russian locale (/ru) is LTR

**Description:** Russian is LTR; root `<div>` must have `dir="ltr"`.
**Preconditions:** None.
**Steps:**
1. Navigate to `/ru`.
2. Assert `page.locator('[dir]').first()` has attribute `dir="ltr"`.

**Expected results:** LTR for Russian.

---

### 10.5 All 4 locales render translated heading text

**Description:** The landing H1 (`#hero-heading`) must render non-English text for he/ar/ru and English for en.
**Preconditions:** All translation files loaded (`src/messages/{locale}/landing.json`).
**Steps:**
1. For each locale [he, en, ar, ru]:
   a. Navigate to `/{locale}` (or `/` for he).
   b. Get `#hero-heading` text content.
   c. Assert it differs from an empty string.
2. Assert he heading contains Hebrew characters (Unicode range `\u0590–\u05FF`).
3. Assert ar heading contains Arabic characters (Unicode range `\u0600–\u06FF`).

**Expected results:** Each locale returns correctly localized H1.
**Locales:** All 4.

---

### 10.6 Logical CSS classes are used for RTL padding/margin

**Description:** RTL-safe classes (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`) must be used throughout the landing page instead of directional `ml-/mr-/pl-/pr-/text-left/text-right`.
**Preconditions:** This is a static code-level check (not runtime Playwright assertion).
**Steps:**
1. Load `/ar` in a viewport of 390×844.
2. Visually verify the search bar and CTA buttons are correctly aligned (start-aligned in RTL = right side).
3. Verify no element overflows the viewport horizontally.

**Expected results:** Layout is mirrored correctly in RTL locales.
**Locales:** he, ar.
**Mobile:** Verify at 390px mobile viewport.

---

## 11. Landing Page — SEO Meta Tags

### 11.1 Landing page has title and description meta tags

**Description:** `<head>` must include a `<title>` and `<meta name="description">`.
**Preconditions:** None.
**Steps:**
1. Navigate to `/en`.
2. Assert `document.title` equals `"Lyriosa - Music for Every Child"`.
3. Assert `meta[name="description"]` content is non-empty.

**Expected results:** SEO-critical meta tags present.
**Locales:** en (canonical); test he for same.

---

### 11.2 Landing page has OpenGraph image meta tag

**Description:** `<meta property="og:image">` must point to `/images/og-harmonia.jpg`.
**Preconditions:** Static OG image exists.
**Steps:**
1. Make HTTP GET to `/en`.
2. Assert response body contains `og:image`.
3. Assert OG image path includes `og-harmonia.jpg`.

**Expected results:** OG image tag present.

---

### 11.3 Landing page has hreflang alternate links

**Description:** `<link rel="alternate" hreflang="he">` and `hreflang="en"` must be present.
**Preconditions:** `generateMetadata()` in `page.tsx` sets `alternates.languages`.
**Steps:**
1. Make HTTP GET to `/`.
2. Assert `<link rel="alternate" hreflang="he">` present.
3. Assert `<link rel="alternate" hreflang="en">` present.

**Expected results:** 2 hreflang links present.

---

## 12. Landing Page — Mobile Responsive

### 12.1 Hero section does not overflow at 390px width

**Description:** At mobile viewport, no horizontal scroll should appear on the landing hero.
**Preconditions:** None.
**Steps:**
1. Set viewport to 390×844.
2. Navigate to `/`.
3. Assert `document.documentElement.scrollWidth <= 390`.

**Expected results:** No horizontal overflow.
**Locales:** he (RTL), en (LTR).

---

### 12.2 Stats bar collapses to 2-column grid on mobile

**Description:** Stats bar uses `grid-cols-2 md:grid-cols-4`; at 390px there should be 2 columns.
**Preconditions:** None.
**Steps:**
1. Set viewport to 390×844.
2. Navigate to `/`.
3. Take screenshot of stats bar.
4. Assert 2 stat tiles per row (first 2 occupy full width in pairs).

**Expected results:** 2×2 stat grid at mobile.

---

### 12.3 Teacher cards stack to 1 column on mobile

**Description:** Teacher cards use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`; at 390px must show 1 card per row.
**Preconditions:** At least 2 teacher cards visible.
**Steps:**
1. Set viewport to 390×844.
2. Navigate to `/`.
3. Take screenshot of teacher section.
4. Assert each card occupies full width row.

**Expected results:** Single column layout at 390px.

---

## 13. Cookie Consent Banner

### 13.1 Cookie banner appears on first visit

**Description:** On first visit with no `harmonia_cookie_consent` in localStorage, the cookie banner must be visible.
**Preconditions:** `localStorage.removeItem('harmonia_cookie_consent')` before navigation.
**Steps:**
1. Remove `harmonia_cookie_consent` from localStorage.
2. Navigate to `/`.
3. Assert `role="dialog"` element with `aria-labelledby="cookie-banner-title"` is visible.
4. Assert banner has Accept and Reject buttons.

**Expected results:** Banner visible with title, description, accept, reject.
**Locales:** All 4 (title/description/button text translated via `CookieBanner` translation namespace).
**Accessibility:** `role="dialog"`, `aria-labelledby="cookie-banner-title"`, `aria-describedby="cookie-banner-desc"`.

---

### 13.2 Accepting cookie banner hides it and persists to localStorage

**Description:** Clicking "Accept" must set `harmonia_cookie_consent=accepted` and hide the banner.
**Preconditions:** No localStorage key.
**Steps:**
1. Remove key from localStorage.
2. Navigate to `/`.
3. Click "Accept" button in cookie banner.
4. Assert banner disappears (not visible).
5. Assert `localStorage.getItem('harmonia_cookie_consent') === 'accepted'`.

**Expected results:** Banner hidden; localStorage value `"accepted"`.
**Locales:** he, en.

---

### 13.3 Rejecting cookie banner sets rejected value

**Description:** Clicking "Reject" must set `harmonia_cookie_consent=rejected` and hide the banner.
**Preconditions:** No localStorage key.
**Steps:**
1. Remove key from localStorage.
2. Navigate to `/`.
3. Click "Reject" (variant="outline") in banner.
4. Assert banner hidden.
5. Assert `localStorage.getItem('harmonia_cookie_consent') === 'rejected'`.

**Expected results:** Banner hidden; localStorage value `"rejected"`.

---

### 13.4 Cookie banner does not re-appear after consent given

**Description:** On a return visit (localStorage already set), the banner must not appear.
**Preconditions:** `harmonia_cookie_consent` already set to `"accepted"`.
**Steps:**
1. Set `localStorage.setItem('harmonia_cookie_consent', 'accepted')`.
2. Navigate to `/`.
3. Assert `role="dialog"` (cookie banner) is not present in DOM (or not visible).

**Expected results:** Banner absent when consent already recorded.

---

### 13.5 Cookie banner is visible on all public pages

**Description:** The banner should appear on any public page on first visit, not just the landing page.
**Preconditions:** No localStorage key.
**Steps:**
1. Remove key from localStorage.
2. Navigate to `/en/contact`.
3. Assert cookie banner dialog visible.

**Expected results:** Banner renders on all pages using the public layout.
**Locales:** en (sample).
**Note:** Banner is `'use client'` and uses `useSyncExternalStore`; SSR always returns `"accepted"` (hidden), so the banner only appears after hydration.

---

### 13.6 Cookie banner is keyboard-navigable

**Description:** Banner accept/reject buttons must be reachable via Tab key.
**Preconditions:** No localStorage key; banner visible.
**Steps:**
1. Remove key, navigate to `/`.
2. Tab to the "Reject" button.
3. Press Enter — banner should disappear.

**Expected results:** Keyboard accessible.
**Accessibility:** Buttons use standard `<Button>` component (receives native button focus).

---

## 14. About / Conservatorium Directory

### 14.1 /about page loads with main content

**Description:** The `/about` page must return non-error status and render a main element.
**Preconditions:** None.
**Steps:**
1. Navigate to `/about`.
2. Assert HTTP status not 404/500.
3. Assert `main` element is visible.
4. Assert page title or heading contains conservatorium-related text.

**Expected results:** Page loads.
**Locales:** `/about`, `/en/about`, `/ar/about`, `/ru/about`.

---

### 14.2 /about page lists conservatoriums

**Description:** The directory page must show a list/grid of conservatoriums.
**Preconditions:** Mock data has 85 conservatoriums.
**Steps:**
1. Navigate to `/about`.
2. Assert at least 10 conservatorium cards or list items visible.

**Expected results:** Large set of conservatorium entries visible.
**Locales:** he, en.
**Mock data:** All 85 conservatoriums.

---

### 14.3 Search filters on /about narrow conservatoriums

**Description:** Passing `?search=Tel+Aviv` to `/about` should filter results to Tel Aviv conservatoriums.
**Preconditions:** At least one conservatorium in Tel Aviv in mock data.
**Steps:**
1. Navigate to `/en/about?search=Tel+Aviv`.
2. Assert cards shown all contain "Tel Aviv" in name or city.
3. Assert at least 1 result visible.

**Expected results:** Filtered results matching search term.
**Locales:** en (using English search terms).

---

### 14.4 Instrument filter on /about narrows teachers shown

**Description:** Passing `?instrument={id}` to `/about` filters teachers to those teaching that instrument.
**Preconditions:** Instruments have IDs in mock data.
**Steps:**
1. Navigate to `/en/about?instrument=piano` (or valid instrument ID).
2. Assert conservatorium cards or teacher listings visible.

**Expected results:** Results filtered by instrument.

---

## 15. Conservatorium Public Profile Pages

### 15.1 Conservatorium profile page loads for cons-15 (Hod HaSharon)

**Description:** Profile page for cons-15 must load without errors and show the conservatorium name.
**Preconditions:** cons-15 exists in mock data; 18 directory teachers.
**Steps:**
1. Navigate to `/about/hod-hasharon-municipal-conservatory-aluma__cons-15` (or the canonical slug).
2. Assert HTTP status not 404/500.
3. Assert conservatorium name (e.g., "קונסרבטוריון עירוני הוד השרון") visible.
4. Assert teacher profiles section exists.

**Expected results:** Page loads with conservatorium details and teacher list.
**Locales:** he, en, ar, ru.
**SEO:** `generateMetadata` emits correct `<title>`, description, OG image, and 4 hreflang `<link>` tags.

---

### 15.2 Conservatorium profile shows location and contact info

**Description:** Address, phone, email, and website link must be rendered if present in data.
**Preconditions:** cons-15 has location/contact data.
**Steps:**
1. Navigate to cons-15 profile page.
2. Assert MapPin icon + address text visible.
3. Assert Phone icon + tel link visible (if phone in data).
4. Assert Mail icon + email link visible (if email in data).
5. Assert Globe icon + official site link (if officialSite in data).

**Expected results:** Contact info rendered using appropriate icons.

---

### 15.3 Conservatorium profile shows teacher cards with instruments

**Description:** Teacher cards must display instrument badges in the locale's language.
**Preconditions:** cons-15 has 18 directory teachers; instruments in mock.
**Steps:**
1. Navigate to cons-15 profile in Hebrew.
2. Assert teacher cards present with instrument badges.
3. Navigate to same page in English (`/en/about/...`).
4. Assert same cards show instrument names in English.

**Expected results:** Instrument names are localized per locale.
**Locales:** he, en.
**Mock data:** dir-teacher-001 to dir-teacher-018 at cons-15.

---

### 15.4 Conservatorium profile: "Book trial lesson" CTA for matched teachers

**Description:** Teachers with a `teacherUserId` (matched to a User record) should show a booking CTA.
**Preconditions:** At least one dir-teacher at cons-15 matches a User record by name.
**Steps:**
1. Navigate to cons-15 profile.
2. Identify teacher cards with "Book trial lesson" or similar CTA button.
3. Click CTA.
4. Assert navigation to `/register` or `/try`.

**Expected results:** CTA visible and functional for matched teachers.
**Locales:** he.

---

### 15.5 Conservatorium profile page for cons-66 (Kiryat Ono)

**Description:** Profile for cons-66 must load with 50 directory teachers.
**Preconditions:** cons-66 has dir-teacher-019 to dir-teacher-068.
**Steps:**
1. Navigate to cons-66 profile page.
2. Assert page loads without error.
3. Assert teacher list contains entries.
4. Assert at least 10 teacher cards visible (pagination or scroll).

**Expected results:** Large teacher list displayed.
**Mock data:** dir-teacher-019 to dir-teacher-068.

---

### 15.6 Conservatorium profile page for cons-84 (ICM Tel Aviv)

**Description:** Profile for cons-84 must load and show 3 specific named teachers.
**Preconditions:** cons-84 has dir-teacher-069 to dir-teacher-071.
**Steps:**
1. Navigate to cons-84 profile.
2. Assert names "Daniel Tanchelson" (or Hebrew equivalent), "Michal Beit Halachmi", "Coral Kanlis" visible.

**Expected results:** Named teachers appear.
**Mock data:** dir-teacher-069, dir-teacher-070, dir-teacher-071.

---

### 15.7 Unknown conservatorium slug returns graceful 404 or empty state

**Description:** An invalid slug like `/about/nonexistent-cons-9999` must not throw a 500 error.
**Preconditions:** cons-9999 does not exist.
**Steps:**
1. Navigate to `/about/nonexistent-cons-9999`.
2. Assert HTTP status is not 500.
3. Assert page renders (not crashed), ideally shows a not-found message.

**Expected results:** Graceful empty state or 404 page; no uncaught exception.

---

### 15.8 Conservatorium profile SEO metadata per locale

**Description:** Each locale's profile page must have the correct `canonical` and hreflang links.
**Preconditions:** cons-15 has valid slug.
**Steps:**
1. Make HTTP GET to `/en/about/hod-hasharon-municipal-conservatory-aluma__cons-15`.
2. Assert `<link rel="canonical" href="...en/about/...">`.
3. Assert 4 hreflang links (he, en, ar, ru).
4. Assert `<meta property="og:locale" content="en">`.

**Expected results:** All SEO meta correct.
**Locales:** en, he.

---

### 15.9 Representative conservatorium profiles — load tests (10 conservatoriums)

**Description:** Sample 10 diverse conservatoriums from across the 85 and verify each profile page loads.
**Preconditions:** Mock data for all 85 conservatoriums.

| # | ID | Name |
|---|----|----|
| 1 | cons-1 | First conservatorium in dataset |
| 2 | cons-15 | Hod HaSharon (18 dir teachers) |
| 3 | cons-66 | Kiryat Ono (50 dir teachers) |
| 4 | cons-84 | ICM Tel Aviv (3 dir teachers) |
| 5 | cons-2 | Second in dataset |
| 6 | cons-10 | Mid-range |
| 7 | cons-20 | Mid-range |
| 8 | cons-50 | Mid-range |
| 9 | cons-75 | Near end |
| 10 | cons-82 | ICM (slug has `__cons-82` suffix) |

**Steps (for each):**
1. Build slug URL.
2. Navigate to `/{locale}/about/{slug}`.
3. Assert status not 404/500.
4. Assert `main` element visible.

**Expected results:** All 10 profiles load.
**Locales:** he (primary), en (spot check cons-15 and cons-84).

---

## 16. Contact Page

### 16.1 Contact page loads and shows form

**Description:** `/contact` must render the contact form with first/last name, phone, email, message fields, and conservatorium picker.
**Preconditions:** None.
**Steps:**
1. Navigate to `/contact`.
2. Assert `h1` with contact page title visible.
3. Assert form `<form>` is present.
4. Assert fields: firstName, lastName, phone, email, message present.
5. Assert conservatorium picker trigger visible.

**Expected results:** Full form visible.
**Locales:** All 4.
**RTL:** Form layout is `dir={isRtl ? 'rtl' : 'ltr'}`.

---

### 16.2 Submit button disabled until conservatorium selected

**Description:** The submit button must show "Select conservatorium first" text and be disabled before selecting a conservatorium.
**Preconditions:** No conservatorium pre-selected.
**Steps:**
1. Navigate to `/contact`.
2. Assert Submit button has `disabled` attribute.
3. Assert Submit button text = `selectConservatoriumFirst` translation.

**Expected results:** Button disabled; informative text shown.
**Locales:** he, en.

---

### 16.3 Conservatorium picker filters by search query

**Description:** Typing in the picker search input must filter the conservatorium list.
**Preconditions:** Mock data has 85 conservatoriums.
**Steps:**
1. Navigate to `/contact`.
2. Click on the conservatorium picker trigger.
3. Type `תל אביב` (Tel Aviv in Hebrew) in the search input.
4. Assert filtered list shows only Tel Aviv conservatoriums (max 20 results).

**Expected results:** List narrows to matching entries.
**Locales:** he (Hebrew search), en (English search).

---

### 16.4 Selecting a conservatorium shows its details panel

**Description:** After selecting a conservatorium, the right panel shows ConservatoriumInfo card with address/phone/email.
**Preconditions:** At least one conservatorium with contact info in mock data.
**Steps:**
1. Navigate to `/contact`.
2. Open picker, select first item in list.
3. Assert conservatorium name in right panel.
4. Assert at least one of: address, phone, email visible in right panel.

**Expected results:** Info panel renders with conservatorium details.
**Locales:** he, en.

---

### 16.5 Contact form submission shows success state

**Description:** Submitting the form with all required fields filled must show the thank-you state.
**Preconditions:** Valid form data.
**Steps:**
1. Navigate to `/contact`.
2. Select any conservatorium.
3. Fill firstName="Test", lastName="User", phone="0501234567".
4. Submit the form.
5. Assert thank-you heading (`thanksTitle` translation) visible.
6. Assert CheckCircle2 icon visible.

**Expected results:** Success state renders; toast notification fired.
**Locales:** he, en.

---

### 16.6 Contact form requires firstName, lastName, phone

**Description:** Required fields must trigger HTML5 validation or prevent submission if empty.
**Preconditions:** Conservatorium selected.
**Steps:**
1. Navigate to `/contact`.
2. Select a conservatorium.
3. Click Submit without filling any fields.
4. Assert form is not submitted (success state not shown).
5. Assert browser validation appears on first required field.

**Expected results:** Validation fires; form not submitted.

---

## 17. Donate Page

### 17.1 Donate page loads with content

**Description:** `/donate` must load and render the `DonationLandingPage` component.
**Preconditions:** None.
**Steps:**
1. Navigate to `/donate`.
2. Assert HTTP status not 404/500.
3. Assert `main` visible.
4. Assert at least one heading or CTA button visible.

**Expected results:** Donation page renders.
**Locales:** All 4.
**Mock data:** None required.

---

### 17.2 Donate page has navbar and footer

**Description:** Like all public pages, donate must include `<PublicNavbar>` and `<PublicFooter>`.
**Preconditions:** None.
**Steps:**
1. Navigate to `/donate`.
2. Assert `header` or `nav` element visible.
3. Assert `footer` element visible.

**Expected results:** Standard public layout wrapping donation content.

---

## 18. Open Day Page

### 18.1 Open day page loads

**Description:** `/open-day` must load and render the `OpenDayLandingPage` component.
**Preconditions:** None.
**Steps:**
1. Navigate to `/open-day`.
2. Assert HTTP status not 404/500.
3. Assert `main` visible.

**Expected results:** Page renders.
**Locales:** All 4.

---

### 18.2 Open day page RTL/LTR

**Description:** The page container uses `dir={isRtl ? 'rtl' : 'ltr'}`.
**Preconditions:** None.
**Steps:**
1. Navigate to `/` (Hebrew), check open-day link from landing → navigate.
2. Assert `[dir]` element has `rtl`.
3. Navigate to `/en/open-day`.
4. Assert `[dir]` element has `ltr`.

**Expected results:** Direction attribute matches locale.

---

## 19. Available Now / Slot Marketplace

### 19.1 /available-now page loads

**Description:** `/available-now` must load and show the AvailableSlotsMarketplace component.
**Preconditions:** None.
**Steps:**
1. Navigate to `/available-now`.
2. Assert HTTP status not 404/500.
3. Assert `main` visible.
4. Assert H1 heading visible (tAvailable('title')).

**Expected results:** Page loads with hero and marketplace content.
**Locales:** All 4.

---

### 19.2 Available now page shows available slots

**Description:** Slot cards (if any available slots in mock data) must be displayed.
**Preconditions:** Mock data has at least one available slot within the 4-day window.
**Steps:**
1. Navigate to `/available-now`.
2. Assert slot card(s) visible, or fallback empty-state message visible.

**Expected results:** Either slots shown or empty-state shown; no error.
**Mock data:** lesson-4 through lesson-13 in mock data.

---

### 19.3 Available now RTL/LTR

**Description:** `dir` attribute on `<main>` must be `rtl` for he/ar and `ltr` for en/ru.
**Preconditions:** None.
**Steps:**
1. Navigate to `/available-now` (he default).
2. Assert `main[dir]` = `rtl`.
3. Navigate to `/en/available-now`.
4. Assert `main[dir]` = `ltr`.

**Expected results:** Correct direction per locale.

---

## 20. Musicians for Hire Page

### 20.1 Musicians page loads

**Description:** `/musicians` must load and render the `MusiciansForHire` component.
**Preconditions:** None.
**Steps:**
1. Navigate to `/musicians`.
2. Assert HTTP status not 404/500.
3. Assert `main` visible.

**Expected results:** Page renders.
**Locales:** All 4.

---

### 20.2 Musicians page renders musician listings

**Description:** The page must show at least one musician listing or fallback text.
**Preconditions:** Mock data may or may not have musicians.
**Steps:**
1. Navigate to `/musicians`.
2. Assert some content (cards, list items, or empty state message) is visible in main.

**Expected results:** No crash; content or fallback.

---

## 21. Playing School Finder Page

### 21.1 Playing school page loads with hero

**Description:** `/playing-school` must render `PlayingSchoolFinder` with the styled hero (badge, H1, subtitle).
**Preconditions:** None.
**Steps:**
1. Navigate to `/playing-school`.
2. Assert HTTP status not 404/500.
3. Assert H1 visible (`PlayingSchool.finder.title`).
4. Assert badge visible.

**Expected results:** Hero renders.
**Locales:** All 4.

---

### 21.2 Playing school finder shows conservatoriums list

**Description:** The `PlayingSchoolFinder` must show a searchable list of playing-school-enabled conservatoriums.
**Preconditions:** Mock data has conservatoriums with playing-school programs.
**Steps:**
1. Navigate to `/playing-school`.
2. Assert at least one conservatorium card or list item visible, or an empty-state message.

**Expected results:** Conservatoriums listed or graceful empty state.

---

## 22. Try / Trial Booking Page

### 22.1 /try page loads with trial booking widget

**Description:** `/try` must render the `TrialBookingWidget` with minimal header.
**Preconditions:** None.
**Steps:**
1. Navigate to `/try`.
2. Assert HTTP status not 404/500.
3. Assert trial booking widget or its first step is visible.
4. Assert "Lyriosa" logo/link in header visible.

**Expected results:** Page renders trial booking flow.
**Locales:** All 4.

---

### 22.2 /try page has language switcher

**Description:** The `LanguageSwitcher` must be visible in the /try page header.
**Preconditions:** None.
**Steps:**
1. Navigate to `/try`.
2. Assert `LanguageSwitcher` component visible.

**Expected results:** Language switcher present.

---

### 22.3 /try page has accessibility footer link

**Description:** A link to `/accessibility` must appear at the bottom of /try.
**Preconditions:** None.
**Steps:**
1. Navigate to `/try`.
2. Assert `<Link href="/accessibility">` visible near bottom.
3. Assert link text is `AccessibilityPage.footerLink` translation.

**Expected results:** Accessibility link present.
**Accessibility:** Important for WCAG accessibility statement requirement.

---

## 23. Apply / Matchmaker Page

### 23.1 /apply/matchmaker page loads

**Description:** `/apply/matchmaker` must load and show the AI matchmaker form.
**Preconditions:** None.
**Steps:**
1. Navigate to `/apply/matchmaker`.
2. Assert HTTP status not 404/500.
3. Assert H1 with Hebrew welcome text visible.
4. Assert `AiMatchmakerForm` component is visible.

**Expected results:** Page renders matchmaker form.
**Locales:** he (page is currently Hebrew-only; i18n is not implemented on this page).
**Note:** This page uses hard-coded Hebrew strings — a known tech debt item.

---

## 24. Privacy Policy Page

### 24.1 Privacy page loads with all sections

**Description:** `/privacy` must render all required sections: data collected, use, sharing, retention, sub-processors table, DSAR, cookies, minors, contact directory.
**Preconditions:** None.
**Steps:**
1. Navigate to `/privacy`.
2. Assert `h1` visible.
3. Assert sub-processors table (`<table>`) visible.
4. Assert DSAR section heading visible.
5. Assert link to `/dashboard/settings` in DSAR section.
6. Assert contact directory table visible (or empty-state message).

**Expected results:** All sections rendered.
**Locales:** All 4.
**RTL:** `dir` attribute set on root.

---

### 24.2 Privacy page sub-processors table renders 5 columns

**Description:** The sub-processors table must have 5 column headers.
**Preconditions:** None.
**Steps:**
1. Navigate to `/privacy`.
2. Assert sub-processors `<thead>` has 5 `<th>` elements.
3. Assert at least 1 data row in `<tbody>`.

**Expected results:** Table complete with headers and data.
**Locales:** All 4 (column headers translated).

---

### 24.3 Privacy page contact directory table renders per-locale

**Description:** The contact directory table must localize conservatorium names.
**Preconditions:** Privacy contacts configured in mock data.
**Steps:**
1. Navigate to `/privacy` (he).
2. Assert conservatorium names in Hebrew.
3. Navigate to `/en/privacy`.
4. Assert same conservatoriums have English names where available (`nameEn` field).

**Expected results:** Localized conservatorium names in directory table.

---

### 24.4 Privacy page DSAR link goes to /dashboard/settings

**Description:** The DSAR section must contain a link to `/dashboard/settings`.
**Preconditions:** None.
**Steps:**
1. Navigate to `/privacy`.
2. Assert anchor with `href="/dashboard/settings"` visible.

**Expected results:** Link present and correct.

---

## 25. Accessibility Statement Page

### 25.1 Accessibility page loads with required sections

**Description:** `/accessibility` must render measures list, known limitations, contact section, and contact directory.
**Preconditions:** None.
**Steps:**
1. Navigate to `/accessibility`.
2. Assert `h1` visible.
3. Assert measures list (6 `<li>` items) visible.
4. Assert known limitations section visible.
5. Assert contact section visible.
6. Assert directory table visible or empty-state.

**Expected results:** All sections present.
**Locales:** All 4.
**RTL:** `dir` attribute on root div.

---

### 25.2 Accessibility contact directory uses same data as privacy

**Description:** Both privacy and accessibility pages call `getConservatoriumStatementContacts()` — both should show the same conservatoriums.
**Preconditions:** Mock data configured.
**Steps:**
1. Navigate to `/accessibility`.
2. Assert directory table rows match (or subset of) privacy page rows for the same locale.

**Expected results:** Consistent contact data across both legal pages.

---

## 26. Help Center Page

### 26.1 Help page loads

**Description:** `/help` must load and render the `HelpCenter` component.
**Preconditions:** None.
**Steps:**
1. Navigate to `/help`.
2. Assert HTTP status not 404/500.
3. Assert `HelpCenter` component (some heading or FAQ/article content) visible.

**Expected results:** Page renders.
**Locales:** All 4.
**Note:** Help page has no public navbar/footer wrapper (uses `<div className="space-y-6">`).

---

### 26.2 Help page contains searchable content or FAQ

**Description:** The help center must offer article search or FAQ accordion.
**Preconditions:** None.
**Steps:**
1. Navigate to `/help`.
2. Assert search input or FAQ accordion visible.

**Expected results:** At least one interactive help element present.

---

## 27. Alumni & Master Classes Page

### 27.1 Alumni page loads

**Description:** `/about/alumni` must load and render the alumni list and master classes.
**Preconditions:** None.
**Steps:**
1. Navigate to `/about/alumni`.
2. Assert HTTP status not 404/500.
3. Assert H1 (`publicAlumniTitle` translation) visible.
4. Assert master classes section heading visible.

**Expected results:** Page renders both sections.
**Locales:** All 4.

---

### 27.2 Alumni page shows alumni cards or empty state

**Description:** If `alumni.filter(a => a.isPublic)` returns items, they must be shown; otherwise, `noPublicAlumni` text.
**Preconditions:** Mock data — alumni items with `isPublic=true` if any.
**Steps:**
1. Navigate to `/about/alumni`.
2. Assert alumni cards visible OR `noPublicAlumni` text visible.

**Expected results:** No empty render (always one of the two states).

---

### 27.3 Master classes show published items or empty state

**Description:** Published master classes (`status='published'`) must appear; if none, show `noPublishedMasterClasses` text.
**Preconditions:** Mock data — at least one master class or test empty path.
**Steps:**
1. Navigate to `/about/alumni`.
2. Assert master class cards visible OR `noPublishedMasterClasses` text visible.

**Expected results:** Consistent state display.

---

### 27.4 Alumni bio uses correct locale

**Description:** Each alumni card bio should use `item.bio[locale]` → `item.bio.en` → `item.currentOccupation` fallback chain.
**Preconditions:** Alumni item with multi-locale bio.
**Steps:**
1. Navigate to `/about/alumni` in English.
2. Assert alumnus bio shows English text.
3. Navigate to `/he/about/alumni` (if he is non-default prefix, else `/about/alumni`).
4. Assert same alumnus bio shows Hebrew text (or fallback).

**Expected results:** Correct locale applied.
**Locales:** he, en.

---

## 28. Public Navbar & Footer

### 28.1 Public navbar renders on all public pages

**Description:** `PublicNavbar` must render on all pages that include it.
**Preconditions:** None.
**Steps:**
1. Navigate to each of: `/`, `/contact`, `/about`, `/donate`, `/open-day`, `/available-now`, `/musicians`, `/playing-school`, `/privacy`, `/accessibility`.
2. For each: assert `header` or `nav` element visible.

**Expected results:** Navbar present on all checked pages.

---

### 28.2 Navbar register CTA is visible

**Description:** The "Register" button in the navbar must be visible on landing page.
**Preconditions:** None.
**Steps:**
1. Navigate to `/en`.
2. Assert `header a[href*="register"]` first element visible.

**Expected results:** Register link in header.
**Locales:** All 4.

---

### 28.3 Navbar login link is visible

**Description:** The "Login" button in the navbar must be visible.
**Preconditions:** None.
**Steps:**
1. Navigate to `/en`.
2. Assert `header a[href*="login"]` or nav login link visible.

**Expected results:** Login link in header.

---

### 28.4 Public footer is visible on all public pages

**Description:** `PublicFooter` must render on all public layout pages.
**Preconditions:** None.
**Steps:**
1. Navigate to `/`, `/contact`, `/about`, `/donate`.
2. For each: assert `footer` element visible.

**Expected results:** Footer present.
**Locales:** he.

---

### 28.5 Language switcher navigates between locales

**Description:** Clicking a locale in the language switcher must navigate to the same page in that locale.
**Preconditions:** Language switcher present in navbar or /try header.
**Steps:**
1. Navigate to `/` (Hebrew).
2. Click language switcher to select "English".
3. Assert URL changes to `/en`.
4. Assert `dir="ltr"` on page.

**Expected results:** Locale switch works; direction updates.
**Locales:** he → en → ar → ru → he cycle.

---

## 29. Cross-cutting: All Public Pages Load Without Error

### 29.1 All public pages return non-error HTTP status

**Description:** A comprehensive list of all public routes must return status 200 and not 404 or 500.
**Preconditions:** App running on localhost:9002.
**Steps:** For each path below, navigate and assert status is not 404/500 and `main` is visible:

| Path | Notes |
|------|-------|
| `/` | Landing, he default |
| `/en` | Landing, English |
| `/ar` | Landing, Arabic |
| `/ru` | Landing, Russian |
| `/about` | Conservatorium directory |
| `/en/about` | EN directory |
| `/contact` | Contact form |
| `/donate` | Donation page |
| `/open-day` | Open days |
| `/available-now` | Slot marketplace |
| `/musicians` | Musicians for hire |
| `/playing-school` | Playing school finder |
| `/try` | Trial booking |
| `/apply/matchmaker` | AI matchmaker |
| `/about/alumni` | Alumni |
| `/help` | Help center |
| `/accessibility` | Accessibility statement |
| `/privacy` | Privacy policy |
| `/about/hod-hasharon-municipal-conservatory-aluma__cons-15` | Profile with teachers |
| `/about/kiriat-ono-conservatorium__cons-66` | Large teacher list |
| `/en/about/hod-hasharon-municipal-conservatory-aluma__cons-15` | English profile |

**Expected results:** All paths return 2xx; `main` visible; no redirect to `/login`.

---

## 30. Cross-cutting: Public Pages Never Redirect to Login

### 30.1 All public pages are accessible without authentication

**Description:** No public page should redirect to `/login` when accessed without credentials.
**Preconditions:** No authentication cookies set; dev bypass not required for public pages.
**Steps:**
1. For each public path in the list above.
2. Navigate and assert URL does NOT contain `/login`.

**Expected results:** All public pages accessible without login.

---

## Appendix A — Mock Data Dependencies

| Feature | Required Mock Data |
|---------|-------------------|
| Stats bar — conservatoriums | 85 conservatoriums |
| Stats bar — students | At least 5 student users |
| Featured teachers | teacher-user-1, teacher-user-2 + 4 dir-teachers with `availableForNewStudents=true` |
| Upcoming events | At least 1 EventProduction with `eventDate >= 2026-03-14` |
| Persona cards | Translation keys only |
| Testimonials | Translation keys only |
| Conservatorium profiles | All 85 + dir-teacher-001..071 |
| Contact page picker | All 85 conservatoriums |
| Privacy/Accessibility directory | Conservatoriums with configured contacts |
| Cookie banner | No data; requires localStorage to be empty |
| Alumni page | At least 1 alumni with `isPublic=true` (or graceful empty state) |
| Master classes | At least 1 with `status='published'` (or graceful empty state) |
| Available now | At least 1 lesson slot within 4-day window |

---

## Appendix B — Playwright Test File Mapping

| Spec file | Covers |
|-----------|--------|
| `e2e/landing.spec.ts` | Scenarios 1.1, 2.1, 3.1, 6.1, 9.1, 10.1, 10.2 (existing) |
| `e2e/public-pages.spec.ts` | Scenarios 29.1, 30.1, 16.1, 20.1, 10.3, 10.4 (existing) |
| `e2e/public-pages-extended.spec.ts` | NEW: cookie banner (13.x), conservatorium profiles (15.x), contact form (16.x), SEO (11.x) |
| `e2e/conservatorium-profiles.spec.ts` | NEW: Scenarios 15.1–15.9 (10 representative profiles) |
| `e2e/cookie-consent.spec.ts` | NEW: Scenarios 13.1–13.6 |

---

## Appendix C — Viewport Sizes for Mobile Testing

| Device | Viewport |
|--------|---------|
| iPhone 14 | 390 × 844 |
| Samsung Galaxy S21 | 360 × 800 |
| iPad Mini | 768 × 1024 |
| Desktop | 1280 × 800 |
| Wide Desktop | 1920 × 1080 |
