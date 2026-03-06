# Performance: Context Decomposition Map

## Overview

`src/hooks/use-auth.tsx` is a **2,364-line monolithic React Context** that serves as the entire application state store. It holds **37 state arrays** (via `useState`), **~80 mutation functions**, and exposes them all through a single `AuthContextType` interface with **~85 properties**.

Every component that calls `useAuth()` subscribes to ALL state changes. A single invoice update triggers re-renders in the schedule view, the practice log panel, the alumni portal, and every other consumer.

---

## 1. Complete State Array Inventory (37 useState calls)

### Auth Domain
| # | State Variable | Type | Line |
|---|---------------|------|------|
| 1 | `user` | `User \| null` | 188 |
| 2 | `users` | `User[]` | 190 |
| 3 | `isLoading` | `boolean` | 292 |
| 4 | `bootstrapResolved` | `boolean` | 293 |
| 5 | `bootstrapUsedMockFallback` | `boolean` | 294 |

### Conservatorium & Configuration
| # | State Variable | Type | Line |
|---|---------------|------|------|
| 6 | `conservatoriums` | `Conservatorium[]` | 289 |
| 7 | `conservatoriumInstruments` | `ConservatoriumInstrument[]` | 290 |
| 8 | `lessonPackages` | `LessonPackage[]` | 291 |
| 9 | `mockBranches` | `Branch[]` | 279 |
| 10 | `mockRooms` | `Room[]` | 288 |

### Lessons & Scheduling
| # | State Variable | Type | Line |
|---|---------------|------|------|
| 11 | `mockLessons` | `LessonSlot[]` | 192 |
| 12 | `mockWaitlist` | `WaitlistEntry[]` | 284 |

### Forms & Compliance
| # | State Variable | Type | Line |
|---|---------------|------|------|
| 13 | `mockFormSubmissions` | `FormSubmission[]` | 191 |
| 14 | `mockFormTemplates` | `FormTemplate[]` | 201 |

### Financials
| # | State Variable | Type | Line |
|---|---------------|------|------|
| 15 | `mockPackages` | `Package[]` | 193 |
| 16 | `mockInvoices` | `Invoice[]` | 194 |
| 17 | `mockPayrolls` | `PayrollSummary[]` | 285 |
| 18 | `mockPlayingSchoolInvoices` | `PlayingSchoolInvoice[]` | 203 |
| 19 | `mockScholarshipApplications` | `ScholarshipApplication[]` | 274 |
| 20 | `mockDonationCauses` | `DonationCause[]` | 275 |
| 21 | `mockDonations` | `DonationRecord[]` | 276 |

### Student Learning & Practice
| # | State Variable | Type | Line |
|---|---------------|------|------|
| 22 | `mockPracticeLogs` | `PracticeLog[]` | 195 |
| 23 | `mockAssignedRepertoire` | `AssignedRepertoire[]` | 196 |
| 24 | `mockLessonNotes` | `LessonNote[]` | 197 |
| 25 | `mockProgressReports` | `ProgressReport[]` | 199 |
| 26 | `mockRepertoire` | `Composition[]` | 287 |
| 27 | `mockPracticeVideos` | `PracticeVideo[]` | 280 |

### Communication & Notifications
| # | State Variable | Type | Line |
|---|---------------|------|------|
| 28 | `mockMessageThreads` | `MessageThread[]` | 198 |
| 29 | `mockAnnouncements` | `Announcement[]` | 200 |
| 30 | `mockAuditLog` | `AuditLogEntry[]` | 202 |

### Events & Performances
| # | State Variable | Type | Line |
|---|---------------|------|------|
| 31 | `mockEvents` | `EventProduction[]` | 222 |
| 32 | `mockPerformanceBookings` | `PerformanceBooking[]` | 273 |

### Instruments & Rentals
| # | State Variable | Type | Line |
|---|---------------|------|------|
| 33 | `mockInstrumentInventory` | `InstrumentInventory[]` | 223 |
| 34 | `mockInstrumentRentals` | `InstrumentRental[]` | 224 |

