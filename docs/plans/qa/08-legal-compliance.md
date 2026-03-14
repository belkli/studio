# QA Plan: Legal, Consent, Privacy & Compliance

**Domain:** Legal & Compliance
**Date:** 2026-03-14
**Compliance frameworks:** PDPPA (Israeli Protection of Privacy Law), Israeli Consumer Protection Law 5741-1981, IS 5568 (accessibility standard)

---

## Scope

| Area | Key Files |
|---|---|
| Cookie banner | `src/components/consent/cookie-banner.tsx` |
| Consent checkboxes | `src/components/forms/consent-checkboxes.tsx` |
| Consent server actions | `src/app/actions/consent.ts` |
| DSAR (settings) | `src/app/[locale]/dashboard/settings/page.tsx` |
| Privacy page | `src/app/[locale]/privacy/page.tsx` |
| Accessibility page | `src/app/[locale]/accessibility/page.tsx` |
| Cancellation cooling-off | `src/app/[locale]/dashboard/settings/cancellation/page.tsx`, `src/app/actions/billing.ts` |
| Rental signing | `src/app/[locale]/rental-sign/[token]/page.tsx`, `src/components/harmonia/rental-signing-flow.tsx` |
| Signature capture | `src/components/forms/signature-capture.tsx` |
| Enrollment wizard contract step | `src/components/harmonia/playing-school-enrollment-wizard.tsx` (step 5) |
| Registration agreement | `src/components/enrollment/registration-agreement.tsx` |

**Existing tests to extend (not replace):**
- `e2e/flows/consent-banner.spec.ts` — 5 tests, all cookie banner happy-path
- `e2e/flows/dsar.spec.ts` — 5 tests, all UI-only toast assertions

---

## Mock Data Requirements

| ID | Description | Used by |
|---|---|---|
| `parent-user-1` | Parent with `conservatoriumId: cons-15` | parental consent, DSAR |
| `student-user-1` | Minor student under `parent-user-1` | parental consent, video recording consent |
| `teacher-user-1` | Teacher at cons-15 | DSAR (teacher role) |
| `conservatorium_admin` user | Admin for cons-15 | cancellation settings, DSAR admin path |
| `site_admin` / dev-bypass | Injected by proxy | most scenarios run without real auth |
| Rental with `status: pending_signature` | In-memory rental fixture | rental signing scenarios |
| Playing-school token `ps-token-test` | Resolves to a known school | enrollment wizard scenarios |
| Conservatorium with `customRegistrationTerms` | cons-10 has per-locale addenda | custom terms display |

DB backend: **mock** (default, all scenarios). Flag: `NEXT_PUBLIC_ALLOW_BOOTSTRAP_MOCK_FALLBACK=1`.

---

## Scenario Index

