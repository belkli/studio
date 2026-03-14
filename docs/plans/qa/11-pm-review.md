# PM Review: QA Plan Evaluation
**Role:** Product Manager
**Date:** 2026-03-14
**Reviewer:** PM Agent
**Document reviewed:** Master QA Plan v1.1 + Domain Plans 01–08
**Persona docs consulted:** SDD-P1 (Admin), SDD-P2 (Teacher), SDD-P3 (Student), SDD-P4 (Parent), SDD-P5 (Ministry/Board)

---

## 0. Overall Assessment

The QA architect has produced a solid, wide-coverage plan. The scenario writing discipline is high: preconditions are explicit, expected results are specific, locale and DB backend tagging is consistent. The plans correctly map to the implemented prototype rather than aspirational SDD features that are not yet built — this is good discipline.

However, from a PM perspective reviewing all five persona SDDs in parallel, several patterns emerge:

1. **Happy-path coverage is strong; recovery and error path coverage is thin** across most domains.
2. **Cross-persona side-effects** (what each other persona sees after one persona acts) are covered by INT scenarios but several critical ones are missing.
3. **Empty state and first-time user experience** is almost entirely untested — a new student, parent, or teacher who has never used Harmonia will see empty states on most pages and there are no tests for those paths.
4. **Business rule precision** — cooling-off period, VAT rate, makeup credit expiry — needs sharper assertion language. Several scenarios say "expected" without verifying the exact numeric calculation.
5. **Three domains have structural gaps** that would block acceptance: (a) billing domain acknowledges key stubs but doesn't flag them as blockers; (b) substitute assignment has no teacher-receives-notification test; (c) legal compliance domain omits PDPPA required-disclosure tests.

**Recommendation: CONDITIONAL APPROVAL** — the plan can proceed to execution with the mandatory additions listed in each domain section below. The 62 new scenarios proposed in this review should be added before the plan is considered complete. The 14 pre-execution fixes should be resolved or formally deferred before any QA gate is declared passed.

---

## 1. Domain: Auth & Registration (A-)

### 1.1 Missing User Journeys

**A. First-time student onboarding after enrollment approval**
No scenario covers what a student sees the *very first time* they log in after their registration is approved. SDD-P3 documents a `hasSeenWalkthrough` flag and a `markWalkthroughAsSeen` function — there is no test for the onboarding walkthrough appearance or the "Getting Started" empty-state dashboard.

**B. Registration with a pre-existing email**
The plan tests invalid passwords and empty fields but has no scenario for a user attempting to register with an email that is already in the system. This is one of the most common real-world support tickets for any auth system.

**C. Playing school enrollment — step 5 (contract signing)**
The playing school wizard has a contract signing step (SignatureCapture). The legal domain plan touches the signature component in rental signing, but the playing school wizard contract step is not covered in auth/registration or legal domains as an end-to-end flow.

**D. Invite link expiry**
The plan tests invite acceptance happy path (A-37 range) but does not test what happens when an invite link has expired (48-hour window per SDD-02). The expected result should be a clear "This invitation has expired" screen, not a generic 404 or crash.

**E. Parent registers child (under-13 flow)**
SDD-P3 documents a `STUDENT_UNDER_13` role with distinct behavior. No test verifies that registering a child with date-of-birth under 13 results in the correct role assignment and parental consent flow activation.

### 1.2 UX Quality Checks

- **Loading states:** The plan checks for skeletons on some pages but does not verify loading state during the email/password verification step itself. On slow connections, the login button submit spinner is the only feedback.
- **Error messages in all 4 locales:** A-05 (invalid credentials) tests only `he`. The error message "Invalid email or password" is particularly important to test in `ar` (RTL, right-to-left error layout).
- **Back navigation after failed login:** No test verifies that after a failed login attempt, the user can retry without the form being cleared or the page crashing.
- **Session expiry:** No scenario for what happens when a Firebase session token expires mid-session. Expected: graceful redirect to login with "Your session has expired" message, not a white screen.

### 1.3 Business Logic Validation

- **Dev bypass scope:** The plan correctly documents dev bypass behavior. Missing: a test that verifies the bypass does NOT activate in a production-like environment (FIREBASE_SERVICE_ACCOUNT_KEY present). This is a security regression risk.
- **Rate limiting:** A-17 (brute force) mentions rate limiting but the expected result is vague. Specify: after 5 failed attempts within 60 seconds, the IP should receive a 429 with a retry-after header, and the UI should show a countdown.

### 1.4 Cross-Persona Consistency

- After A-30 (admin approves registration), the **student** should immediately be able to log in. There is no linked scenario verifying the student-side experience after admin approval.
- After A-34 (teacher invite accepted), the **admin** should see the teacher move from "Pending" to "Active" in the users list. No cross-check scenario.

### 1.5 Missing Scenarios to Add