### Open Day & Enrollment
| # | State Variable | Type | Line |
|---|---------------|------|------|
| 35 | `mockOpenDayEvents` | `OpenDayEvent[]` | 277 |
| 36 | `mockOpenDayAppointments` | `OpenDayAppointment[]` | 278 |

### Alumni & Master Classes
| # | State Variable | Type | Line |
|---|---------------|------|------|
| 37 | `mockAlumni` | `Alumnus[]` | 281 |
| 38 | `mockMasterclasses` | `Masterclass[]` | 282 |
| 39 | `mockMasterClassAllowances` | `StudentMasterClassAllowance[]` | 283 |
| 40 | `mockMakeupCredits` | `MakeupCredit[]` | 286 |

---

## 2. Complete Mutation Function Inventory (~80 functions)

### Auth & User Management (8 functions)
| Function | Server Action Called | Domains Affected |
|----------|-------------------|-----------------|
| `login(email)` | None (client-side) | users, user |
| `logout()` | None (client-side) | user |
| `approveUser(userId)` | `upsertUserAction` | users |
| `rejectUser(userId, reason)` | `upsertUserAction` | users |
| `updateUser(updatedUser)` | `upsertUserAction` | users, user |
| `addUser(userData, isAdminFlow)` | `upsertUserAction` | users |
| `markWalkthroughAsSeen(userId)` | None | users, user |
| `updateNotificationPreferences(prefs)` | `upsertUserAction` (via updateUser) | users, user |

### Lesson Management (7 functions)
| Function | Server Action Called | Domains Affected |
|----------|-------------------|-----------------|
| `addLesson(lessonData)` | `upsertLessonAction` | mockLessons, mockRooms (read) |
| `cancelLesson(lessonId, withNotice)` | `upsertLessonAction` | mockLessons |
| `rescheduleLesson(lessonId, newStartTime)` | `upsertLessonAction` | mockLessons |
| `updateLessonStatus(lessonId, status)` | `upsertLessonAction` | mockLessons |
| `assignSubstitute(lessonId, newTeacherId)` | None | mockLessons |
| `reportSickLeave(teacherId, from, to)` | None | mockLessons |
| `getMakeupCreditBalance(studentIds)` | None (read-only) | mockLessons (read) |

### Forms & Templates (3 functions)
| Function | Server Action Called | Domains Affected |
|----------|-------------------|-----------------|
| `updateForm(updatedForm)` | `upsertFormSubmissionAction` | mockFormSubmissions |
| `addFormTemplate(templateData)` | None | mockFormTemplates |
| `updateConservatorium(updatedCons)` | `upsertConservatoriumAction` | conservatoriums |

### Practice & Repertoire (6 functions)
| Function | Server Action Called | Domains Affected |
|----------|-------------------|-----------------|
| `addPracticeLog(logData)` | None | mockPracticeLogs, users (via achievement) |
| `updateRepertoireStatus(id, status)` | None | mockAssignedRepertoire, users (via achievement) |
| `addLessonNote(noteData)` | None | mockLessonNotes |
| `updateUserPracticeGoal(studentId, goal)` | `upsertUserAction` (via updateUser) | users |
| `addProgressReport(reportData)` | None | mockProgressReports |
| `assignRepertoire(studentIds, compositionId)` | None | mockAssignedRepertoire |

### Messaging & Announcements (3 functions)
| Function | Server Action Called | Domains Affected |
|----------|-------------------|-----------------|
| `addMessage(threadId, senderId, body)` | None | mockMessageThreads |
| `createMessageThread(participants, msg)` | None | mockMessageThreads |
| `addAnnouncement(data)` | `createAnnouncement` | mockAnnouncements, mockAuditLog |

### Events & Performances (8 functions)
| Function | Server Action Called | Domains Affected |
|----------|-------------------|-----------------|
| `addEvent(eventData)` | `createEventAction` | mockEvents |
| `updateEvent(updatedEvent)` | `updateEventAction` | mockEvents |
| `updateEventStatus(eventId, status)` | `updateEventAction` | mockEvents |
| `bookEventTickets(eventId, ...)` | `updateEventAction` | mockEvents |
| `addPerformanceToEvent(eventId, ...)` | `updateEventAction` | mockEvents |
| `removePerformanceFromEvent(...)` | `updateEventAction` | mockEvents |
| `addPerformanceBooking(bookingData)` | None | mockPerformanceBookings |
| `assignMusiciansToPerformance(...)` | None | mockPerformanceBookings |