| # | Name | Area |
|---|---|---|
| LC-01 | Banner appears on first visit | Cookie banner |
| LC-02 | Accept sets localStorage and hides banner | Cookie banner |
| LC-03 | Reject sets localStorage and hides banner | Cookie banner |
| LC-04 | Banner absent after accepted reload | Cookie banner |
| LC-05 | Banner absent after rejected reload | Cookie banner |
| LC-06 | Banner persistence across page navigation | Cookie banner |
| LC-07 | Banner absent mid-session (no reload needed) | Cookie banner |
| LC-08 | Banner renders in RTL locales | Cookie banner |
| LC-09 | Banner ARIA roles and labelling | Cookie banner (a11y) |
| LC-10 | Consent checkboxes render for adult registration | Consent checkboxes |
| LC-11 | Mandatory checkboxes block form submission when unchecked | Consent checkboxes |
| LC-12 | Marketing checkbox is optional | Consent checkboxes |
| LC-13 | isMinor=true shows parental wording and VIDEO_RECORDING checkbox | Parental consent |
| LC-14 | customTerms prop displays per-conservatorium addendum | Custom terms |
| LC-15 | Consent checkboxes ARIA — required, invalid, describedby | Consent checkboxes (a11y) |
| LC-16 | saveConsentRecord called on successful registration | Consent server action |
| LC-17 | recordConsentAction rejects unauthenticated callers | Consent server action (security) |
| LC-18 | Parental consent recorded with isMinorConsent=true | Parental consent (server) |
| LC-19 | DSAR section visible on /dashboard/settings for all roles | DSAR |
| LC-20 | Export Data triggers success toast | DSAR |
| LC-21 | Request Data Deletion triggers destructive toast | DSAR |
| LC-22 | Withdraw Consent triggers success toast | DSAR |
| LC-23 | DSAR section accessible to student role | DSAR (role) |
| LC-24 | DSAR section accessible to teacher role | DSAR (role) |
| LC-25 | DSAR section accessible to parent role | DSAR (role) |
| LC-26 | Privacy page renders all required sections | Privacy page |
| LC-27 | Privacy page sub-processors table is present | Privacy page |
| LC-28 | Privacy page retention schedule list is present | Privacy page |
| LC-29 | Privacy page conservatorium contact directory renders | Privacy page |
| LC-30 | Privacy page links to /dashboard/settings for DSAR | Privacy page |
| LC-31 | Privacy page renders in all 4 locales without missing keys | Privacy page (i18n) |
| LC-32 | Privacy page RTL layout for he and ar | Privacy page (RTL) |
| LC-33 | Accessibility page renders all required sections | Accessibility page |
| LC-34 | Accessibility page conservatorium contact directory renders | Accessibility page |
| LC-35 | Accessibility page renders in all 4 locales | Accessibility page (i18n) |
| LC-36 | Cancellation settings page accessible only to conservatorium_admin and site_admin | Cancellation (auth) |
| LC-37 | Cancellation settings page inaccessible without newFeaturesEnabled | Cancellation (guard) |
| LC-38 | Cancellation policy form saves changes with success toast | Cancellation (CRUD) |
| LC-39 | Notice-hours field rejects negative values | Cancellation (validation) |
| LC-40 | cancelPackageAction marks package inactive | Cancellation (billing) |
| LC-41 | cancelPackageAction returns withinCoolingOff=true within 14 days | Cancellation cooling-off |
| LC-42 | Rental sign page returns expired-token card for unknown/used tokens | Rental signing |
| LC-43 | Rental sign page step 1: OTP send and verify | Rental signing (OTP) |
| LC-44 | Rental sign page step 2: rental terms display | Rental signing (terms) |
| LC-45 | Rental sign page step 3: signature canvas draw and submit | Rental signing (sig) |
| LC-46 | Rental sign page step 3: confirmOnly checkbox bypasses canvas requirement | Rental signing (sig) |
| LC-47 | Rental sign page step 4: completion screen shown | Rental signing (completion) |
| LC-48 | Rental sign page invalid OTP shows error | Rental signing (OTP error) |
| LC-49 | Rental sign page expired OTP shows error | Rental signing (OTP error) |
| LC-50 | SignatureCapture confirm disabled when canvas empty | Signature component |
| LC-51 | SignatureCapture clear button resets canvas | Signature component |
| LC-52 | SignatureCapture produces SHA-256 hash in onConfirm result | Signature component |
| LC-53 | SignatureCapture ARIA: canvas role=img, aria-label set | Signature component (a11y) |
| LC-54 | SignatureCapture RTL: clear button in logical start corner | Signature component (RTL) |
| LC-55 | Enrollment wizard step 5 shows RegistrationAgreement accordion | Enrollment contract |
| LC-56 | Enrollment wizard step 5 next button disabled until signature given | Enrollment contract |
| LC-57 | Enrollment wizard step 5 SignatureCapture onConfirm sets contractSigned | Enrollment contract |
| LC-58 | RegistrationAgreement shows customAddendum when provided | Custom terms (enrollment) |
| LC-59 | RegistrationAgreement section 10 shows default text when no addendum | Custom terms (enrollment) |
| LC-60 | RegistrationAgreement admin-preview mode hides section 10 | Custom terms (admin) |

---

## Detailed Scenarios

### LC-01 — Banner appears on first visit

**Personas:** unauthenticated visitor
**Preconditions:** `localStorage` has no `harmonia_cookie_consent` key
**Steps:**
1. Navigate to `/` (Hebrew default locale)
2. Wait for `domcontentloaded`

**Expected results:**
- `role=dialog` element is visible
- Banner has `aria-labelledby="cookie-banner-title"` and `aria-describedby="cookie-banner-desc"`
- Two buttons present: Accept and Reject

**DB backend:** mock
**Locales:** he (default)
**Compliance:** PDPPA § first-visit consent gate; GDPR-equivalent transparency requirement

---

### LC-02 — Accept sets localStorage and hides banner

**Personas:** unauthenticated visitor
**Preconditions:** `harmonia_cookie_consent` cleared
**Steps:**
1. Navigate to `/`, reload to pick up cleared state
2. Click the Accept button (matches `/accept|אישור/i`)
3. Assert banner is no longer visible
4. Read `localStorage.getItem('harmonia_cookie_consent')`