| ID | Name | Expected Result |
|----|------|-----------------|
| A-56 | Register with already-registered email | Error toast: "An account with this email already exists. Try logging in instead." Link to login page. |
| A-57 | Student first login after approval — walkthrough shown | `hasSeenWalkthrough === false` → walkthrough overlay renders; after dismissal, `markWalkthroughAsSeen()` called |
| A-58 | Under-13 registration flow — role assignment | Child DOB < 13 years ago → role = `STUDENT_UNDER_13`; parental consent step shown; parent email required |
| A-59 | Expired invite link | Page renders "Invitation Expired" card; no registration form shown; link to contact conservatorium |
| A-60 | Session expiry mid-navigation | After token expiry, next API call redirects to `/login?reason=session_expired`; session-expired message shown |

### 1.6 Domain Verdict

**Changes requested** on A-05, A-17 (sharpen expected results), A-30/A-34 (add cross-persona checks). Add A-56 through A-60. Otherwise approve.

---

## 2. Domain: Dashboard & Navigation (DN-)

### 2.1 Missing User Journeys

**A. First-time empty state for every persona**
Every major dashboard widget has an empty state. A student with no lessons, no practice logs, no repertoire, and no messages sees a completely empty dashboard. The plan tests navigation structure but never verifies what the dashboard looks like with zero data. This is the exact state a new student is in after enrollment approval.

**B. Notification badge clears after reading**
DN-48 through DN-52 test the notifications page, but there is no test that the notification bell badge (unread count) updates in real time after notifications are read. A parent who receives a "lesson cancelled" notification and reads it should see the badge disappear.

**C. What's New — first-time vs returning user**
DN-46 tests the feed but doesn't test the "new badge" logic: a user who has seen all items should not see the badge; a user who hasn't seen the latest item should. The badge state is critical UX.

**D. Settings page — saved vs unsaved changes warning**
If a user edits notification preferences (DN-63) and navigates away without saving, is there a confirmation dialog? No test covers this. For a product managing financial and legal settings, unsaved-change protection is important.

**E. Mobile hamburger — closing by clicking outside**
DN-36 tests opening the hamburger menu. DN-37 tests closing it. No test verifies closing by clicking outside the menu overlay (a common mobile pattern that is easy to break).

### 2.2 UX Quality Checks

- **Role-gated sidebar items:** DN-22 (delegated_admin scoping) tests the sidebar correctly, but the plan does not verify that a `parent` who manually navigates to `/dashboard/users` sees a proper "no access" page rather than a crash or empty component.
- **Deep-link with locale prefix:** DN-38 tests deep links but the scenario uses the default `he` locale. Test with `/en/dashboard/schedule` (non-default locale) to catch `next-intl` routing regressions.
- **Logout redirect:** The plan tests logout (DN-31) but doesn't verify the redirect destination is `/` (home), not `/login` — this was an explicit UX fix per memory.

### 2.3 Business Logic Validation

- **conservatorum_admin sees only own conservatorium data:** DN-05 through DN-10 test role-based routing but only DN-02 has a cross-conservatorium isolation assertion. The plan should explicitly verify that `admin-user-1` (cons-15) does NOT see students or teachers from cons-66 in the users list.
- **site_admin sees all conservatoriums:** Counterpart test — site_admin should see data from ALL conservatoriums in a unified view.

### 2.4 Missing Scenarios to Add

| ID | Name | Expected Result |
|----|------|-----------------|
| DN-81 | Student dashboard — all-empty state | New student with no lessons/logs/repertoire/messages: each widget shows its empty-state illustration and CTA, no null errors |
| DN-82 | Parent dashboard — all-empty state | New parent with no children enrolled: family hub shows "Add your child" CTA |
| DN-83 | Notification bell badge clears after mark-all-read | Bell badge disappears after DN-52 (mark all read) action; count shows 0 |
| DN-84 | Logout redirects to `/` home, not `/login` | After logout, URL is `/` (or locale root), not `/login` |
| DN-85 | Parent navigates to `/dashboard/users` (admin-only page) | "No permission" message rendered; no crash; no user list shown |
| DN-86 | Mobile hamburger closes on outside-overlay click | Clicking the backdrop overlay closes the menu |

### 2.5 Domain Verdict

**Changes requested:** Add DN-81 through DN-86. Sharpen DN-05 to include explicit cross-conservatorium isolation assertion. Approve otherwise.

---

## 3. Domain: Scheduling & Booking (SB-)

### 3.1 Missing User Journeys

**A. Teacher cancels a lesson (sick leave / emergency)**
SDD-P2 identifies the sick leave flow as P0 — "the highest-urgency mobile UX pattern in the entire teacher experience." There is no scenario for a teacher cancelling a lesson from their schedule. The plan tests admin substitute assignment (SB-40 to SB-44) but not the teacher's own cancellation path. What does the teacher see? How do they cancel? What confirmation is shown?

**B. Student reschedules within the cancellation notice window (late reschedule)**
SB-16 tests successful booking but there is no test for the error case where a student attempts to reschedule a lesson that starts in 1 hour (within the `studentNoticeHoursRequired` window). Per SDD-P3 Gap 2, this should be a LATE_CANCEL response with a clear error message, not a silent success.

