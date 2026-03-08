# 03 -- Frontend

## 1. Technology Stack

| Concern | Technology | Version |
|---------|-----------|---------|
| Framework | Next.js (App Router) | ^16.1.6 |
| Runtime | React | ^19.2.4 |
| Language | TypeScript | ^5.9.3 (strict mode) |
| UI Components | shadcn/ui (Radix UI) | various |
| Styling | Tailwind CSS | ^4.2.0 |
| i18n | next-intl | ^4.8.3 |
| Fonts | Rubik (Google Fonts) | latin, hebrew, arabic, cyrillic |
| Icons | Lucide React | ^0.575.0 |
| Forms | React Hook Form + Zod | ^7.71.1 / ^4.3.6 |
| Charts | Recharts | ^3.7.0 |
| PDF Generation | jsPDF + jspdf-autotable | ^4.2.0 / ^5.0.7 |
| E-Signatures | react-signature-canvas | ^1.0.6 |
| Onboarding | driver.js | ^1.4.0 |
| Carousels | embla-carousel-react | ^8.6.0 |
| Animations | framer-motion | ^12.34.3 |
| Date utils | date-fns | ^4.1.0 |
| AI | Genkit + @genkit-ai/google-genai | ^1.29.0 |
| Firebase | firebase (Auth only) | ^12.9.0 |

---

## 2. Application Structure

```
src/
+-- app/
|   +-- actions.ts                    # Server Actions (withAuth + Zod)
|   +-- actions/                      # Domain-specific action modules
|   |   +-- auth.ts, consent.ts, signatures.ts, storage.ts, user-preferences.ts
|   +-- api/
|   |   +-- auth/                     # /api/auth/login, /api/auth/logout
|   |   +-- bootstrap/                # /api/bootstrap -- serves mock data
|   |   +-- cardcom-webhook/          # /api/cardcom-webhook
|   +-- [locale]/                     # Locale-prefixed routes
|       +-- layout.tsx                # NextIntlClientProvider + dir attribute
|       +-- page.tsx                  # Public landing page
|       +-- dashboard/                # Authenticated shell
|           +-- layout.tsx            # Sidebar + WalkthroughManager
|           +-- admin/                # Admin pages
|           +-- teacher/              # Teacher pages
|           +-- student/              # Student pages
|           +-- family/, billing/, schedule/, practice/, ...
+-- components/
|   +-- ui/                           # shadcn/ui primitives
|   +-- dashboard/harmonia/           # Domain components
|   +-- harmonia/                     # Public-facing components
|   +-- forms/, enrollment/, payments/, auth/, layout/
+-- hooks/
|   +-- use-auth.tsx                  # Auth + bootstrap context (881 lines, decomposed from 2534)
|   +-- domains/                      # Domain context files (Phase 3 decomposition)
|   |   +-- auth-domain.tsx           # user, login, logout, session
|   |   +-- users-domain.tsx          # user management, approvals
|   |   +-- lessons-domain.tsx        # lesson slots, scheduling, makeup credits
|   |   +-- repertoire-domain.tsx     # assigned repertoire, compositions
|   |   +-- comms-domain.tsx          # messaging, announcements, notifications
|   |   +-- instruments-domain.tsx    # instrument inventory and rentals
|   |   +-- events-domain.tsx         # events, performances, open days
|   |   +-- admin-domain.tsx          # conservatorium config, branches, rooms, packages
|   |   +-- index.ts                  # re-exports all domain contexts
|   +-- data/                         # React Query hooks
+-- i18n/
|   +-- routing.ts                    # locales: [he,en,ar,ru], as-needed
|   +-- request.ts                    # Deep-merges split message files
+-- messages/
|   +-- he/ ar/ en/ ru/               # 10 namespace files per locale
+-- lib/
|   +-- types.ts                      # Master types (1964 lines)
|   +-- data.ts / data.json           # Mock seed data + 5,217 compositions
|   +-- auth-utils.ts                 # verifyAuth, requireRole, withAuth
|   +-- db/                           # Database adapter layer
|   +-- validation/                   # Zod schemas
+-- ai/
    +-- flows/                        # 8 Genkit flows

e2e/                                  # Playwright tests (6 spec files)
functions/                            # Firebase Cloud Functions
```

---

## 3. Key Components

### Public-Facing

