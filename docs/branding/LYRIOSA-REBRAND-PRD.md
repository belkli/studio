# Lyriosa Rebrand -- Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-15
**Author:** Product Manager
**Status:** Draft for Review

---

## Executive Summary

This document defines the complete scope, strategy, and rollout plan for rebranding the platform from **Lyriosa** (EN) / **הַרמוֹנְיָה** (HE) / **هارمونيا** (AR) / **Гармония** (RU) to **Lyriosa** (EN) / **ליריוסה** (HE) / **ليريوسا** (AR) / **Лириоса** (RU).

The rebrand encompasses two visual identity candidates for public-facing pages, while the dashboard will uniformly adopt Candidate A. A server-side environment variable (`NEXT_PUBLIC_LANDING_THEME='a'|'b'`) will enable A/B testing between the candidates before final rollout.

A snapshot branch (`harmonia-snapshot-pre-rebrand`) already preserves the pre-rebrand state for safe rollback.

---

## 1. Rebrand Scope Definition

### 1.1 Translation Files (4 locales x 11 namespaces)

Every JSON file under `src/messages/{he,en,ar,ru}/` must be audited. The following is the exhaustive list of brand-name occurrences discovered in the codebase:

| Namespace | File | Keys containing "Lyriosa" / "הרמוניה" / equivalents | Count |
|-----------|------|-------------------------------------------------------|-------|
| `common.json` | `Metadata.siteName` | "Lyriosa" / "הַרמוֹנְיָה" / "هارمونيا" / "Гармония" | 4 |
| `common.json` | `AccessibilityPage.intro` | "Lyriosa" / "הרמוניה" references | 4 |
| `common.json` | `PrivacyPolicy.*` | ~8 keys across intro, generalBody, contactDescription, contactDirectoryDescription, subProcessorsBody, retentionScheduleBody, dsarEmail | 4x8=32 |
| `common.json` | `FinancialAid.pageDesc` (HE only) | "הרמוניה" | 1 |
| `public.json` | `HomePage.title` | "Lyriosa" / "הַרמוֹנְיָה" | 4 |
| `public.json` | `AboutPage.subtitle` | "Lyriosa" / "הרמוניה" network reference | 4 |
| `public.json` | `MusiciansForHire.heroSubtitle` | "Lyriosa" reference | 4 |
| `public.json` | `HelpCenter.title` | "Lyriosa Help Center" / "מרכז העזרה של הרמוניה" | 4 |
| `public.json` | `HelpAssistant.title` | "Lyriosa AI Assistant" / "עוזר AI של הרמוניה" | 4 |
| `public.json` | `HelpAssistant.welcomeMessage` | "I'm Harmony, your AI assistant" | 4 |
| `public.json` | `Landing.conservatoryFallback` | "Lyriosa network" / "רשת הרמוניה" | 4 |
| `public.json` | `Landing.teacherFallback` | "Lyriosa network" / "רשת הרמוניה" | 4 |
| `enrollment.json` | `Wizard.subtitle` | "join Lyriosa" / "להצטרף להרמוניה" | 4 |
| `enrollment.json` | `Contract.s1Body` | "Lyriosa Platform" / "פלטפורמת הרמוניה" | 4 |
| `enrollment.json` | `Contract.s6Body` | "Lyriosa Platform" references | 4 |
| `enrollment.json` | `Contract.s7Body` | "privacy@harmonia.co.il" | 4 |
| `enrollment.json` | `Contract.s8Body` | "Lyriosa" references | 4 |
| `enrollment.json` | `Contract.s9Body` | "accessibility@harmonia.co.il" | 4 |
| `enrollment.json` | `Contract.termsTitle` | "Lyriosa Terms of Service" | 4 |
| `enrollment.json` | `Contract.termsBody` | "Lyriosa platform" | 4 |
| `enrollment.json` | `Contract.agreeCheckboxLegacy` | "Lyriosa's Terms" | 4 |
| `enrollment.json` | `PlayingSchool.subtitle` | "Lyriosa conservatories" | 4 |
| `enrollment.json` | `PlayingSchool.heroBadge` | "Lyriosa Playing School" | 4 |
| `admin.json` | `applyForAid.metaTitle` | "Lyriosa" in page title | 2+ |
| `admin.json` | `logo` key (EN) | "Lyriosa" | 1 |
| `admin.json` | Ministry portal title (HE) | "הרמוניה" | 1 |
| `billing.json` | `securityNotice` (HE) | "הרמוניה" | 1 |
| `student.json` | `ScheduleAssistant.greeting` | "Lyriosa's AI assistant" / "הרמוניה" (all 4 locales) | 4 |
| `settings.json` | `standardTermsTitle` | "Standard Lyriosa Terms" | 4 |