**C. Makeup credit issued and consumed end-to-end**
SB-31 through SB-35 test the makeup credits display. SB-34 tests the "Book Makeup" button link. But there is no scenario that follows the full lifecycle: teacher cancels lesson → makeup credit issued → student books makeup using that credit → credit balance decreases. This is a core business flow.

**D. Available-Now slot booking by a completely new user (full account creation)**
SB-63 tests the pipeline up to registration page, but assumes the user clicks "already have account." A new user who goes through the full registration wizard and then arrives at the deals tab is not tested.

**E. Deal slot expired between display and booking**
A deal slot shown in the marketplace may be claimed by another user while the first user is deciding. The booking dialog should handle the "slot already taken" case gracefully. No test covers this race condition.

### 3.2 UX Quality Checks

- **SB-22 (book via promotional price):** The toast says "Deal Booked!" but the test does not verify the calendar also shows the new lesson immediately after redirect. It just says "New lesson visible in schedule." Sharpen: verify the specific time slot appears on the correct date in the calendar.
- **SB-42 (substitute assignment):** After assigning a substitute, does `teacher-user-2` receive a notification? The test only checks the lesson update, not the notification side-effect. Cross-persona: the student should also be notified that their teacher changed.
- **SB-18 (urgency banner color):** The expected result says `bg-blue-600` for tomorrow/later slots but the CLAUDE.md project notes say `bg-indigo-500` for tomorrow/upcoming. This discrepancy must be resolved — one of these values is wrong.

### 3.3 Business Logic Validation

- **Discount matrix precision (SB-65):** The expected results specify exact percentages (20%, 40%, 15%). Verify these against the actual discount calculation constants in the codebase, not just the SDD. If the code uses different values, the test will fail spuriously.
- **Makeup credit expiry:** SB-31 verifies that EXPIRED credits are not counted in the balance. No test verifies what happens on the day a credit expires — does it automatically flip to EXPIRED, or does it require a background job? This affects whether the count is accurate at midnight.
- **Package credit deduction:** SB-23 (book via package credit) checks the toast but does not verify the package's `usedCredits` counter incremented and `remainingCredits` decremented. Add assertion on billing page credit count post-booking.

### 3.4 Cross-Persona Consistency

| Action | Actor | Missing Check |
|--------|-------|---------------|
| Substitute assigned (SB-42) | Admin | Teacher-user-2 should see new lesson in their schedule; student should receive notification |
| Lesson booked (SB-16) | Student | Teacher should see new lesson block in their availability grid |
| Makeup credit created | System | Student AND parent should both see the new credit balance |

### 3.5 Missing Scenarios to Add

| ID | Name | Expected Result |
|----|------|-----------------|
| SB-66 | Teacher cancels lesson from schedule | Lesson status → CANCELLED_TEACHER; student/parent receive notification toast; makeup credit issued |
| SB-67 | Student attempts late reschedule (within notice window) | Error message: "Cannot reschedule within X hours of lesson start"; reschedule blocked |
| SB-68 | Makeup credit lifecycle E2E | Teacher cancels → credit appears in student balance → student books makeup → credit balance decreases by 1 |
| SB-69 | Deal slot already taken (race condition) | Booking dialog shows "This slot was just taken by another student. Please choose another slot." |
| SB-70 | New user completes full registration then arrives at deals tab | After full enrollment + login, deals tab shows with pending_slot auto-opened |
| SB-71 | Substitute assigned — cross-persona notifications | After SB-42, teacher-user-2 sees lesson in their schedule; student receives in-app notification |

### 3.6 Domain Verdict

**Changes requested:** Resolve SB-18 banner color discrepancy (bg-blue-600 vs bg-indigo-500). Add SB-66 through SB-71. Sharpen SB-22 and SB-23 to include credit balance assertions. Approve otherwise.

---

## 4. Domain: Billing & Financial (BF-)

### 4.1 Missing User Journeys

**A. Parent receives payment failure notification and retries**
BF-09 tests the "Pay Now" flow but there is no scenario for what a parent sees when a payment attempt fails. In the real Cardcom flow, a declined card must show a human-readable error ("Your card was declined. Please try another card or contact your bank.") — not a raw error code.

**B. Sibling discount application**
SDD-P4 documents sibling discounts as automatically applied at invoice time based on `childIds`. There is no test that verifies: parent has two children enrolled → both appear on the family billing view → sibling discount applied to the second child → invoice total is correct.

**C. Package expires — what does the student see?**
BF-39 tests the expiry warning, but there is no test for after expiry. When a package's `validUntil` passes midnight, the student should see a "Your package has expired. Renew to book lessons." banner, and the Book Lesson button should be disabled.

**D. Invoice download by admin for a student**
BF-05 tests student downloading their own invoice. No test for an admin downloading an invoice on behalf of a student (e.g., for a parent who cannot find the PDF).

**E. Teacher views their own payroll — zero lessons scenario**
BF-12 tests payroll with completed lessons. No test for a teacher who has no completed lessons in the selected period. The payroll page should show "No lessons in this period" rather than a broken table or NaN values.