**Expected results:**
- Banner disappears within 5 s
- localStorage value is exactly `'accepted'`

**DB backend:** mock
**Locales:** he, en
**Compliance:** PDPPA informed-consent record; Consumer Protection Art. 4(a)

---

### LC-03 — Reject sets localStorage and hides banner

**Personas:** unauthenticated visitor
**Preconditions:** `harmonia_cookie_consent` cleared
**Steps:**
1. Navigate to `/`, reload
2. Click Reject button (matches `/reject|דחייה/i`)
3. Assert banner not visible; read localStorage

**Expected results:**
- Banner disappears
- localStorage value is `'rejected'`

**DB backend:** mock
**Locales:** he, en
**Security check:** `'rejected'` value must not be treated as truthy by any downstream analytics check
**Compliance:** right to decline consent

---

### LC-04 — Banner absent after accepted reload

**Preconditions:** `localStorage.setItem('harmonia_cookie_consent', 'accepted')` pre-set before navigation
**Steps:**
1. Set localStorage, navigate to `/`, reload
2. Wait 1 s for client hydration

**Expected results:**
- `role=dialog` banner not visible
**Notes:** `getServerSnapshot` returns `'accepted'` to prevent SSR flash

---

### LC-05 — Banner absent after rejected reload

Same as LC-04 but with `'rejected'`.

---

### LC-06 — Banner persistence across page navigation

**Steps:**
1. Accept banner on `/`
2. Navigate to `/en/privacy`
3. Navigate to `/dashboard`

**Expected results:**
- Banner does not reappear on any subsequent page load within the same session

---

### LC-07 — Banner absent mid-session (no reload)

**Steps:**
1. Clear localStorage, navigate to `/`
2. Accept banner
3. Without reload, navigate to `/about`

**Expected results:**
- `useSyncExternalStore` picks up storage event; banner does not reappear

---

### LC-08 — Banner renders in RTL locales

**Locales:** he, ar
**Steps:**
1. Navigate to `/` (he) and `/ar/`
2. Assert banner is visible
3. Inspect layout: banner buttons should be on the visually correct side for RTL

**Expected results:**
- Banner renders; all text is present; no layout overflow
**Notes:** Banner uses logical CSS (`inset-x-0`) so RTL layout is inherited from parent `dir`

---

### LC-09 — Banner ARIA roles and labelling

**Steps:**
1. Navigate to `/`, clear localStorage, reload
2. Using axe or ARIA snapshot: assert `role=dialog`, `aria-labelledby=cookie-banner-title`, `aria-describedby=cookie-banner-desc`
3. Both buttons have accessible text

**Expected results:**
- No ARIA violations in banner region
**Compliance:** IS 5568 (Israeli accessibility standard), WCAG 2.1 AA

---

### LC-10 — Consent checkboxes render for adult registration

**Personas:** new adult user registering
**Preconditions:** Registration form mounted with `isMinor=false`
**Steps:**
1. Navigate to registration page or mount ConsentCheckboxes in isolation
2. Assert checkboxes for: `consentDataProcessing`, `consentTerms`, `consentMarketing`
3. Assert `consentVideoRecording` is NOT present

**Expected results:**
- 3 checkboxes visible
- Data processing and Terms checkboxes have `aria-required="true"`
- Marketing checkbox has `aria-required="false"`

**DB backend:** mock
**Locales:** he (RTL), en
**Compliance:** PDPPA, IS 5568

---

### LC-11 — Mandatory checkboxes block form submission when unchecked

**Personas:** new user
**Preconditions:** `consentDataProcessing` or `consentTerms` unchecked
**Steps:**
1. Submit registration form with mandatory checkboxes unchecked
2. Observe form validation errors

**Expected results:**
- Form does not submit
- Error message shown under unchecked required checkbox with `role="alert"`
- `aria-invalid="true"` on the checkbox element
**Compliance:** PDPPA mandatory consent record

---

### LC-12 — Marketing checkbox is optional

**Steps:**
1. Complete registration with `consentMarketing=false`
2. Submit form

**Expected results:**
- Form submits successfully
- `saveConsentRecord` payload does not include `MARKETING` in `consentTypes`

---

### LC-13 — isMinor=true shows parental wording and VIDEO_RECORDING checkbox

**Personas:** parent registering a child
**Steps:**
1. Mount `ConsentCheckboxes` with `isMinor=true`
2. Assert 4 checkboxes: data processing (parental wording), terms, marketing, `consentVideoRecording`
3. Assert data processing label uses `dataProcessingLabelMinor` translation key

