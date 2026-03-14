# QA Plan: Scheduling & Booking
_Domain: Weekly Calendar, Book Wizard, Teacher Availability, Makeups, Substitutes, AI Reschedule, Master Schedule, Available-Now Pipeline_

---

## Coverage Summary

| Area | Scenarios |
|------|-----------|
| Weekly schedule calendar | SB-01 – SB-06 |
| Book wizard — Regular tab | SB-07 – SB-16 |
| Book wizard — Deals tab | SB-17 – SB-24 |
| Teacher availability grid | SB-25 – SB-30 |
| Student/parent makeup credits | SB-31 – SB-35 |
| Admin makeup dashboard | SB-36 – SB-39 |
| Admin substitute assignment | SB-40 – SB-44 |
| AI reschedule chat widget | SB-45 – SB-49 |
| Master schedule (admin view) | SB-50 – SB-54 |
| Available-Now public page | SB-55 – SB-60 |
| Available-Now → register → book pipeline | SB-61 – SB-65 |

---

## Shared Mock Data Requirements

- **Students with active package:** `student-user-1` (cons-15, piano), `student-user-3` (cons-15, violin)
- **Student without active package:** `student-user-5` (cons-66)
- **Parent with children:** `parent-user-1` (children: student-user-1, student-user-2)
- **Teacher with availability:** `teacher-user-1` (מרים כהן, `isPremiumTeacher: true`, availability Mon–Thu 15:00–20:00), `teacher-user-2` (דוד המלך, `isPremiumTeacher: false`)
- **Teacher without availability:** any teacher with no `availability` array
- **Conservatorium admin:** `admin-user-1` (cons-15)
- **Site admin:** `dev-user`
- **Lessons:** at least two `scheduled` lessons in the current week, one `cancelled`
- **Makeup credits:** `student-user-1` has at least 2 AVAILABLE makeup credits, one EXPIRED credit
- **Empty slots (deals):** generated dynamically from teacher availability; ensure at least one teacher has availability within today + 4 days

---

## SB-01 — Weekly calendar renders for student

**Personas:** student
**Preconditions:** `student-user-1` logged in; at least 2 scheduled lessons in current week
**DB backend:** mock
**Locale tags:** `he` (RTL), `en` (LTR)

**Steps:**
1. Navigate to `/dashboard/schedule`
2. Observe page heading and week range
3. Observe lesson blocks in calendar grid

**Expected results:**
- Heading "לוח שבועי" (he) / "Weekly Schedule" (en) visible
- Week range label shows current week dates
- Lesson blocks rendered in correct day column with instrument color coding
- "Book New Lesson" button visible and links to `/dashboard/schedule/book`

---

## SB-02 — Weekly calendar week navigation

**Personas:** student, teacher, admin
**Preconditions:** Logged in; multiple lessons across weeks
**DB backend:** mock
**Locale tags:** `he`, `en`

**Steps:**
1. Go to `/dashboard/schedule`
2. Click the "Next week" button
3. Verify week range label advances by 7 days
4. Click "Previous week" twice; verify week range goes back
5. Click "Today" button; verify current week is restored

**Expected results:**
- `weekStartRaw` state advances/retreats correctly each click
- Week range label updates accordingly
- Lesson blocks filter to the newly displayed week
- "Today" button returns to current week

---

## SB-03 — Weekly calendar RTL layout (Hebrew)

**Personas:** student
**Preconditions:** Locale = `he`; logged in
**DB backend:** mock
**Locale tags:** `he`, `ar`

**Steps:**
1. Navigate to `/he/dashboard/schedule`
2. Observe page-level `dir` attribute
3. Observe navigation buttons (prev/next week)
4. Observe text alignment of heading and dates

**Expected results:**
- Page container has `dir="rtl"`
- Text starts from right
- Prev/next chevron icons are NOT mirrored (logical direction preserved by CSS classes `ms-`/`me-`, no `dir="ltr"` wrapper around calendar)
- Week range reads right-to-left

---

## SB-04 — Schedule view filters (teacher/instrument/room)

**Personas:** conservatorium_admin, site_admin
**Preconditions:** Admin logged in; multiple lessons across teachers and instruments
**DB backend:** mock
**Locale tags:** `he`, `en`

**Steps:**
1. Go to `/dashboard/schedule`
2. Switch view toggle to "Teacher" view
3. Select a specific teacher from dropdown
4. Switch to "Instrument" view; select "Piano"
5. Switch to "Room" view; select a room

**Expected results:**
- Teacher view: only lessons for selected teacher shown
- Instrument view: only piano lessons shown, colored correctly
- Room view: only lessons in selected room shown
- "All" selection restores full list

---

## SB-05 — Schedule role scoping (student sees only own lessons)

