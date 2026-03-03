# SDD-ACCESS-01: Israeli Web Accessibility Compliance (IS 5568 / WCAG 2.1 AA)

**Document Type:** Software Design Document — Legal & Technical Compliance  
**Standard:** Israeli Standard IS 5568 (based on WCAG 2.0/2.1 Level AA)  
**Legal Basis:** Equal Rights for Persons with Disabilities Act, 1998 (חוק שוויון זכויות לאנשים עם מוגבלות)  
**Applies To:** Harmonia Platform — all user-facing surfaces (registration, parent portal, admin, teacher portal)  
**Prepared By:** Technical Analysis  
**Date:** March 2026  
**Version:** 1.0

---

## Table of Contents

1. [Legal Framework & Obligations](#1-legal-framework--obligations)
2. [Scope of Application](#2-scope-of-application)
3. [POUR Principles — Technical Specification](#3-pour-principles--technical-specification)
4. [IS 5568 — Israel-Specific Additional Requirements](#4-is-5568--israel-specific-additional-requirements)
5. [RTL-Specific Accessibility Requirements](#5-rtl-specific-accessibility-requirements)
6. [Component-Level Accessibility Specification](#6-component-level-accessibility-specification)
7. [Registration Wizard Accessibility Spec](#7-registration-wizard-accessibility-spec)
8. [Accessibility Statement Requirements](#8-accessibility-statement-requirements)
9. [Addon Widget vs. Native Accessibility](#9-addon-widget-vs-native-accessibility)
10. [Testing Strategy](#10-testing-strategy)
11. [Implementation Checklist](#11-implementation-checklist)
12. [Enforcement & Penalties](#12-enforcement--penalties)
13. [Recommended Tools & Vendors](#13-recommended-tools--vendors)

---

## 1. Legal Framework & Obligations

### 1.1 Primary Legislation

**IS 5568** is Israel's mandatory web accessibility standard. It is grounded in:

| Law / Standard | Year | Description |
|----------------|------|-------------|
| Equal Rights for Persons with Disabilities Act (ERPD) | 1998, amended 2005, 2013 | Prohibits discrimination; mandates equal access to public services |
| UN Convention on Rights of Persons with Disabilities | 2012 (ratified by Israel) | Requires accessible ICT for member states |
| IS 5568 Part 1 — Web Content Accessibility | October 2017 (effective); September 2023 (updated) | Mandates WCAG 2.0 Level AA; updated to align with WCAG 2.1 |
| IS 5568 Part 2 — Digital Documents Accessibility | May 2020 | Covers PDFs, e-books, digital forms |

### 1.2 Who Is Obligated

| Business Type | Revenue Threshold | Compliance Deadline |
|---------------|-------------------|---------------------|
| Medium/large business (established post-2017) | ≥ ₪300,000/year | **Immediately upon launch** |
| Medium/large business (established pre-2017) | ≥ ₪300,000/year | **October 2020 — already overdue** |
| Small business | < ₪300,000/year | October 2020 |
| Private contractor | < ₪100,000/year | **Exempt** |
| Education providers (all types) | — | **Always covered** |

**Conclusion for Harmonia:** A conservatorium network (Aluma) offering paid educational services to the public is **unambiguously obligated**. Revenue almost certainly exceeds ₪300,000/year across branches. Compliance is not optional.

### 1.3 Penalties for Non-Compliance

- **Civil lawsuit:** Any individual with a disability (or organization representing them) may sue.
- **Statutory damages:** Up to **₪50,000 per complaint** — no proof of actual harm required. Plaintiff only needs to demonstrate non-compliance.
- **Class actions:** Permitted under Israeli law.
- **Reputational damage:** Media coverage of non-compliant educational institutions in Israel is common.

> ⚠️ **Israeli law is among the strictest in the world for web accessibility enforcement. The burden of proof is on the website owner, not the plaintiff.**

---

## 2. Scope of Application

### 2.1 Surfaces That Must Be Accessible

| Surface | URL | Priority |
|---------|-----|----------|
| Public registration wizard | `/register` | P0 — PRIMARY |
| Trial lesson booking | `/try` | P0 |
| Login page | `/login` | P0 |
| Teacher booking page | `/book/teacher/:id` | P0 |
| Parent portal | `/dashboard` | P0 |
| Teacher portal | `/teacher` | P1 |
| Admin portal | `/admin` | P1 |
| Terms & conditions / תקנון | `/terms` | P0 |
| Accessibility statement | `/accessibility` | P0 (legally required) |
| Error pages (404, 500) | `/404`, `/500` | P1 |
| Emails (HTML) | — | P1 |
| PDF invoices | — | P1 (IS 5568 Part 2) |

### 2.2 User Populations Served

The Harmonia platform must support users with:

| Disability Type | Assistive Technology Used | Key WCAG Success Criteria |
|-----------------|--------------------------|--------------------------|
| Blindness | NVDA, JAWS, VoiceOver screen readers | 1.1.1, 1.3.1, 2.4.1–2.4.7 |
| Low vision | Screen magnification (ZoomText), browser zoom 200%+ | 1.4.3, 1.4.4, 1.4.10 |
| Color blindness | Browser/OS color filters | 1.4.1, 1.4.3, 1.4.11 |
| Motor/physical | Keyboard-only, switch access, voice control | 2.1.1, 2.1.2, 2.4.3 |
| Deafness / hard of hearing | Captions, transcripts | 1.2.1–1.2.5 |
| Cognitive disabilities | Clear language, consistent navigation | 3.1.1, 3.3.1–3.3.4 |
| Dyslexia | Font, spacing, contrast control | 1.4.3, 1.4.4, 1.4.12 |

---

## 3. POUR Principles — Technical Specification

WCAG 2.0/2.1 is organized around four principles: **Perceivable, Operable, Understandable, Robust**.

### 3.1 PERCEIVABLE

#### 1.1 — Text Alternatives

Every non-text element must have a text alternative:

```tsx
// ✅ CORRECT — Image with meaningful alt text
<img src="/teacher-profile.jpg" alt="רבקה כהן, מורה לפסנתר עם ניסיון של 15 שנה" />

// ✅ CORRECT — Decorative image (skip screen reader)
<img src="/divider.svg" alt="" role="presentation" />

// ❌ WRONG — Missing alt
<img src="/teacher-profile.jpg" />

// ✅ CORRECT — Icon button with label
<button aria-label="סגור טופס רישום">
  <XIcon aria-hidden="true" />
</button>
```

#### 1.2 — Time-Based Media

If Harmonia includes video tutorials, demonstrations, or recordings:
- Captions required for all prerecorded audio
- Audio description for prerecorded video
- Live captions for live events (WCAG 2.1 AA: 1.2.4)

```tsx
<video controls>
  <source src="/how-to-register.mp4" />
  <track kind="captions" src="/captions-he.vtt" srclang="he" label="עברית" default />
</video>
```

#### 1.3 — Adaptable (Semantic Structure)

All registration forms must use semantic HTML with proper landmark roles:

```tsx
// ✅ CORRECT — Registration wizard with landmarks
<main role="main" aria-label="טופס רישום לקונסרבטוריון">
  <nav aria-label="שלבי הרישום">
    <ol>
      <li aria-current="step">פרטי הורה</li>
      <li>פרטי ילד/ה</li>
      <li>פרופיל מוסיקלי</li>
      {/* ... */}
    </ol>
  </nav>

  <section aria-labelledby="step-heading">
    <h1 id="step-heading">שלב 1 — פרטי ההורה / המשלם</h1>
    <form>
      <fieldset>
        <legend>פרטים אישיים</legend>
        {/* fields */}
      </fieldset>
    </form>
  </section>
</main>
```

#### 1.4 — Distinguishable

**Color Contrast Requirements (WCAG 2.0 AA):**

| Element Type | Minimum Contrast Ratio | Harmonia Target |
|--------------|----------------------|-----------------|
| Normal text (< 18pt) | 4.5:1 | 7:1 (AAA where possible) |
| Large text (≥ 18pt bold or 24pt) | 3:1 | 4.5:1 |
| UI components (borders, icons) | 3:1 | 3:1+ |
| Error states | 4.5:1 | Must be distinguishable without color alone |

**Harmonia color palette compliance check:**

```
Primary blue: #3B82F6 on white (#FFFFFF)
  → Contrast ratio: 3.1:1 ❌ FAILS for body text
  → Use for large text / buttons only: ✅
  → For body text use: #1D4ED8 on white = 5.9:1 ✅

Error red: #EF4444 on white
  → Contrast ratio: 3.9:1 ❌ FAILS for body text
  → Use darker red: #B91C1C = 7.2:1 ✅
  
Success green: #10B981 on white
  → Contrast ratio: 2.4:1 ❌ FAILS
  → Use: #065F46 on white = 10.9:1 ✅
  
Background: #E5E7EB (desaturated indigo)
  → Dark body text (#111827): 16.1:1 ✅
```

**Do NOT rely on color alone for meaning:**
```tsx
// ❌ WRONG — Error shown only in red
<span style={{ color: 'red' }}>שדה חובה</span>

// ✅ CORRECT — Error with icon + text + ARIA
<span role="alert" aria-live="polite">
  <ErrorIcon aria-hidden="true" />
  <span>שדה חובה — יש להזין כתובת דואל תקינה</span>
</span>
```

---

### 3.2 OPERABLE

#### 2.1 — Keyboard Accessible

Every interactive element must be reachable and operable via keyboard alone:

```
Tab         → Move to next focusable element
Shift+Tab   → Move to previous focusable element
Enter/Space → Activate buttons, checkboxes
Arrow keys  → Navigate radio groups, select dropdowns, sliders
Escape      → Close modals, dismiss tooltips
```

**Critical requirements for Harmonia's registration wizard:**

```tsx
// Step navigation buttons must be keyboard accessible
<button
  type="button"
  onClick={goToNextStep}
  onKeyDown={(e) => e.key === 'Enter' && goToNextStep()}
>
  הבא
</button>

// Modals must trap focus while open
// Use: @radix-ui/react-dialog (ships with focus trap)
<Dialog.Root>
  <Dialog.Content
    onOpenAutoFocus={(e) => e.preventDefault()} // Focus first field
    onCloseAutoFocus={() => triggerRef.current?.focus()} // Return focus on close
  >
    {/* modal content */}
  </Dialog.Content>
</Dialog.Root>

// Date picker must be keyboard navigable
// Avoid custom date pickers — use accessible libraries
// Recommended: react-day-picker (ARIA-compliant)
```

**No Keyboard Traps (2.1.2):**
- Focus must never be locked inside a component with no escape
- Exception: Modals may trap focus, but Escape must always close them

#### 2.2 — Enough Time

The InfoCash 60-minute session timer is a **potential accessibility barrier** for users with cognitive disabilities or motor impairments who take longer:

```tsx
// WCAG 2.2.1 — Timing Adjustable
// Requirement: Users can turn off, adjust, or extend any time limit

const SessionTimer = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes

  // At 10 minutes remaining, show accessible warning
  useEffect(() => {
    if (timeRemaining === 600) {
      setShowWarning(true);
    }
  }, [timeRemaining]);

  return showWarning ? (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="timeout-title"
      aria-describedby="timeout-desc"
    >
      <h2 id="timeout-title">תזכורת — הפגישה תפוג בקרוב</h2>
      <p id="timeout-desc">
        נותרו לך פחות מ-10 דקות להשלים את הרישום. האם ברצונך להאריך את הזמן?
      </p>
      <button onClick={extendSession}>כן, הארך את הזמן ב-30 דקות</button>
      <button onClick={saveAndContinueLater}>שמור והמשך מאוחר יותר</button>
    </div>
  ) : null;
};
```

Also: **auto-save every 30 seconds** to Firestore draft — so users can return to a partially-completed form.

#### 2.3 — Seizures and Physical Reactions

- No content that flashes more than 3 times per second
- No animated content that cannot be paused (prefers-reduced-motion)

```tsx
// Respect system-level motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// In Tailwind, use:
<div className="motion-safe:animate-spin motion-reduce:animate-none">
  <Spinner />
</div>
```

#### 2.4 — Navigable

**Skip Navigation Link (required by WCAG 2.4.1):**

```tsx
// First element on every page must be a skip link
// Visible on focus, hidden otherwise
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:right-0 focus:z-50 focus:p-4 focus:bg-white focus:text-blue-700"
>
  דלג לתוכן הראשי
</a>

<main id="main-content" tabIndex={-1}>
  {/* page content */}
</main>
```

**Page Titles (2.4.2):** Every page must have a descriptive `<title>`:
```tsx
// Next.js App Router
export const metadata = {
  title: 'רישום לקונסרבטוריון — שלב 1: פרטי הורה | הרמוניה',
};
```

**Focus Visible (2.4.7):** Focus indicator must always be visible:
```css
/* Never remove outline without replacement */
:focus-visible {
  outline: 3px solid #1D4ED8;
  outline-offset: 2px;
  border-radius: 3px;
}
```

**Consistent Navigation (3.2.3):** Navigation elements must appear in the same location across pages.

---

### 3.3 UNDERSTANDABLE

#### 3.1 — Readable

```html
<!-- Every page must declare language -->
<html lang="he" dir="rtl">

<!-- If page contains mixed-language content: -->
<span lang="en">Cardcom</span>
<span lang="ar">عربي</span>
```

#### 3.2 — Predictable

Changing a select dropdown must NOT automatically navigate — user must confirm:
```tsx
// ❌ WRONG — auto-navigate on select change
<select onChange={(e) => router.push(e.target.value)}>

// ✅ CORRECT — present button to confirm
<select onChange={setSelection} aria-label="בחר שלב" />
<button onClick={() => router.push(selection)}>עבור לשלב</button>
```

#### 3.3 — Input Assistance

**Error Identification (3.3.1):** Every form error must:
1. Be in text (not just color)
2. Describe the error specifically (not just "שדה שגוי")
3. Be linked to its field via `aria-describedby`

```tsx
const [emailError, setEmailError] = useState('');

<div>
  <label htmlFor="email-input">
    כתובת דואל
    <span aria-hidden="true" className="text-red-700"> *</span>
    <span className="sr-only">(חובה)</span>
  </label>
  <input
    id="email-input"
    type="email"
    aria-required="true"
    aria-invalid={!!emailError}
    aria-describedby={emailError ? "email-error" : "email-hint"}
  />
  {emailError && (
    <p id="email-error" role="alert" className="text-red-700">
      <span aria-hidden="true">⚠️ </span>
      {emailError}
    </p>
  )}
  {!emailError && (
    <p id="email-hint" className="text-gray-600">
      לדוגמה: name@example.com
    </p>
  )}
</div>
```

**Error Suggestions (3.3.3):**
```
// Bad: "כתובת דואל שגויה"
// Good: "כתובת הדואל חייבת לכלול @ ודומיין, לדוגמה: name@gmail.com"

// Bad: "ת.ז. שגוי"
// Good: "מספר תעודת זהות חייב להכיל 9 ספרות"
```

**Error Prevention (3.3.4):** For payment pages:
- Show order summary before final submit
- Confirmation dialog for irreversible actions
- Ability to review, correct, and re-submit

---

### 3.4 ROBUST

#### 4.1 — Compatible

**Valid HTML:**
```html
<!-- Every id must be unique -->
<!-- Every opening tag must be closed -->
<!-- Every form field must have a label -->
<!-- ARIA attributes must be valid and used correctly -->
```

**ARIA usage rules:**
```tsx
// ✅ Use native HTML elements when possible
<button>שלח</button>               // Not: <div role="button">שלח</div>
<nav>...</nav>                     // Not: <div role="navigation">
<input type="checkbox" />          // Not: <div role="checkbox">

// ✅ When using custom components, add full ARIA
<div
  role="combobox"
  aria-expanded={isOpen}
  aria-haspopup="listbox"
  aria-controls="dropdown-list"
  aria-activedescendant={selectedOption?.id}
  tabIndex={0}
>
  {selectedOption?.label ?? 'בחר...'}
</div>
<ul id="dropdown-list" role="listbox">
  {options.map(opt => (
    <li key={opt.id} id={opt.id} role="option" aria-selected={opt.id === selected?.id}>
      {opt.label}
    </li>
  ))}
</ul>
```

**Live Regions for dynamic content:**
```tsx
// When form advances to next step:
<div aria-live="polite" aria-atomic="true" className="sr-only">
  עברת לשלב 2: פרטי ילד/ה
</div>

// For error summaries after submit attempt:
<div role="alert" aria-live="assertive">
  <h2>נמצאו {errorCount} שגיאות בטופס:</h2>
  <ul>
    {errors.map(err => (
      <li key={err.field}>
        <a href={`#${err.field}`}>{err.message}</a>
      </li>
    ))}
  </ul>
</div>
```

---

## 4. IS 5568 — Israel-Specific Additional Requirements

Beyond WCAG, IS 5568 includes Israel-specific provisions:

### 4.1 Accessibility Statement (`הצהרת נגישות`)

Every website **must** publish an accessibility statement at a clearly accessible URL (typically `/accessibility` or in the footer). The statement must include:

| Required Element | Content |
|-----------------|---------|
| Compliance level | "אתר זה תואם לתקן IS 5568 ברמת WCAG 2.1 AA" |
| Date of last review | תאריך בדיקה אחרונה |
| Known limitations | רשימת מגבלות נגישות ידועות |
| Accessible alternatives | כיצד לקבל מידע בפורמט חלופי |
| Accessibility coordinator contact | שם + אימייל + טלפון של רכז הנגישות |
| Feedback mechanism | טופס / מייל לדיווח על בעיות נגישות |

### 4.2 Accessibility Coordinator

Organizations must designate a named accessibility coordinator (`רכז/ת נגישות`) who:
- Receives reports of accessibility issues
- Responds within a reasonable timeframe (typically 5 business days)
- Is listed on the accessibility statement page

```tsx
// Accessibility statement page — mandatory fields
const AccessibilityStatement = () => (
  <main lang="he" dir="rtl">
    <h1>הצהרת נגישות</h1>
    <section>
      <h2>רמת הנגישות</h2>
      <p>
        אנו פועלים לעמוד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות
        (התאמות נגישות לשירות), תשע"ג-2013, בהתאם לתקן הישראלי IS 5568
        המבוסס על הנחיות WCAG 2.1 ברמה AA.
      </p>
    </section>
    <section>
      <h2>רכז/ת נגישות</h2>
      <address>
        <p>שם: [שם רכז הנגישות]</p>
        <p>דואל: <a href="mailto:accessibility@harmonia.co.il">accessibility@harmonia.co.il</a></p>
        <p>טלפון: <a href="tel:+97250XXXXXXX">050-XXXXXXX</a></p>
      </address>
    </section>
    <section>
      <h2>מגבלות נגישות ידועות</h2>
      {/* List any known gaps */}
    </section>
    <section>
      <h2>תאריך עדכון אחרון</h2>
      <time dateTime="2026-03-01">1 במרץ 2026</time>
    </section>
  </main>
);
```

### 4.3 Accessible Contact Channel

At minimum one accessible contact method must be offered for users who cannot use the main registration form due to accessibility barriers. This could be a phone number, WhatsApp, or in-person option.

---

## 5. RTL-Specific Accessibility Requirements

Harmonia is an RTL (Right-to-Left) Hebrew-first platform. RTL introduces unique accessibility considerations not fully covered by WCAG (which was written primarily for LTR languages).

### 5.1 CSS Logical Properties

```css
/* ❌ WRONG — hard-coded physical properties break in RTL */
.input { padding-left: 16px; text-align: right; }

/* ✅ CORRECT — logical properties adapt to writing direction */
.input { padding-inline-start: 16px; text-align: start; }

/* Tailwind RTL classes: */
/* <div className="ps-4">  → padding-inline-start: 16px */
/* <div className="ms-2">  → margin-inline-start: 8px */
```

### 5.2 Next.js + Tailwind RTL Configuration

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  i18n: {
    locales: ['he', 'ar', 'en'],
    defaultLocale: 'he',
  },
};

// tailwind.config.ts — ensure RTL plugin loaded
import plugin from 'tailwindcss/plugin';
export default {
  plugins: [
    require('tailwindcss-rtl'),  // or use Tailwind v3.3+ built-in RTL
  ],
};
```

### 5.3 Screen Reader RTL Behavior

Hebrew screen readers (NVDA + Hebrew voice, VoiceOver on iOS with Hebrew) read content RTL. Ensure:

```tsx
// Breadcrumbs in RTL: rightmost = current step
<nav aria-label="ניווט שלבים" dir="rtl">
  <ol>
    <li><a href="/register/step1">פרטי הורה</a></li>
    <li aria-current="page">פרטי ילד/ה</li>
    {/* Visual separator (/) must have aria-hidden */}
    {/* Screen reader announces: "פרטי הורה, פרטי ילד/ה, דף נוכחי" */}
  </ol>
</nav>
```

### 5.4 Number and Date Formatting

```tsx
// Hebrew date format: DD/MM/YYYY (right to left reading)
// Dates in forms must support both keyboard entry and calendar picker
// Keyboard entry: Must accept DD/MM/YYYY and DD-MM-YYYY

// Use Intl for proper formatting
const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
// Output: "15/03/2026"
```

### 5.5 Mixed-Direction Content (Bidi)

Phone numbers, email addresses, and ID numbers are LTR within an RTL document:

```tsx
// ✅ Phone numbers must be explicitly LTR
<span dir="ltr" aria-label="מספר טלפון: 052 1234567">
  052-1234567
</span>

// ✅ Email addresses
<a href="mailto:parent@gmail.com" dir="ltr">
  parent@gmail.com
</a>
```

---

## 6. Component-Level Accessibility Specification

### 6.1 Forms — Master Specification

```tsx
interface AccessibleFieldProps {
  id: string;           // Unique on page
  label: string;        // Hebrew label text
  required?: boolean;
  hint?: string;        // Helper text
  error?: string;       // Error message (shown on validation failure)
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'password';
}

const AccessibleField = ({ id, label, required, hint, error, type }: AccessibleFieldProps) => (
  <div className="field-wrapper">
    <label htmlFor={id}>
      {label}
      {required && (
        <>
          <span aria-hidden="true" className="text-red-700 ms-1">*</span>
          <span className="sr-only"> (שדה חובה)</span>
        </>
      )}
    </label>

    {hint && <p id={`${id}-hint`} className="hint-text">{hint}</p>}

    <input
      id={id}
      type={type}
      required={required}
      aria-required={required}
      aria-invalid={!!error}
      aria-describedby={
        [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ')
      }
    />

    {error && (
      <p id={`${id}-error`} role="alert" className="error-text">
        {error}
      </p>
    )}
  </div>
);
```

### 6.2 Dropdown / Select

```tsx
// For simple selects, use native <select> (most accessible)
<label htmlFor="city-select">עיר מגורים</label>
<select id="city-select" aria-required="true">
  <option value="">-- בחר עיר --</option>
  <option value="hod-hasharon">הוד השרון</option>
  <option value="raanana">רעננה</option>
</select>

// For custom dropdowns (autocomplete, multi-select):
// Use: @radix-ui/react-select or headlessui Combobox
// These ship with full ARIA support
```

### 6.3 Multi-Step Progress Indicator

```tsx
// The step wizard must communicate progress to screen readers
<nav aria-label="התקדמות ברישום">
  <ol>
    {steps.map((step, index) => (
      <li
        key={step.id}
        aria-current={currentStep === index ? 'step' : undefined}
      >
        <span aria-hidden="true">{index + 1}. </span>
        {step.label}
        {currentStep > index && <span className="sr-only"> (הושלם)</span>}
        {currentStep === index && <span className="sr-only"> (שלב נוכחי)</span>}
      </li>
    ))}
  </ol>
</nav>
```

### 6.4 Modals

```tsx
// Payment breakdown modal — must be accessible
<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content
      aria-labelledby="modal-title"
      aria-describedby="modal-desc"
    >
      <Dialog.Title id="modal-title">
        פרטי תשלומים לפי חודש
      </Dialog.Title>
      <Dialog.Description id="modal-desc">
        להלן תוכנית התשלומים החודשיים עבור הפעילות שנבחרה
      </Dialog.Description>

      {/* Table must be accessible */}
      <table>
        <caption className="sr-only">לוח תשלומים חודשי</caption>
        <thead>
          <tr>
            <th scope="col">חודש</th>
            <th scope="col">סכום</th>
            <th scope="col">תאריך חיוב</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(p => (
            <tr key={p.month}>
              <td>{p.month}</td>
              <td>₪{p.amount}</td>
              <td><time dateTime={p.date}>{p.label}</time></td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog.Close asChild>
        <button>סגור</button>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### 6.5 Accessible Digital Signature

```tsx
// The signature pad must be keyboard and screen reader accessible
const SignaturePad = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div>
      <p id="signature-instructions">
        חתמו בתיבה שלהלן עם העכבר, האצבע (מסך מגע), או השתמשו בכפתור
        "קבל ואשר" להחתמה דיגיטלית באמצעות מקלדת.
      </p>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="לוח חתימה"
        aria-describedby="signature-instructions"
        tabIndex={0}
      />
      {/* Keyboard-accessible alternative */}
      <button
        onClick={signWithKeyboard}
        aria-label="אשר וחתום באמצעות מקלדת — ללא כתיבה ידנית"
      >
        אשר חתימה (ללא כתיבה)
      </button>
      <button onClick={clearSignature} aria-label="נקה חתימה ולהתחיל מחדש">
        נקה
      </button>
    </div>
  );
};
```

---

## 7. Registration Wizard Accessibility Spec

### 7.1 Wizard Flow — Screen Reader Announcements

Each step transition must:
1. Move focus to the step heading (`h1`)
2. Announce step number and title via live region
3. Not trigger a full page reload (AJAX navigation)

```tsx
const WizardStep = ({ stepNumber, title, children }: WizardStepProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Move focus to heading on step mount
    headingRef.current?.focus();
  }, []);

  return (
    <section aria-labelledby={`step-${stepNumber}-heading`}>
      <h1
        id={`step-${stepNumber}-heading`}
        ref={headingRef}
        tabIndex={-1}  // Makes non-interactive element focusable
        className="sr-focus-outline"
      >
        שלב {stepNumber}: {title}
      </h1>
      {children}
    </section>
  );
};
```

### 7.2 Submit Button States

```tsx
<button
  type="submit"
  disabled={isSubmitting}
  aria-disabled={isSubmitting}
  aria-busy={isSubmitting}
>
  {isSubmitting ? (
    <>
      <Spinner aria-hidden="true" />
      <span>שולח...</span>
      <span className="sr-only" aria-live="polite">הטופס נשלח, אנא המתן</span>
    </>
  ) : (
    'הבא'
  )}
</button>
```

---

## 8. Accessibility Statement Requirements

### 8.1 Required Page: `/accessibility`

The page must be linked from the footer on **every page** of the platform.

Minimum content structure:

```
הצהרת נגישות — הרמוניה

אתר זה עומד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), 
תשע"ג-2013. הנגישות בוצעה בהתאם לתקן הישראלי IS 5568 המבוסס על הנחיות WCAG 2.1 ברמה AA.

[1] אמצעי הנגישות
- תמיכה מלאה בניווט מקלדת
- תאימות עם קוראי מסך (NVDA, JAWS, VoiceOver)
- הגדלת טקסט עד 200% ללא אובדן תוכן
- יחסי ניגודיות תואמים לתקן
- הצהרות שגיאה ברורות בעברית
- תגי alt לכל התמונות
- כיתובים לסרטוני וידיאו

[2] מגבלות נגישות ידועות
- [List any known WCAG failures being addressed]

[3] יצירת קשר עם רכז הנגישות
שם: [שם]
דואל: accessibility@[domain]
טלפון: [number]
זמן תגובה: עד 5 ימי עסקים

[4] בקשה לתוכן חלופי
אם אינכם יכולים לגשת לאחד ממרכיבי האתר, פנו אלינו ונסייע בפורמט חלופי.

[5] תאריך עדכון אחרון: [date]
```

---

## 9. Addon Widget vs. Native Accessibility

### 9.1 The Problem with Addon Widgets

The current InfoCash platform uses an **accessibility widget** (visible as a sidebar panel with options for font size, contrast, monochrome, link highlighting, etc.). This approach — used widely in Israel by Nagich, EqualWeb, accessiBe, and others — has serious limitations:

| Aspect | Addon Widget | Native Accessibility |
|--------|-------------|---------------------|
| Screen reader compatibility | ❌ Often breaks ARIA | ✅ Always correct |
| Keyboard navigation | ❌ May interfere | ✅ Guaranteed |
| WCAG 2.1 compliance | ❌ Does not guarantee | ✅ Verifiable |
| Performance | ❌ JS overhead (~50-150KB) | ✅ Zero overhead |
| Legal protection | ⚠️ Courts have found widgets insufficient | ✅ Full compliance |
| Actual user benefit | ⚠️ Overlay, not fix | ✅ Core experience |

### 9.2 Harmonia's Approach

**Harmonia must implement accessibility natively in the codebase**, not via an addon widget. Widgets may be added as supplemental visual preference tools (font size, contrast), but they cannot substitute for native accessibility.

### 9.3 If a Widget Is Used as Supplement

If a visual customization widget is included (e.g., for font size, contrast preferences), it must itself be accessible:
```tsx
// Widget toggle button must be keyboard accessible
<button
  aria-label="פתח אפשרויות נגישות"
  aria-expanded={isWidgetOpen}
  aria-controls="accessibility-widget-panel"
>
  <AccessibilityIcon aria-hidden="true" />
</button>

<div
  id="accessibility-widget-panel"
  role="region"
  aria-label="אפשרויות נגישות"
  hidden={!isWidgetOpen}
>
  {/* Controls */}
</div>
```

---

## 10. Testing Strategy

### 10.1 Automated Testing (CI/CD)

```bash
# Install axe-core for automated accessibility testing
npm install --save-dev @axe-core/react axe-playwright

# playwright/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Registration Step 1 has no WCAG violations', async ({ page }) => {
  await page.goto('/register');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

**Automate axe-core scans on every PR in CI pipeline.**

### 10.2 Manual Testing Checklist

| Test | Tool | Pass Criteria |
|------|------|---------------|
| Keyboard-only navigation | No mouse | Complete full registration without mouse |
| Screen reader full flow | NVDA (Windows) + Chrome | All form fields announced correctly |
| Screen reader mobile | VoiceOver (iOS) | All steps navigable by swipe |
| 200% zoom | Browser zoom | No content hidden or overlapping |
| High contrast mode | Windows High Contrast | All elements visible |
| Color blindness simulation | Chrome DevTools (vision deficiencies) | No info conveyed by color alone |
| Reading order | NVDA | Reading order matches visual order |
| Error identification | Trigger all validation errors | All errors announced by screen reader |
| Focus management | Tab key | Focus moves logically; no traps; modals return focus |

### 10.3 Recommended Testing Tools

| Tool | Type | Use |
|------|------|-----|
| axe-core | Automated | Catches ~30% of issues; CI integration |
| WAVE (web extension) | Semi-automated | Visual overlay of issues |
| NVDA + Chrome | Manual (Windows) | Primary Hebrew screen reader testing |
| JAWS | Manual (Windows) | Enterprise screen reader testing |
| VoiceOver | Manual (iOS/macOS) | Mobile users |
| Colour Contrast Analyser | Manual | Verify contrast ratios |
| Lighthouse | Automated | Google's built-in accessibility audit |

---

## 11. Implementation Checklist

### Phase 1 — Foundation (Before Launch)
- [ ] `<html lang="he" dir="rtl">` on all pages
- [ ] Skip navigation link on every page
- [ ] All images have alt text or `alt=""`
- [ ] All form fields have `<label>` linked via `htmlFor`
- [ ] All required fields marked with `aria-required="true"`
- [ ] Error messages use `role="alert"` and `aria-describedby`
- [ ] Contrast ratio ≥ 4.5:1 for all body text
- [ ] Focus indicator visible on all interactive elements
- [ ] Modal dialogs trap focus and return on close
- [ ] Multi-step wizard announces step changes via live region
- [ ] Page titles unique and descriptive on every page
- [ ] Language declared in `<html lang>`
- [ ] Session timeout warning with option to extend
- [ ] Auto-save draft every 30 seconds
- [ ] Accessibility statement page live at `/accessibility`
- [ ] Footer link to accessibility statement on every page
- [ ] Accessibility coordinator named and contact info published
- [ ] No content flashes more than 3 times/second
- [ ] `prefers-reduced-motion` respected for animations

### Phase 2 — Enhanced (Within 3 Months of Launch)
- [ ] Full keyboard navigation test documented
- [ ] NVDA screen reader test completed for all P0 flows
- [ ] VoiceOver iOS test completed for all P0 flows
- [ ] axe-core integrated in CI pipeline
- [ ] PDF invoices tagged for accessibility (IS 5568 Part 2)
- [ ] Hebrew captions for all video content
- [ ] Accessible date picker implemented (react-day-picker)
- [ ] ARIA landmarks correctly assigned throughout
- [ ] Logical tab order verified across all forms
- [ ] Error summary at top of form after failed submission

### Phase 3 — Excellence (Within 6 Months)
- [ ] Third-party accessibility audit commissioned
- [ ] Remediation of all audit findings
- [ ] Arabic language support (for Arabic-speaking parents)
- [ ] User testing with actual users with disabilities
- [ ] Annual accessibility review process documented

---

## 12. Enforcement & Penalties

### 12.1 Legal Risk Summary

```
Risk Level: HIGH

Fines: Up to ₪50,000 per individual complaint
       Class actions permitted
       No requirement to prove actual harm

Key Precedents:
- Israeli courts have ruled against organizations using overlay widgets
  as a substitute for native accessibility
- Educational institutions are specifically listed in ERPD as covered
- The Israel Internet Association (ISOC) actively monitors compliance
```

### 12.2 Liability Mitigation

Best practices to minimize legal exposure:

1. **Document all accessibility work** — Keep records of audit dates, test results, and remediation actions
2. **Publish and maintain accessibility statement** — Courts view published statements positively
3. **Respond promptly to complaints** — Accessibility coordinator must reply within 5 business days
4. **Use native accessibility, not overlays** — Courts have viewed overlay-only approaches skeptically
5. **Commission periodic audits** — Annual third-party audit demonstrates good faith
6. **Train developers** — Document that development team has received WCAG training

---

## 13. Recommended Tools & Vendors

### 13.1 Israeli-Specific Services

| Service | Type | Notes |
|---------|------|-------|
| Nagich (נגיש) | Widget + Audit | Most common in Israel; widget has limitations |
| EqualWeb | Widget + Audit | Good for supplement widget |
| AccessiBe | AI-powered widget | Controversial in accessibility community |
| Tabnav (tabnav.com) | Audit + Hebrew resources | Israeli-focused |

### 13.2 Recommended Stack for Harmonia

| Category | Tool | Reason |
|----------|------|--------|
| Component library | shadcn/ui | Built on Radix UI — accessibility-first primitives |
| Date picker | react-day-picker | WCAG-compliant, Tailwind-compatible |
| Dialog/modal | @radix-ui/react-dialog | Focus trap, ARIA built-in |
| Select/combobox | @radix-ui/react-select | Full ARIA combobox spec |
| Automated testing | @axe-core/playwright | CI integration |
| Manual testing | NVDA + Chrome | Primary Hebrew screen reader |
| Contrast checking | Colour Contrast Analyser | Free, accurate |
| Code linting | eslint-plugin-jsx-a11y | Catches common ARIA mistakes at write-time |

```bash
# Install accessibility linting
npm install --save-dev eslint-plugin-jsx-a11y

# .eslintrc
{
  "plugins": ["jsx-a11y"],
  "extends": ["plugin:jsx-a11y/recommended"]
}
```

---

*End of SDD-ACCESS-01*

---

**Cross-References:**  
- SDD-COMPARE-Harmonia-vs-InfoCash.md — Section 6 (UX), Section 4 (W16 weakness in InfoCash)  
- SDD-02 (Registration Wizard) — Section 7 of this document  
- SDD-05 (Payment) — Modal dialogs (Section 6.4)  
- SDD-15 (i18n) — RTL + Arabic language support (Section 5)  
