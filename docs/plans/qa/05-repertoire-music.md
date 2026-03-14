# QA Plan: Repertoire, Library & Music Features

**Domain:** Repertoire, Library & Music
**Date:** 2026-03-14
**Coverage:** Student repertoire viewer, teacher assign-repertoire dialog, ministry CRUD, library page, practice log, practice video upload, AI coach (stub), student practice panel, exam tracker, performance profile, teacher reports

---

## Mock Data Prerequisites

| Entity | IDs | Notes |
|--------|-----|-------|
| Teacher | `teacher-user-1` (מרים כהן) | Has student assignments |
| Students | `student-user-1`, `student-user-3`..`student-user-8` | Multiple instruments |
| Parent | `parent-user-1` | childIds → student-user-1 |
| Ministry director | `ministry-director-user` | Role: `ministry_director` |
| Site admin | `dev-user` | Role: `site_admin`, dev bypass |
| Compositions | IDs from `data.json` (5,217 entries) | Must have `titles.{he,en,ar,ru}` and `composerNames.{he,en,ar,ru}` |
| Assigned repertoire | At least 2 entries for student-user-1 | One with `pdfUrl`, one without |

**DB backends:** mock (primary for all E2E), memory adapter
**Gemini stub:** Set `GEMINI_API_KEY` to empty string to exercise the failure path; use a real/mock key for the success path.

---

## Scenario RM-01: Student views empty repertoire

**Personas:** student (student-user-3, no assigned compositions)
**Preconditions:** No `assignedRepertoire` entries for student-user-3
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Log in as student-user-3 (dev bypass).
2. Navigate to `/dashboard/student/repertoire`.

**Expected results:**
- Page renders with heading from `RepertoirePage.title`.
- `SheetMusicViewer` sidebar shows "No pieces" placeholder text (`SheetMusicViewer.noPieces`).
- Main viewer area shows "Select a piece" empty state (`SheetMusicViewer.selectPieceTitle`).
- No JavaScript errors in console.

---

## Scenario RM-02: Student views assigned repertoire list

**Personas:** student (student-user-1)
**Preconditions:** `assignedRepertoire` has ≥2 entries for student-user-1; each linked to a composition with `titles.he`
**DB backend:** mock
**Locales:** `he`, `en`

**Steps:**
1. Log in as student-user-1.
2. Navigate to `/dashboard/student/repertoire`.
3. Verify sidebar piece list.
4. Switch locale to `/en/dashboard/student/repertoire`.

**Expected results:**
- Sidebar lists all assigned pieces with locale-aware title (`c.titles[locale]`) and composer name.
- Status badge shown on each piece (`SheetMusicViewer.statuses.*`).
- In `en` locale: English title/composer displayed (falls back to `titles.en` then `title`).
- In `he` locale: Hebrew title/composer displayed.

---

## Scenario RM-03: Student selects and views a piece (no PDF)

**Personas:** student (student-user-1)
**Preconditions:** Assigned composition has no `pdfUrl`
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Navigate to `/dashboard/student/repertoire`.
2. Click a piece in the sidebar.

**Expected results:**
- Main viewer header shows piece title and composer.
- "No sheet music attached" message displayed (`SheetMusicViewer.noPdfAttached`).
- Fullscreen button visible.
- Selected piece visually highlighted in sidebar (border-primary class applied).

---

## Scenario RM-04: Student selects a piece with pdfUrl

**Personas:** student (student-user-1)
**Preconditions:** Assigned composition has `pdfUrl` set (stub URL)
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Navigate to `/dashboard/student/repertoire`.
2. Click the piece that has a `pdfUrl`.

**Expected results:**
- PDF simulator placeholder shown (FileMusic icon + `SheetMusicViewer.pdfSimulator` text).
- Title and composer shown in viewer header.

---

## Scenario RM-05: Student opens fullscreen viewer

**Personas:** student (student-user-1)
**Preconditions:** A piece is selected in the viewer
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Navigate to `/dashboard/student/repertoire`.
2. Click a piece in the sidebar.
3. Click the Maximize button in the viewer header.

**Expected results:**
- Fullscreen dialog opens covering the entire viewport.
- Black header bar shows piece title and composer.
- Close (X) button visible and accessible.
- Clicking X closes the dialog and returns to normal view.