**Personas:** student, parent, teacher
**Preconditions:** Multiple lessons in system; `student-user-1` has 2 own lessons, `student-user-2` has 1 lesson
**DB backend:** mock
**Locale tags:** `he`

**Steps:**
1. Log in as `student-user-1`; go to `/dashboard/schedule`
2. Count visible lesson blocks
3. Log in as `teacher-user-1`; go to `/dashboard/schedule`
4. Count visible lesson blocks
5. Log in as `parent-user-1` (children: student-user-1 and student-user-2); go to schedule

**Expected results:**
- Student: only their own 2 lessons visible (role filter `lesson.studentId === user.id`)
- Teacher: only lessons where `lesson.teacherId === user.id`
- Parent: lessons for all `childIds` combined
- Admin: all lessons visible (no filter applied)

---

## SB-06 — Schedule page inaccessible without auth

**Personas:** unauthenticated
**Preconditions:** Not logged in (dev bypass OFF or using real auth)
**DB backend:** mock
**Locale tags:** `he`

**Steps:**
1. Open `/he/dashboard/schedule` without being logged in
2. Observe redirect

**Expected results:**
- Redirected to `/he/login` (or auth gate)
- Schedule content not rendered

---

## SB-07 — Book wizard page loads for student

**Personas:** student
**Preconditions:** `student-user-1` logged in
**DB backend:** mock
**Locale tags:** `he`, `en`

**Steps:**
1. Navigate to `/dashboard/schedule/book`
2. Wait for wizard to render (dynamic import with Suspense)
3. Observe tabs

**Expected results:**
- H1 "Book a Lesson" (or Hebrew equivalent) visible
- Two tabs rendered: "Regular Booking" and "Last-Minute Deals" (with Zap icon)
- No JS errors in console

---

## SB-08 — Regular tab: default tab is Regular when no `?tab=deals` param

**Personas:** student
**Preconditions:** Logged in
**DB backend:** mock

**Steps:**
1. Navigate to `/dashboard/schedule/book` (no query param)
2. Observe active tab

**Expected results:**
- "Regular Booking" tab is active by default
- Deals tab is inactive

---

## SB-09 — Regular tab: instrument selector lists student's instruments first

**Personas:** student
**Preconditions:** `student-user-1` has `instruments: [{instrument: 'Piano'}]`
**DB backend:** mock
**Locale tags:** `he`

**Steps:**
1. Navigate to `/dashboard/schedule/book` (Regular tab)
2. Open the Instrument combobox

**Expected results:**
- "Piano" appears at the top of the list (registered instruments first)
- Other instruments offered by teachers appear below
- Hint text visible: "Instruments registered to your profile appear first"

---

## SB-10 — Regular tab: teacher scope toggle (own conservatorium vs all)

**Personas:** student (cons-15)
**Preconditions:** Both `teacher-user-1` (cons-15) and `dir-teacher-069` (cons-84) exist
**DB backend:** mock
**Locale tags:** `he`

**Steps:**
1. Open book wizard, Regular tab
2. Select instrument
3. Observe teacher combobox with scope = "My Conservatorium" (default)
4. Toggle scope to "All Teachers"
5. Observe teacher combobox again

**Expected results:**
- Default ("My Conservatorium"): only cons-15 teachers listed
- "All Teachers": all teachers from all conservatoriums listed
- Premium teacher `teacher-user-1` shows ⭐ prefix in combobox when present

---

## SB-11 — Regular tab: premium-only filter

**Personas:** student
**Preconditions:** `teacher-user-1` has `isPremiumTeacher: true`; scope set to "All Teachers"
**DB backend:** mock

**Steps:**
1. Open book wizard, Regular tab; set scope to "All Teachers"
2. Click "Premium" toggle button
3. Observe teacher list

**Expected results:**
- Only `teacher-user-1` (and other premium teachers) remain in the list
- Toggle button shows active state (yellow star, yellow background)
- Non-premium teachers hidden

---

## SB-12 — Regular tab: time slots load for selected teacher + date

**Personas:** student
**Preconditions:** `teacher-user-1` has availability WED 15:00–20:00; no lessons booked that day
**DB backend:** mock

**Steps:**
1. Open book wizard, Regular tab
2. Select instrument "Piano"
3. Select teacher `teacher-user-1`
4. Pick the next Wednesday on the calendar
5. Wait for time slots to load

**Expected results:**
- Time slots 15:00, 16:00, 17:00, 18:00, 19:00 visible (one per available hour)
- No loader visible after ~500 ms
- If teacher has no availability on selected day, "No available time slots" message shown

---

## SB-13 — Regular tab: booked slots excluded from time slots

