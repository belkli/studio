# Landing Page Analysis and Design Plan

**Author:** Frontend Agent
**Date:** March 2026
**Reference:** SDD-FIX-18-PublicSite-LandingPage.md
**Stitch Project:** Harmonia Platform - UI Redesign (projects/14127458006566837297)

---

## 1. Current Landing Page Analysis

### 1.1 Architecture

The landing page is implemented as:
- **Route:** `src/app/[locale]/page.tsx` — thin wrapper calling `<PublicLandingPage />`
- **Component:** `src/components/harmonia/public-landing-page.tsx` (397 lines, client component)
- **Data source:** `useAuth()` monolithic context — pulls `conservatoriums`, `conservatoriumInstruments`, `users`, `events`

### 1.2 Current Sections (in order)

| # | Section | Implementation | Status |
|---|---------|---------------|--------|
| 1 | Hero | Full-bleed image (Unsplash), Hebrew title, 2 CTAs | Implemented |
| 2 | Stats Bar | 4 stats in grid, card-based | Implemented |
| 3 | Find Conservatory | Search bar with text/city/instrument inputs, 3 featured cards | Implemented |
| 4 | How It Works | 3-step cards with icons | Implemented |
| 5 | Featured Teachers | 4 teacher cards with avatar, name, rating | Implemented |
| 6 | Upcoming Events | 3 event cards with date/venue | Implemented |
| 7 | Testimonials | 3 quote cards | Implemented |
| 8 | Donate CTA | Banner with Donate + Open Day buttons | Implemented |

### 1.3 Current Strengths

- RTL-aware with `dir` attribute and `me-2` / `text-start` logical properties
- Uses Unsplash hero image with proper overlay for text contrast
- Instrument dropdown populated from actual conservatorium data (not hardcoded)
- Teacher ranking algorithm with relevance scoring
- Event filtering by future dates
- Responsive grid layouts using Tailwind

### 1.4 Current Weaknesses

| Issue | Severity | Details |
|-------|----------|---------|
| Client-side rendering | P1 | Entire page is `'use client'` — no SSR/ISR for SEO. `useAuth()` loads ALL data client-side. |
| No metadata for sections | P1 | Missing `aria-labelledby` on sections, no IDs on headings |
| Form inputs lack labels | P1 | Search, city, instrument inputs use only placeholders |
| No Open Graph per-locale | P2 | OG tags in `page.tsx` are English-only |
| Teacher cards not linkable | P2 | No CTA to view full teacher profile |
| Testimonials anonymous | P2 | No author attribution |
| No "Open Days" section | P1 | SDD-FIX-18 specifies an Open Days banner section — not implemented |
| Hero image from Unsplash CDN | P2 | Should use `next/image` with local or CDN-optimized image for LCP |
| No persona cards | P1 | SDD-FIX-18 section 3.2 specifies persona cards — not implemented |

---

## 2. Design Plan (Following SDD-FIX-18)

### 2.1 Design Philosophy

Drawing from Israeli music education institutions (ICM, Raanana Music Center, Makom Balev):
- **Warm and authoritative:** Professional but approachable
- **Hebrew-first:** All primary content in Hebrew, with locale switching
- **Clear CTAs:** Every section has a clear call-to-action
- **Mobile-first:** Responsive design for parent mobile users

### 2.2 Target Page Structure

```
+------------------------------------------+
|  PUBLIC NAVBAR (logo, nav, lang switch)   |
+------------------------------------------+
|  HERO — Full-bleed image/video            |
|  Value proposition in Hebrew              |
|  [Register Now] [Find Conservatory]       |
+------------------------------------------+
|  STATS BAR — Primary bg color             |
|  85 conservatories | 450K lessons          |
|  75% satisfaction | 12K+ students          |
+------------------------------------------+
|  FIND YOUR CONSERVATORY                   |
|  Search bar (text + city + instrument)    |
|  3 featured conservatory cards            |
|  [View All X Conservatories]              |
+------------------------------------------+
|  HOW IT WORKS — 3 steps                   |
|  Search > Register > Learn                |
+------------------------------------------+
|  FEATURED TEACHERS — 4 teacher cards      |
|  Avatar, name, instrument, rating         |
|  [Book a Trial Lesson]                    |
+------------------------------------------+
|  PERSONA CARDS (NEW)                      |
|  Admin | Teacher | Parent | Student       |
|  Brief description of what each gets      |
+------------------------------------------+
|  UPCOMING EVENTS — 3 event cards          |
|  Date, venue, title                       |
+------------------------------------------+
|  OPEN DAYS BANNER (NEW)                   |
|  Next open day dates across platform      |
+------------------------------------------+
|  TESTIMONIALS — 3 attributed quotes       |
|  Parent/student name, conservatory        |
+------------------------------------------+
|  DONATE CTA — Banner                      |
|  [Donate] [Open Day Registration]         |
+------------------------------------------+
|  PUBLIC FOOTER                            |
+------------------------------------------+
```