---

## Scenario RM-06: Fullscreen viewer RTL layout (Arabic locale)

**Personas:** student (student-user-1)
**Preconditions:** Same as RM-05
**DB backend:** mock
**Locales:** `ar`

**Steps:**
1. Navigate to `/ar/dashboard/student/repertoire`.
2. Select a piece and open fullscreen.

**Expected results:**
- Dialog uses `dir="rtl"`.
- Title/composer text aligns right-to-left.
- Close button positioned at start (right side) of header bar.

---

## Scenario RM-07: Teacher assigns repertoire to single student

**Personas:** teacher (teacher-user-1)
**Preconditions:** Student student-user-1 exists with an instrument; compositions searchable
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Log in as teacher-user-1.
2. Navigate to a student detail page that opens `AssignRepertoireDialog`.
3. Open the "Assign Repertoire" dialog.
4. Verify the dialog opens with scope defaulting to "single".
5. Type a search term into the composition combobox (e.g., "Bach").
6. Select a composition from the dropdown.
7. Confirm scope is "single student".
8. Click Submit.

**Expected results:**
- Dialog loads composition options on open (initial `runSearch('')` call fires).
- Debounced search updates options as user types.
- After submit: toast appears with `successSingle` message including composition title.
- Dialog closes and resets.
- `assignedRepertoire` for student-user-1 includes the new composition.

---

## Scenario RM-08: Teacher assigns repertoire to instrument group

**Personas:** teacher (teacher-user-1)
**Preconditions:** Teacher has ≥2 students sharing the same primary instrument
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Open `AssignRepertoireDialog` for a student whose instrument is shared by other students.
2. Set scope dropdown to "instrument_group".
3. Select a composition.
4. Submit.

**Expected results:**
- Toast shows `successGroup` message with count of students affected.
- All students in the instrument group have the composition in their `assignedRepertoire`.

---

## Scenario RM-09: Teacher assigns repertoire — instrument group falls back to single

**Personas:** teacher (teacher-user-1)
**Preconditions:** Student has no matching instrument peers (unique instrument)
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Open `AssignRepertoireDialog` for student with a unique instrument.
2. Select "instrument_group" scope.
3. Select a composition and submit.

**Expected results:**
- Only the single target student receives the assignment.
- Toast shows `successSingle` (count is 1, falls back).

---

## Scenario RM-10: Locale-aware composition title in assign dialog

**Personas:** teacher (teacher-user-1)
**Preconditions:** Composition with all 4 locale titles
**DB backend:** mock
**Locales:** `ru`

**Steps:**
1. Navigate to `/ru/dashboard`.
2. Open `AssignRepertoireDialog`.
3. Search and select a composition.
4. Submit.

**Expected results:**
- Toast description uses Russian title (`titles.ru`) for the composition, not Hebrew fallback.

---

## Scenario RM-11: Ministry director views repertoire list

**Personas:** ministry_director
**Preconditions:** Compositions list loaded (5,217 entries from data.json)
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Log in as ministry_director.
2. Navigate to `/dashboard/ministry/repertoire`.

**Expected results:**
- Page renders with Library icon, title, description showing total count.
- Search input visible.
- First 30 compositions visible (PAGE_SIZE = 30).
- "Load more" button visible if total > 30.
- Stats bar shows "Showing X of Y".

---

## Scenario RM-12: Ministry repertoire — access control (teacher role)

**Personas:** teacher (teacher-user-1)
**Preconditions:** Teacher role does not include `ministry_director` or `site_admin`
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Log in as teacher-user-1.
2. Navigate to `/dashboard/ministry/repertoire`.

**Expected results:**
- Page renders the "no permission" message (`MinistryRepertoire.noPermission`).
- No composition list or Add button shown.

---

## Scenario RM-13: Ministry repertoire search filters by title

**Personas:** site_admin (`dev-user`)
**Preconditions:** Compositions loaded
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Navigate to `/dashboard/ministry/repertoire`.
2. Type a Hebrew search term matching a known composition title.

**Expected results:**
- List filters in real-time (no submit needed).
- Visible count resets to first 30 of filtered results.
- Stats bar updates.
- "Load more" button only appears if filtered results > 30.
- Clearing search restores full list.

---