**Personas:** student
**Preconditions:** `teacher-user-1` has a lesson at 16:00 on a specific Wednesday
**DB backend:** mock

**Steps:**
1. Open book wizard, Regular tab; select teacher-user-1
2. Pick the Wednesday with existing 16:00 lesson
3. Observe time slots

**Expected results:**
- 16:00 slot NOT shown
- 15:00, 17:00, 18:00, 19:00 still shown

---

## SB-14 — Regular tab: package guard for student without active package

**Personas:** student (no active package)
**Preconditions:** `student-user-5` has no package
**DB backend:** mock
**Locale tags:** `he`, `en`

**Steps:**
1. Log in as `student-user-5`
2. Navigate to book wizard, Regular tab
3. Fill in instrument, teacher, date, time
4. Observe submit button and alert

**Expected results:**
- Alert shown: "No Active Package" with description suggesting purchase
- Submit button disabled
- Attempting to submit yields no lesson creation

---

## SB-15 — Regular tab: admin/site_admin bypasses package guard

**Personas:** conservatorium_admin, site_admin
**Preconditions:** Logged in as admin; student-user-5 (no package) selected
**DB backend:** mock

**Steps:**
1. Log in as `dev-user` (site_admin)
2. Navigate to book wizard, Regular tab
3. Complete all fields
4. Submit

**Expected results:**
- No package warning shown for admin
- Submit button enabled
- Lesson created and redirects to `/dashboard/schedule`
- Success toast shown

---

## SB-16 — Regular tab: successful booking creates lesson and redirects

**Personas:** student (with active package)
**Preconditions:** `student-user-1` has active PACK_10 with remaining credits
**DB backend:** mock

**Steps:**
1. Log in as `student-user-1`
2. Open book wizard, Regular tab
3. Select "Piano", `teacher-user-1`, pick a future date with availability, pick 15:00
4. Click "Book Lesson"

**Expected results:**
- Success toast: "Lesson Booked" with instrument, teacher name, date/time
- Redirected to `/dashboard/schedule`
- New lesson block visible in calendar for that date/time

---

## SB-17 — Deals tab: activated via `?tab=deals` query param

**Personas:** student
**Preconditions:** Logged in
**DB backend:** mock
**Locale tags:** `he`, `en`

**Steps:**
1. Navigate to `/dashboard/schedule/book?tab=deals`

**Expected results:**
- "Last-Minute Deals" tab active by default
- Slot cards rendered (or "No deals available" message if no availability in next 5 days)

---

## SB-18 — Deals tab: slot cards show correct urgency banner color

**Personas:** student
**Preconditions:** At least one deal slot with `startTime` = today, at least one = tomorrow
**DB backend:** mock

**Steps:**
1. Open book wizard, Deals tab
2. Observe top banner of today's slot
3. Observe top banner of tomorrow's slot

**Expected results:**
- Today's slot: `bg-amber-500` (amber) urgency banner with "Today" label
- Tomorrow/later slot: `bg-blue-600` banner with day label or "Tomorrow"
- Each card shows: teacher name, star icon if premium, instrument badge, city, time, promotional price with strikethrough base price, discount % badge

---

## SB-19 — Deals tab: instrument filter buttons

**Personas:** student
**Preconditions:** Deals include slots for Piano and Violin
**DB backend:** mock

**Steps:**
1. Open book wizard, Deals tab
2. Observe filter buttons
3. Click "Piano" filter
4. Observe slot cards
5. Click "All Instruments"

**Expected results:**
- All unique instruments shown as filter buttons + "All Instruments"
- Clicking "Piano" shows only piano slots
- Clicking "All Instruments" restores all
- Student's registered instruments hint alert shown

---

## SB-20 — Deals tab: clicking slot card opens booking dialog

**Personas:** student
**Preconditions:** At least one deal slot available
**DB backend:** mock

**Steps:**
1. Open book wizard, Deals tab
2. Click any slot card

**Expected results:**
- `SlotBookingDialog` opens
- Shows teacher avatar, name, conservatorium, instrument badge, time, day, city
- Two payment options: "Use Package Credit" and "Pay Promotional Price"

---

## SB-21 — Deals tab: booking dialog — package credit option disabled when no credits

**Personas:** student (no package or exhausted package)
**Preconditions:** `student-user-5` has no active package
**DB backend:** mock

**Steps:**
1. Log in as `student-user-5`; open book wizard, Deals tab
2. Click a slot card
3. Observe payment options

**Expected results:**
- "Use Package Credit" button disabled (opacity-50, cursor-not-allowed)
- Reason text: "You have no credits left"
- "Pay Promotional Price" option still enabled

---

## SB-22 — Deals tab: book via promotional price

**Personas:** student
**Preconditions:** Deal slot available; `student-user-1` logged in
**DB backend:** mock