**Total translation string updates: ~120+ individual key-value pairs across 44 files**

### 1.2 Hardcoded Brand References in Source Code

| File | Reference | Type |
|------|-----------|------|
| `src/app/[locale]/layout.tsx` (line 33) | Fallback `'Lyriosa'` in catch block | Metadata fallback |
| `src/app/[locale]/page.tsx` (lines 6-17) | `generateMetadata()`: title, OG title, OG image path, canonical URL, alternate URLs | SEO/OG |
| `src/app/[locale]/about/[slug]/page.tsx` (line 43, 51) | `'https://harmonia.co.il'` fallback, description text | SEO |
| `src/app/[locale]/error.tsx` (line 14) | `[Lyriosa Error]` console log | Debug |
| `src/app/[locale]/apply/matchmaker/page.tsx` (lines 9, 18) | Hardcoded Hebrew brand strings | UI text |
| `src/app/robots.ts` (line 12) | `'https://harmonia.co.il/sitemap.xml'` | SEO |
| `src/app/api/invoice-pdf/[invoiceId]/route.ts` (line 67) | "מערכת Lyriosa" and "support@harmonia.co.il" | Invoice PDF |
| `src/app/api/ps/qr/route.ts` (line 6) | `'https://harmonia.co.il'` fallback | QR codes |
| `src/ai/flows/help-assistant-flow.ts` (line 51) | AI system prompt: `"Lyriosa"`, `"Harmony"` assistant name | AI |
| `src/proxy.ts` (line 183) | `'dev@harmonia.local'` dev email | Dev only |
| `src/lib/auth-utils.ts` (lines 15-16, 91) | `LyriosaClaims` interface name, `dev@harmonia.local` | Internal API |
| `src/lib/auth-cookie.ts` (line 2) | `'harmonia-user'` cookie name | Auth |
| `src/hooks/use-auth.tsx` (lines 653-702) | `'harmonia-user'` localStorage key | Auth |
| `src/hooks/domains/users-domain.tsx` (lines 114-149) | `'harmonia-user'` localStorage key | Auth |
| `src/hooks/domains/auth-domain.tsx` (lines 66-99) | `'harmonia-user'` localStorage key | Auth |
| `src/components/language-switcher.tsx` (line 46) | `'harmonia_locale'` localStorage key | i18n |
| `src/components/consent/cookie-banner.tsx` (line 6) | `'harmonia_cookie_consent'` localStorage key | Legal |
| `src/components/a11y/accessibility-panel.tsx` (lines 18-20) | `'harmonia.a11y.*'` localStorage keys | A11y |
| `src/components/harmonia/ai-help-assistant.tsx` (lines 23-24) | `'harmonia.help.*'` localStorage keys | Help |
| `src/components/harmonia/conservatorium-public-profile-page.tsx` (line 308) | `'https://harmonia.co.il'` fallback | OG/SEO |
| `src/lib/data.ts` (lines 628-676+) | Conservatorium website URLs containing `harmonia.co.il` | Mock data |

### 1.3 Static Assets

| Asset | Current State | Action Required |
|-------|--------------|-----------------|
| OG image | Referenced as `/images/og-harmonia.jpg` (file not found in `public/`) | Create `og-lyriosa.jpg` with new branding |
| Favicon | No favicon files exist yet | Create favicon set with Lyriosa logo |
| Web manifest | Does not exist | Create `site.webmanifest` with Lyriosa name |
| Landing hero image | `/images/landing-hero.jpg` | Evaluate if re-shoot or reuse needed |
| Logo SVG | `src/components/icons.tsx` -- generic music note SVG | Replace with Lyriosa branded logo |

### 1.4 Domain and Email Addresses

| Current | New | Appears In |
|---------|-----|------------|
| `harmonia.co.il` | TBD (e.g., `lyriosa.co.il`) | robots.ts, page.tsx, profile page, QR route, data.ts, enrollment contract |
| `privacy@harmonia.co.il` | `privacy@lyriosa.co.il` | Privacy policy (4 locales), enrollment contract (4 locales) |
| `support@harmonia.co.il` | `support@lyriosa.co.il` | Invoice PDF template |
| `accessibility@harmonia.co.il` | `accessibility@lyriosa.co.il` | Enrollment contract (4 locales) |
| `dev@harmonia.local` | `dev@lyriosa.local` | Proxy, auth-utils (dev-only) |