**Expected results:**
- 4 checkboxes rendered
- Parental wording visible
- VIDEO_RECORDING checkbox present with `aria-required="false"`

**Mock data:** minor student linked to `parent-user-1`
**Compliance:** PDPPA § 11 (minor data processing requires explicit parental consent)

---

### LC-14 — customTerms prop displays per-conservatorium addendum

**Preconditions:** Conservatorium cons-10 has `customRegistrationTerms` set in all 4 locales
**Steps:**
1. Render `ConsentCheckboxes` with `customTerms="[cons-10 addendum text]"`
2. Assert custom terms block is rendered under checkboxes

**Expected results:**
- Custom terms box visible with heading and addendum text
**DB backend:** mock
**Locales:** he, en, ar, ru

---

### LC-15 — Consent checkboxes ARIA attributes

**Steps:**
1. Render `ConsentCheckboxes`
2. Submit form without checking required fields
3. Assert `aria-invalid="true"` on failing checkboxes
4. Assert `aria-describedby` points to the corresponding error paragraph

**Expected results:**
- Screen-reader-accessible error association
**Compliance:** IS 5568, WCAG 1.3.1 (Info and Relationships)

---

### LC-16 — saveConsentRecord called on successful registration

**Personas:** new student (dev-bypass)
**Preconditions:** Registration flow completes with all mandatory consents checked
**Steps:**
1. Complete registration form through to submit
2. Assert network request to the Server Action contains `consentDataProcessing: true, consentTerms: true`
3. In dev mode: assert console does not show an error from `saveConsentRecord`

**Expected results:**
- Action returns `{ success: true, recordIds: [...] }`
- ComplianceLog entry created (check via console in dev)

**DB backend:** mock
**Security check:** Action is wrapped in `withAuth()`; unauthenticated call must return `Unauthorized`

---

### LC-17 — recordConsentAction rejects unauthenticated callers

**Steps:**
1. Call `recordConsentAction` directly without a valid auth token (simulate via direct fetch to Server Action endpoint without cookie)
2. Assert response contains `{ success: false, error: 'Unauthorized' }`

**Security check:** Validates `requireRole()` guard; no consent record should be written
**Compliance:** PDPPA audit integrity

---

### LC-18 — Parental consent recorded with isMinorConsent=true

**Personas:** parent (role=parent)
**Steps:**
1. Parent submits consent for their minor child via `saveConsentRecord` with `isMinorConsent: true, minorUserId: 'student-user-1'`
2. Assert returned `recordIds` are non-empty
3. Assert `userId` on consent records is `minorUserId`, not the parent's ID

**Expected results:**
- ConsentRecord.userId = student's ID
- ConsentRecord.givenByUserId = parent's ID
- ComplianceLog reason includes `(parental consent on behalf of minor)`

**DB backend:** mock
**Compliance:** PDPPA § 11

---

### LC-19 — DSAR section visible on /dashboard/settings for all roles

**Personas:** student, teacher, parent, conservatorium_admin, site_admin (via dev-bypass)
**Steps:**
1. Navigate to `/dashboard/settings`
2. Assert heading matching `/פרטיות ונתונים|Privacy & Data/i` is visible

**Expected results:**
- DSAR card rendered for all authenticated roles
**DB backend:** mock
**Compliance:** PDPPA § 14 (right of access) — all data subjects must be able to submit requests

---

### LC-20 — Export Data button triggers success toast

**Steps:**
1. Navigate to `/dashboard/settings`
2. Click "Export My Data" button
3. Assert toast region with matching text visible within 5 s

**Expected results:**
- Toast appears with Export title and success description
**Notes:** Current implementation is UI-only toast; future test should assert file download when backend wired

---

### LC-21 — Request Data Deletion triggers destructive toast

**Steps:**
1. Navigate to `/dashboard/settings`
2. Click "Request Data Deletion" button
3. Assert toast with `variant=destructive`

**Expected results:**
- Destructive (red) toast appears
**Compliance:** PDPPA § 14(b) erasure right — UI must make erasure request visible and distinguishable

---

### LC-22 — Withdraw Consent triggers success toast

**Steps:**
1. Navigate to `/dashboard/settings`
2. Click "Withdraw Data Processing Consent" button
3. Assert toast with withdrawal wording