## Scenario RM-14: Ministry repertoire search — no results

**Personas:** site_admin
**Preconditions:** Compositions loaded
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Navigate to `/dashboard/ministry/repertoire`.
2. Type a search string that matches no composition (e.g., "xyznotfound123").

**Expected results:**
- `noResults` empty state card shown.
- No list items rendered.
- "Load more" button hidden.

---

## Scenario RM-15: Ministry repertoire search by composer

**Personas:** site_admin
**Preconditions:** Compositions loaded; at least one composition with a known composer name
**DB backend:** mock
**Locales:** `en`

**Steps:**
1. Navigate to `/en/dashboard/ministry/repertoire`.
2. Search for a composer name in English.

**Expected results:**
- Results include compositions matching the English `composerNames.en` field.
- Locale of display matches `en`.

---

## Scenario RM-16: Ministry repertoire — load more pagination

**Personas:** site_admin
**Preconditions:** Total compositions > 30
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Navigate to `/dashboard/ministry/repertoire`.
2. Scroll to bottom; click "Load more" button.

**Expected results:**
- Additional 30 compositions appended to list.
- Stats bar updates (shown count increases by 30).
- "Load more" button disappears when all filtered items are shown.

---

## Scenario RM-17: Ministry repertoire — add new composition (Hebrew only)

**Personas:** site_admin
**Preconditions:** None
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Navigate to `/dashboard/ministry/repertoire`.
2. Click "+ Add" button.
3. Fill in Hebrew title and Hebrew composer fields only.
4. Leave all other fields blank.
5. Verify the Save button is enabled.
6. Click Save.

**Expected results:**
- Dialog opens with all fields empty and `approved` toggle ON by default.
- Save button disabled until both `titleHe` and `composerHe` are filled.
- After save: dialog closes, toast shows `addedTitle` / `addedDesc`.
- New composition appears at the end of the list with Hebrew title.
- English title falls back to Hebrew title (payload: `en: form.titleHe`).

---

## Scenario RM-18: Ministry repertoire — add new composition (all locales)

**Personas:** site_admin
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Open Add dialog.
2. Fill Hebrew title, Hebrew composer, English title, English composer, Arabic title, Arabic composer, Russian title, Russian composer.
3. Set genre = "Classical", instrument = "Piano", duration = "04:30".
4. Leave `approved` ON.
5. Save.

**Expected results:**
- Composition saved with all locale `titles` and `composerNames` fields populated.
- Genre, instrument, and duration stored correctly.
- When viewing in `en` locale, English title shown; in `he`, Hebrew title shown.

---

## Scenario RM-19: Ministry repertoire — save button disabled without required fields

**Personas:** site_admin
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Open Add dialog.
2. Fill in only `titleHe`. Leave `composerHe` empty.
3. Inspect Save button state.

**Expected results:**
- Save button remains disabled.
- No toast or submission occurs.

---

## Scenario RM-20: Ministry repertoire — edit existing composition

**Personas:** site_admin
**Preconditions:** At least one composition in the list
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Click the pencil (edit) icon on any composition.
2. Modify the Hebrew title.
3. Click Save.

**Expected results:**
- Dialog opens pre-populated with existing values (all locale fields, genre, instrument, duration, approved).
- After save: dialog closes, toast shows `updatedTitle` / `updatedDesc`.
- Updated title immediately reflected in the list.

---

## Scenario RM-21: Ministry repertoire — delete composition

**Personas:** site_admin
**Preconditions:** At least one composition in the list
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Click the trash icon on a composition.

**Expected results:**
- Composition removed from list immediately (no confirmation dialog — direct delete).
- Toast shows `deletedDesc` with the composition's title.
- List count decreases by 1.

---

## Scenario RM-22: Ministry repertoire — approved toggle

**Personas:** site_admin
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Open Add dialog; toggle `approved` OFF.
2. Save the composition.

**Expected results:**
- Composition card renders with `opacity-60` and dashed border.
- "Unapproved" badge visible on the card.

**Steps (edit):**
1. Edit the unapproved composition; toggle `approved` ON.
2. Save.

**Expected results:**
- Card returns to normal opacity; "Unapproved" badge disappears.

---

## Scenario RM-23: Ministry repertoire — auto-translate (Gemini stub — no API key)

