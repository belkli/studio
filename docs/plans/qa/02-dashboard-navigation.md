# QA Plan: Dashboard & Navigation

**Domain:** Dashboard layout, sidebar navigation, header, per-persona routing, deep-linking, settings, DSAR, notifications, messages, What's New, profile, and responsive behaviour.

**Stack context:** Next.js 16 + next-intl (4 locales: he/en/ar/ru). Default locale Hebrew (`/`), others prefixed. Auth in dev bypass mode (proxy injects `site_admin`). 8 roles: student, parent, teacher, conservatorium_admin, site_admin, ministry_director, school_coordinator, delegated_admin.

---

## Coverage overview

| Area | Scenarios |
|---|---|
| Auth-gate & redirect | 1–4 |
| Dashboard root routing per role | 5–10 |
| Sidebar nav: admin groups | 11–13 |
| Sidebar nav: teacher groups | 14–15 |
| Sidebar nav: student groups | 16–17 |
| Sidebar nav: parent groups | 18–19 |
| Sidebar nav: ministry groups | 20 |
| Sidebar nav: school_coordinator | 21 |
| Sidebar nav: delegated_admin scoping | 22 |
| Sidebar collapsible groups | 23–24 |
| Sidebar active state | 25 |
| Sidebar footer (notifications bell, What's New badge, settings, help, logout) | 26–31 |
| Header (search, language switcher, user menu) | 32–35 |
| Mobile sidebar (hamburger) | 36–37 |
| Deep-linking / direct URL access | 38–40 |
| Dashboard home page (legacy / new-features) | 41–43 |
| Profile page (student only) | 44–45 |
| What's New feed | 46–47 |
| Notifications page (tabs, mark-all-read) | 48–52 |
| Messages page | 53–54 |
| Settings main page | 55–62 |
| Settings: notification preferences sub-page | 63–64 |
| Settings: conservatorium sub-pages (admin only) | 65–69 |
| Settings: calendar sub-page (admin only) | 70 |
| DSAR section (all roles) | 71–76 |
| RTL / LTR layout | 77–80 |
| Locale switching in dashboard | 81–84 |
| Mock data per-role display | 85–90 |

---

## Scenario 1 — Unauthenticated redirect to login

**Description:** Accessing any dashboard route without a session redirects to `/login`.

**Personas:** All (tested with no session cookie; production auth only).

**Preconditions:** `FIREBASE_SERVICE_ACCOUNT_KEY` set; no active session cookie.

**Steps:**
1. Navigate to `/en/dashboard`.
2. Observe URL.

**Expected results:**
- URL contains `/login`.
- Login page renders.

**DB backend:** [BOTH]

**Locales:** [ALL-LOCALES]

**Mock data needed:** None (unauthenticated).

---

## Scenario 2 — Dev-bypass grants dashboard access without credentials

**Description:** In dev mode (no `FIREBASE_SERVICE_ACCOUNT_KEY`), proxy injects `site_admin` claims and all dashboard routes render without login.

**Personas:** site_admin (synthetic, injected).

**Preconditions:** Dev server running; `FIREBASE_SERVICE_ACCOUNT_KEY` absent.

**Steps:**
1. Navigate to `/dashboard`.
2. Navigate to a protected route `/dashboard/admin`.

**Expected results:**
- No redirect to `/login`.
- `main` landmark visible.
- No error page title.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** `devUser` (`dev-user`, role `site_admin`) in `mockUsers` and `buildDefaultMemorySeed()`.

---

## Scenario 3 — 403 page for unauthorised direct URL access

**Description:** A student navigating directly to an admin-only URL receives a 403 or is redirected, not a blank page.

**Personas:** student.

**Preconditions:** Student logged in (production auth or role-override cookie).

**Steps:**
1. Authenticate as student.
2. Navigate to `/dashboard/admin` directly.

**Expected results:**
- Shows 403 page or redirects to student home.
- Does not show admin content.

**DB backend:** [BOTH]

**Locales:** [ALL-LOCALES]

**Mock data needed:** `student-user-1`, `conservatorium_id: cons-15`.

---

## Scenario 4 — Session expiry mid-session redirects to login

**Description:** After a session expires, the next navigation attempt redirects to `/login` with `callbackUrl`.

**Personas:** All.

**Preconditions:** Production auth; token manually invalidated.

**Steps:**
1. Invalidate Firebase token.
2. Click any sidebar navigation link.

**Expected results:**
- Redirect to `/login?callbackUrl=<original-path>`.
- After re-login, redirect back to original path.

**DB backend:** [BOTH]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Any authenticated user.

---

## Scenario 5 — `/dashboard` redirects admin to `/dashboard/admin`

**Description:** When `newFeaturesEnabled = true`, admin/site_admin landing on `/dashboard` are redirected to `/dashboard/admin`.

**Personas:** conservatorium_admin, site_admin.

**Preconditions:** `newFeaturesEnabled = true` for conservatorium.

**Steps:**
1. Navigate to `/dashboard`.
2. Wait for redirect.

**Expected results:**
- URL becomes `/dashboard/admin` (or locale-prefixed equivalent).
- Admin command centre content visible.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Any admin user with conservatorium that has `newFeaturesEnabled: true`.

---

## Scenario 6 — `/dashboard` redirects teacher to `/dashboard/teacher`

**Description:** Teacher is redirected to their personal dashboard.

**Personas:** teacher.

**Preconditions:** `newFeaturesEnabled = true`.

**Steps:**
1. Authenticate as teacher.
2. Navigate to `/dashboard`.

**Expected results:**
- URL becomes `/dashboard/teacher`.
- Teacher dashboard widget visible.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** `teacher-user-1` (מרים כהן).

---

## Scenario 7 — `/dashboard` redirects parent to `/dashboard/family`

**Personas:** parent.

**Preconditions:** `newFeaturesEnabled = true`.

**Steps:**
1. Authenticate as parent.
2. Navigate to `/dashboard`.

**Expected results:**
- URL becomes `/dashboard/family`.
- Family Hub content visible.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** `parent-user-1`.

---

## Scenario 8 — `/dashboard` redirects student to `/dashboard/profile`

**Personas:** student.

**Preconditions:** `newFeaturesEnabled = true`.

**Steps:**
1. Authenticate as student.
2. Navigate to `/dashboard`.

**Expected results:**
- URL becomes `/dashboard/profile`.
- Student profile content visible.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** `student-user-1`.

---

## Scenario 9 — `/dashboard` redirects ministry director to `/dashboard/ministry`

**Personas:** ministry_director.

**Preconditions:** `newFeaturesEnabled = true`.

**Steps:**
1. Authenticate as ministry_director.
2. Navigate to `/dashboard`.

**Expected results:**
- URL becomes `/dashboard/ministry`.
- Ministry dashboard content visible.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** ministry_director user (mock or real).

---

## Scenario 10 — `/dashboard` redirects school_coordinator to `/dashboard/school`

**Personas:** school_coordinator.

**Preconditions:** `newFeaturesEnabled = true`.

**Steps:**
1. Authenticate as school_coordinator.
2. Navigate to `/dashboard`.

**Expected results:**
- URL becomes `/dashboard/school`.
- School coordinator dashboard visible.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** school_coordinator mock user.

---

## Scenario 11 — Admin sidebar shows all 7 nav groups

**Description:** Admin user sees: Overview, People, Schedule & Ops, Programs & Events, Finance, Intelligence, Communication — plus footer items (What's New, Settings, Help, Logout).

**Personas:** conservatorium_admin, site_admin.

**Preconditions:** Logged in as admin.

**Steps:**
1. Navigate to `/dashboard/admin`.
2. Inspect sidebar for group labels and all expected links.

**Expected results:**
- `groupOverview` group visible with: Dashboard, Announcements.
- `groupPeople` group visible with: User Management, New Registration, Approvals, Substitute, Scholarships.
- `groupScheduleOps` with: Master Schedule, Admin Makeups, Waitlists.
- `groupProgramsEvents` with: Events, Open Day, Performances, Rentals, Branches, Playing School.
- `groupFinance` with: Billing, Teacher Payroll.
- `groupIntelligence` (default collapsed) with: Reports, AI Agents, Form Builder, Ministry Export.
- `groupCommunication` with: Messages, Forms, Notifications, Alumni.
- Footer: What's New, Settings, Help, Logout.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Any admin user.

---

## Scenario 12 — Admin sidebar group `Intelligence` is collapsed by default

**Description:** The `groupIntelligence` group has `defaultCollapsed: true` and should start closed.

**Personas:** conservatorium_admin, site_admin.

**Preconditions:** Fresh page load (no localStorage state saved).

**Steps:**
1. Navigate to `/dashboard/admin`.
2. Inspect sidebar — find the Intelligence group label.

**Expected results:**
- Reports, AI Agents, Form Builder, Ministry Export items are NOT visible.
- The chevron icon points left (collapsed state).

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** Admin user.

---

## Scenario 13 — Admin sidebar group expand/collapse toggles on click and keyboard

**Description:** Clicking or pressing Enter/Space on a group label toggles its collapsed state.

**Personas:** conservatorium_admin.

**Preconditions:** On `/dashboard/admin`. Intelligence group collapsed.

**Steps:**
1. Click the Intelligence group label.
2. Verify items appear.
3. Press Enter on the group label.
4. Verify items collapse.
5. Press Space on the group label.
6. Verify items appear again.

**Expected results:**
- Each interaction toggles `aria-expanded` attribute between `true` / `false`.
- Child items show/hide accordingly.

**DB backend:** [MEMORY]

**Locales:** [he, en]

**Mock data needed:** Admin user.

---

## Scenario 14 — Teacher sidebar shows 4 nav groups

**Description:** Teacher sees: My Workspace, My Profile, My Finances, Community.

**Personas:** teacher.

**Preconditions:** Logged in as teacher.

**Steps:**
1. Navigate to `/dashboard/teacher`.
2. Inspect sidebar.

**Expected results:**
- `groupMyWorkspace`: Teacher Dashboard, Schedule, Approvals.
- `groupMyProfile`: Teacher Profile, Performance Profile, My Availability.
- `groupMyFinances`: Payroll, My Reports.
- `groupCommunity`: Messages, Forms, Notifications, Alumni.
- Footer: What's New, Settings, Help, Logout.
- No admin-only groups (Overview, People, Finance, Intelligence) visible.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** `teacher-user-1`.

---

## Scenario 15 — Teacher does NOT see student/parent/ministry groups

**Personas:** teacher.

**Steps:**
1. Navigate to `/dashboard/teacher`.
2. Look for "My Family", "My Learning", "Ministry" group labels.

**Expected results:**
- None of those groups appear in the sidebar.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** `teacher-user-1`.

---

## Scenario 16 — Student sidebar shows 4 nav groups

**Description:** Student sees: My Learning, Practice, Logistics, Community.

**Personas:** student.

**Preconditions:** Logged in as student.

**Steps:**
1. Navigate to `/dashboard/profile`.
2. Inspect sidebar groups.

**Expected results:**
- `groupMyLearning`: My Profile, Schedule, Progress.
- `groupPractice`: Practice Log, AI Coach.
- `groupLogistics`: Makeups, AI Assistant, Billing, Scholarships, Forms.
- `groupCommunity`: Messages, Notifications, Alumni.
- No admin-only or teacher-only groups visible.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** `student-user-1`.

---

## Scenario 17 — Student does NOT see teacher/admin/parent/ministry groups

**Personas:** student.

**Steps:**
1. Navigate to `/dashboard/profile`.
2. Look for admin and teacher group labels.

**Expected results:**
- None of "Overview", "People", "My Workspace", "My Family" appear.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** `student-user-1`.

---

## Scenario 18 — Parent sidebar shows 5 nav groups

**Description:** Parent sees: My Family, Child Progress, Parent Tools, Finance & Admin, Community.

**Personas:** parent.

**Preconditions:** Logged in as parent.

**Steps:**
1. Navigate to `/dashboard/family`.
2. Inspect sidebar.

**Expected results:**
- `groupMyFamily`: My Family, Schedule.
- `groupChildProgress`: Progress, Practice Log.
- `groupParentTools`: AI Coach, AI Assistant.
- `groupFinanceAdmin`: Billing, Makeups, Scholarships, Forms.
- `groupCommunity`: Messages, Notifications, Alumni.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** `parent-user-1` (linked to children in cons-15).

---

## Scenario 19 — Parent does NOT see teacher or admin groups

**Personas:** parent.

**Steps:**
1. Navigate to `/dashboard/family`.
2. Confirm absence of admin/teacher-specific links.

**Expected results:**
- No "User Management", "Teacher Dashboard", "Payroll", "Master Schedule".

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** `parent-user-1`.

---

## Scenario 20 — Ministry sidebar shows Ministry Overview group only

**Description:** ministry_director sees Ministry Overview with: Ministry, Ministry Repertoire.

**Personas:** ministry_director.

**Preconditions:** Logged in as ministry_director.

**Steps:**
1. Navigate to `/dashboard/ministry`.
2. Inspect sidebar.

**Expected results:**
- `groupMinistryOverview` group contains Ministry (Landmark icon) and Ministry Repertoire (BookOpen icon).
- No student/teacher/admin/parent-only groups.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** ministry_director mock user.

---

## Scenario 21 — School coordinator sidebar shows My School group

**Personas:** school_coordinator.

**Preconditions:** Logged in as school_coordinator.

**Steps:**
1. Navigate to `/dashboard/school`.
2. Inspect sidebar.

**Expected results:**
- `groupMySchool` group with: My School (School icon).
- No other role-specific groups.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** school_coordinator mock user.

---

## Scenario 22 — Delegated admin sees only permitted sections

**Description:** A `delegated_admin` with `delegatedAdminPermissions: ['users', 'approvals']` should only see sidebar items matching those sections.

**Personas:** delegated_admin.

**Preconditions:** User has `delegatedAdminPermissions` set to a subset (e.g., `['users', 'approvals']`).

**Steps:**
1. Authenticate as delegated_admin.
2. Navigate to `/dashboard`.
3. Inspect sidebar items.

**Expected results:**
- Only User Management (`users`) and Approvals (`approvals`) links visible in relevant groups.
- Items with `section` values not in the permitted set are hidden.
- Items with no `section` defined still show.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** delegated_admin mock user with restricted `delegatedAdminPermissions`.

---

## Scenario 23 — Collapsed group hides its items from DOM visibility

**Preconditions:** Any admin user. Intelligence group is collapsed.

**Steps:**
1. Navigate to `/dashboard/admin`.
2. Try to find "Reports" link inside Intelligence group.

**Expected results:**
- "Reports" link is not visible (group collapsed; items hidden with conditional render).
- `aria-expanded="false"` on group label.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** Admin user.

---

## Scenario 24 — Expanding collapsed group reveals all child items

**Steps:**
1. Navigate to `/dashboard/admin`.
2. Click the Intelligence group label to expand.
3. Verify all 4 child links appear: Reports, AI Agents, Form Builder, Ministry Export.

**Expected results:**
- All 4 items visible.
- `aria-expanded="true"`.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** Admin user.

---

## Scenario 25 — Active sidebar item highlighted on current route

**Description:** The `SidebarMenuButton` sets `isActive=true` for the current path; `aria-current="page"` set on the active link.

**Personas:** Any.

**Steps:**
1. Navigate to `/dashboard/schedule`.
2. Check the sidebar "Schedule" link.

**Expected results:**
- "Schedule" button has `data-active="true"` or equivalent active styling.
- `aria-current="page"` attribute present on the active `<a>` element.
- Other links do not have active styling.

**DB backend:** [MEMORY]

**Locales:** [he, en]

**Mock data needed:** Student or teacher user.

---

## Scenario 26 — Notification bell shows unread badge count

**Description:** The notification bell button in the sidebar footer shows a red badge with the count of unread notifications.

**Personas:** Any user with unread notifications.

**Preconditions:** User has at least 1 unread notification.

**Steps:**
1. Navigate to `/dashboard`.
2. Inspect the Bell button in sidebar footer.

**Expected results:**
- Red badge with count visible.
- `aria-label` on button includes the count: e.g., "התראות (3)".

**DB backend:** [MEMORY]

**Locales:** [he, en]

**Mock data needed:** `student-user-1` or any user with `notifications` array containing unread items.

---

## Scenario 27 — Notification dropdown opens and shows items

**Description:** Clicking the bell opens a dropdown with the 5 most recent notifications.

**Personas:** Any.

**Preconditions:** User has at least 1 notification.

**Steps:**
1. Click the bell button in sidebar footer.
2. Observe dropdown content.

**Expected results:**
- Dropdown opens with notification list.
- Each item shows title, message snippet, and relative time.
- "View all" link at the bottom navigates to `/dashboard/notifications`.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** User with 3+ notifications.

---

## Scenario 28 — Opening notification dropdown marks all notifications as read

**Description:** When the dropdown opens (`onOpenChange` handler fires), all notifications are marked read.

**Personas:** Any.

**Preconditions:** User has unread notifications.

**Steps:**
1. Note unread badge count.
2. Click bell to open dropdown.
3. Close dropdown.
4. Check badge.

**Expected results:**
- After opening, badge disappears (count = 0).
- All notifications updated to `read: true`.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** User with at least 1 unread notification.

---

## Scenario 29 — What's New badge shows for first-time users

**Description:** When `user.hasSeenNewFeatures` is `false`, a "New" badge appears next to the What's New link.

**Personas:** Any.

**Preconditions:** `user.hasSeenNewFeatures = false`.

**Steps:**
1. Navigate to `/dashboard`.
2. Inspect What's New sidebar button.

**Expected results:**
- Badge with "new" label visible next to "What's New".

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Mock user with `hasSeenNewFeatures: false`.

---

## Scenario 30 — Help button triggers AI help assistant

**Description:** Clicking the Help (?) button in the sidebar footer fires `window.openHelpAssistant()`.

**Personas:** Any.

**Steps:**
1. Navigate to `/dashboard`.
2. Click "Help" button (id `sidebar-help-button`).

**Expected results:**
- `window.openHelpAssistant` is invoked.
- (If not registered: no crash, no navigation.)

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** Any authenticated user.

---

## Scenario 31 — Logout button logs out and redirects to home

**Description:** Clicking Logout in sidebar clears session and redirects to `/`.

**Personas:** All.

**Steps:**
1. Navigate to `/dashboard`.
2. Click the Logout button.

**Expected results:**
- User is redirected to `/` (home, not `/login`).
- Dashboard routes redirect to `/login` on subsequent visit (production auth).

**DB backend:** [BOTH]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Any authenticated user.

---

## Scenario 32 — Header search input is visible and accepts text

**Personas:** All.

**Steps:**
1. Navigate to `/dashboard`.
2. Locate the search input in the header.
3. Type a query.

**Expected results:**
- Input accepts text.
- No errors thrown.
- (Search functionality may be placeholder — acceptable if no crash.)

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Any user.

---

## Scenario 33 — Header language switcher changes locale

**Personas:** All.

**Steps:**
1. Navigate to `/en/dashboard`.
2. Click the language switcher.
3. Select Hebrew.

**Expected results:**
- URL changes to `/dashboard` (Hebrew root, no prefix).
- Page re-renders in Hebrew.
- Text direction switches to RTL.

**DB backend:** [MEMORY]

**Locales:** [en → he, he → en, he → ar, he → ru]

**Mock data needed:** Any user.

---

## Scenario 34 — Header user menu shows correct user name and links

**Personas:** All.

**Steps:**
1. Navigate to `/dashboard`.
2. Click the avatar button in the header.
3. Inspect dropdown items.

**Expected results:**
- Dropdown label shows the current user's name.
- "Profile" and "Settings" links both navigate to `/dashboard/settings`.
- "Logout" item present.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Any user.

---

## Scenario 35 — Header notification bell button renders

**Personas:** All.

**Steps:**
1. Navigate to `/dashboard`.
2. Find Bell button in header.

**Expected results:**
- Bell button visible with `sr-only` label for screen readers.
- No JavaScript error.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** Any user.

---

## Scenario 36 — Mobile sidebar opens via hamburger (SidebarTrigger)

**Description:** On viewport < md breakpoint, the sidebar is hidden; a SidebarTrigger button opens it.

**Personas:** All.

**Preconditions:** Viewport set to 375×812 (mobile).

**Steps:**
1. Set viewport to 375×812.
2. Navigate to `/dashboard`.
3. Click the SidebarTrigger button.

**Expected results:**
- Sidebar becomes visible (slides in).
- Navigation links accessible.

**DB backend:** [MEMORY]

**Locales:** [he, en]

**Mock data needed:** Any user.

---

## Scenario 37 — Mobile sidebar closes when a nav link is clicked

**Preconditions:** Mobile viewport; sidebar is open.

**Steps:**
1. With sidebar open, click any navigation link.

**Expected results:**
- Navigation happens.
- Sidebar closes.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** Any user.

---

## Scenario 38 — Deep link to nested admin page works

**Description:** Navigating directly to `/dashboard/admin/branches` renders the branches page without landing on root first.

**Personas:** site_admin (dev bypass).

**Steps:**
1. Navigate directly to `/dashboard/admin/branches`.

**Expected results:**
- Page renders without `/login` redirect.
- Branches content visible.
- Sidebar branch link has active styling.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** Admin user.

---

## Scenario 39 — Deep link with locale prefix works

**Description:** `/en/dashboard/settings` renders the settings page in English.

**Personas:** Any (dev bypass).

**Steps:**
1. Navigate to `/en/dashboard/settings`.

**Expected results:**
- Settings page renders in English.
- No `/login` redirect.
- LTR layout.

**DB backend:** [MEMORY]

**Locales:** [en, ar, ru]

**Mock data needed:** Any user.

---

## Scenario 40 — Deep link to settings sub-pages renders correctly

**Description:** Each settings sub-page can be accessed directly via URL.

**Personas:** conservatorium_admin (dev bypass).

**Steps:**
1. Navigate to each of:
   - `/dashboard/settings/notifications`
   - `/dashboard/settings/conservatorium`
   - `/dashboard/settings/conservatorium/profile`
   - `/dashboard/settings/pricing`
   - `/dashboard/settings/cancellation`
   - `/dashboard/settings/instruments`
   - `/dashboard/settings/packages`
   - `/dashboard/settings/calendar`

**Expected results:**
- Each page renders without error.
- "Back to Settings" breadcrumb/button navigates to `/dashboard/settings`.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** Admin user.

---

## Scenario 41 — Dashboard root in legacy mode (newFeaturesEnabled = false)

**Description:** When `newFeaturesEnabled = false`, `/dashboard` shows the legacy overview page with OverviewCards, RecentForms, and WhatsNewFeed instead of redirecting.

**Personas:** Any.

**Preconditions:** Conservatorium has `newFeaturesEnabled: false`.

**Steps:**
1. Set conservatorium `newFeaturesEnabled = false`.
2. Navigate to `/dashboard`.

**Expected results:**
- No redirect occurs.
- `h1` greeting visible with user's first name.
- Overview cards visible.
- "New Form" button visible (for non-ministry roles).

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Any user; conservatorium with `newFeaturesEnabled: false`.

---

## Scenario 42 — Dashboard root legacy mode sidebar shows legacy flat nav

**Preconditions:** `newFeaturesEnabled = false`.

**Steps:**
1. Navigate to `/dashboard`.
2. Inspect sidebar.

**Expected results:**
- Flat list of links (not grouped).
- Only role-appropriate links shown.
- Logout button in footer.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** Admin or student user; `newFeaturesEnabled: false`.

---

## Scenario 43 — Dashboard welcome title uses user's first name

**Preconditions:** `newFeaturesEnabled = false`.

**Steps:**
1. Navigate to `/dashboard`.

**Expected results:**
- Heading contains user's first name (first word of `user.name`).

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Any user with a multi-word name.

---

## Scenario 44 — Student profile page shows correct content

**Personas:** student.

**Steps:**
1. Navigate to `/dashboard/profile`.

**Expected results:**
- Student profile content renders (not blank).
- WaitlistOfferBanner may or may not appear depending on waitlist state.
- Skeleton shown during loading then replaced with content.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** `student-user-1` with lesson history and active package.

---

## Scenario 45 — Non-student on `/dashboard/profile` returns null/blank

**Description:** The profile page guards `user.role !== 'student'` and returns null.

**Personas:** teacher, parent, admin.

**Steps:**
1. Authenticate as teacher.
2. Navigate directly to `/dashboard/profile`.

**Expected results:**
- Page renders blank (returns null) or redirects.
- No crash.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** `teacher-user-1`.

---

## Scenario 46 — What's New page renders feed

**Personas:** All.

**Steps:**
1. Navigate to `/dashboard/whats-new`.

**Expected results:**
- H1 heading visible.
- WhatsNewFeed component renders.
- No redirect to `/403`.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Any authenticated user.

---

## Scenario 47 — What's New unauthenticated redirects to `/403`

**Preconditions:** No user session (production auth).

**Steps:**
1. Navigate to `/dashboard/whats-new` without session.

**Expected results:**
- Redirect to `/403` (not to `/login` for this page).

**DB backend:** [BOTH]

**Locales:** [he]

**Mock data needed:** None.

---

## Scenario 48 — Notifications page renders with All tab selected by default

**Personas:** All.

**Steps:**
1. Navigate to `/dashboard/notifications`.

**Expected results:**
- H1 heading visible.
- "All" tab active by default.
- Notification items listed (most recent first).
- "Mark all read" button visible.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** User with 3+ mixed read/unread notifications.

---

## Scenario 49 — Notifications page Unread tab filters correctly

**Steps:**
1. Navigate to `/dashboard/notifications`.
2. Click "Unread" tab.

**Expected results:**
- Only unread notifications shown.
- Unread count badge visible on "Unread" tab.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** User with mixed read/unread notifications.

---

## Scenario 50 — Mark all read disables button when no unread

**Steps:**
1. Navigate to `/dashboard/notifications`.
2. Click "Mark all read".
3. Check button state.

**Expected results:**
- Button becomes `disabled` after all notifications are marked read.
- All notification items change to read styling.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** User with unread notifications.

---

## Scenario 51 — Notifications empty state shown when no notifications

**Preconditions:** User has zero notifications.

**Steps:**
1. Navigate to `/dashboard/notifications`.

**Expected results:**
- EmptyState component visible with appropriate message.
- No error.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** User with `notifications: []`.

---

## Scenario 52 — Notification item links navigate to correct page

**Steps:**
1. Navigate to `/dashboard/notifications`.
2. Click on a notification item.

**Expected results:**
- Browser navigates to the URL stored in `notification.link`.
- No error.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** User with notification that has a valid `link` (e.g., `/dashboard/schedule`).

---

## Scenario 53 — Messages page renders MessagingInterface

**Personas:** All.

**Steps:**
1. Navigate to `/dashboard/messages`.

**Expected results:**
- H1 heading visible.
- MessagingInterface component renders (lazy-loaded; skeleton shown first).
- No error.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Any user with conversations in mock data.

---

## Scenario 54 — Messages page RTL layout

**Personas:** Any (Hebrew locale).

**Steps:**
1. Navigate to `/he/dashboard/messages` (or default `he`).

**Expected results:**
- `dir="rtl"` on outer container.
- MessagingInterface chat bubbles align to correct side.

**DB backend:** [MEMORY]

**Locales:** [he, ar]

**Mock data needed:** Any user.

---

## Scenario 55 — Settings page loads for all roles

**Personas:** student, parent, teacher, conservatorium_admin, site_admin, ministry_director.

**Steps:**
1. Navigate to `/dashboard/settings`.

**Expected results:**
- Page renders without error.
- Profile card, Password card, Linked Accounts card, Language Preference card, Notifications card, and DSAR card all visible.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Each role has a corresponding mock user.

---

## Scenario 56 — Settings profile form saves and shows success toast

**Personas:** Any.

**Steps:**
1. Navigate to `/dashboard/settings`.
2. Edit the Name field.
3. Click "Save Profile".

**Expected results:**
- Success toast appears with the success title/description keys.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Any user.

---

## Scenario 57 — Settings password form shows success toast

**Steps:**
1. Navigate to `/dashboard/settings`.
2. Fill current and new password fields.
3. Click "Update Password".

**Expected results:**
- Success toast appears.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** Any user.

---

## Scenario 58 — Settings language preference selector changes locale and navigates

**Steps:**
1. Navigate to `/he/dashboard/settings`.
2. Change language selector to "English".
3. Click "Save".

**Expected results:**
- `updatePreferredLanguageAction` is called.
- Success toast appears.
- Page navigates to `/en/dashboard/settings`.

**DB backend:** [MEMORY]

**Locales:** [he → en, en → ar]

**Mock data needed:** Any user.

---

## Scenario 59 — Teacher sees Spoken Languages card in Settings

**Personas:** teacher.

**Steps:**
1. Navigate to `/dashboard/settings`.

**Expected results:**
- Spoken Languages card visible.
- 4 checkboxes: HE, EN, AR, RU.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** `teacher-user-1`.

---

## Scenario 60 — Teacher toggles spoken language and sees success toast

**Personas:** teacher.

**Steps:**
1. Navigate to `/dashboard/settings`.
2. Click on a language checkbox to toggle it.

**Expected results:**
- Toast "Saved" appears.
- `user.spokenLanguages` updated in auth context.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** `teacher-user-1`.

---

## Scenario 61 — Non-teacher does NOT see Spoken Languages card

**Personas:** student, parent, admin.

**Steps:**
1. Navigate to `/dashboard/settings`.
2. Look for Spoken Languages card.

**Expected results:**
- Card is not present.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** `student-user-1`.

---

## Scenario 62 — Admin sees Conservatorium section in Settings

**Personas:** conservatorium_admin, site_admin.

**Steps:**
1. Navigate to `/dashboard/settings`.
2. Look for Conservatorium settings card.

**Expected results:**
- "Conservatorium" card visible.
- "Public Profile" button links to `/dashboard/settings/conservatorium/profile`.
- If `newFeaturesEnabled`: additional buttons for Manage Features, Pricing, Cancellation, Instruments, Packages, AI.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Admin user.

---

## Scenario 63 — Notification preferences settings sub-page renders

**Personas:** All.

**Steps:**
1. Navigate to `/dashboard/settings`.
2. Click "Manage notifications" button.
3. Verify navigation to `/dashboard/settings/notifications`.

**Expected results:**
- Notifications settings page loads.
- H1 heading visible.
- Back button to "Settings" present.
- `NotificationPreferences` component renders.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Any user.

---

## Scenario 64 — Back button on notification settings returns to Settings

**Steps:**
1. Navigate to `/dashboard/settings/notifications`.
2. Click the back button / "Settings" breadcrumb link.

**Expected results:**
- Navigates back to `/dashboard/settings`.
- RTL: Back icon is ChevronRight; LTR: ChevronLeft.

**DB backend:** [MEMORY]

**Locales:** [he, en]

**Mock data needed:** Any user.

---

## Scenario 65 — Conservatorium settings page admin-only guard

**Personas:** conservatorium_admin, site_admin.

**Steps:**
1. Navigate to `/dashboard/settings/conservatorium`.

**Expected results:**
- Page renders with "Feature Management" toggle card.
- "Custom Registration Terms" card with 4 locale text areas.
- Standard terms expand/collapse accordion.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Admin user with `conservatoriumId` pointing to a valid mock conservatorium.

---

## Scenario 66 — Non-admin on conservatorium settings sees access denied

**Personas:** student, parent, teacher.

**Steps:**
1. Navigate to `/dashboard/settings/conservatorium`.

**Expected results:**
- Shows "אין לך הרשאה לגשת לעמוד זה" (no permission) or returns null.
- No admin content visible.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** `student-user-1`.

---

## Scenario 67 — Conservatorium feature toggle triggers reload after 1500ms

**Personas:** conservatorium_admin.

**Steps:**
1. Navigate to `/dashboard/settings/conservatorium`.
2. Toggle the "Enable Lyriosa system" switch.

**Expected results:**
- Toast appears: "features enabled/disabled".
- Page reloads after ~1500ms.
- After reload, feature state reflects new value.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** Admin user with a conservatorium.

---

## Scenario 68 — Save custom terms persists per-locale text

**Personas:** conservatorium_admin.

**Steps:**
1. Navigate to `/dashboard/settings/conservatorium`.
2. Enter text in the Hebrew custom terms field.
3. Click "Save custom terms".

**Expected results:**
- Toast "Terms saved" appears.
- `updateConservatorium` called with `customRegistrationTerms.he` set.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** Admin user with conservatorium.

---

## Scenario 69 — Conservatorium profile sub-page loads

**Personas:** conservatorium_admin, site_admin.

**Steps:**
1. Navigate to `/dashboard/settings/conservatorium/profile`.

**Expected results:**
- Page renders public profile editor.
- No error or blank page.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Admin user.

---

## Scenario 70 — Calendar settings sub-page admin-only guard

**Personas:** conservatorium_admin, site_admin.

**Steps:**
1. Navigate to `/dashboard/settings/calendar`.

**Expected results:**
- `AdminCalendarPanel` renders.
- Back to "Settings" button visible.

**Roles that should see nothing:** student, teacher, parent, ministry_director — the page returns `null`.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** Admin user.

---

## Scenario 71 — DSAR section visible in settings for ALL roles

**Description:** Privacy & Data card is always shown regardless of role.

**Personas:** student, parent, teacher, conservatorium_admin, site_admin, ministry_director.

**Steps:**
1. Navigate to `/dashboard/settings`.
2. Scroll to find DSAR heading.

**Expected results:**
- DSAR card heading present (translations: "פרטיות ונתונים" / "Privacy & Data").
- All 3 DSAR action rows visible.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** One user per role.

---

## Scenario 72 — DSAR: Export Data button triggers success toast

**Steps:**
1. Navigate to `/dashboard/settings`.
2. Click the "Export My Data" / "ייצוא הנתונים שלי" button.

**Expected results:**
- Toast notification appears with export success message.
- No navigation or error.

**DB backend:** [MEMORY]

**Locales:** [he, en]

**Mock data needed:** Any user.

---

## Scenario 73 — DSAR: Request Data Deletion button triggers destructive toast

**Steps:**
1. Navigate to `/dashboard/settings`.
2. Click the "Request Data Deletion" / "בקשת מחיקת נתונים" button.

**Expected results:**
- Destructive-variant toast appears with deletion request message.

**DB backend:** [MEMORY]

**Locales:** [he, en]

**Mock data needed:** Any user.

---

## Scenario 74 — DSAR: Withdraw Consent button triggers toast

**Steps:**
1. Navigate to `/dashboard/settings`.
2. Click the "Withdraw Consent" / "ביטול הסכמה לעיבוד נתונים" button.

**Expected results:**
- Toast appears confirming consent withdrawal.

**DB backend:** [MEMORY]

**Locales:** [he, en]

**Mock data needed:** Any user.

---

## Scenario 75 — DSAR: All 3 action buttons present simultaneously

**Steps:**
1. Navigate to `/dashboard/settings`.
2. Verify presence of all three buttons without scrolling past the DSAR card.

**Expected results:**
- Export, Delete, Withdraw buttons all rendered in the DSAR card.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** Any user.

---

## Scenario 76 — DSAR toast localization

**Description:** Toast messages for DSAR actions render in the correct locale.

**Steps:**
1. Navigate to `/en/dashboard/settings`.
2. Click each DSAR button.

**Expected results:**
- Toast messages appear in English.
- No untranslated keys (no raw key strings like `DSAR.exportButton`).

**DB backend:** [MEMORY]

**Locales:** [en, ar, ru]

**Mock data needed:** Any user.

---

## Scenario 77 — RTL layout: Hebrew locale sidebar is right-side or LTR agnostic

**Description:** Sidebar uses logical CSS (`ms-`, `me-`, `ps-`, `pe-`) and renders correctly in RTL.

**Personas:** Any.

**Steps:**
1. Navigate to `/he/dashboard` (default Hebrew).
2. Inspect layout direction.

**Expected results:**
- `dir="rtl"` on page container.
- Sidebar text and icons appear on correct side.
- Navigation links readable, no overflow.

**DB backend:** [MEMORY]

**Locales:** [he, ar]

**Mock data needed:** Any user.

---

## Scenario 78 — Arabic locale (ar) renders full RTL dashboard

**Steps:**
1. Navigate to `/ar/dashboard`.

**Expected results:**
- All dashboard pages render in Arabic with RTL layout.
- No missing translations (fallback to Hebrew permitted but not raw keys).
- Chevron icons in breadcrumbs point the right direction (reversed vs LTR).

**DB backend:** [MEMORY]

**Locales:** [ar]

**Mock data needed:** Any user.

---

## Scenario 79 — LTR locale: English sidebar chevrons point correct direction

**Steps:**
1. Navigate to `/en/dashboard/settings/notifications`.
2. Inspect the back-button icon.

**Expected results:**
- Back icon is ChevronLeft (LTR).
- In `he`/`ar` the same button shows ChevronRight.

**DB backend:** [MEMORY]

**Locales:** [en, he]

**Mock data needed:** Any user.

---

## Scenario 80 — Russian locale (ru) renders dashboard without crash

**Steps:**
1. Navigate to `/ru/dashboard`.

**Expected results:**
- No crash or JavaScript error.
- At least one heading/content visible.
- Language switcher shows "Русский" as current.

**DB backend:** [MEMORY]

**Locales:** [ru]

**Mock data needed:** Any user.

---

## Scenario 81 — Language switcher in header persists locale across navigation

**Steps:**
1. Navigate to `/en/dashboard`.
2. Click a sidebar navigation link (e.g., Settings).

**Expected results:**
- URL includes `/en/` prefix throughout.
- Locale does not reset to Hebrew on nav.

**DB backend:** [MEMORY]

**Locales:** [en, ar, ru]

**Mock data needed:** Any user.

---

## Scenario 82 — Language preference saved and page re-renders in new locale

**Description:** After saving language preference in Settings, route replaces to the new locale path.

**Steps:**
1. Navigate to `/he/dashboard/settings`.
2. Change preferred language to English.
3. Click "Save".

**Expected results:**
- `router.replace('/dashboard/settings', { locale: 'en' })` fires.
- Page now at `/en/dashboard/settings`.
- All text in English.

**DB backend:** [MEMORY]

**Locales:** [he → en]

**Mock data needed:** Any user.

---

## Scenario 83 — All settings sub-pages include Back to Settings link with correct locale

**Steps:**
1. Navigate to `/en/dashboard/settings/notifications`.
2. Click the Back to Settings link.

**Expected results:**
- Navigates to `/en/dashboard/settings` (locale preserved).

**DB backend:** [MEMORY]

**Locales:** [en, ar, ru]

**Mock data needed:** Any user.

---

## Scenario 84 — All dashboard routes smoke-pass all 4 locales

**Description:** All routes in the smoke suite must render in all 4 locales without 404 or error title.

**Personas:** site_admin (dev bypass).

**Steps:**
1. For each route in `DASHBOARD_ROUTES` (smoke.spec.ts), navigate with each locale prefix: `/`, `/en/`, `/ar/`, `/ru/`.

**Expected results:**
- HTTP 200 (or 200-redirect).
- No title containing "error" or "404".
- At least one visible heading or `main` landmark.

**DB backend:** [MEMORY]

**Locales:** [ALL-LOCALES]

**Mock data needed:** Full mock seed data loaded.

---

## Scenario 85 — Student mock data populates schedule page

**Personas:** student.

**Steps:**
1. Authenticate as `student-user-1`.
2. Navigate to `/dashboard/schedule`.

**Expected results:**
- At least one lesson visible in the weekly calendar.
- Lesson details include teacher name, instrument, time.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** `student-user-1` (cons-15), lessons `lesson-4..lesson-13`, teacher `teacher-user-1`.

---

## Scenario 86 — Parent mock data populates family hub

**Personas:** parent.

**Steps:**
1. Authenticate as `parent-user-1`.
2. Navigate to `/dashboard/family`.

**Expected results:**
- At least one child card visible.
- Child progress data shown.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** `parent-user-1`, children from `cons-15` and `cons-66`.

---

## Scenario 87 — Admin command centre shows key metrics

**Personas:** conservatorium_admin, site_admin.

**Steps:**
1. Navigate to `/dashboard/admin`.

**Expected results:**
- Key metrics bar shows: total students, lessons this week, pending approvals count, revenue summary.

**DB backend:** [MEMORY]

**Locales:** [he, en]

**Mock data needed:** Full seed with 85 conservatoriums, 6 students, 4 parents, 13+ lessons.

---

## Scenario 88 — Ministry mock data populates ministry page

**Personas:** ministry_director.

**Steps:**
1. Navigate to `/dashboard/ministry`.

**Expected results:**
- Ministry inbox panel or overview visible.
- At least one heading visible.

**DB backend:** [MEMORY]

**Locales:** [he]

**Mock data needed:** ministry_director user; repertoire data.

---

## Scenario 89 — Teacher dashboard shows today's lesson snapshot

**Personas:** teacher.

**Steps:**
1. Authenticate as `teacher-user-1`.
2. Navigate to `/dashboard/teacher`.

**Expected results:**
- "Today's Snapshot" card visible.
- Lessons scheduled for today shown (or empty state if none).

**DB backend:** [MEMORY]

**Locales:** [he, en]

**Mock data needed:** `teacher-user-1` with lessons in `lesson-4..13` on current date range.

---

## Scenario 90 — Postgres backend parity: dashboard routes render same content as memory

**Description:** All user-facing dashboard pages must show the same structure and non-zero content when using Postgres backend as when using Memory backend.

**Personas:** site_admin, student, teacher, parent.

**Steps:**
1. Run dev server with `DB_BACKEND=postgres` and valid seed data.
2. Navigate to each persona's home dashboard.

**Expected results:**
- Content structure identical to memory mode.
- No blank pages or "no data" states that differ from memory mode.
- No JS errors in console.

**DB backend:** [POSTGRES]

**Locales:** [he]

**Mock data needed:** Postgres seed applied via `scripts/db/seed.sql`.

---

## Mock data matrix

| Role | Mock user ID | Conservatorium | Has notifications | Has lessons | Notes |
|---|---|---|---|---|---|
| site_admin | dev-user | any | optional | optional | dev bypass |
| conservatorium_admin | teacher-user-X + admin flag | cons-15 | yes | no | |
| teacher | teacher-user-1 | cons-15 | yes | yes (lesson-4..13) | isPremiumTeacher |
| student | student-user-1 | cons-15 | yes | yes | active package |
| parent | parent-user-1 | cons-15 | yes | via children | linked to student-user-1..3 |
| ministry_director | (mock) | N/A | no | no | needs mock user creation |
| school_coordinator | (mock) | N/A | no | no | needs mock user creation |
| delegated_admin | (mock) | cons-15 | no | no | delegatedAdminPermissions subset |

---

## Existing test coverage (gaps)

The following scenarios have **no existing test** coverage and should be prioritized for new E2E tests:

- SCN-3: Role-based 403 enforcement (production auth required).
- SCN-4: Session expiry mid-session.
- SCN-13: Keyboard accessibility for collapsible nav groups.
- SCN-22: Delegated admin scoping of sidebar items.
- SCN-28: Notification dropdown marks-as-read on open.
- SCN-29: What's New badge for first-time users.
- SCN-33: Header language switcher locale switch.
- SCN-36–37: Mobile sidebar open/close.
- SCN-42: Legacy sidebar flat-nav rendering.
- SCN-45: Non-student on `/dashboard/profile` returns null.
- SCN-67: Conservatorium feature toggle + reload.
- SCN-77–80: Full RTL/LTR per-locale rendering.
- SCN-84: Cross-locale smoke suite (already in smoke.spec.ts for single locale, not all 4).
- SCN-90: Postgres backend parity.

Existing covered scenarios (partial): SCN-2, SCN-5/6/7/8/9, SCN-11 (routes only, not structure), SCN-14, SCN-16, SCN-18, SCN-20, SCN-38, SCN-39, SCN-40 (partial), SCN-46, SCN-48, SCN-53, SCN-55, SCN-56, SCN-63, SCN-65, SCN-71–75 (in `dsar.spec.ts`).