### 1.5 Legal Pages

The following legal content must be updated to reflect the new brand name:

- **Privacy Policy** -- `PrivacyPolicy` namespace in `common.json` (all 4 locales): intro, generalBody, contactDescription, contactDirectoryDescription, subProcessorsBody, retentionScheduleBody, dsarEmail
- **Accessibility Statement** -- `AccessibilityPage` namespace in `common.json` (all 4 locales)
- **Registration Contract** -- `Contract` namespace in `enrollment.json` (all 4 locales): 7 sections referencing "Lyriosa Platform" or contact emails
- **Terms of Service** -- `Contract.termsTitle`, `Contract.termsBody`, `Contract.agreeCheckboxLegacy`
- **Cookie Banner** -- storage key only (no user-visible brand name currently)
- **Standard Terms** -- `settings.json` `standardTermsTitle` (all 4 locales)

### 1.6 AI/Bot Identity

- **AI Help Assistant** system prompt: references "Lyriosa" and names the bot "Harmony"
  - Decision needed: rename bot to "Lyra" or similar?
- **Schedule Rescheduling Chat** greeting: references "הרמוניה" in `student.json`

### 1.7 Error Pages

- `src/app/[locale]/error.tsx` -- English-only hardcoded text ("Something went wrong"), console log `[Lyriosa Error]`
- No `not-found.tsx` exists (uses Next.js default)

### 1.8 Directory Structure

The entire `src/components/harmonia/` directory (33+ components) and `src/components/dashboard/harmonia/` directory (40+ components) use "harmonia" in the path. This is internal-only and not user-visible, but should be considered for developer experience.

---

## 2. Priority Matrix (MoSCoW)

### MUST HAVE (Blocks launch; rebrand is incomplete without these)

| # | Item | Effort | Risk |
|---|------|--------|------|
| M1 | Update `Metadata.siteName` in all 4 locale `common.json` files | S | Low |
| M2 | Update `HomePage.title` in all 4 locale `public.json` files | S | Low |
| M3 | Update all `Landing.*` fallback strings referencing "Lyriosa network" | S | Low |
| M4 | Update `HelpCenter.title` and `HelpAssistant.title` in all 4 locales | S | Low |
| M5 | Update `AboutPage.subtitle` in all 4 locales | S | Low |
| M6 | Replace logo SVG in `icons.tsx` with Lyriosa branded mark | M | Medium |
| M7 | Update `generateMetadata()` in `page.tsx` (title, OG, canonical) | S | Low |
| M8 | Update `generateMetadata()` in `layout.tsx` (fallback string) | S | Low |
| M9 | Create and deploy OG image (`og-lyriosa.jpg`) | M | Low |
| M10 | Create favicon set | M | Low |
| M11 | Update `robots.ts` sitemap URL | S | Low |
| M12 | Implement Candidate A landing page theme | L | High |
| M13 | Implement Candidate B landing page theme | L | High |
| M14 | Add `NEXT_PUBLIC_LANDING_THEME` env var toggle between A and B | M | Medium |
| M15 | Update enrollment contract text in all 4 locale `enrollment.json` | M | Medium -- legal review needed |
| M16 | Update privacy policy text in all 4 locale `common.json` | M | Medium -- legal review needed |
| M17 | Update accessibility statement in all 4 locale `common.json` | S | Low |
| M18 | Update invoice PDF template brand name and contact email | S | Low |
| M19 | Update AI help assistant system prompt (brand name) | S | Low |
| M20 | Update `student.json` schedule assistant greeting (all 4 locales) | S | Low |

### SHOULD HAVE (Improves quality but not blocking day-1)