**Personas:** site_admin
**Preconditions:** `GEMINI_API_KEY` is unset or empty (stub returns error)
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Open Add dialog.
2. Fill Hebrew title and composer.
3. Click the Wand (auto-translate) button.

**Expected results:**
- Wand button shows spinner (`Loader2`) while pending.
- After failure: toast with `translationFailed` message (destructive variant).
- Other locale fields remain unchanged.
- Wand button disabled when both `titleHe` and `composerHe` are empty.

---

## Scenario RM-24: Ministry repertoire — auto-translate success (with API key)

**Personas:** site_admin
**Preconditions:** `GEMINI_API_KEY` set to valid key
**DB backend:** mock
**Locales:** `he`
**Stub:** Gemini returns valid JSON translations

**Steps:**
1. Open Add dialog.
2. Fill `titleHe` = "אינוונציה בדו מז'ור" and `composerHe` = "יוהן סבסטיאן באך".
3. Click the Wand button.
4. Wait for response.

**Expected results:**
- Spinner shown during transition.
- EN, AR, RU title and composer fields populated with AI translations.
- Toast shows `translationApplied`.
- Hebrew fields unchanged.

---

## Scenario RM-25: Ministry repertoire — Hebrew-original title shown in non-Hebrew locales

**Personas:** site_admin
**Preconditions:** Composition where `titles.he` differs from `titles.en`
**DB backend:** mock
**Locales:** `en`

**Steps:**
1. Navigate to `/en/dashboard/ministry/repertoire`.
2. Observe the composition card.

**Expected results:**
- English title displayed as the primary title.
- Hebrew original shown as secondary text (`dir="rtl"`, `opacity-60`) when `titles.he !== titles.en`.
- Hebrew original NOT shown in `he` locale (condition in JSX).

---

## Scenario RM-26: Ministry repertoire — back-to-ministry link

**Personas:** site_admin
**DB backend:** mock
**Locales:** `he`, `en`

**Steps:**
1. Navigate to `/dashboard/ministry/repertoire`.
2. Click the back link ("Back to Ministry").

**Expected results:**
- Navigates to `/dashboard/ministry`.
- In RTL (`he`): back icon is `ChevronRight`. In LTR (`en`): icon is `ChevronLeft`.

---

## Scenario RM-27: Library page renders under-construction state

**Personas:** Any authenticated user
**DB backend:** mock
**Locales:** `he`, `en`

**Steps:**
1. Navigate to `/dashboard/library`.

**Expected results:**
- Page title from `DashboardPages.library.title`.
- BookOpen icon visible.
- "Under Construction" card shown with description.
- No JavaScript errors.

---

## Scenario RM-28: Practice log page renders with links

**Personas:** student (student-user-1), parent, teacher
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Navigate to `/dashboard/practice`.

**Expected results:**
- Page title from `DashboardPages.practice.title`.
- "Upload Video" button links to `/dashboard/practice/upload`.
- "Open Coach" button links to `/dashboard/practice/coach`.
- `PracticeLogForm` card rendered.

---

## Scenario RM-29: Student submits practice log

**Personas:** student (student-user-1)
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Navigate to `/dashboard/practice`.
2. Observe default date (today) and default duration (30 min).
3. Leave date as today.
4. Move duration slider to 45 minutes.
5. Enter pieces: "Bach Invention, Clementi Sonatina".
6. Select mood: "GREAT".
7. Enter a note.
8. Click Save.

**Expected results:**
- Form validation passes (date filled, duration ≥ 5, mood selected).
- Success toast shown with duration.
- Router navigates to `/dashboard/progress`.
- `addPracticeLog` called with `studentId = student-user-1.id`.

---

## Scenario RM-30: Practice log validation — missing mood

**Personas:** student (student-user-1)
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Navigate to `/dashboard/practice`.
2. Fill in date and set duration.
3. Do NOT select a mood.
4. Click Save.

**Expected results:**
- Form submission blocked.
- Mood field shows error message (`errorMoodRequired`).
- No toast, no navigation.

---

## Scenario RM-31: Practice log validation — duration below minimum

**Personas:** student (student-user-1)
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Navigate to `/dashboard/practice`.
2. The slider minimum is 5 — attempt to submit with 5 minutes (valid boundary) and verify it passes.