### 4.2 UX Quality Checks

- **BF-06/BF-07 (cooling-off):** The plan acknowledges that `cancelPackageAction` currently always returns `withinCoolingOff: true`. This is flagged as a "Known Gap" but is listed as passing scenarios, which is misleading. These scenarios should be marked `[BLOCKED — stub not production-ready]` so the QA gate reflects reality.
- **BF-18 (delete package — no confirmation dialog):** The test notes this as a UX concern but accepts it. **From a PM perspective this is a regression risk** — admins can accidentally delete a package that has active students enrolled. Before shipping, delete must require a confirmation dialog that checks for active student assignments.
- **BF-15 (create package — per-lesson hint):** The hint shows ₪150/lesson (600÷4) but the calculation uses `price / lessonCount`. If `lessonCount` is 0 (before user fills it in), this would divide by zero. Add a test for the empty-state of this hint.

### 4.3 Business Logic Validation

- **VAT rate:** BF-04 asserts 18% VAT (450 × 1.18 = 531). The stubs section confirms `VAT_RATE = 0.18`. The MEMORY.md notes `addVAT()` uses this rate. **Verify the rate is correct under Israeli law for 2025/2026.** As of 2024 the rate was 17%; it was raised to 18% — confirm the 2025 effective date and that the test constant matches the legal effective date.
- **14-day cooling-off precision:** BF-06 says "within last 14 days" but does not specify: is it 14 calendar days or 14 business days? Israeli Consumer Protection Law 5741-1981 specifies calendar days. The test should assert that a package purchased exactly 14 days ago (at 23:59) still triggers the cooling-off refund.
- **Installment payment (תשלומים) — not tested at all:** The SDD and the billing stub reference installments, but no BF scenario tests installment selection (1, 3, 6, 10, 12 payments), installment fee calculation, or the Cardcom webhook behavior for `NumOfPayments > 1`. BF-31 only tests `NumOfPayments=1`. This is a critical gap for the Israeli market.
- **CardCom webhook — idempotency:** If the webhook is called twice for the same `InternalDealNumber` (e.g., Cardcom retries on timeout), the second call should NOT create a duplicate payment. No idempotency test exists.

### 4.4 Cross-Persona Consistency

| Action | Actor | Missing Check |
|--------|-------|---------------|
| Package approved by admin | Admin | Student sees updated package status immediately; billing page refreshes |
| Invoice marked PAID via webhook (BF-31) | System | Parent/student should see invoice status change to PAID in their billing view without page reload |
| Scholarship approved (BF-24) | Admin | Student/parent should receive notification of approval |

### 4.5 Missing Scenarios to Add

| ID | Name | Expected Result |
|----|------|-----------------|
| BF-41 | Payment failure — user-visible error | Payment declined → error message in user's language; "Try another card" link shown |
| BF-42 | Sibling discount — two children, discount applied | Second child invoice shows discounted amount; discount line item visible |
| BF-43 | Package expired — post-expiry state | Package `validUntil` = yesterday → student billing shows "Expired" badge; book lesson disabled |
| BF-44 | Teacher payroll — zero lessons in period | Payroll page for teacher with no March 2026 lessons shows "No lessons recorded for this period" |
| BF-45 | Delete package with active students — confirmation required | Trash icon click shows AlertDialog: "X students are currently on this package. Are you sure?" |
| BF-46 | Webhook idempotency — duplicate call | Second webhook POST for same InternalDealNumber returns 200 but does NOT create duplicate PAID record |
| BF-47 | Installment payment — NumOfPayments=6 in webhook | Webhook with NumOfPayments=6 stores installment plan on invoice; billing page shows "6 installments" |

### 4.6 Domain Verdict

**Changes requested (blocking):** Mark BF-06/BF-07 as BLOCKED-STUB in test. BF-18 must require confirmation dialog before package delete ships. Add BF-41 through BF-47. Clarify 14-day cooling-off calculation to be explicit about calendar days. Approve otherwise.

---

## 5. Domain: Repertoire & Music (RM-)

### 5.1 Missing User Journeys

**A. Student sees teacher's lesson note after lesson**
The SDD documents a `teacherNote` / `LessonNote` per lesson visible to students. No RM scenario tests this. After a lesson is marked complete, the student navigating to their repertoire or practice page should see the teacher's note for that session.

**B. Teacher marks a piece as "Performance Ready"**
The `AssignedRepertoire` type has a `status` field. The repertoire plans cover the assignment but not the status lifecycle: `LEARNING → POLISHING → PERFORMANCE_READY`. No test verifies a teacher can update the status and the student sees the updated badge.

**C. Parent views child's repertoire progress**
SDD-P4 describes a parent-facing Family Hub with student progress visibility. No RM scenario tests a parent accessing their child's practice log or repertoire list. Does the parent see the same view as the student? Do they see the teacher's notes?

**D. Practice log — student submits on a past date**
RM-29 tests submitting for today. Students often log practice retroactively. What is the date validation rule? Can a student log practice for yesterday? Last week? Last year? The form default is today, but the business rule for maximum lookback period is not specified or tested.