| # | Item | Effort | Risk |
|---|------|--------|------|
| S1 | Update `MusiciansForHire.heroSubtitle` in all 4 locales | S | Low |
| S2 | Update `billing.json` security notice (HE) | S | Low |
| S3 | Update `settings.json` standard terms title (all 4 locales) | S | Low |
| S4 | Update `admin.json` logo key and aid metaTitle | S | Low |
| S5 | Update `admin.json` ministry portal title (HE) | S | Low |
| S6 | Rename `matchmaker/page.tsx` hardcoded Hebrew brand strings | S | Low |
| S7 | Update conservatorium profile page SEO fallback URL | S | Low |
| S8 | Update QR code route fallback URL | S | Low |
| S9 | Create `site.webmanifest` | S | Low |
| S10 | DNS and domain transition (if changing to lyriosa.co.il) | L | High |
| S11 | Rename AI assistant character from "Harmony" to "Lyra" (or keep) | S | Decision needed |
| S12 | Update `data.ts` mock conservatorium website URLs | M | Low (mock data) |

### COULD HAVE (Nice-to-have if time permits)

| # | Item | Effort | Risk |
|---|------|--------|------|
| C1 | Rename `src/components/harmonia/` directory to `src/components/lyriosa/` | L | Medium -- 80+ import paths |
| C2 | Rename `harmonia-user` localStorage key to `lyriosa-user` | M | Medium -- migration logic needed |
| C3 | Rename `harmonia_cookie_consent` localStorage key | M | Medium -- reset existing consents |
| C4 | Rename `harmonia_locale` localStorage key | S | Low -- no migration needed |
| C5 | Rename `harmonia.a11y.*` and `harmonia.help.*` localStorage keys | M | Medium -- reset existing prefs |
| C6 | Rename `harmonia-user` cookie to `lyriosa-user` | M | Medium -- session invalidation |
| C7 | Rename `LyriosaClaims` TypeScript interface | S | Low -- internal only |
| C8 | Update `dev@harmonia.local` dev email | S | Low -- dev only |
| C9 | New landing page hero photography/videography | XL | Low |
| C10 | Branded email templates (welcome, lesson confirmation, etc.) | L | Medium |

### WON'T HAVE (Explicitly out of scope for this rebrand)

| # | Item | Rationale |
|---|------|-----------|
| W1 | Changing the product functionality | Rebrand is visual/textual only |
| W2 | Redesigning the dashboard UI | Dashboard uses Candidate A design language only; no layout changes |
| W3 | Changing the tech stack | No framework migrations |
| W4 | Migrating existing user data | localStorage keys migration is optional; cookie name change deferred |
| W5 | Rewriting legal agreements from scratch | Only brand name substitutions; legal review for compliance |
| W6 | Changing the database schema | No DB column renames |
| W7 | Renaming the git repository | Repository can remain "studio" internally |
| W8 | Firebase project renaming | Firebase project IDs are immutable |

---

## 3. A/B Testing Strategy

### 3.1 Candidates