| Component | File | Description |
|-----------|------|-------------|
| Landing Page | `components/harmonia/public-landing-page.tsx` | Hero, stats bar, teacher cards, persona cards, testimonials |
| Slot Marketplace | `components/harmonia/available-slots-marketplace.tsx` | Browse open teacher slots |
| Slot Card | `components/harmonia/slot-promotion-card.tsx` | Individual slot tile with premium badge |
| Trial Booking | `components/harmonia/trial-booking-widget.tsx` | Public trial lesson booking |
| Open Day | `components/harmonia/open-day-landing.tsx` | Open day registration page |
| Musicians for Hire | `components/harmonia/musicians-for-hire.tsx` | Public musician marketplace |

### Dashboard

| Component | File | Description |
|-----------|------|-------------|
| Book Lesson Wizard | `dashboard/harmonia/book-lesson-wizard.tsx` | Multi-tab booking with Deals tab |
| Admin Command Center | `dashboard/harmonia/admin-command-center.tsx` | Live metrics, quick actions |
| Teacher Dashboard | `dashboard/harmonia/teacher-dashboard.tsx` | Today's lessons, roster |
| Schedule Calendar | `dashboard/harmonia/schedule-calendar.tsx` | Weekly lesson calendar |
| Master Schedule | `dashboard/harmonia/master-schedule-calendar.tsx` | Admin full-conservatorium view |
| Sidebar Nav | `dashboard/sidebar-nav.tsx` | Role-scoped grouped navigation (556 lines) |

---

## 4. Routing & Locale Strategy

```
/dashboard               -> Hebrew (default -- localePrefix: 'as-needed')
/en/dashboard            -> English
/ar/dashboard            -> Arabic
/ru/dashboard            -> Russian
```

Auth via Edge Proxy (`src/proxy.ts`):
- Dashboard routes: validate `__session` cookie, inject `x-user-*` headers
- API routes: pass through without auth or intl
- Public routes: intl middleware only

---

## 5. i18n Implementation

### Translation Files

Messages loaded from split files via **static imports** in `src/i18n/request.ts`:

```
src/messages/{locale}/
+-- admin.json, alumni.json, billing.json, common.json,
    enrollment.json, forms.json, OpenDay.json, public.json,
    settings.json, student.json
```

English is the fallback: `deepMerge(fallbackMessages, messages)`.

### RTL Support

```tsx
// src/app/[locale]/layout.tsx
const dir = locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr';
<html lang={locale} dir={dir}>
```

All spacing uses CSS Logical Properties: `ms-`/`me-`, `ps-`/`pe-`, `text-start`/`text-end`.

---

## 6. State Management

### Phase 3 Complete: Domain Context Decomposition

`src/hooks/use-auth.tsx` was decomposed from 2,534 lines to 881 lines. The 8 domain context files in `src/hooks/domains/` each own a distinct slice of state:

| File | Responsibility |
|------|---------------|
| `auth-domain.tsx` | user identity, login, logout, session |
| `users-domain.tsx` | user management, approvals, role changes |
| `lessons-domain.tsx` | lesson slots, scheduling, makeup credits |
| `repertoire-domain.tsx` | assigned repertoire, compositions |
| `comms-domain.tsx` | messaging, announcements, notifications |
| `instruments-domain.tsx` | instrument inventory and rentals |
| `events-domain.tsx` | events, performances, open days |
| `admin-domain.tsx` | conservatorium config, branches, rooms, packages |

`src/hooks/domains/index.ts` re-exports all 8 contexts for a single import point.

### React Query: Installed and Wired

`@tanstack/react-query` is installed. `QueryProvider` wraps the app. Domain hooks in `src/hooks/data/` use `useQuery`/`useMutation` directly against the database adapter layer:

- `useMyLessons` — student/teacher lesson feed
- `useMyInvoices` — billing history
- `useLiveStats` — admin dashboard metrics
- `useMakeupCredits` — makeup credit balance
- `usePracticeLogs` — student practice history

---

## 7. Accessibility (IS 5568 / WCAG 2.1 AA)

- `/accessibility` statutory page present
- Skip-to-content link in root layout
- `AccessibilityPanel` component for user preferences
- Semantic HTML + ARIA labels throughout
- Keyboard navigation with visible focus rings
- RTL-aware tab order
- Color contrast targets: 4.5:1 (normal), 3:1 (large/UI)

---

## 8. Testing

| Tool | Purpose |
|------|---------|
| Vitest | Unit + integration tests |
| React Testing Library | Component tests |
| Playwright | End-to-end browser tests |

Playwright specs in `e2e/`: `landing.spec.ts`, `public-pages.spec.ts`, `register.spec.ts`, `playing-school.spec.ts`, `dashboard.spec.ts`, `api.spec.ts`.