**E. Exam tracker — ministry approves exam registration**
RM-40 through RM-46 cover the exam tracker CRUD from the teacher's side. No scenario covers the downstream: after the tracker reaches `READY_TO_SIT`, does the teacher submit the form to the Ministry? How does that connect to the forms domain (LC domain)?

### 5.2 UX Quality Checks

- **RM-21 (delete composition — no confirmation):** Like BF-18, direct delete without confirmation is flagged but accepted. A ministry director deleting a composition that is assigned to 200 students across 85 conservatoriums would cause silent data loss. **Mandatory: add a confirmation dialog for composition delete.** This is not a UX nicety; it is a data integrity requirement.
- **RM-24 (auto-translate success):** The test verifies the fields are populated but doesn't verify the *quality gate* — if Gemini returns an empty string for a locale, should the field be left blank or should the original Hebrew be copied in? Specify the fallback rule.
- **RM-35 (AI coach stub):** The test notes this is a "fully stubbed simulation." Acceptable for now, but the test must be tagged `[STUB — NOT PRODUCTION BEHAVIOR]` so it is not confused with a real AI quality check.

### 5.3 Business Logic Validation

- **Exam readiness calculation (RM-43):** The test says 40% → 75% when one more requirement becomes READY. Verify: is it `(READY_count + EXAM_PASSED_count) / total_requirements × 100`? The calculation must also handle the case where `total_requirements = 0` without dividing by zero.
- **Practice log streak calculation:** RM-29 calls `addPracticeLog` but does not verify the streak counter. If a student logs practice 7 days in a row, they should earn the `PRACTICE_STREAK_7` achievement. No test covers the achievement award trigger.
- **Composition search — case and diacritic sensitivity:** RM-13 tests Hebrew search. In Hebrew, search for "ב" should match words with "בּ" (dagesh), "בְ" (shva), etc. Is the search diacritic-insensitive? This is a real usability issue for the Hebrew-speaking audience.

### 5.4 Missing Scenarios to Add

| ID | Name | Expected Result |
|----|------|-----------------|
| RM-52 | Teacher updates assigned piece status to PERFORMANCE_READY | Student sees badge update from LEARNING to PERFORMANCE_READY; parent sees same |
| RM-53 | Parent views child's practice log | Parent navigates to child practice log; sees log entries; sees teacher notes; cannot submit logs from this view (read-only) |
| RM-54 | Practice streak — 7-day achievement trigger | Student submits practice logs 7 days in a row; `PRACTICE_STREAK_7` achievement awarded; toast notification |
| RM-55 | Delete composition — confirmation required | Trash icon click shows "This composition is assigned to X students. Confirm deletion?" dialog |
| RM-56 | Practice log — retroactive date (within policy) | Student submits for yesterday; log accepted; for date > 30 days ago, system shows validation error |
| RM-57 | Composition search — Hebrew diacritic insensitivity | Searching "ב" matches compositions with "בּ" in title |

### 5.5 Domain Verdict

**Changes requested (blocking):** RM-21 must require confirmation dialog before ship. Add RM-52 through RM-57. Tag RM-35 as STUB. Approve otherwise.

---

## 6. Domain: Public Pages (PP-)

### 6.1 Missing User Journeys

**A. Conservatorium profile — no upcoming events**
PP coverage includes conservatorium profile pages but no scenario for a conservatorium that has no upcoming events. The "Upcoming Events" section should show an empty state, not a crash or missing section.

**B. Open Day registration — confirmation email**
The open day page allows registration. No test verifies whether a confirmation email or WhatsApp is sent after registration. Per SDD-P4, parents expect WhatsApp confirmation for any registration action.

**C. SEO — Hebrew page with English crawlers**
PP-11 (SEO meta tags) tests the `<title>` and `<meta description>`. No test verifies `hreflang` tags for all 4 locales, which are required for proper multi-language SEO indexing. Missing hreflang is a significant SEO defect for an Israeli audience served in 4 languages.

**D. Cookie banner — GDPR re-consent on policy change**
The cookie banner tests (LC-01 through LC-09, also referenced in PP) test first-visit and persistence. No test covers the case where the privacy policy changes: users who previously accepted must be shown the banner again and asked to re-consent. There is no `consent_version` mechanism tested.

**E. Public directory — teacher with no profile photo**
The about/conservatorium directory shows teacher cards. No test for teachers where `photoUrl` is null/undefined. The avatar fallback (initials) should render gracefully.

### 6.2 UX Quality Checks

- **Landing page loading performance:** No test verifies the largest contentful paint (LCP) or Time to Interactive (TTI) for the landing page. With 85 conservatoriums, 348+ teachers, and events data loaded on the public landing page, performance tests should be added.
- **Contact form — success message vs email delivery:** The contact page form shows a success toast but there is no verification that the form data is actually transmitted anywhere. If the backend handler is missing, the toast still fires. Add a test that verifies the API call is made.

### 6.3 Business Logic Validation