| Aspect | Candidate A (Indigo/Clean SaaS) | Candidate B (Gold/Navy Cinematic) |
|--------|----------------------------------|-----------------------------------|
| Typography | Plus Jakarta Sans + Playfair Display | Frank Ruhl Libre + Heebo |
| Color palette | Indigo (#6366f1) primary, dark BG (#0a0a1e) | Gold (#C9A84C) accent, deep navy (#0D1B2A) |
| Hero style | Clean sections, animated sections | Cinematic full-viewport hero with string texture overlay, grain, vignette |
| Stats bar | Standard section | Semi-transparent with gold borders |
| Overall feel | Modern SaaS / tech product | Premium cultural institution / concert hall |
| Dashboard | Always Candidate A | Always Candidate A |
| RTL handling | Standard | Purpose-built RTL-first |

### 3.2 Test Design

**Method:** Server-side random assignment via `NEXT_PUBLIC_LANDING_THEME` or, for proper A/B testing, a cookie-based split (50/50) on first visit.

**Implementation approach:**
1. Both theme implementations coexist in the codebase
2. A `LandingThemeProvider` reads the env var (or user cookie) and renders the appropriate component
3. Analytics events tag each user with their assigned variant

**Population:** All new visitors to public-facing pages (landing, about, contact, open-day, donate, musicians, events).

### 3.3 Metrics

| Metric | Priority | Measurement Method |
|--------|----------|--------------------|
| **Bounce rate** | Primary | Google Analytics / Mixpanel |
| **Time on page** (landing) | Primary | GA4 engaged sessions |
| **Registration conversion** (visitor -> started registration) | Primary | Event tracking on "Register" CTA click |
| **Registration completion** (started -> completed enrollment) | Primary | Server-side enrollment completion event |
| **Contact form submissions** | Secondary | Form submission count |
| **Open Day registrations** | Secondary | Event registration count |
| **Donation page visits** | Secondary | Page view count |
| **Accessibility widget usage** | Tertiary | Custom event tracking |
| **Heatmap engagement** | Tertiary | Hotjar / Microsoft Clarity |

### 3.4 Test Duration and Sample Size

- **Minimum duration:** 4 weeks (to capture weekday/weekend cycles and seasonal effects)
- **Target sample size:** Minimum 1,000 unique visitors per variant (2,000 total) for 95% confidence / 80% power to detect a 5% difference in conversion rate
- **Early termination:** If either variant shows >15% degradation in primary metrics after 2 weeks with >500 visitors per variant, stop the test and revert

### 3.5 Decision Authority

| Stakeholder | Role in Decision |
|-------------|-----------------|
| Product Manager | Final decision based on data |
| UX Lead | Qualitative assessment, usability feedback |
| Ministry of Education liaison | Feedback on institutional perception |
| Conservatorium admins (sample of 5-10) | Stakeholder interviews during test period |
| Engineering | Technical feasibility and maintenance burden assessment |

**Decision criteria:**
- If Candidate A conversion > Candidate B by >3%: ship A
- If Candidate B conversion > Candidate A by >3%: ship B
- If within 3% margin: choose based on qualitative feedback from conservatorium admins and Ministry, with tiebreaker going to whichever is more maintainable (likely A, since it shares design language with the dashboard)

---

## 4. Rollout Plan

### Phase 1: Foundation (Week 1-2)

**Goal:** All brand text updated, both themes implemented, A/B infra ready.

| Task | Owner | Dependencies |
|------|-------|-------------|
| Update all 120+ translation strings across 4 locales x 11 namespaces | i18n engineer | Translation review by native speakers |
| Update all hardcoded brand references in `.tsx`/`.ts` files | Frontend engineer | -- |
| Create Lyriosa logo SVG and favicon set | Designer | Brand guidelines finalized |
| Create OG image (`og-lyriosa.jpg`) | Designer | -- |
| Implement Candidate A landing page component | Frontend engineer | Design mockup approval |
| Implement Candidate B landing page component | Frontend engineer | Design mockup approval |
| Build theme toggle mechanism (`NEXT_PUBLIC_LANDING_THEME`) | Frontend engineer | -- |
| Update AI assistant system prompt | AI engineer | New bot name decision |
| Update invoice PDF template | Backend engineer | -- |
| Legal review of updated contract and privacy text | Legal counsel | Updated translations |
| Deploy to preview environment | DevOps | All above |

### Phase 2: A/B Test (Week 3-6)

**Goal:** Collect data, gather qualitative feedback, make final decision.

| Task | Owner | Dependencies |
|------|-------|-------------|
| Deploy A/B test to staging, then production | DevOps | Phase 1 complete |
| Configure analytics events for variant tracking | Analytics engineer | GA4 / Mixpanel setup |
| Monitor metrics dashboard daily for first week | Product Manager | Analytics in place |
| Conduct 5-10 conservatorium admin interviews | UX Lead | Admin scheduling |
| Gather Ministry feedback | Ministry liaison | Liaison contact |
| Weekly metrics review and anomaly check | Product Manager | -- |
| Decision point: select final theme (end of Week 6) | Product Manager + stakeholders | Sufficient data |

### Phase 3: Final Rollout and Cleanup (Week 7-8)

**Goal:** Ship winning theme, remove losing variant, finalize all assets.

| Task | Owner | Dependencies |
|------|-------|-------------|
| Remove non-selected theme variant code | Frontend engineer | Decision made |
| Remove A/B toggle infrastructure | Frontend engineer | -- |
| DNS transition to `lyriosa.co.il` (if applicable) | DevOps / IT | Domain registration |
| Set up 301 redirects from `harmonia.co.il` to `lyriosa.co.il` | DevOps | DNS ready |
| Update `robots.ts` and sitemap with final domain | Frontend engineer | DNS ready |
| Update Google Search Console | SEO | DNS ready |
| Submit new sitemap to search engines | SEO | Sitemap updated |
| Create `site.webmanifest` | Frontend engineer | Logo finalized |
| Send stakeholder announcement (see Section 5) | Product Manager | All ready |
| Update documentation (CLAUDE.md, MEMORY.md, architecture docs) | Engineering | -- |
| Regression testing: full E2E suite | QA | All changes deployed |

### Rollback Triggers

| Trigger | Action | Owner |
|---------|--------|-------|
| Registration conversion drops >20% for 48+ hours | Revert to `harmonia-snapshot-pre-rebrand` | DevOps |
| Critical rendering bug on any locale | Hotfix or revert affected component | Frontend |
| Legal compliance issue discovered in updated text | Revert legal pages only, keep visual rebrand | Legal + Frontend |
| Negative Ministry feedback requiring reversal | Revert public pages, keep dashboard | Product Manager |

**Rollback process:**
1. `NEXT_PUBLIC_LANDING_THEME` can be flipped instantly (server restart, no deploy)
2. Translation files can be reverted per-namespace from git
3. Full rollback: deploy from `harmonia-snapshot-pre-rebrand` branch

---

## 5. Stakeholder Communication

### 5.1 Conservatorium Admins (85+)

**Timeline:** 2 weeks before public launch

**Channels:**
- In-app announcement via the "What's New" feed (`/dashboard/whats-new`)
- Email to all `conservatorium_admin` users
- Bilingual (Hebrew primary, English secondary)

**Content:**
- Why the rebrand is happening (growth, professionalization)
- What changes they will see (name, logo, colors on public pages)
- What does NOT change (dashboard, functionality, their data, login process)
- New domain (if applicable) with assurance that old domain redirects
- Contact for questions

### 5.2 Teachers and Parents

**Timeline:** 1 week before public launch

**Channels:**
- In-app announcement
- Optional: conservatorium admins can forward the announcement

**Content:**
- Brief explanation of the visual refresh
- Assurance: same login, same functionality, same data

### 5.3 Ministry of Education

**Timeline:** 3 weeks before public launch (before A/B test ends)

**Channels:**
- Direct meeting / presentation with ministry liaison
- Written brief

**Content:**
- Brand evolution rationale
- Visual samples of both candidates (if still in A/B)
- Compliance continuity assurance
- Updated legal documentation drafts

### 5.4 Domain Transition Plan

If migrating from `harmonia.co.il` to `lyriosa.co.il`:

1. **Register `lyriosa.co.il`** -- immediate
2. **Set up parallel hosting** -- `lyriosa.co.il` serves the same app as `harmonia.co.il`
3. **301 redirects** -- all `harmonia.co.il/*` paths redirect to equivalent `lyriosa.co.il/*` paths
4. **Update environment variables** -- `NEXT_PUBLIC_SITE_URL`, canonical URLs, sitemap
5. **Keep `harmonia.co.il` active with redirects for 12+ months** -- search engine authority transfer
6. **Update Google Search Console** -- add `lyriosa.co.il` as property, submit change of address
7. **Update all external references** -- Google Business profiles, Ministry directory listings, conservatorium websites linking to us

### 5.5 API Consumers Impact

**Assessment:** Minimal.
- API routes (`/api/*`) do not expose brand names in their response payloads
- The `harmonia-user` cookie name change is deferred (Won't Have for now)
- Internal localStorage key changes are user-invisible
- **Action needed:** If any conservatorium has integrated with our API directly (unlikely given current architecture), notify them of domain change

### 5.6 Redirect Strategy

| Old URL Pattern | New URL Pattern | Redirect Type |
|----------------|-----------------|---------------|
| `harmonia.co.il/*` | `lyriosa.co.il/*` | 301 Permanent |
| `harmonia.co.il/he/about/...` | `lyriosa.co.il/he/about/...` | 301 Permanent |
| `harmonia.co.il/api/*` | `lyriosa.co.il/api/*` | 301 Permanent |

Bookmarked dashboard URLs (`/dashboard/*`) will continue to work via redirect.

---

## 6. Success Criteria

### 6.1 Launch Readiness Checklist

- [ ] Zero instances of "Lyriosa" / "הרמוניה" / equivalents visible to end users on any page
- [ ] All 4 locales render the new brand name correctly
- [ ] OG images and meta tags show "Lyriosa" in social sharing previews
- [ ] Favicon displays correctly across browsers
- [ ] Legal pages reviewed and approved by counsel
- [ ] E2E test suite passes at 100% (existing 103 smoke tests + 176 flow tests)
- [ ] New brand-specific visual regression tests pass
- [ ] Lighthouse scores maintained (no regression in performance, accessibility, SEO)
- [ ] A/B test infrastructure functional in staging

### 6.2 Measurable KPIs

| KPI | Baseline (pre-rebrand) | Target (4 weeks post-launch) | Measurement |
|-----|----------------------|------------------------------|-------------|
| Landing page bounce rate | Measure during A/B phase | No increase >5% vs baseline | GA4 |
| Registration conversion rate | Measure during A/B phase | No decrease >3% vs baseline | Server events |
| Time on landing page | Measure during A/B phase | Increase or neutral | GA4 |
| Contact form submissions / week | Current average | No decrease >10% | Server events |
| Open Day registrations | Current average | No decrease >10% | Server events |
| SEO organic traffic | Current average | Recovery to 90%+ within 8 weeks of domain change | Google Search Console |
| Brand recognition (qualitative) | Pre-survey | Post-survey 4 weeks after launch | User survey |
| Stakeholder satisfaction | N/A | >80% positive in admin survey | Survey |

### 6.3 Timeline Expectations

| Milestone | Target Date | Status |
|-----------|------------|--------|
| PRD approved | Week 0 | This document |
| Brand assets finalized (logo, colors, fonts) | Week 0+3 days | Pending designer |
| Phase 1 complete (all code changes) | Week 2 | Not started |
| A/B test begins | Week 3 | Not started |
| A/B test decision | Week 6 | Not started |
| Final rollout complete | Week 8 | Not started |
| Old domain redirect monitoring complete | Week 8 + 12 months | Not started |

---

## Appendix A: Candidate Visual Summary

### Candidate A -- Indigo/Clean SaaS
- **Mockup:** `docs/branding/lyriosa-brand-mockup.html`
- **Fonts:** Plus Jakarta Sans (body), Playfair Display (headings), Heebo (Hebrew)
- **Primary color:** Indigo `#6366f1` / `#818cf8`
- **Background:** Deep blue `#0a0a1e`
- **Accent:** White/slate
- **Logo treatment:** "Lyr**i**osa" with golden "i" accent
- **Feel:** Modern SaaS, clean, professional, tech-forward
- **Sections in mockup:** Page header, color system, typography system, component library (buttons, cards, badges, inputs), navigation, hero, stats, features, footer

### Candidate B -- Gold/Navy Cinematic
- **Mockup:** `docs/branding/lyriosa-grok-hero.html`
- **Fonts:** Frank Ruhl Libre (Hebrew headings), Heebo (Hebrew body), Playfair Display (Latin)
- **Primary color:** Gold `#C9A84C` / `#E8CC7A`
- **Background:** Deep navy `#0D1B2A`
- **Accent:** Indigo `#2D3F8F` (CTAs)
- **Logo treatment:** "Lyr**i**osa" with golden "i" accent, musical note icon in gold square
- **Feel:** Premium cultural institution, concert hall warmth, cinematic
- **Sections in mockup:** Full-viewport hero with animated string texture, badge, dual CTAs, stats bar, accessibility widget, cookie bar, watermark
- **RTL-native:** Built Hebrew-first (`dir="rtl"`, Frank Ruhl Libre)

---

## Appendix B: File Inventory for Engineering

Complete list of files requiring modification:

**Translation files (44 files):**
All files under `src/messages/{he,en,ar,ru}/{public,common,enrollment,admin,student,billing,settings}.json`

**Source code files (20+ files):**
- `src/app/[locale]/layout.tsx`
- `src/app/[locale]/page.tsx`
- `src/app/[locale]/error.tsx`
- `src/app/[locale]/about/[slug]/page.tsx`
- `src/app/[locale]/apply/matchmaker/page.tsx`
- `src/app/robots.ts`
- `src/app/api/invoice-pdf/[invoiceId]/route.ts`
- `src/app/api/ps/qr/route.ts`
- `src/ai/flows/help-assistant-flow.ts`
- `src/components/icons.tsx`
- `src/components/harmonia/public-landing-page.tsx` (new theme implementations)
- `src/components/layout/public-navbar.tsx` (logo rendering)
- `src/components/layout/public-footer.tsx` (brand name via translations -- auto-updated)
- `src/components/harmonia/conservatorium-public-profile-page.tsx`
- `src/proxy.ts` (dev email -- optional)
- `src/lib/auth-utils.ts` (interface name -- optional)
- `src/lib/auth-cookie.ts` (cookie name -- deferred)

**New files to create:**
- `public/images/og-lyriosa.jpg`
- `public/favicon.ico` (+ `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`)
- `public/site.webmanifest`
- Theme variant component(s) for Candidate A/B landing pages

---

*End of document.*
