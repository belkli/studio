# SDD-02: Student Registration & Enrollment

**Module:** 02  
**Dependencies:** Module 01 (Identity)  
**Priority:** P0 — Core user journey

---

## 1. Overview & Rationale

Today, enrolling a student at a conservatorium typically involves: a phone call, a visit to the office, paper forms, cash payment, and hoping the secretary manually enters everything correctly. Students are often matched to teachers informally ("whoever has availability") without considering the student's goals, style, or schedule.

This module replaces that entire process with an intelligent, self-service enrollment journey that takes a prospective student from "I want to learn piano" to "I have a confirmed slot on Tuesday at 4pm with Teacher Rivka" — in under 10 minutes, from any device.

---

## 2. Enrollment Journey

### 2.1 Entry Points

| Entry Point | URL | Description |
|-------------|-----|-------------|
| Main registration | `/register` | Full enrollment wizard |
| Trial lesson only | `/try` | Quick booking for one trial, no commitment |
| Direct teacher booking | `/book/teacher/:id` | Book with a specific teacher by sharing their profile link |
| Admin-created enrollment | `/admin/enroll` | Admin enrolls a student manually (e.g., off-the-street walk-in) |

### 2.2 The Enrollment Wizard (`/register`)

**Step 1 — Who is registering?**
- [ ] I am a parent registering my child
- [ ] I am registering myself (13+)

**Step 2 — Personal Details**

*For Parent:*
```
Parent: First Name, Last Name, Email, Phone, ID Number (for invoicing)
Child: First Name, Last Name, Date of Birth, School Name, Grade
```
*For 13+ Student:*
```
Student: First Name, Last Name, Date of Birth, Email, Phone
School Name, Grade
(Optional) Parent/Guardian email — for payment setup
```

**Step 3 — Musical Profile**
```
Instrument (searchable dropdown, multi-select allowed for ensemble students)
Current Level: Beginner | Intermediate | Advanced | Exam Candidate
Previous Experience: text field (e.g., "3 years piano, no formal grades")
Goals: [ ] Israeli Music Ministry Exams  [ ] Performance/Recitals  
        [ ] Personal Enjoyment  [ ] Competition  [ ] Other
Preferred lesson duration: 30 min | 45 min | 60 min
```

**Step 4 — Schedule Preferences**
```
Available days: Mon Tue Wed Thu Fri Sun (checkboxes)
Available times: Morning (8–13) | Afternoon (13–17) | Evening (17–21)
Virtual lessons OK? Yes / No / Only
```

**Step 5 — Teacher Matching**
*(Powered by AI Matchmaker Agent — see Module 10)*

The system presents 2–3 recommended teachers with:
- Photo, name, bio snippet
- Matching score explanation (e.g., "Available Wednesday afternoons · Specializes in exam preparation · 4.9★")
- "See full profile" expandable card
- Available trial slots preview

Student/Parent selects preferred teacher, or selects "Match me automatically."

**Step 6 — Package Selection**
*(See Module 05 for pricing details)*
```
[ ] Trial Lesson — 1 session, no commitment (₪X)
[ ] 5-Lesson Pack — flexible scheduling (₪X, save 5%)
[ ] 10-Lesson Pack — flexible scheduling (₪X, save 10%)
[ ] Monthly Subscription — recurring weekly slot (₪X/month)
[ ] Yearly Commitment — reserved weekly slot, best price (₪X/year, pay monthly or upfront)
```

**Step 7 — Book First Lesson**
- Calendar showing teacher's available slots
- Filter by: this week / next 2 weeks / specific date
- Click slot to select
- Confirmation summary: Teacher · Instrument · Date & Time · Duration · Price

**Step 8 — Payment**
*(See Module 05)*
- Credit/debit card (Cardcom / Tranzila integration)
- Bank transfer (with manual confirmation flow)
- Phone payment QR code option (for less tech-savvy users)

**Step 9 — Confirmation**
- Summary page with all details
- Calendar invite download (.ics)
- WhatsApp confirmation option
- "What happens next?" explainer (admin approval, teacher contact, etc.)

---

## 3. Enrollment States

```
NEW_LEAD → PENDING_PAYMENT → PENDING_APPROVAL → ACTIVE → SUSPENDED | GRADUATED
```

| State | Description | Who Can Change |
|-------|-------------|----------------|
| `NEW_LEAD` | Wizard started but not completed | — |
| `PENDING_PAYMENT` | Wizard complete, payment not confirmed | Payment gateway webhook |
| `PENDING_APPROVAL` | Payment confirmed, awaiting admin approval | Admin |
| `ACTIVE` | Fully enrolled, can book and access system | Admin, system |
| `SUSPENDED` | Outstanding balance or disciplinary | Admin |
| `GRADUATED` | Completed studies (e.g., passed final exam) | Admin |

---

## 4. Trial Lesson Flow (`/try`)

A lightweight version of enrollment designed for conversion. No account required upfront.

1. Select instrument
2. Select teacher (or "Surprise me" for auto-match)
3. Pick available slot from calendar
4. Enter name, phone, email
5. Pay trial fee (card or phone)
6. Receive SMS confirmation

After the trial lesson:
- Automatic SMS/email: "How was your lesson? Continue with a package? [Book Now]"
- Teacher logs a note after the lesson
- If student books a package, trial lesson fee is deducted (configurable per conservatorium)

---

## 5. Admin Manual Enrollment (`/admin/enroll`)

For walk-in registrations or phone enrollments. Admin can:
- Create a full user account directly
- Skip payment (e.g., invoice them later)
- Assign a teacher and time slot directly
- Auto-generate a welcome email to the student/parent

---

## 6. Re-Enrollment

When an existing student's package expires or subscription lapses:
- System automatically emails/SMS 14 days before expiry: "Your package expires on [date]. Renew to keep your slot!"
- Renewal is one-click from the notification
- If not renewed within 3 days of expiry, the recurring time slot is **released** back to the public availability pool
- Student retains their profile, history, and forms

---

## 7. Waitlist Management

When a teacher has no available slots:
```typescript
{
  id: string;
  studentId: string;
  teacherId: string;
  instrument: Instrument;
  preferredDays: DayOfWeek[];
  preferredTimes: TimeRange[];
  joinedAt: Timestamp;
  notifiedAt?: Timestamp;
  status: 'WAITING' | 'OFFERED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
}
```

- Student can join a teacher's waitlist during enrollment
- When a slot opens (cancellation, new availability), the first matched waitlist entry receives a **48-hour priority offer** via SMS + email
- If not accepted in 48 hours, the offer moves to the next person
- Admin can view and manage all waitlists at `/admin/waitlists`

---

## 8. Data Collected for Ministry Compliance

The enrollment form collects all fields required by the Israeli Ministry of Education for music school registration:
- Student ID number (for 18+) or Parent ID number (for minors)
- School and grade
- Instrument and level
- Conservatorium registration number on all generated documents

---

## 9. UI Components Required

| Component | Description |
|-----------|-------------|
| `EnrollmentWizard` | 9-step wizard with progress indicator |
| `TeacherMatchCard` | Teacher recommendation card with match score |
| `AvailabilityCalendar` | Interactive slot picker |
| `PackageSelector` | Visual package comparison with pricing |
| `TrialBookingWidget` | Lightweight 4-step trial booking |
| `WaitlistJoinModal` | One-click waitlist registration |
| `EnrollmentConfirmation` | Post-enrollment summary with .ics download |