- **Stats bar numbers:** The landing page stats bar shows "1,200+ students", "350+ teachers", "85+ conservatoriums" (or similar). Are these hardcoded or dynamic? If dynamic, no test verifies they update when data changes. If hardcoded, they should be audited against real data before launch.

### 6.4 Missing Scenarios to Add

| ID | Name | Expected Result |
|----|------|-----------------|
| PP-56 | Conservatorium profile — no upcoming events | Events section shows "No upcoming events" placeholder, not a crash |
| PP-57 | Teacher card — no profile photo | Initials avatar fallback rendered; no broken image |
| PP-58 | hreflang tags in landing page `<head>` | `<link rel="alternate" hreflang="he" href="...">` present for all 4 locales |
| PP-59 | Contact form — API call verification | Submit contact form; verify POST to `/api/contact` (or equivalent) is made; not just toast |

### 6.5 Domain Verdict

**Changes requested:** Add PP-56 through PP-59. The hreflang test (PP-58) is a blocking SEO requirement before launch. Approve otherwise.

---

## 7. Domain: Admin Features (ADM-)

### 7.1 Missing User Journeys

**A. Admin marks a lesson as completed (attendance marking)**
SDD-P2 identifies attendance marking as P0 ("one-tap: Present/Absent/No-Show"). The admin plan covers approvals, form management, and user management but has no scenario for attendance marking from the admin's perspective. If a teacher fails to mark a lesson, the admin needs to be able to mark it on the teacher's behalf.

**B. Admin creates a new event — and all personas see it**
ADM- covers event CRUD. But there is no cross-persona test: after an admin creates an event, the landing page should show it, enrolled students should receive notifications, and the ministry director should see it in their dashboard. Only the creation action is tested, not the ripple effects.

**C. Admin sends a broadcast announcement — and verifies delivery**
ADM- covers the announcements page. No test for verifying that a sent announcement actually appears in the notification feeds of target personas (students, parents, teachers).

**D. Playing School — student completes enrollment wizard**
The playing school admin pages (ADM- section) are covered for admin routing. No end-to-end test of a student completing the entire 6-step enrollment wizard, including the contract-signing step (step 5) and the admin subsequently seeing the new enrollment in their dashboard.

**E. Form builder — admin creates custom form and sends to conservatoria**
ADM- covers the form builder page load. No test for the full workflow: admin creates a form → publishes → sends to selected conservatoria → teacher/student fills form → admin receives it in their inbox → approves it. This is the core www.y-noam.com replacement flow.

### 7.2 UX Quality Checks

- **ADM-01 (command center stats):** The expected result says "at least 4 stat cards are visible" but does not specify what happens when the stats are 0 (e.g., no lessons this week). Test both the populated and zero-data states.
- **ADM-03 (approve pending user):** After approval, does the admin receive any confirmation beyond a toast? Does the user count on the "Pending" tab decrease? Both should be asserted.
- **ADM- Events section:** No test for editing an event that has registered attendees. If attendees are registered and the event time changes, should notifications be sent? This is a real operational scenario.

### 7.3 Business Logic Validation

- **Ministry Director access scope:** ADM-20 range covers the Ministry Dashboard. SDD-P5 specifies that `ministry_director` has read-only access to form submissions across ALL conservatoriums but NO access to financial data or student PII beyond form content. No test explicitly verifies this restriction — a ministry director attempting to access `/dashboard/billing` or `/dashboard/users` should receive a permission denial.
- **delegated_admin scope:** DN-22 tests sidebar scoping. No ADM scenario verifies that a `delegated_admin` attempting to approve users or create events for a conservatorium they are NOT delegated to receives a permission error.

### 7.4 Missing Scenarios to Add

| ID | Name | Expected Result |
|----|------|-----------------|
| ADM-51 | Admin marks lesson complete on behalf of teacher | Lesson status → COMPLETED; teacher's attendance log updated; student's credit balance decremented |
| ADM-52 | Ministry director cannot access /dashboard/billing | Navigate to billing as ministry_director → "No permission" page; no financial data exposed |
| ADM-53 | Broadcast announcement appears in student/parent notification feed | Create announcement → student-user-1 and parent-user-1 both see it in notifications page |
| ADM-54 | Playing school E2E: student enrollment + admin receives registration | Student completes wizard (all 6 steps) → admin-user-1 sees new enrollment in playing-school admin dashboard |
| ADM-55 | Command center — zero-data state | New conservatorium with no students/lessons: all stat cards show "0" or "--"; no null errors |

### 7.5 Domain Verdict

**Changes requested:** Add ADM-51 through ADM-55. Add explicit ministry director permission restriction test (ADM-52 is blocking for compliance). Approve otherwise.

---

## 8. Domain: Legal & Compliance (LC-)

### 8.1 Missing User Journeys

**A. PDPPA required disclosure — data breach notification**
Israeli PDPPA requires organizations to notify affected individuals within 72 hours of a data breach. No test verifies that the system has a mechanism to notify users. This is a regulatory gap, not just a UX gap. Minimum: there should be an admin-triggered "send data breach notification" flow tested.