### 2.3 New Sections to Add

#### Persona Cards Section
Shows what each user type gets from the platform:

| Persona | Icon | Title (HE) | Description |
|---------|------|-------------|-------------|
| Admin | Building2 | "למנהלי קונסרבטוריונים" | ניהול מלא של תלמידים, מורים, לוח זמנים, כספים ודוחות |
| Teacher | Music2 | "למורים" | לוח שיעורים, מעקב התקדמות, משוב ודוחות שכר |
| Parent | HeartHandshake | "להורים" | מעקב שיעורים, תשלומים, התקדמות ותקשורת עם המורה |
| Student | GraduationCap | "לתלמידים" | יומן אימון, AI מאמן, לוח שיעורים ומעקב התקדמות |

#### Open Days Banner
- Fetches next open day dates from events data
- Prominent banner with date, location, and CTA to book

### 2.4 SEO and Performance Improvements

| Improvement | Details |
|-------------|---------|
| **Server Component migration** | Split `PublicLandingPage` into server-rendered sections with client islands |
| **ISR for data** | Conservatorium list, teacher list, event list can use `revalidate: 3600` |
| **next/image optimization** | Hero image should use `priority`, `sizes="100vw"`, and a local/CDN source |
| **Structured data (JSON-LD)** | Add Organization, EducationalOrganization schemas for SEO |
| **Per-locale OG metadata** | Generate Hebrew OG title/description for `/he`, English for `/en` |

---

## 3. Stitch Design Mockups

Designs have been generated in the Stitch project **"Harmonia Platform - UI Redesign"** (projects/14127458006566837297):

| Screen | Device | Description |
|--------|--------|-------------|
| Landing Page | Desktop | Full page with all 8+ sections, Hebrew RTL, warm color palette |
| Admin Dashboard | Desktop | Grouped sidebar, command center, charts, recent registrations |
| Teacher Dashboard | Desktop | Workspace view, today's schedule, student progress |
| Parent/Family Dashboard | Desktop | Family hub, child selector, practice logs, payments |

These mockups serve as the visual reference for the production implementation.

---

## 4. Accessibility Requirements for Landing Page

Per IS 5568 audit findings:

1. All section headings must have IDs and `aria-labelledby` on their `<section>` parents
2. All form inputs must have visible `<label>` elements or `aria-label` attributes
3. Stats bar must have `aria-label` context for each number
4. Teacher cards should be interactive articles with CTAs
5. Testimonials must include author attribution
6. Hero image must have `alt=""` (decorative) — already done
7. Color contrast must meet 4.5:1 for all body text
8. Skip link must work on the landing page

---

## 5. RTL Compliance for Landing Page

The current landing page has **good RTL compliance**:
- Uses `dir={isRtl ? 'rtl' : 'ltr'}` on container
- Uses `me-2` (logical margin) for icon spacing
- Uses `text-start` instead of `text-left`
- Grid layouts are direction-agnostic

**No RTL violations found** in the landing page component.

---

## 6. Implementation Phases

### Phase 1 — Accessibility Fixes (1 day)
- Add `aria-label` to search/city/instrument inputs
- Add IDs to all `<h2>` headings
- Add `aria-labelledby` to all `<section>` elements
- Add author attribution to testimonials

### Phase 2 — New Sections (2-3 days)
- Add Persona Cards section
- Add Open Days Banner section
- Add CTA links to teacher cards (Book Trial Lesson)

### Phase 3 — Performance Optimization (2-3 days)
- Migrate to Server Component with client islands
- Implement ISR for conservatorium/teacher/event data
- Optimize hero image loading (local or CDN)
- Add JSON-LD structured data

### Phase 4 — SEO Enhancements (1 day)
- Per-locale OG metadata
- Sitemap entries for all public pages
- Canonical URLs with hreflang

---

## 7. Dependencies

| Dependency | Agent | Status |
|------------|-------|--------|
| RTL logical properties audit | @i18n | Coordinating |
| Dynamic imports for heavy components | @Performance | Pending |
| ISR/data fetching for production | @Backend | Requires FirebaseAdapter |
| SEO/metadata from server | @Infrastructure | Requires production URL |

---

*End of Landing Page Analysis and Design Plan*