**Expected results:**
- Toast with withdrawal title appears
**Notes:** Button styled with `text-destructive border-destructive` to signal irreversibility
**Compliance:** PDPPA right to revoke consent

---

### LC-23 — DSAR section accessible to student role

**Personas:** student-user-1
**Steps:**
1. Dev-bypass injects site_admin; scope test using a student mock persona override
2. Navigate to `/dashboard/settings`
3. Assert DSAR card present

**Expected results:** DSAR card visible (students are data subjects)

---

### LC-24 — DSAR section accessible to teacher role

Same as LC-23 for teacher-user-1.

---

### LC-25 — DSAR section accessible to parent role

Same as LC-23 for parent-user-1.

---

### LC-26 — Privacy page renders all required sections

**Steps:**
1. Navigate to `/privacy` (default locale he)
2. Assert `<h1>` present (PrivacyPage.title)
3. Assert `<h2>` headings present for: General, Lawful Basis, Data Collected, Use, Sharing, Transfers, Security, Rights, Retention, Sub-processors, DSAR, Cookies, Minors, Updates, Terms, Contact, Contact Directory

**Expected results:**
- All 17 sections present with non-empty text
**Locales:** he
**Compliance:** PDPPA § 13 (mandatory privacy notice contents)

---

### LC-27 — Privacy page sub-processors table is present

**Steps:**
1. Navigate to `/privacy`
2. Assert table with column headers: Processor, Service, Data Accessed, Location, DPA Status
3. Assert at least 1 data row present

**Expected results:**
- Table renders; cells non-empty
**Compliance:** PDPPA Art. 17(b) sub-processor disclosure

---

### LC-28 — Privacy page data retention schedule

**Steps:**
1. Navigate to `/privacy`
2. Assert section with `retentionScheduleTitle` heading
3. Assert at least 3 list items in retention schedule

**Expected results:**
- Retention schedule items rendered
**Compliance:** PDPPA time-limited retention

---

### LC-29 — Privacy page conservatorium contact directory

**Steps:**
1. Navigate to `/privacy`
2. Assert contact directory table with columns: Conservatorium, Contact, Role, Email, Phone, Source
3. Assert rows > 0 (mock data includes conservatoriums)

**Expected results:**
- At least 1 conservatorium row in directory
**DB backend:** mock

---

### LC-30 — Privacy page links to /dashboard/settings for DSAR

**Steps:**
1. Navigate to `/privacy`
2. Find DSAR section link to `/dashboard/settings`
3. Click the link and assert navigation succeeds

**Expected results:**
- Link navigates to `/dashboard/settings` without 404
**Implementation note:** Link uses `<Link href="/dashboard/settings">` from `@/i18n/routing` — must resolve correctly for all locales

---

### LC-31 — Privacy page renders in all 4 locales without missing keys

**Locales:** he, en, ar, ru
**Steps:**
1. Navigate to `/privacy`, `/en/privacy`, `/ar/privacy`, `/ru/privacy`
2. Assert page title `<h1>` non-empty in each locale
3. Assert sub-processors table has column headers in each locale

**Expected results:**
- No `[PrivacyPage.xxx]` placeholder keys visible in any locale
**DB backend:** mock

---

### LC-32 — Privacy page RTL layout for he and ar

**Locales:** he, ar
**Steps:**
1. Navigate to `/privacy` (he) and `/ar/privacy`
2. Assert `dir="rtl"` on outermost `<div>`
3. Assert table column headers have `text-start` alignment (logical CSS)

**Expected results:**
- Text flows right-to-left; no visual overflow

---

### LC-33 — Accessibility page renders all required sections

**Steps:**
1. Navigate to `/accessibility`
2. Assert `<h1>` (AccessibilityPage.title) present
3. Assert sections: Measures, Known Limitations, Contact, Contact Directory, Alternative Access

**Expected results:**
- 5 sections present with non-empty body text
**Compliance:** Israeli Equal Rights for Persons with Disabilities Law 5758-1998, IS 5568

---

### LC-34 — Accessibility page conservatorium contact directory

**Steps:**
1. Navigate to `/accessibility`
2. Assert contact directory table renders (same structure as privacy page)

**Expected results:**
- Table with at least 1 row
**DB backend:** mock

---

### LC-35 — Accessibility page renders in all 4 locales

Same structure as LC-31 but for `/accessibility`.

---

### LC-36 — Cancellation settings page gated to admin roles only

**Personas:** student, parent, teacher (should be blocked); conservatorium_admin, site_admin (should have access)
**Steps:**
1. Navigate to `/dashboard/settings/cancellation` as a non-admin role
2. Assert page content does not render (component returns null)

