# SDD-FIX-00: New Features & Bug Fixes — Master Index
## Based on Product Review: DesignSiteBetter.pdf

**Version:** 1.0  
**Date:** 2026-03  
**Status:** Ready for Implementation  
**Stack:** Next.js (App Router) · TypeScript · Firebase · shadcn/ui · Tailwind CSS (RTL)

> **How to read this index:** Each SDD below maps directly to one or more issues raised in the product review PDF. SDDs are grouped by domain for maximum implementation efficiency. Items marked ✅ exist in code but need fixing; items marked 🆕 are net-new features.

---

## SDD Map

| File | Domain | PDF Issues | Priority |
|------|--------|-----------|----------|
| [SDD-FIX-01](./SDD-FIX-01-Admin-UI-Navigation.md) | Admin UI, Language Selector, Chat Icon, RTL | #1, #2, #24 | P0 |
| [SDD-FIX-02](./SDD-FIX-02-User-Management-Delegated-Admin.md) | Manage Users, Delegated Admin Role, User Edit Forms | #4 | P0 |
| [SDD-FIX-03](./SDD-FIX-03-UI-Micro-Fixes.md) | Announcements spacing, Form checkboxes, Composer translation | #3, #7, #18 | P1 |
| [SDD-FIX-04](./SDD-FIX-04-Registration-Enhancement.md) | Admin registration, Instruments per conservatorium, Packages, ID mandatory | #5, #25, #26 | P0 |
| [SDD-FIX-05](./SDD-FIX-05-Approvals-Module.md) | Approvals RTL, "For your treatment" logic, Bulk actions, i18n key | #6 | P0 |
| [SDD-FIX-06](./SDD-FIX-06-Events-Enhancement.md) | Event editing, Venue, AI poster, Seat booking, Paid/free events | #9 | P1 |
| [SDD-FIX-07](./SDD-FIX-07-Scholarship-Donations.md) | Scholarship action buttons, Extended donation categories | #8, #28 | P1 |
| [SDD-FIX-08](./SDD-FIX-08-OpenDay-Performances.md) | Open day management, Kanban redesign, City/distance filter | #10, #11, #27 | P1 |
| [SDD-FIX-09](./SDD-FIX-09-Rentals-Module.md) | Rentals RTL, Remote signature, Billing, Monthly rental model | #12 | P1 |
| [SDD-FIX-10](./SDD-FIX-10-Smart-Room-Assignment.md) | Instrument taxonomy, Smart room allocation, Manual blocking | #13 | P1 |
| [SDD-FIX-11](./SDD-FIX-11-PlayingSchool-Schedule-Redesign.md) | Playing school fixes, Full schedule redesign, Distribution translation | #14 | P1 |
| [SDD-FIX-12](./SDD-FIX-12-Payroll-Module.md) | Payroll RTL, Hours report, CSV export | #15 | P1 |
| [SDD-FIX-13](./SDD-FIX-13-FormBuilder-Messages.md) | Form builder enhancement, Messages new-conversation, Forms visibility | #16, #17 |  P0 |
| [SDD-FIX-14](./SDD-FIX-14-Alumni-MasterClasses.md) | Alumni auto-enrollment, Master class workflow, Publishing | #19 | P2 |
| [SDD-FIX-15](./SDD-FIX-15-ConservatoriumProfile-WhatsNew.md) | Conservatorium profile RTL, Opening hours, Google Maps, What's New | #20, #21 | P1 |
| [SDD-FIX-16](./SDD-FIX-16-Translation-Infrastructure.md) | NodeJS translation scripts, encoding fix, i18n tooling | #22 | P0 |
| [SDD-FIX-17](./SDD-FIX-17-OAuth-SocialSignIn.md) | Google/Microsoft OAuth, Registration flow with OAuth | #23 | P1 |
| [SDD-FIX-18](./SDD-FIX-18-PublicSite-LandingPage.md) | About page, Landing redesign, Teacher bios, Conservatory discovery | #29, #30, #31, #32 | P1 |
| [SDD-FIX-19](./SDD-FIX-19-MultiBackend-Database.md) | Database abstraction layer, PostgreSQL, Schema scripts, Mock data | #33 | P2 |

---

## Implementation Priority Order

### Sprint 1 — P0 Blockers (must fix before any demo)
1. `SDD-FIX-16` — Translation infrastructure (NodeJS scripts, fix gibberish)
2. `SDD-FIX-01` — Admin UI navigation fixes (language selector, chat icon)
3. `SDD-FIX-05` — Approvals module (broken i18n key blocks usage)
4. `SDD-FIX-02` — User management & delegated admin
5. `SDD-FIX-13` — Form builder & messages (forms invisible)
6. `SDD-FIX-04` — Registration enhancement (packages, instruments)

### Sprint 2 — P1 Core Features
7. `SDD-FIX-03` — UI micro-fixes
8. `SDD-FIX-06` — Events enhancement
9. `SDD-FIX-07` — Scholarship & donations
10. `SDD-FIX-09` — Rentals module
11. `SDD-FIX-11` — Playing school & schedule
12. `SDD-FIX-12` — Payroll module
13. `SDD-FIX-15` — Conservatorium profile
14. `SDD-FIX-17` — OAuth
15. `SDD-FIX-18` — Public site & landing page
16. `SDD-FIX-08` — Open day & performances
17. `SDD-FIX-10` — Smart room assignment

### Sprint 3 — P2 Enhancements
18. `SDD-FIX-14` — Alumni & master classes
19. `SDD-FIX-19` — Multi-backend database

---

## Cross-Cutting Concerns

### RTL Rule (applies to ALL fixes)
Every component must use `dir="rtl"` on its root when `locale === 'he' || locale === 'ar'`. Use the existing `useLocale()` hook and the `cn(rtl && 'text-right', ...)` pattern already established in the codebase.

### i18n Rule
All user-facing strings go into `src/messages/{locale}/*.json`. Never hardcode Hebrew in JSX. Keys follow the pattern `Namespace.screen.element`.

### Translation Script Rule (Issue #22)
**Never use PowerShell** to write translation files — it corrupts UTF-8 Hebrew characters. Always use the NodeJS scripts defined in `SDD-FIX-16`.