**Steps:**
1. Open book wizard, Deals tab
2. Click a slot card
3. In dialog, click "Pay Promotional Price"

**Expected results:**
- Dialog closes
- Toast: "Deal Booked!" with promotional price and discount percentage
- Redirected to `/dashboard/schedule`
- New lesson visible in schedule for that slot's time

---

## SB-23 — Deals tab: book via package credit

**Personas:** student (with active package)
**Preconditions:** `student-user-1` has PACK_10 with remaining credits
**DB backend:** mock

**Steps:**
1. Open book wizard, Deals tab
2. Click a slot card
3. Click "Use Package Credit"

**Expected results:**
- Toast: "Deal Booked!" with package credit description
- Redirected to `/dashboard/schedule`
- Lesson created

---

## SB-24 — Deals tab: pending_slot auto-opens dialog

**Personas:** student
**Preconditions:** `pending_slot` JSON set in `sessionStorage` with a matching slot ID
**DB backend:** mock

**Steps:**
1. Set `sessionStorage.setItem('pending_slot', JSON.stringify({id: '<valid-slot-id>', ...}))`
2. Navigate to `/dashboard/schedule/book?tab=deals`
3. Wait for deals to load

**Expected results:**
- `SlotBookingDialog` opens automatically for the matching slot
- `pending_slot` key removed from sessionStorage after dialog opens
- If no matching slot exists, dialog does not open (graceful no-op)

---

## SB-25 — Teacher availability page: only accessible to teacher role

**Personas:** student, teacher, admin
**Preconditions:** Various users logged in
**DB backend:** mock
**Locale tags:** `he`

**Steps:**
1. Log in as `student-user-1`; navigate to `/dashboard/teacher/availability`
2. Log in as `teacher-user-1`; navigate to same page
3. Log in as admin; navigate to same page

**Expected results:**
- Student: redirected to `/dashboard` (role guard in `useEffect`)
- Teacher: page renders with AvailabilityGrid
- Admin: redirected to `/dashboard` (only `teacher` role allowed)

---

## SB-26 — Availability grid: displays existing availability

**Personas:** teacher
**Preconditions:** `teacher-user-1` has availability WED 15:00–20:00 and THU 14:00–19:00
**DB backend:** mock
**Locale tags:** `he`

**Steps:**
1. Log in as `teacher-user-1`; navigate to `/dashboard/teacher/availability`
2. Observe the grid

**Expected results:**
- Wednesday slots 15:00–19:00 shown as selected (5 cells)
- Thursday slots 14:00–18:00 shown as selected
- Other cells shown as unselected
- Booked lesson slots shown as non-toggle-able (different visual state)

---

## SB-27 — Availability grid: toggle slot and save

**Personas:** teacher
**Preconditions:** `teacher-user-2` logged in with no availability set on Monday
**DB backend:** mock

**Steps:**
1. Navigate to `/dashboard/teacher/availability`
2. Click MON 09:00 cell
3. Click MON 10:00 cell
4. Click "Save Changes" button

**Expected results:**
- Clicked cells highlighted as available
- Save button was disabled before any changes, enabled after toggle
- Toast "Availability saved" shown
- `user.availability` updated to include MON 09:00–11:00 block

---

## SB-28 — Availability grid: cannot toggle a booked slot

**Personas:** teacher
**Preconditions:** `teacher-user-1` has a lesson at WED 16:00
**DB backend:** mock

**Steps:**
1. Log in as `teacher-user-1`; navigate to availability
2. Click the WED 16:00 cell

**Expected results:**
- Cell does not toggle (handled by `teacherLessons[key]` guard)
- Visual indicator shows the slot is occupied by a lesson

---

## SB-29 — Availability grid: RTL day ordering

**Personas:** teacher
**Preconditions:** Locale = `he`
**DB backend:** mock
**Locale tags:** `he`, `ar`

**Steps:**
1. Log in as `teacher-user-1`; navigate to `/he/dashboard/teacher/availability`
2. Observe day column headers

**Expected results:**
- Page container has `dir="rtl"` (from `AvailabilityGrid` component)
- Day headers: SUN, MON, TUE, WED, THU, FRI (SAT excluded — Israeli school week)
- Grid text aligned from right

---

## SB-30 — Availability grid: save re-merges consecutive slots into blocks

**Personas:** teacher
**Preconditions:** `teacher-user-2` logged in with no availability
**DB backend:** mock

**Steps:**
1. Toggle TUE 10:00, 11:00, 12:00, 13:00 cells selected
2. Skip 14:00 (leave unselected)
3. Toggle 15:00, 16:00
4. Save