**Expected results:**
- Non-admin roles see empty/null render, not the cancellation form
**Security check:** Role guard in `CancellationSettingsPage` — `user.role !== 'conservatorium_admin' && user.role !== 'site_admin'`

---

### LC-37 — Cancellation settings page hidden without newFeaturesEnabled

**Preconditions:** `newFeaturesEnabled=false` for the user/conservatorium
**Steps:**
1. Navigate to `/dashboard/settings` as conservatorium_admin
2. Assert no "Cancellation" link in admin settings card

**Expected results:**
- Cancellation link not rendered (guarded by `{newFeaturesEnabled && ...}`)

---

### LC-38 — Cancellation policy form saves changes

**Personas:** conservatorium_admin
**Steps:**
1. Navigate to `/dashboard/settings/cancellation`
2. Change `studentNoticeHoursRequired` to 48
3. Change `studentCancellationCredit` to NONE
4. Click Save Changes button
5. Assert success toast (`CancellationPolicySettings.successToast`)

**Expected results:**
- Toast appears
- Save button re-disabled (form no longer dirty)
**DB backend:** mock

---

### LC-39 — Cancellation notice-hours field rejects negative values

**Steps:**
1. Set `studentNoticeHoursRequired` to `-1`
2. Submit form

**Expected results:**
- Zod validation error shown under field (positive number required)
- Form does not save

---

### LC-40 — cancelPackageAction marks package inactive

**Personas:** parent or student with active package
**Steps:**
1. Call `cancelPackageAction({ packageId: 'pkg-1' })` via Server Action
2. Assert package `isActive` set to `false` in mock DB

**Expected results:**
- Action returns `{ success: true, withinCoolingOff: true, refundEligible: true }`
**DB backend:** mock

---

### LC-41 — cancelPackageAction returns withinCoolingOff=true

**Preconditions:** Package created within past 14 days (mock data sets `purchasedAt` to recent date)
**Steps:**
1. Call `cancelPackageAction` with a recently-purchased package
2. Assert `withinCoolingOff: true` and `refundEligible: true` in response

**Expected results:**
- 14-day cooling-off window correctly identified
**Compliance:** Israeli Consumer Protection Law 5741-1981, Art. 14c (cooling-off period)

---

### LC-42 — Rental sign page: expired/invalid token shows error card

**Steps:**
1. Navigate to `/rental-sign/invalid-token-xyz`
2. Assert card with `tokenExpiredTitle` heading is rendered
3. Assert `tokenExpiredHelp` description text is present

**Expected results:**
- No signing flow rendered; user directed to contact conservatorium
**DB backend:** mock
**Locales:** he, en

---

### LC-43 — Rental sign OTP step: send and verify

**Personas:** parent (via rental token, no auth required)
**Preconditions:** Rental fixture exists with `status: 'pending_signature'` and valid token
**Steps:**
1. Navigate to `/rental-sign/[valid-token]`
2. Click "Send OTP" button
3. Assert OTP sent state (resend button appears or OTP input enabled)
4. Enter valid OTP code
5. Click Verify OTP
6. Assert step advances to step 2 (terms display)

**Expected results:**
- Step indicator badge 1 replaced by badge 2 becoming active
**DB backend:** mock
**Security check:** OTP must be single-use; second use of same code triggers `OTP_EXPIRED`

---

### LC-44 — Rental sign step 2: terms display

**Preconditions:** OTP verified (step = 2)
**Steps:**
1. Assert instrument type, student name, rental model, financial terms are displayed
2. Assert deposit/monthly/purchase fields shown only when non-null
3. Click Continue to Signature

**Expected results:**
- Step 3 becomes active
- All rental details accurate per mock fixture

---

### LC-45 — Rental sign step 3: draw signature and submit

**Preconditions:** Step = 3
**Steps:**
1. Draw on signature canvas using `page.mouse.move` / `mouse.down` / `mouse.up`
2. Assert Submit button is enabled
3. Click Submit Signature
4. Assert step advances to step 4

**Expected results:**
- Completion screen shown with `signatureCompleteTitle`
**DB backend:** mock
**Compliance:** Electronic Signature Law 5761-2001 (Israel)

---

### LC-46 — Rental sign step 3: confirmOnly checkbox bypasses canvas

**Steps:**
1. On step 3, do NOT draw anything on canvas
2. Check "I confirm and agree" checkbox (`confirmOnly`)
3. Click Submit Signature