**Expected results:**
- Duration of 5 minutes passes validation.
- Duration below 5 (if forced programmatically) shows `errorDurationMin` message.

---

## Scenario RM-32: Parent logs practice for a child

**Personas:** parent (parent-user-1) with childIds = [student-user-1]
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Log in as parent-user-1.
2. Navigate to `/dashboard/practice`.
3. Verify "Log for" select dropdown is shown with child names.
4. Select student-user-1.
5. Fill in date, duration, mood.
6. Submit.

**Expected results:**
- "Log for" dropdown visible only for `parent` role.
- Practice log submitted with `studentId = student-user-1.id` (not the parent's ID).
- Success toast and navigation to progress page.

---

## Scenario RM-33: Parent practice log — no child selected

**Personas:** parent-user-1
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Navigate to `/dashboard/practice`.
2. Fill mood, date, duration but leave "Log for" unselected.
3. Submit.

**Expected results:**
- Toast with destructive variant and `errorStudentRequired` message.
- No navigation.

---

## Scenario RM-34: Practice video upload page renders

**Personas:** student, teacher
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Navigate to `/dashboard/practice/upload`.

**Expected results:**
- Page title from `DashboardPages.practiceUpload.title`.
- `PracticeVideoUploadForm` rendered.
- No JavaScript errors.

---

## Scenario RM-35: AI practice coach — simulate recording and analysis flow

**Personas:** student, teacher
**DB backend:** mock
**Locales:** `he` (coach UI currently hard-coded Hebrew strings)

**Steps:**
1. Navigate to `/dashboard/practice/coach`.
2. Page renders with `PracticeCoach` lazy-loaded (Skeleton shown briefly).
3. Click the microphone button.

**Expected results:**
- Button becomes disabled; red pulsing square replaces mic icon.
- "Recording..." text appears (Hebrew stub text).
- After ~5 seconds: recording state ends; "Analyzing..." spinner shown.
- After ~3 more seconds: feedback panel shown with:
  - Pitch accuracy score (85–100%) with progress bar.
  - Rhythm accuracy score (80–100%) with progress bar.
  - 3 bullet observations (Hebrew text).
- Microphone button re-enabled after feedback appears.

**Note:** This is a fully stubbed simulation — no real audio is captured. Test verifies the UI state machine, not AI quality.

---

## Scenario RM-36: AI practice coach — cannot start second recording while analyzing

**Personas:** student
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Navigate to `/dashboard/practice/coach`.
2. Click microphone button to start recording.
3. While recording (within 5-second window), attempt to click the microphone button again.

**Expected results:**
- Button is disabled during `isRecording || isAnalyzing` states.
- Second click does nothing.

---

## Scenario RM-37: Student practice panel page renders

**Personas:** student (student-user-1)
**DB backend:** mock
**Locales:** `he` (page title is hard-coded Hebrew)

**Steps:**
1. Navigate to `/dashboard/student/practice`.

**Expected results:**
- Page title "אימון אישי ורפרטואר" visible.
- `StudentPracticePanel` renders without errors.

---

## Scenario RM-38: Teacher performance profile — access control

**Personas:** teacher (teacher-user-1), non-teacher (student-user-1)
**DB backend:** mock
**Locales:** `he`

**Steps (teacher):**
1. Log in as teacher-user-1.
2. Navigate to `/dashboard/teacher/performance-profile`.

**Expected results:**
- `PerformanceProfileEditor` component rendered.
- Page title from `Sidebar.performanceProfile`.

**Steps (student):**
1. Log in as student-user-1.
2. Navigate to `/dashboard/teacher/performance-profile`.

**Expected results:**
- Redirect to `/dashboard` (via `router.replace`).
- Page renders `null` briefly then redirects.

---

## Scenario RM-39: Teacher reports page — access control

**Personas:** teacher (teacher-user-1), student (student-user-1)
**DB backend:** mock
**Locales:** `he`

**Steps (teacher):**
1. Log in as teacher-user-1.
2. Navigate to `/dashboard/teacher/reports`.

**Expected results:**
- "הדוחות שלי" title and `TeacherReportsDashboard` rendered.

**Steps (non-teacher):**
1. Log in as student-user-1.
2. Navigate to `/dashboard/teacher/reports`.

**Expected results:**
- "אין לך הרשאה לצפות בעמוד זה" message displayed.
- No dashboard component rendered.

---

## Scenario RM-40: Exam tracker — page access control

**Personas:** teacher (teacher-user-1), student (student-user-1)
**DB backend:** mock
**Locales:** `he`

**Steps (teacher):**
1. Navigate to `/dashboard/teacher/exams`.

**Expected results:**
- Page title "מעקב בחינות משרד החינוך / רסיטל" visible.
- `ExamTrackerPanel` rendered with mock tracker (exam-1 for student-1, 40% readiness).

**Steps (non-teacher):**
1. Log in as student-user-1.
2. Navigate to `/dashboard/teacher/exams`.

**Expected results:**
- Error message "אין לך הרשאות לגשת לעמוד זה." shown.

---

## Scenario RM-41: Exam tracker — initial mock tracker displayed

**Personas:** teacher (teacher-user-1)
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Navigate to `/dashboard/teacher/exams`.

**Expected results:**
- Tracker card shown for `exam-1`.
- Student name resolved (student-user-1's name).
- Instrument badge: "Piano".
- Exam type badge: "MINISTRY LEVEL 1".
- Target date formatted using date-fns with Hebrew locale.
- Readiness badge: "40%" in amber (40–79% range → yellow class).
- Requirements table with 4 rows: SCALES (READY), PIECES/Baroque (IN_PROGRESS with teacher note), PIECES/Sonatina (NOT_STARTED), SIGHT_READING (READY).

---

## Scenario RM-42: Exam tracker — create new tracker from template

**Personas:** teacher (teacher-user-1)
**Preconditions:** student-user-1 exists in users list
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Navigate to `/dashboard/teacher/exams`.
2. Click "Create new exam tracker" button.
3. Creation form shown.
4. Select a student from dropdown.
5. Set instrument to "Violin".
6. Set exam type to "MINISTRY_LEVEL_2".
7. Click "Create plan".

**Expected results:**
- New tracker card added to the list (5 requirements from MINISTRY_LEVEL_2 template).
- All requirements start at NOT_STARTED status.
- Readiness = 0%.
- Toast with `trackerCreated` message.
- "Create new tracker" button reverts (form hidden).

---

## Scenario RM-43: Exam tracker — update requirement status

**Personas:** teacher (teacher-user-1)
**Preconditions:** Exam tracker with at least one requirement
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Navigate to `/dashboard/teacher/exams`.
2. In the mock tracker (exam-1), find the "NOT_STARTED" Sonatina requirement.
3. Click its status select and change to "READY".

**Expected results:**
- Row badge immediately updates to green "Ready" badge.
- Overall readiness percentage auto-recalculates: was 40% (2/4 ready), becomes 75% (3/4 ready).
- Readiness badge color updates accordingly (amber → green if ≥80%).

---

## Scenario RM-44: Exam tracker — readiness percentage color thresholds

**Personas:** teacher
**DB backend:** mock
**Locales:** `he`

**Steps:**
Mark requirements to exercise all three color bands:
1. 0–39%: Readiness badge should be red.
2. 40–79%: Readiness badge should be amber/yellow.
3. 80–100%: Readiness badge should be green.

**Expected results:**
- Badge class `bg-red-100 text-red-800` for < 40%.
- Badge class `bg-yellow-100 text-yellow-800` for 40–79%.
- Badge class `bg-green-100 text-green-800` for ≥ 80%.

---

## Scenario RM-45: Exam tracker — create button disabled without student

**Personas:** teacher
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Open the create form.
2. Leave student dropdown empty.
3. Click "Create plan".

**Expected results:**
- Button is disabled (`!selectedStudent` condition).
- No tracker created, no toast.

---

## Scenario RM-46: Exam tracker — BAGRUT template

**Personas:** teacher
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Create tracker with exam type "BAGRUT" for a student.

**Expected results:**
- Tracker created with 2 requirements (PIECES + THEORY) from BAGRUT template.
- All status: NOT_STARTED.

---

## Scenario RM-47: Locale-aware date format in exam tracker

**Personas:** teacher
**DB backend:** mock
**Locales:** `en`, `ru`

**Steps:**
1. Navigate to `/en/dashboard/teacher/exams`.
2. Observe target exam date format on exam-1 card.
3. Navigate to `/ru/dashboard/teacher/exams`.

**Expected results:**
- Date formatted using the locale's date-fns locale (from `useDateLocale`).
- Format "PP" (e.g., "Jun 15, 2026" in English, "15 июня 2026 г." in Russian).

---

## Scenario RM-48: Composition list — locale fallback chain

**Personas:** site_admin
**DB backend:** mock
**Locales:** `ar`

**Steps:**
1. Navigate to `/ar/dashboard/ministry/repertoire`.
2. Find a composition that has `titles.ar` set.
3. Find a composition that has no `titles.ar` but has `titles.he`.

**Expected results:**
- Composition WITH `titles.ar`: Arabic title shown.
- Composition WITHOUT `titles.ar`: Falls back to `c.title` (top-level field).
- Hebrew original shown as secondary text for compositions displayed in non-Hebrew locale.

---

## Scenario RM-49: Ministry repertoire RTL layout (Arabic locale)

**Personas:** site_admin
**DB backend:** mock
**Locales:** `ar`

**Steps:**
1. Navigate to `/ar/dashboard/ministry/repertoire`.

**Expected results:**
- Page container uses `dir="rtl"`.
- Search icon positioned at `start-3` (right side in RTL).
- Back icon is `ChevronRight` (RTL back).
- Dialog uses `dir="rtl"`.
- Hebrew fields within dialog use `dir="rtl"`, Arabic fields use `dir="rtl"`, English/Russian use `dir="ltr"`.

---

## Scenario RM-50: Ministry repertoire dialog — cancel and reset

**Personas:** site_admin
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Open "Add" dialog.
2. Fill in some fields.
3. Click Cancel.
4. Re-open the Add dialog.

**Expected results:**
- After cancel, dialog closes.
- Re-opening the dialog shows blank form (not pre-filled with previous values).
- No composition added.

---

## Scenario RM-51: Ministry repertoire search resets pagination

**Personas:** site_admin
**DB backend:** mock
**Locales:** `he`

**Steps:**
1. Click "Load more" to expand beyond 30 items (visibleCount = 60).
2. Enter a search term.

**Expected results:**
- `visibleCount` resets to PAGE_SIZE (30) when search query changes.
- Shows first 30 of filtered results, not first 60.

---

## Summary Table

| Scenario | Feature Area | Personas | Locales | Mock Data |
|----------|-------------|----------|---------|-----------|
| RM-01 | Student repertoire (empty) | student | he | No assignments |
| RM-02 | Student repertoire (list) | student | he, en | ≥2 assignments |
| RM-03..05 | Sheet music viewer | student | he | 1 with PDF, 1 without |
| RM-06 | Sheet music viewer RTL | student | ar | — |
| RM-07..10 | Assign repertoire dialog | teacher | he, ru | Compositions, students |
| RM-11..12 | Ministry list + access control | ministry_director, teacher | he | 5,217 compositions |
| RM-13..16 | Ministry search + pagination | site_admin | he, en | 5,217 compositions |
| RM-17..19 | Ministry add composition | site_admin | he | — |
| RM-20..21 | Ministry edit/delete | site_admin | he | ≥1 composition |
| RM-22 | Ministry approved toggle | site_admin | he | — |
| RM-23..24 | Auto-translate (stub/real) | site_admin | he | Gemini key |
| RM-25..26 | Locale display + back link | site_admin | he, en | Mixed locale compositions |
| RM-27 | Library page (stub) | any | he, en | — |
| RM-28..33 | Practice log form | student, parent | he | parent.childIds |
| RM-34 | Video upload page | student | he | — |
| RM-35..36 | AI coach stub | student | he | — |
| RM-37 | Student practice panel | student | he | — |
| RM-38 | Performance profile access | teacher, student | he | — |
| RM-39 | Teacher reports access | teacher, student | he | — |
| RM-40..46 | Exam tracker CRUD | teacher | he | student list |
| RM-47 | Exam tracker date locale | teacher | en, ru | — |
| RM-48..49 | Locale fallback + RTL | site_admin | ar | Compositions with/without ar |
| RM-50..51 | Dialog reset + pagination reset | site_admin | he | — |