### Instruments & Rentals (9 functions)
| Function | Server Action Called | Domains Affected |
|----------|-------------------|-----------------|
| `assignInstrumentToStudent(...)` | None | mockInstrumentInventory |
| `initiateInstrumentRental(payload)` | None | mockInstrumentRentals, users |
| `getRentalByToken(token)` | None (read-only) | mockInstrumentRentals (read) |
| `confirmRentalSignature(token, url)` | None | mockInstrumentRentals, mockInstrumentInventory, users |
| `returnInstrument(instrumentId)` | None | mockInstrumentInventory |
| `markInstrumentRentalReturned(...)` | None | mockInstrumentRentals, mockInstrumentInventory |
| `addInstrument(instrumentData)` | None | mockInstrumentInventory |
| `updateInstrument(id, data)` | None | mockInstrumentInventory |
| `deleteInstrument(instrumentId)` | None | mockInstrumentInventory |

### Financial Operations (7 functions)
| Function | Server Action Called | Domains Affected |
|----------|-------------------|-----------------|
| `updatePayrollStatus(id, status)` | None | mockPayrolls |
| `updateUserPaymentMethod(data)` | `upsertUserAction` (via updateUser) | users, user |
| `addScholarshipApplication(data)` | `createScholarshipApplicationAction` | mockScholarshipApplications |
| `updateScholarshipStatus(id, status)` | `updateScholarshipStatusAction` | mockScholarshipApplications |
| `markScholarshipAsPaid(applicationId)` | `markScholarshipPaidAction` | mockScholarshipApplications |
| `addDonationCause(cause)` | `createDonationCauseAction` | mockDonationCauses |
| `recordDonation(donation)` | `recordDonationAction` | mockDonations, mockDonationCauses |

### Alumni & Master Classes (5 functions)
| Function | Server Action Called | Domains Affected |
|----------|-------------------|-----------------|
| `graduateStudent(studentId, year)` | None | users, mockAlumni |
| `upsertAlumniProfile(payload)` | `saveAlumnus` | mockAlumni |
| `createMasterClass(payload)` | `createMasterClassAction` | mockMasterclasses |
| `publishMasterClass(masterClassId)` | `publishMasterClassAction` | mockMasterclasses |
| `registerToMasterClass(id, studentId)` | `registerToMasterClassAction` | mockMasterclasses, mockMasterClassAllowances |

### Waitlist & Open Day (3 functions)
| Function | Server Action Called | Domains Affected |
|----------|-------------------|-----------------|
| `addToWaitlist(waitlistEntry)` | None | mockWaitlist |
| `updateWaitlistStatus(entryId, status)` | None | mockWaitlist |
| `addOpenDayAppointment(data)` | None | mockOpenDayAppointments |

### Practice Videos & Achievements (3 functions)
| Function | Server Action Called | Domains Affected |
|----------|-------------------|-----------------|
| `addPracticeVideo(videoData)` | None | mockPracticeVideos |
| `addVideoFeedback(videoId, comment)` | None | mockPracticeVideos |
| `awardAchievement(studentId, type)` | `upsertUserAction` (via updateUser) | users |

### Configuration Management (9 functions)
| Function | Server Action Called | Domains Affected |
|----------|-------------------|-----------------|
| `addBranch(branchData)` | `createBranchAction` | mockBranches |
| `updateBranch(updatedBranch)` | `updateBranchAction` | mockBranches |
| `addConservatoriumInstrument(data)` | `createConservatoriumInstrumentAction` | conservatoriumInstruments |
| `updateConservatoriumInstrument(...)` | `updateConservatoriumInstrumentAction` | conservatoriumInstruments |
| `deleteConservatoriumInstrument(id)` | `deleteConservatoriumInstrumentAction` | conservatoriumInstruments |
| `addLessonPackage(packageData)` | `createLessonPackageAction` | lessonPackages |
| `updateLessonPackage(id, data)` | `updateLessonPackageAction` | lessonPackages |
| `deleteLessonPackage(packageId)` | `deleteLessonPackageAction` | lessonPackages |
| `addRoom / updateRoom / deleteRoom` | `createRoomAction / updateRoomAction / deleteRoomAction` | mockRooms |