**Expected results:**
- No `signatureRequired` error
- Step advances to step 4
- `signatureUrl` uses `manual-confirm://` scheme (internally recorded)

---

### LC-47 — Rental sign step 4: completion screen

**Steps:**
1. Complete steps 1–3
2. Assert step 4 renders heading `signatureCompleteTitle` and description `signatureCompleteDesc`
3. Assert no back navigation or re-submission available

**Expected results:**
- Completion is final; contract considered signed

---

### LC-48 — Rental sign invalid OTP shows error

**Steps:**
1. Navigate to rental sign page
2. Click Send OTP
3. Enter code `000000` (invalid)
4. Click Verify OTP
5. Assert error text matching `otpInvalid` translation key

**Expected results:**
- Error shown; step stays at 1

---

### LC-49 — Rental sign expired OTP shows error

**Steps:**
1. Send OTP but wait for expiry (or simulate expired state via mock)
2. Enter the expired code
3. Click Verify OTP
4. Assert error text matching `otpExpired` translation key

**Expected results:**
- Expired error distinct from invalid error

---

### LC-50 — SignatureCapture confirm disabled when canvas empty

**Steps:**
1. Render `SignatureCapture` without drawing
2. Assert Confirm button is `disabled`

**Expected results:**
- Button disabled; clicking does not fire `onConfirm`
**Implementation:** `isEmpty` state starts `true`; set `false` only in `handleEnd`

---

### LC-51 — SignatureCapture clear button resets canvas

**Steps:**
1. Draw on canvas
2. Assert Clear button is enabled
3. Click Clear
4. Assert canvas is empty; Confirm button re-disabled

**Expected results:**
- `handleClear` calls `canvasRef.current.clear()` and sets `isEmpty=true`

---

### LC-52 — SignatureCapture produces SHA-256 hash in onConfirm result

**Steps:**
1. Draw signature
2. Click Confirm
3. Capture `onConfirm` callback argument
4. Assert result has `dataUrl` (string starting with `data:image/png;base64,`) and `signatureHash` (64-char hex string)

**Expected results:**
- Hash is deterministic SHA-256 of the dataUrl
**Compliance:** Audit trail integrity (PDPPA § 17, electronic records)

---

### LC-53 — SignatureCapture ARIA

**Steps:**
1. Render `SignatureCapture`
2. Assert canvas has `role="img"` and `aria-label` matching `Signature.canvasAriaLabel`
3. Assert Clear button has `aria-label` matching `Signature.clear`

**Expected results:**
- Screen readers can identify canvas and clear action
**Compliance:** IS 5568, WCAG 1.1.1

---

### LC-54 — SignatureCapture RTL: clear button in logical start corner

**Locales:** he, ar
**Steps:**
1. Render `SignatureCapture` in RTL locale
2. Inspect clear button position class: must be `start-2` (logical), not `left-2`

**Expected results:**
- Clear button appears in top-right corner in RTL; top-left in LTR

---

### LC-55 — Enrollment wizard step 5 shows RegistrationAgreement accordion

**Personas:** parent registering child via playing-school token
**Steps:**
1. Navigate to `/playing-school/enroll/[ps-token-test]`
2. Complete steps 1–4 (program info, student details, parent details, consent)
3. Assert step 5 renders accordion with at least 9 items (sections 1–9)

**Expected results:**
- `RegistrationAgreement` accordion visible; all sections have titles
**DB backend:** mock

---

### LC-56 — Enrollment wizard step 5 next button disabled until signature given

**Preconditions:** Step 5 loaded; `contractSigned=false`
**Steps:**
1. Assert Next button is `disabled`
2. Draw signature and click Confirm in SignatureCapture
3. Assert green "signed" confirmation text appears
4. Assert Next button becomes enabled

**Expected results:**
- `contractSigned` state blocks navigation until signature captured
**Compliance:** Registration contract must be electronically signed before enrollment completes

---

### LC-57 — Enrollment wizard step 5 SignatureCapture triggers contractSigned

**Steps:**
1. Draw on SignatureCapture canvas in step 5
2. Click Confirm
3. Assert `ShieldCheck` icon and confirmation text rendered
4. Assert `SignatureCapture` component no longer rendered (replaced by confirmation)

**Expected results:**
- `setContractSigned(true)` called via `onConfirm` callback

---

### LC-58 — RegistrationAgreement shows customAddendum when provided

**Steps:**
1. Render `RegistrationAgreement` with `customAddendum="Custom pricing addendum for cons-10"`
2. Expand section 10 in accordion
3. Assert addendum text displayed instead of default