**B. Consent version tracking — user must re-consent on policy change**
The cookie banner tests verify first-visit behavior and localStorage persistence. No test verifies that changing the privacy policy version (e.g., `consent_version: 2`) causes already-consented users to see the banner again. Without version tracking, every policy update requires manual re-consent outreach.

**C. Minor's parent withdraws consent — downstream effects**
LC-22 tests consent withdrawal. But the downstream effects are not tested: after a parent withdraws consent for a minor, the student's `STUDENT_UNDER_13` account should have restricted access (no practice log upload, no teacher communication) until re-consent is given. This is a PDPPA compliance requirement.

**D. DSAR — data export actually contains real data**
LC-20 tests that "Export Data triggers success toast." The toast fires in the current implementation. But the export must actually deliver the data (download starts, ZIP contains the user's records). The current implementation appears to be stub-only. Flag as BLOCKED.

**E. 7-year data retention — graduated student data**
SDD-P5 documents a data retention policy requiring 7 years of record retention. No test verifies that a graduated student's record is NOT deleted before the 7-year window expires. Conversely, no test verifies that after 7 years + 1 day, the PII IS deleted (anonymized). This is a legal compliance requirement.

### 8.2 UX Quality Checks

- **LC-45 (signature canvas — submit):** The test verifies the canvas draw and submit flow. It does not verify that the submitted signature is actually stored (a signature audit record is written to DB). The audit trail is legally required — test that the record exists post-submission, not just that the UI says "submitted."
- **LC-38 (cancellation policy form saves):** The test verifies a success toast. It does not verify that the saved policy is actually applied to the next cancellation attempt. Add a follow-up test: save policy (2 hours notice required) → student attempts to cancel a lesson in 1 hour → policy blocks it.
- **LC-31 (privacy page in all 4 locales):** The test uses `he` as primary. Test the Arabic locale explicitly as the Arabic privacy page must have correct RTL layout AND correct legal terminology. RTL layout bugs on a legal page could cause misreadings.

### 8.3 Business Logic Validation

- **14-day cooling-off precision (also raised in BF domain):** LC-41 tests that `cancelPackageAction` returns `withinCoolingOff: true` within 14 days, but the current implementation stubs this as always true. **This is a blocking defect** — a student who purchased 20 days ago should NOT receive a full refund. Mark LC-41 as BLOCKED-STUB.
- **OTP expiry (LC-49):** The test verifies expired OTP shows an error. What is the OTP lifetime? 10 minutes? 30 minutes? The expected result should specify the exact expiry window so QA can control the timing in the test environment.
- **Digital signature — legally binding timestamp:** LC-45 tests the UI flow but the legal validity of a digital signature requires a timestamp that is cryptographically bound to the document content. The `SignatureAuditRecord` in SDD-P4 specifies `documentHash` (SHA-256 of form content). No test verifies this hash is actually computed and stored.

### 8.4 Missing Scenarios to Add

| ID | Name | Expected Result |
|----|------|-----------------|
| LC-56 | DSAR export — actual file delivery | Export Data action → download starts; ZIP/JSON file contains user's personal data records |
| LC-57 | Consent version bump — existing consent user sees banner again | `consent_version` increments → user who previously accepted sees cookie banner again |
| LC-58 | Signature audit record written to DB | After LC-45, query DB for signature audit record → record exists with `signedAt`, `signatureHash`, `documentHash` |
| LC-59 | Cancellation policy applied to next cancellation | Save policy (4 hours notice) → student cancels within 4 hours → system blocks cancellation with policy error |
| LC-60 | Minor consent withdrawal — downstream restrictions | Parent withdraws consent → child's practice video upload and teacher messaging disabled |
| LC-61 | Privacy page Arabic locale — RTL and legal terminology | Navigate to `/ar/privacy` → `dir="rtl"`, legal terms correctly rendered in Arabic |

### 8.5 Domain Verdict

**Changes requested (blocking):** Mark LC-20 and LC-41 as BLOCKED-STUB — they cannot be claimed as passing tests while the implementation is stubbed. Add LC-56 through LC-61. Specify OTP expiry window in LC-49 expected result. Approve otherwise.

---

## 9. Cross-Persona Integration Tests (INT-)

### 9.1 Coverage Assessment

The master plan includes INT-01 through INT-24. The cross-persona lifecycle tests (INT-18 through INT-24) added in v1.1 address several gaps. However, the following cross-persona flows are still missing:

### 9.2 Missing Integration Scenarios

| ID | Flow | Personas Involved |
|----|------|------------------|
| INT-25 | Teacher sick leave → student notified → admin sees affected lessons → substitute assigned → student sees substitute teacher name | Teacher, Student, Parent, Admin |
| INT-26 | Parent pays invoice (Cardcom) → student package activates → student can book lesson | Parent, Student, System |
| INT-27 | Ministry director creates form template → admin distributes → student fills → teacher countersigns → admin approves → ministry director sees in inbox | Ministry Director, Admin, Student, Teacher |
| INT-28 | Student earns PRACTICE_STREAK_7 achievement → parent sees achievement badge in family hub | Student, Parent, System |
| INT-29 | Admin creates event → event appears on public landing page → parent registers → parent receives WhatsApp confirmation | Admin, Parent, System, Anonymous Visitor |
| INT-30 | Student package expires → student cannot book → admin is notified → admin renews package → student can book again | Student, Admin, System |

### 9.3 Verdict on Integration Tests

Add INT-25 through INT-30 as high-priority integration scenarios. INT-25 (sick leave pipeline) and INT-27 (forms lifecycle) are P0 — they represent the two most operationally critical multi-persona flows in the entire system.

---

## 10. Global Observations

### 10.1 Loading State Coverage

Across all 8 domains, loading state coverage is inconsistent. Some scenarios test skeletons (SB-39, SB-43, SB-54, ADM-02), but most scenarios skip directly to the loaded state. For a product targeting mobile users in Israel (where 4G coverage is inconsistent), loading state correctness is important. **Recommendation:** Add a loading state assertion to every P1 scenario that involves a dynamic component or API call.

### 10.2 Error State Coverage

Almost no scenarios test what happens when an API call fails. If the mock data adapter returns an error, does the billing page show a "Failed to load" error state, or does it crash? Add at minimum:
- One "API returns 500" scenario per domain.
- Verify error boundary catches the error and renders a recoverable error UI (not a white screen).

### 10.3 Accessibility

- The plan includes ARIA checks in LC-09, LC-15, and the accessibility page tests. However, keyboard navigation is not tested for any of the wizard flows (enrollment wizard, book wizard, aid wizard). Tab order and focus management in multi-step forms is a common accessibility failure.
- The exam tracker's select dropdowns (RM-43) should be keyboard-accessible.

### 10.4 Performance

No performance assertions exist anywhere in the plan. For a platform serving 85 conservatoriums with 5,000+ students, page load time matters. At minimum:
- Landing page: LCP < 3s on simulated 4G.
- Book wizard: time-to-interactive < 2s after dynamic import.

### 10.5 Internationalization Completeness

The plan tests locale-switching and RTL layout well. Missing: a test that verifies **no translation key is missing** in all 4 locales across all pages. The existing `tests/i18n-landing-keys.test.ts` pattern should be extended to all dashboard namespaces, not just the landing page.

---

## 11. Summary of Mandatory Changes

### Blocking (must be resolved before QA gate is declared passed)

| # | Domain | Issue |
|---|--------|-------|
| B-01 | Billing | BF-06/BF-07 must be marked BLOCKED-STUB; cooling-off logic is not implemented |
| B-02 | Billing | BF-18 (delete package): confirmation dialog required before ship |
| B-03 | Legal | LC-20 must be marked BLOCKED-STUB; DSAR export is not implemented |
| B-04 | Legal | LC-41 must be marked BLOCKED-STUB; cooling-off check is stub |
| B-05 | Repertoire | RM-21 (delete composition): confirmation dialog required before ship |
| B-06 | Admin | ADM-52 (ministry director billing access): explicit permission restriction test required for compliance |
| B-07 | Scheduling | SB-18: resolve banner color discrepancy (bg-blue-600 vs bg-indigo-500) |
| B-08 | Public | PP-58 (hreflang tags): required for multi-language SEO; add before launch |

### High Priority (add before first QA execution cycle)

62 new scenarios proposed across domains (A-56–60, DN-81–86, SB-66–71, BF-41–47, RM-52–57, PP-56–59, ADM-51–55, LC-56–61, INT-25–30).

### Medium Priority (add before QA gate sign-off)

- Loading state assertions on all P1 dynamic components
- Error state (API 500) scenarios for each domain
- Keyboard navigation tests for all multi-step wizard flows
- i18n completeness test extended to all dashboard translation namespaces

---

## 12. Approval Status by Domain

| Domain | Status | Condition |
|--------|--------|-----------|
| 01 Auth & Registration | Conditional Approval | Add A-56–60; sharpen A-05, A-17 |
| 02 Dashboard & Navigation | Conditional Approval | Add DN-81–86; cross-conservatorium isolation assertion |
| 03 Scheduling & Booking | Conditional Approval | Resolve SB-18 color; add SB-66–71 |
| 04 Billing & Financial | Changes Requested | B-01, B-02 blocking; add BF-41–47 |
| 05 Repertoire & Music | Changes Requested | B-05 blocking; add RM-52–57; tag RM-35 as STUB |
| 06 Public Pages | Conditional Approval | B-08 blocking for launch; add PP-56–59 |
| 07 Admin Features | Conditional Approval | B-06 blocking; add ADM-51–55 |
| 08 Legal & Compliance | Changes Requested | B-03, B-04 blocking; add LC-56–61 |
| Integration Tests | Changes Requested | Add INT-25–30; INT-25 and INT-27 are P0 |

**Overall plan status: CHANGES REQUESTED**
The plan has strong bones and professional discipline. The additions requested are material but manageable. Once the 8 blocking issues are resolved and the 62 new scenarios are incorporated, the plan will be ready for execution approval.