---

## 3. Proposed Domain Decomposition (Priority Order)

### Priority 1: CRITICAL (highest re-render impact)

#### Domain: `useAuthCore` (Auth only)
- **State:** `user`, `isLoading`
- **Functions:** `login`, `logout`
- **Impact:** Every page consumes this. Isolating auth from data eliminates cascading re-renders.
- **Estimated re-render reduction:** 90% of unnecessary renders eliminated for non-data pages.

#### Domain: `useLessonsStore` (Lessons & Scheduling)
- **State:** `mockLessons`, `mockWaitlist`, `mockMakeupCredits`
- **Functions:** `addLesson`, `cancelLesson`, `rescheduleLesson`, `updateLessonStatus`, `assignSubstitute`, `reportSickLeave`, `getMakeupCreditBalance`, `getMakeupCreditsDetail`, `addToWaitlist`, `updateWaitlistStatus`
- **Server Actions:** `upsertLessonAction`
- **Impact:** Lessons are the most frequently mutated data. Every lesson status change currently causes ALL consumers to re-render.

#### Domain: `useUsersStore` (User management)
- **State:** `users`
- **Functions:** `approveUser`, `rejectUser`, `updateUser`, `addUser`, `markWalkthroughAsSeen`, `graduateStudent`, `awardAchievement`
- **Server Actions:** `upsertUserAction`
- **Impact:** User array is the largest dataset. Updating one user triggers full re-render.

### Priority 2: HIGH

#### Domain: `useFormsStore` (Forms & Compliance)
- **State:** `mockFormSubmissions`, `mockFormTemplates`
- **Functions:** `updateForm`, `addFormTemplate`
- **Server Actions:** `upsertFormSubmissionAction`

#### Domain: `useInvoicesStore` (Billing)
- **State:** `mockPackages`, `mockInvoices`, `mockPayrolls`, `mockPlayingSchoolInvoices`
- **Functions:** `updatePayrollStatus`, `updateUserPaymentMethod`

#### Domain: `useEventsStore` (Events & Performances)
- **State:** `mockEvents`, `mockPerformanceBookings`
- **Functions:** `addEvent`, `updateEvent`, `updateEventStatus`, `bookEventTickets`, `addPerformanceToEvent`, `removePerformanceFromEvent`, `addPerformanceBooking`, `assignMusiciansToPerformance`, `updatePerformanceBookingStatus`
- **Server Actions:** `createEventAction`, `updateEventAction`

### Priority 3: MEDIUM

#### Domain: `usePracticeStore` (Practice & Progress)
- **State:** `mockPracticeLogs`, `mockAssignedRepertoire`, `mockLessonNotes`, `mockProgressReports`, `mockRepertoire`, `mockPracticeVideos`
- **Functions:** `addPracticeLog`, `updateRepertoireStatus`, `addLessonNote`, `updateUserPracticeGoal`, `addProgressReport`, `assignRepertoire`, `addPracticeVideo`, `addVideoFeedback`

#### Domain: `useMessagingStore` (Messages & Announcements)
- **State:** `mockMessageThreads`, `mockAnnouncements`, `mockAuditLog`
- **Functions:** `addMessage`, `createMessageThread`, `addAnnouncement`
- **Server Actions:** `createAnnouncement`

### Priority 4: LOW

#### Domain: `useInstrumentsStore` (Instruments & Rentals)
- **State:** `mockInstrumentInventory`, `mockInstrumentRentals`
- **Functions:** All instrument/rental functions
- **Admin-only domain — fewer consumers.**