**Expected results:**
- Saved `availability` contains two blocks: `{dayOfWeek: 'TUE', startTime: '10:00', endTime: '14:00'}` and `{dayOfWeek: 'TUE', startTime: '15:00', endTime: '17:00'}`
- Not stored as 6 individual single-hour blocks

---

## SB-31 — Makeups page: displays credit balance for student

**Personas:** student
**Preconditions:** `student-user-1` has 2 AVAILABLE makeup credits, 1 EXPIRED
**DB backend:** mock
**Locale tags:** `he`, `en`

**Steps:**
1. Log in as `student-user-1`; navigate to `/dashboard/makeups`
2. Observe balance card and details table

**Expected results:**
- Balance card shows "2" (only AVAILABLE credits counted)
- History table shows 3 rows: 2 AVAILABLE (green badge) + 1 EXPIRED (gray badge)
- Table columns: Source, Granted At, Expires At, Status
- Dates formatted with locale-aware date-fns

---

## SB-32 — Makeups page: RTL layout

**Personas:** student
**Preconditions:** Locale = `he`
**DB backend:** mock

**Steps:**
1. Navigate to `/he/dashboard/makeups`

**Expected results:**
- Page container has `dir="rtl"`
- Status badge aligned to `text-end`
- Table header "Status" at end (right in LTR, left in RTL)

---

## SB-33 — Makeups page: "Book Makeup" button disabled when zero credits

**Personas:** student
**Preconditions:** `student-user-5` has 0 AVAILABLE makeup credits
**DB backend:** mock

**Steps:**
1. Log in as `student-user-5`; navigate to `/dashboard/makeups`
2. Observe "Book Makeup Lesson" button

**Expected results:**
- Button rendered with `disabled` attribute
- Clicking has no effect
- Balance card shows "0"

---

## SB-34 — Makeups page: "Book Makeup" button links to book wizard with `?type=makeup`

**Personas:** student (with credits)
**Preconditions:** `student-user-1` has credits
**DB backend:** mock

**Steps:**
1. Navigate to `/dashboard/makeups`
2. Click "Book Makeup Lesson" button

**Expected results:**
- Navigates to `/dashboard/schedule/book?type=makeup`
- Book wizard loads (regular tab active since no `?tab=deals`)

---

## SB-35 — Makeups page: parent sees combined balance for all children

**Personas:** parent
**Preconditions:** `parent-user-1` has children `student-user-1` (2 credits) and `student-user-2` (1 credit)
**DB backend:** mock

**Steps:**
1. Log in as `parent-user-1`; navigate to `/dashboard/makeups`