**Expected results:**
- Section 10 body = customAddendum text
**DB backend:** mock (cons-10 has `customRegistrationTerms`)

---

### LC-59 — RegistrationAgreement section 10 shows default text without addendum

**Steps:**
1. Render `RegistrationAgreement` with `customAddendum=undefined` in `mode='enrollment'`
2. Expand section 10
3. Assert default `contract.s10BodyDefault` translation shown

**Expected results:**
- Default text present; no empty section

---

### LC-60 — RegistrationAgreement admin-preview mode hides section 10

**Steps:**
1. Render `RegistrationAgreement` with `mode='admin-preview'`
2. Assert accordion does NOT contain section 10

**Expected results:**
- Only sections 1–9 rendered in admin-preview mode

---

## Cross-Cutting Checks

### Security

| Check | Verification |
|---|---|
| `recordConsentAction` auth guard | `requireRole()` must reject unauthenticated callers (LC-17) |
| `saveConsentRecord` uses `withAuth()` | Action fails without valid session cookie |
| `cancelPackageAction` uses `withAuth()` | Cannot cancel another user's package |
| Rental OTP single-use | Second use of same OTP returns `OTP_EXPIRED` |
| DSAR buttons do not leak other users' data | All three actions operate on the calling user's own data only |
| ConsentRecord immutability | Firestore rules: `allow update, delete: if false` — update/delete calls must be rejected in production |

### i18n Coverage

| Page/Component | Locales to verify |
|---|---|
| Cookie banner | he, en |
| Consent checkboxes | he, en (RTL/LTR) |
| Privacy page | he, en, ar, ru |
| Accessibility page | he, en |
| DSAR section | he, en |
| Rental signing | he, en |
| Enrollment wizard step 5 | he, en |

### Accessibility (IS 5568 / WCAG 2.1 AA)

| Element | Required attribute |
|---|---|
| Cookie banner | `role="dialog"`, `aria-labelledby`, `aria-describedby` |
| Consent checkboxes | `aria-required`, `aria-invalid`, `aria-describedby` (on error) |
| Signature canvas | `role="img"`, `aria-label` |
| Error messages | `role="alert"` |
| Privacy/Accessibility tables | `<th scope>` for screen-reader column association |

---

## Test File Recommendations

| File | New scenarios to add |
|---|---|
| `e2e/flows/consent-banner.spec.ts` | LC-06, LC-08, LC-09 |
| `e2e/flows/dsar.spec.ts` | LC-23, LC-24, LC-25 (role variants) |
| `e2e/flows/privacy-page.spec.ts` | LC-26 through LC-32 (new file) |
| `e2e/flows/accessibility-page.spec.ts` | LC-33 through LC-35 (new file) |
| `e2e/flows/rental-signing.spec.ts` | LC-42 through LC-49 (new file) |
| `e2e/flows/enrollment-contract.spec.ts` | LC-55 through LC-57 (new file) |
| `tests/components/signature-capture.test.ts` | LC-50 through LC-54 (Vitest/Testing Library) |
| `tests/components/consent-checkboxes.test.ts` | LC-10 through LC-15 (Vitest/Testing Library) |
| `tests/components/registration-agreement.test.ts` | LC-58 through LC-60 (Vitest/Testing Library) |
| `tests/actions/consent.test.ts` | LC-16 through LC-18 (Vitest, pure logic) |
| `tests/actions/billing.test.ts` | LC-40, LC-41 (Vitest, pure logic) |

---

## Compliance Reference Matrix

| Scenario(s) | Legal Basis |
|---|---|
| LC-01 to LC-09 | PDPPA first-visit consent gate; GDPR-equivalent transparency |
| LC-10 to LC-18 | PDPPA § 11 (minors), § 13 (mandatory consent at registration) |
| LC-19 to LC-25 | PDPPA § 14 (right of access, erasure, withdrawal) |
| LC-26 to LC-32 | PDPPA § 13 (privacy notice), Art. 17(b) sub-processor disclosure |
| LC-33 to LC-35 | Equal Rights for Persons with Disabilities Law; IS 5568 |
| LC-40 to LC-41 | Israeli Consumer Protection Law 5741-1981 Art. 14c (14-day cooling-off) |
| LC-42 to LC-49 | Electronic Signature Law 5761-2001; rental contract validity |
| LC-55 to LC-59 | Electronic contract signing; PDPPA consent version tracking (TERMS_VERSION) |