#### Domain: `useScholarshipsStore` (Scholarships & Donations)
- **State:** `mockScholarshipApplications`, `mockDonationCauses`, `mockDonations`
- **Functions:** All scholarship/donation functions

#### Domain: `useAlumniStore` (Alumni & Master Classes)
- **State:** `mockAlumni`, `mockMasterclasses`, `mockMasterClassAllowances`
- **Functions:** All alumni/master class functions

#### Domain: `useConfigStore` (Conservatorium Configuration)
- **State:** `conservatoriums`, `conservatoriumInstruments`, `lessonPackages`, `mockBranches`, `mockRooms`
- **Functions:** All config management functions (add/update/delete for branches, instruments, packages, rooms)

#### Domain: `useOpenDayStore` (Open Day)
- **State:** `mockOpenDayEvents`, `mockOpenDayAppointments`
- **Functions:** `addOpenDayAppointment`

---

## 4. Re-Render Cascade Analysis

### Current Problem: The useMemo Dependency Array

The `contextValue` memo at line 2175 has **36 dependencies**:
```
user, users, mockFormSubmissions, mockLessons, mockPackages, mockInvoices,
mockPracticeLogs, mockAssignedRepertoire, mockLessonNotes, mockMessageThreads,
mockProgressReports, mockAnnouncements, mockFormTemplates, mockAuditLog,
mockPlayingSchoolInvoices, mockEvents, mockInstrumentInventory, mockInstrumentRentals,
mockPerformanceBookings, mockScholarshipApplications, mockDonationCauses, mockDonations,
mockOpenDayEvents, mockOpenDayAppointments, mockPracticeVideos, mockAlumni,
mockMasterclasses, mockMasterClassAllowances, mockMakeupCredits, mockRepertoire,
conservatoriums, conservatoriumInstruments, lessonPackages, mockBranches,
mockWaitlist, mockPayrolls, newFeaturesEnabled, isLoading, mockRooms
```

**Any change to ANY of these 36 state variables recreates the entire context value object**, causing every `useAuth()` consumer to re-render.

### Worst-Case Scenarios

1. **Admin approves a user** -> `users` changes -> ALL pages re-render (schedule, billing, practice, alumni, etc.)
2. **Teacher marks lesson completed** -> `mockLessons` changes -> ALL pages re-render
3. **Bootstrap data loads** -> Up to 37 `setState` calls in rapid succession -> 37 potential re-render cascades (React batches some, but not all in useEffect)
4. **Rental purchase eligibility useEffect** (line 226) -> updates `mockInstrumentRentals` AND `users` -> double cascade

### Cross-Domain Side Effects (Anti-Patterns)

Several mutations modify multiple state arrays simultaneously:
- `addPracticeLog` -> `mockPracticeLogs` + `users` (via `awardAchievement`)
- `confirmRentalSignature` -> `mockInstrumentRentals` + `mockInstrumentInventory` + `users`
- `addAnnouncement` -> `mockAnnouncements` + `mockAuditLog`
- `graduateStudent` -> `users` + `mockAlumni`

These cross-domain effects will need careful transaction boundaries in the decomposed architecture.

---

## 5. Existing Domain Hooks (Wrappers)

These hooks already exist and wrap `useAuth()`:

| Hook | File | Data Consumed from useAuth |
|------|------|---------------------------|
| `useMyLessons` | `src/hooks/data/use-my-lessons.ts` | `user`, `lessons` |
| `useMyInvoices` | `src/hooks/data/use-my-invoices.ts` | `user`, `invoices` |
| `useLiveStats` | `src/hooks/data/use-live-stats.ts` | `user`, `users`, `formSubmissions`, `payrolls` |
| `useMakeupCredits` | `src/hooks/data/use-makeup-credits.ts` | `user`, `makeupCredits` |
| `usePracticeLogs` | `src/hooks/data/use-practice-logs.ts` | `user`, `practiceLogs` |
| `usePreLessonSummary` | `src/hooks/data/use-pre-lesson-summary.ts` | Multiple fields |

**These wrappers still trigger re-renders from the monolithic context.** They need to be migrated to React Query to break the dependency.