**Expected results:**
- Balance card shows "3" (sum of both children's AVAILABLE credits)
- History table shows credits for both children

---

## SB-36 — Admin makeups dashboard: loads for conservatorium_admin

**Personas:** conservatorium_admin
**Preconditions:** `admin-user-1` logged in
**DB backend:** mock
**Locale tags:** `he`, `en`

**Steps:**
1. Log in as `admin-user-1`; navigate to `/dashboard/admin/makeups`

**Expected results:**
- Page heading visible (from `Sidebar.adminMakeups` translation key)
- `AdminMakeupDashboard` component rendered
- No redirect

---

## SB-37 — Admin makeups dashboard: non-admin redirected

**Personas:** student, teacher
**Preconditions:** Logged in as student
**DB backend:** mock

**Steps:**
1. Navigate to `/dashboard/admin/makeups` as `student-user-1`

**Expected results:**
- `useAdminGuard` redirects to `/dashboard` or shows unauthorised state
- AdminMakeupDashboard not rendered

---

## SB-38 — Admin makeups dashboard: shows makeup credits across all students

**Personas:** site_admin
**Preconditions:** Multiple students with varying makeup credit statuses
**DB backend:** mock

**Steps:**
1. Log in as `dev-user`; navigate to `/dashboard/admin/makeups`
2. Observe content

**Expected results:**
- Credits from multiple students visible
- Ability to grant or expire makeup credits (per AdminMakeupDashboard capabilities)

---

## SB-39 — Admin makeups: loading skeleton shown during auth check

**Personas:** conservatorium_admin
**Preconditions:** Slow network / first load
**DB backend:** mock

**Steps:**
1. Navigate to `/dashboard/admin/makeups` immediately after page load
2. Observe render during `isLoading === true` state

**Expected results:**
- Skeleton elements rendered (h-8 w-48 + h-5 w-64 + h-96)
- No content flash of AdminMakeupDashboard before auth confirms

---

## SB-40 — Admin substitute: loads for admin

**Personas:** conservatorium_admin, site_admin
**Preconditions:** Admin logged in
**DB backend:** mock
**Locale tags:** `he`, `en`

**Steps:**
1. Navigate to `/dashboard/admin/substitute`

**Expected results:**
- Page heading from `Sidebar.substitute` visible
- Subtitle from `AdminPages.substitute.subtitle` visible
- `SubstituteAssignmentPanel` rendered

---

## SB-41 — Admin substitute: non-admin redirected

**Personas:** teacher, student
**Preconditions:** Logged in as teacher
**DB backend:** mock

**Steps:**
1. Navigate to `/dashboard/admin/substitute`

**Expected results:**
- `useAdminGuard` redirects or renders null/loading until redirect occurs
- SubstituteAssignmentPanel never rendered

---

## SB-42 — Admin substitute: assign substitute teacher to a lesson

**Personas:** conservatorium_admin
**Preconditions:** Lesson exists where `teacher-user-1` cannot attend; `teacher-user-2` available
**DB backend:** mock

**Steps:**
1. Log in as `admin-user-1`; navigate to `/dashboard/admin/substitute`
2. Find the affected lesson in `SubstituteAssignmentPanel`
3. Select `teacher-user-2` as substitute
4. Confirm assignment

**Expected results:**
- Lesson's substitute teacher updated
- Toast or confirmation shown
- Lesson now visible on `teacher-user-2`'s schedule

---

## SB-43 — Admin substitute: loading skeleton during auth check

**Personas:** conservatorium_admin
**Preconditions:** isLoading state
**DB backend:** mock

**Steps:**
1. Hard refresh `/dashboard/admin/substitute`
2. Observe initial render

**Expected results:**
- Skeleton displayed (h-8 w-48 + h-5 w-64 + h-96) while auth check completes

---

## SB-44 — Admin substitute: RTL layout

**Personas:** conservatorium_admin
**Preconditions:** Locale = `he`
**DB backend:** mock

**Steps:**
1. Navigate to `/he/dashboard/admin/substitute`
2. Observe layout

**Expected results:**
- Page heading and panel are right-aligned
- SubstituteAssignmentPanel respects RTL context

---

## SB-45 — AI reschedule: accessible to student and parent

**Personas:** student, parent
**Preconditions:** Logged in
**DB backend:** mock
**Locale tags:** `he`, `en`

**Steps:**
1. Log in as `student-user-1`; navigate to `/dashboard/ai-reschedule`
2. Log in as `parent-user-1`; navigate to same page

**Expected results:**
- Both see `ReschedulingChatWidget` rendered
- No "no permission" message

---

## SB-46 — AI reschedule: not accessible to teacher/admin

**Personas:** teacher, conservatorium_admin
**Preconditions:** Logged in
**DB backend:** mock

**Steps:**
1. Log in as `teacher-user-1`; navigate to `/dashboard/ai-reschedule`
2. Log in as `admin-user-1`; navigate to same page

**Expected results:**
- Both see the "no permission" message (`t('aiReschedule.noPermissionDesc')`)
- `ReschedulingChatWidget` not rendered
- Page still loads (not a hard redirect)

---

## SB-47 — AI reschedule: chat widget initial render

**Personas:** student
**Preconditions:** Logged in
**DB backend:** mock

**Steps:**
1. Navigate to `/dashboard/ai-reschedule`
2. Observe `ReschedulingChatWidget`

**Expected results:**
- Chat input field visible
- Initial assistant greeting message rendered
- No JS errors

---

## SB-48 — AI reschedule: null user guard

**Personas:** unauthenticated
**Preconditions:** user = null
**DB backend:** mock

**Steps:**
1. Render page without auth

**Expected results:**
- The null guard `if (!user || ...)` triggers "no permission" view
- Does not crash

---

## SB-49 — AI reschedule: locale-aware heading

**Personas:** student
**Preconditions:** Locales `he`, `en`, `ar`, `ru`
**DB backend:** mock
**Locale tags:** `he`, `en`, `ar`, `ru`

**Steps:**
1. Access `/he/dashboard/ai-reschedule`
2. Access `/en/dashboard/ai-reschedule`
3. Access `/ar/dashboard/ai-reschedule`
4. Access `/ru/dashboard/ai-reschedule`

**Expected results:**
- "No permission" message (or chat widget) rendered in correct language for each locale
- No missing translation keys (fallback to `he` if needed via deepMerge)

---

## SB-50 — Master schedule: loads for admin

**Personas:** conservatorium_admin, site_admin
**Preconditions:** Admin logged in
**DB backend:** mock
**Locale tags:** `he`, `en`

**Steps:**
1. Navigate to `/dashboard/master-schedule`

**Expected results:**
- Heading from `DashboardPages.masterSchedule.title` visible
- `MasterScheduleCalendar` component rendered (with 600px skeleton during dynamic import)
- No redirect

---

## SB-51 — Master schedule: non-admin sees no-permission view

**Personas:** teacher, student, parent
**Preconditions:** Logged in as teacher
**DB backend:** mock

**Steps:**
1. Navigate to `/dashboard/master-schedule` as `teacher-user-1`

**Expected results:**
- Heading still visible but body shows `DashboardPages.masterSchedule.noPermissionDesc` message
- `MasterScheduleCalendar` NOT rendered
- No crash (page remains accessible at the route, content restricted)

---

## SB-52 — Master schedule: shows all lessons across all teachers

**Personas:** site_admin
**Preconditions:** Multiple lessons for different teachers
**DB backend:** mock

**Steps:**
1. Log in as `dev-user`; navigate to `/dashboard/master-schedule`
2. Observe `MasterScheduleCalendar`

**Expected results:**
- All lessons visible regardless of teacher
- Calendar grid shows proper week layout

---

## SB-53 — Master schedule: week navigation works

**Personas:** conservatorium_admin
**Preconditions:** Logged in
**DB backend:** mock

**Steps:**
1. Navigate to master schedule
2. Click next week / previous week in MasterScheduleCalendar

**Expected results:**
- Week range advances/retreats
- Lesson blocks update to show correct week's data

---

## SB-54 — Master schedule: loading skeleton during dynamic import

**Personas:** conservatorium_admin
**Preconditions:** First load / slow network
**DB backend:** mock

**Steps:**
1. Hard refresh `/dashboard/master-schedule`
2. Observe before `MasterScheduleCalendar` is ready

**Expected results:**
- `h-[600px] w-full` Skeleton visible during dynamic import
- No layout shift after component loads

---

## SB-55 — Available-Now public page: renders without auth

**Personas:** unauthenticated visitor
**Preconditions:** At least one teacher with availability in next 4 days
**DB backend:** mock
**Locale tags:** `he`, `en`, `ar`, `ru`

**Steps:**
1. Navigate to `/available-now` (unauthenticated)

**Expected results:**
- Page renders: `PublicNavbar` + hero section + `AvailableSlotsMarketplace` + `PublicFooter`
- H1 heading from `AvailableNow.title` visible
- Slot promotion cards visible (or "no slots" message)
- No auth redirect

---

## SB-56 — Available-Now page: hero section RTL

**Personas:** unauthenticated
**Preconditions:** Locale = `he` or `ar`
**DB backend:** mock
**Locale tags:** `he`, `ar`

**Steps:**
1. Navigate to `/he/available-now`

**Expected results:**
- `<main dir="rtl">` applied
- Hero text right-aligned
- Slot cards respect RTL layout

---

## SB-57 — SlotPromotionCard: today slot shows amber banner

**Personas:** unauthenticated
**Preconditions:** At least one slot with `startTime` = today
**DB backend:** mock

**Steps:**
1. Navigate to `/available-now`
2. Locate a slot card with today's date

**Expected results:**
- Urgency banner: `bg-amber-500` with "Today" label and Zap icon
- Time displayed in HH:mm format

---

## SB-58 — SlotPromotionCard: shows premium badge for premium teacher

**Personas:** unauthenticated
**Preconditions:** `teacher-user-1` (`isPremiumTeacher: true`) has a slot available
**DB backend:** mock

**Steps:**
1. Navigate to `/available-now`
2. Find slot card for `teacher-user-1`

**Expected results:**
- "Premium" badge shown below teacher name (gold star icon, yellow border)
- Non-premium teachers do not show badge

---

## SB-59 — SlotPromotionCard: share button copies link to clipboard (no navigator.share)

**Personas:** unauthenticated
**Preconditions:** Browser environment without `navigator.share` API
**DB backend:** mock

**Steps:**
1. Navigate to `/available-now`
2. Click share icon button on a slot card
3. Observe toast

**Expected results:**
- `navigator.clipboard.writeText` called with slot share text + URL
- Toast: "Link Copied" with description
- No error

---

## SB-60 — SlotPromotionCard: price display

**Personas:** unauthenticated
**Preconditions:** Slot with `basePrice: 200`, `promotionalPrice: 140`, `discount: 30`
**DB backend:** mock

**Steps:**
1. Navigate to `/available-now`
2. Find the slot card

**Expected results:**
- Promotional price: "₪140" in large green text
- Base price: "₪200" with strikethrough in muted text
- Discount badge: "-30%" in red

---

## SB-61 — Available-Now → unauthenticated → register flow

**Personas:** unauthenticated visitor
**Preconditions:** Not logged in; slot available
**DB backend:** mock

**Steps:**
1. Navigate to `/available-now`
2. Click "Book Now" on a slot card

**Expected results:**
- `pending_slot` JSON written to `sessionStorage`
- Redirected to `/register?teacher=<id>&conservatorium=<id>`
- Registration page loads with relevant context

---

## SB-62 — Available-Now → authenticated → deals tab direct

**Personas:** student (logged in)
**Preconditions:** `student-user-1` logged in; slot available on Available-Now page
**DB backend:** mock

**Steps:**
1. Navigate to `/available-now` while logged in
2. Click "Book Now" on a slot card

**Expected results:**
- `pending_slot` written to sessionStorage
- Redirected to `/dashboard/schedule/book?tab=deals` (not to /register)
- Deals tab is active
- Booking dialog auto-opens for the pending slot (SB-24 scenario)

---

## SB-63 — Available-Now → register → login → deals tab pipeline (full E2E)

**Personas:** unauthenticated (becomes student)
**Preconditions:** Dev bypass OFF (or stub); `student-user-1` credentials available
**DB backend:** mock
**Locale tags:** `he`

**Steps:**
1. Navigate to `/available-now`
2. Click "Book Now" — `pending_slot` saved in sessionStorage, redirected to `/register?teacher=X&conservatorium=Y`
3. Complete registration (or use existing account link on register page)
4. Follow "already have account" link → `/login?callbackUrl=/dashboard/schedule/book?tab=deals`
5. Login with `student-user-1` credentials
6. Observe redirect after login

**Expected results:**
- After login, redirected to `/dashboard/schedule/book?tab=deals`
- Deals tab active
- `pending_slot` still in sessionStorage (set before login, persists across navigation)
- Dialog auto-opens for the saved slot

---

## SB-64 — Available-Now: slot search window is today + 4 days (not just today + tomorrow)

**Personas:** unauthenticated
**Preconditions:** Teacher has availability only on day+3 (3 days from today)
**DB backend:** mock

**Steps:**
1. Ensure `teacher-user-2` has availability only on a day that is 3 days in the future
2. Navigate to `/available-now`

**Expected results:**
- Slot for day+3 IS visible on the marketplace
- Urgency banner shows day label (not "Today" or "Tomorrow")
- Discount reflects "TOMORROW" urgency matrix (10–25%)

---

## SB-65 — Available-Now: slot discount matrix

**Personas:** unauthenticated
**Preconditions:** Slot today during peak hours (15:00–19:00 weekday) vs off-peak
**DB backend:** mock

**Steps:**
1. Observe a today-peak slot (e.g., 16:00 Thursday) price
2. Observe a today-low demand slot (e.g., 08:00 Saturday)

**Expected results:**
- Today-peak: discount = 20% (`SAME_DAY × HIGH_DEMAND`)
- Today-low: discount = 40% (`SAME_DAY × LOW_DEMAND`)
- Tomorrow-medium: discount = 15% (`TOMORROW × MEDIUM_DEMAND`)
- Promotional price = `round(basePrice * (1 - discount/100))`

---

## Locale Matrix

| Scenario | `he` | `en` | `ar` | `ru` |
|----------|------|------|------|------|
| SB-01 schedule calendar | P | P | S | S |
| SB-03 RTL layout | P | — | P | — |
| SB-07 book wizard loads | P | P | S | S |
| SB-17 deals tab | P | P | S | S |
| SB-55 available-now page | P | P | P | P |
| SB-56 RTL hero | P | — | P | — |

P = primary test locale, S = smoke check only

---

## DB Backend Matrix

| Scenario Group | mock | postgres | supabase |
|----------------|------|----------|---------|
| All SB-01–SB-65 | Required | Recommended | Optional |
| SB-16, SB-22, SB-23 (lesson creation) | Required | Required | Required |
| SB-27 (availability save) | Required | Required | Optional |

_All scenarios must pass against the `mock` backend (default CI environment). Scenarios involving data mutation (SB-16, SB-22–SB-23, SB-27) should additionally run against `postgres` to validate Server Actions and DB writes._

---

## Coverage Gaps vs Existing Tests

The following areas have thin coverage in existing `e2e/flows/booking-flow.spec.ts` and `e2e/flows/teacher-makeup.spec.ts`:

| Gap | Addressed By |
|-----|-------------|
| RTL calendar layout | SB-03 |
| Package guard (student no package) | SB-14 |
| Package guard bypass for admin | SB-15 |
| Premium-only filter | SB-11 |
| Urgency discount matrix | SB-65 |
| pending_slot auto-open | SB-24, SB-62 |
| Full pipeline unauthenticated → book | SB-63 |
| Teacher availability grid save | SB-27, SB-30 |
| Master schedule role guard | SB-51 |
| AI reschedule role restriction | SB-46 |
| Substitute assignment | SB-42 |
| Makeup balance scoping (parent) | SB-35 |
