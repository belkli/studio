# Theme System V2 — Design Sprint Brief

## Date: 2026-03-15
## Status: Ready for brainstorming

## Problem Statement

The current theme system (v1) has fundamental issues:
1. Theme B hero removes the violin image (should keep it with gold overlay)
2. CSS variable approach (`[data-theme="b"]`) affects ALL components globally — causes mixed CSS in below-fold sections
3. No proper dark mode support for Theme B
4. Build-time toggle (`NEXT_PUBLIC_LANDING_THEME`) prevents runtime switching
5. The "good" light-mode Theme B (with violin image) was accidentally broken by switching to cinematic-only hero

## What Works (Keep)
- Theme A (indigo) — fully functional in light and dark mode
- Brand name Lyriosa — all translations, constants, infrastructure identifiers renamed
- 4 Google Fonts loaded (Playfair Display, Plus Jakarta Sans, Heebo, Frank Ruhl Libre)
- BrandThemeProvider architecture (server-side prop, no hydration flash)
- Dashboard always uses Theme A (forced via `data-theme="a"`)
- RTL compliance test suite (427 tests passing)

## What's Broken (Fix in V2)
- Theme B hero: `showHeroImage: false` removes violin — should be `true` with gold overlay
- Theme B below-fold sections: CSS variable cascade creates mixed light/dark cards
- Theme B navbar: sometimes unreadable (dark text on dark gradient)
- No user-facing theme toggle
- No system dark mode preference support for Theme B

## Evidence (Screenshots)
- `docs/lyriosa/good_theme_b_light_mode.jpg` — THE TARGET: violin image + gold overlay + readable menu
- `docs/lyriosa/bad_theme_b_dark_mode.jpg` — no image, empty hero, weak overlays
- `docs/lyriosa/bad_theme_b_light_mode.jpg` — no image, unreadable menu
- `docs/lyriosa/bad_mixed_css_theme_b_dark_mode.jpg` — white cards on dark bg
- `docs/lyriosa/bad_mixed_css_theme_b_dark_mode_II.jpg` — same mixed CSS on open day

## Reference Mockups
- `docs/branding/lyriosa-brand-mockup.html` — Candidate A (indigo) full landing page
- `docs/branding/lyriosa-grok-hero.html` — Candidate B (gold/navy) hero-only mockup

## Questions for Design Sprint
1. Should Theme B keep the violin image with gold overlay (like the good screenshot)?
2. Should both themes support light + dark mode (4 combinations)?
3. Should users be able to toggle themes at runtime? Where?
4. How to handle the below-fold sections for Theme B without global CSS variable pollution?
5. Should the theme choice persist (cookie/localStorage)?

## Key Files
- `src/app/globals.css` — CSS variables (lines 54-210)
- `src/components/brand-theme-provider.tsx` — theme context
- `src/lib/themes/active-theme.ts` — theme reader
- `src/components/harmonia/public-landing-page.tsx` — landing page with HERO_STYLES
- `src/components/layout/public-navbar.tsx` — themed navbar
- `src/components/layout/public-footer.tsx` — themed footer

## Snapshot
- Current branch: `main` at commit `dc080fc`
- Snapshot before rebrand: branch `harmonia-snapshot-pre-rebrand` at `ebe896c`
