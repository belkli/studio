# SDD-17: Scholarship Fund & Donation Management

**Module:** 17  
**Dependencies:** Modules 01, 02, 05, 07, 08, 11  
**Priority:** P3 — High social impact; significant revenue supplement for the conservatorium

---

## 1. Overview & Rationale

Music education in Israel has a quiet access problem. The students who need music the most — those from single-parent homes, low-income families, new immigrant communities, or underserved towns — are precisely the ones most likely to drop out when money gets tight, or never enroll at all. Meanwhile, many conservatoriums have alumni, parents, and community members who would happily contribute to a scholarship fund if only there were a dignified, transparent, and tax-efficient way to do so.

This module creates that channel: a full scholarship ecosystem connecting donors to students, with a public-facing donation page, a fair scholarship allocation engine, a student financial aid application process, and full integration with Israel's mandatory digital donation reporting system (מערכת תרומות ישראל, Section 46).

The system is designed around three principles:
- **Dignity:** Students apply privately; their financial situation is never exposed to donors
- **Fairness:** Scholarship allocation follows transparent, configurable criteria — not personal relationships
- **Trust:** Every shekel is accounted for and tax-receipt-ready from day one

---

## 2. System Architecture Overview

```
PUBLIC DONATION PAGE                    STUDENT APPLICATION PORTAL
/donate                                 /apply-for-aid
   |                                           |
   v                                           v
[Donation collected]               [Aid application submitted]
[Cardcom payment]                  [Documents uploaded]
[Section 46 API call]              [Admin review]
   |                                           |
   v                                           v
[Scholarship Fund]  <----------->  [Scholarship Committee Review]
   |                                           |
   v                                           v
[Fund balance grows]               [Awards allocated by engine]
                                           |
                                           v
                              [Student receives discount/full scholarship]
                                           |
                                           v
                              [Thank-you letter sent to donor]
```

---

## 3. Data Models

### 3.1 Donation

```typescript
{
  id: string;
  conservatoriumId: string;

  // Donor identity
  isAnonymous: boolean;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  donorIdNumber?: string;        // ת"ז — required for Section 46 tax receipt
  donorOrganization?: string;   // for corporate donors

  // Financial
  amount: number;
  currency: 'ILS';
  paymentMethod: 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'CASH';
  paymentReference?: string;    // Cardcom transaction ID

  // Tax receipt
  taxReceiptEligible: boolean;  // true only if donorIdNumber provided
  section46AllocationNumber?: string;  // מספר הקצאה from Israel Tax Authority API
  receiptUrl?: string;          // PDF stored in Firebase Storage
  reportedToTaxAuthority: boolean;
  reportedAt?: Timestamp;

  // Dedication
  isDedicated: boolean;
  dedicationText?: string;      // e.g., "In memory of Miriam Cohen"

  // Fund targeting
  targetType: 'GENERAL_FUND' | 'SPECIFIC_STUDENT' | 'INSTRUMENT_FUND';
  targetStudentId?: string;    // if donor wants to sponsor a named student
  targetInstrument?: Instrument;

  // Status
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  confirmedAt?: Timestamp;
  isRecurring: boolean;
  recurringIntervalMonths?: number;  // 1 | 3 | 12

  // Messaging
  donorMessage?: string;        // personal message to the student (optional)
  thankYouReceived: boolean;    // has the thank-you letter been sent back?

  createdAt: Timestamp;
}
```

### 3.2 ScholarshipApplication

```typescript
{
  id: string;
  studentId: string;
  conservatoriumId: string;
  academicYear: string;

  // Application type
  type: 'FINANCIAL_AID' | 'MERIT_SCHOLARSHIP' | 'COMBINED';

  // Financial aid evidence (uploaded documents)
  documents: {
    type: DocumentType;
    fileUrl: string;
    uploadedAt: Timestamp;
    reviewedAt?: Timestamp;
    reviewNote?: string;
  }[];

  // Merit criteria (for merit scholarships)
  teacherEndorsement?: string;
  teacherRating?: number;          // 1–10 teacher assessment
  recitalPerformances?: number;    // appearances in official recitals
  examGrade?: string;              // Ministry exam grade if applicable
  competitionResults?: string;     // competition awards

  // Self-declaration (financial aid)
  householdSize: number;
  monthlyIncome?: number;          // optional; supports SES calculation
  isSingleParent: boolean;
  isNewImmigrant: boolean;         // עולה חדש
  isDisabled: boolean;             // student or parent with disability
  additionalContext?: string;      // free text for special circumstances

  // Requested support
  requestedDiscountPercent: number;   // what the student requests: 25 | 50 | 75 | 100
  requestedMonths: number;            // how many months of support requested

  // Review
  status: ApplicationStatus;
  priorityScore: number;              // calculated by allocation engine
  committeeNotes?: string;
  awardedDiscountPercent?: number;    // what was actually granted
  awardedMonths?: number;
  awardedFrom?: Date;
  awardedUntil?: Date;
  linkedDonationIds?: string[];       // which donations fund this award

  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
}

type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'DOCUMENTS_PENDING'   // some documents missing
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PARTIALLY_APPROVED'  // lower discount than requested
  | 'WAITLISTED'          // approved but fund insufficient right now
  | 'REJECTED'
  | 'EXPIRED'             // approval lapsed without renewal

type DocumentType =
  | 'INCOME_CERTIFICATE'        // אישור הכנסה
  | 'SINGLE_PARENT_CERTIFICATE' // אישור חד הורי
  | 'NEW_IMMIGRANT_CERTIFICATE' // תעודת עולה
  | 'DISABILITY_CERTIFICATE'    // אישור נכות
  | 'SOCIAL_WORKER_LETTER'      // מכתב עו"ס
  | 'NATIONAL_INSURANCE_BENEFIT'// קצבת ביטוח לאומי
  | 'TEACHER_RECOMMENDATION'    // for merit scholarship
  | 'EXAM_CERTIFICATE'          // Ministry exam results
  | 'COMPETITION_AWARD'         // competition proof
```

### 3.3 ScholarshipFund

```typescript
{
  id: string;
  conservatoriumId: string;
  name: string;                 // e.g., "קרן המלגות של קונסרבטוריון חיפה"
  description: string;

  // Balance
  totalReceived: number;        // all-time donations
  totalAwarded: number;         // all-time scholarships paid out
  currentBalance: number;       // available to allocate

  // Policy (admin-configured)
  maxAwardPercent: number;      // e.g., 100 (full scholarship possible)
  maxAwardMonths: number;       // e.g., 12 months max per award
  renewalRequiresReapplication: boolean;
  meritQuota: number;           // % of fund reserved for merit (vs. financial need)
  section46ApprovalNumber?: string;  // the conservatorium's Section 46 approval number

  // Targets
  annualTarget: number;         // fundraising goal
  featuredStudentCount?: number; // how many anonymized student stories to show on donation page
}
```

---

## 4. Public Donation Landing Page

`/donate` (or `donate.[conservatorium].harmonia.co.il`)

This is a standalone, emotionally resonant page designed to convert casual visitors into donors. It is fully accessible without login.

### 4.0 Visual Design Philosophy

The public donation page at `/donate` must be a visually compelling, emotionally resonant landing page designed for conversion, not a simple administrative form. It should function as a marketing asset that tells a story and inspires giving. Key elements include:
*   **High-Quality Imagery:** Use professional, evocative (yet anonymized) photography of students and music. Avoid generic stock photos. Photos should convey dedication, passion, and the joy of music.
*   **Strong Emotional Hook:** The headline and opening section must immediately connect with the visitor's desire to make a difference.
*   **Clear Impact Metrics:** Use bold typography and counters to show tangible results (e.g., "XX students supported").
*   **Storytelling:** Anonymized student stories are the core of the page and should be presented as visually distinct cards with a personal touch.
*   **Trust and Transparency:** The design should feel professional and trustworthy, with clear information on fund allocation and tax-deductibility.


### 4.1 Page Structure

**Section 1 — The Hook**
- Full-bleed header image/video: a student performing, shot from behind (anonymized)
- Headline: "כי מוזיקה היא לא רק לאלה שיכולים להרשות לעצמם"
- Subheadline: "כל תרומה מאפשרת לילד מוכשר להמשיך את דרכו המוזיקלית"
- Single CTA button: [תרמו עכשיו]

**Section 2 — The Impact Numbers**
- Live counter: "XX students supported this year"
- "₪[total donated] raised from [N] donors"
- "Average scholarship covers [X]% of tuition"

**Section 3 — Anonymized Student Stories**
3–5 cards, each representing a real (anonymized) scholarship recipient:
```
Card example:
[Music note icon]
"מיה, גיל 14, כינור"
"מיה מגיעה ממשפחה חד-הורית. המלגה מאפשרת לה להמשיך 
ולהתכונן לבחינות משרד החינוך. המורה שלה אומרת שיש לה 
פוטנציאל אמיתי לקריירה מוזיקלית."
[Status bar: 60% funded]
```
Stories are written by the admin; names are changed; faces are never shown. Donors can optionally "adopt" a specific student story (their donation goes to the matching fund for that instrument/age group).

**Section 4 — The Donation Configurator**

```
How much would you like to donate?
[₪100] [₪250] [₪500] [₪1,000] [Other: ___]

One-time | Monthly | Quarterly | Annual

[  ] Dedicate this donation (in honor of / in memory of)
[  ] Include a personal message to the student

[Your details for tax receipt — Section 46]
Name: ___________
ID Number: _________ (required for tax receipt)
Email: ___________

[ ] I prefer to donate anonymously (no tax receipt issued)

[ ] I have read and agree to the donation terms

[Donate ₪XXX →]

⭐ Your donation is tax-deductible under Section 46
   of the Israeli Income Tax Ordinance (35% credit)
```

**Section 5 — Transparency**
- Pie chart: how donations are allocated (direct tuition | materials | admin)
- Statement: "100% of your donation goes directly to student tuition support. Administrative costs are covered by the conservatorium's operating budget."
- Link to audited annual report (PDF)

**Section 6 — Recurring Donors Wall**
- "Our community of supporters" — first names + donation month of recurring donors (opt-in)
- A live ticker: "Rivka from Tel Aviv just donated ₪200"

### 4.2 Mobile Optimization

The donation page is built mobile-first. The donation configurator is a single scrollable form that works perfectly with Israeli mobile payment habits (card via Cardcom, Apple Pay, Google Pay).

---

## 5. Donation Processing & Section 46 Integration

### 5.1 Payment Flow

1. Donor fills in the configurator and clicks [Donate]
2. Cardcom checkout opens (already integrated in Module 05)
3. Payment is processed
4. On success webhook from Cardcom:
   - Donation record is created in Firestore
   - If `donorIdNumber` was provided → Section 46 API call (see 5.2)
   - Receipt PDF is generated and emailed
   - Fund balance is updated in real time
   - Admin receives notification: "New donation: ₪XXX from [name/Anonymous]"

### 5.2 מערכת תרומות ישראל — Section 46 API Integration

From January 1, 2026, all public institutions with Section 46 approval are required to report every donation digitally to the Israel Tax Authority via the "תרומות ישראל" system. This saves donors from keeping paper receipts, as all donations appear automatically in their personal area on the Tax Authority website.

Cardcom (already the system's payment gateway) supports direct integration with the תרומות ישראל system, so donations processed via Cardcom can be automatically reported to the Tax Authority.

**Implementation:**

```typescript
// Called after successful Cardcom payment confirmation
async function reportDonationToTaxAuthority(donation: Donation): Promise<string | null> {
  if (!donation.donorIdNumber || donation.isAnonymous) {
    // Anonymous donations: no tax reporting, no allocation number
    await updateDonation(donation.id, {
      taxReceiptEligible: false,
      reportedToTaxAuthority: false,
    });
    return null;
  }

  // Call Israel Tax Authority API (via Cardcom integration or direct API)
  const payload = {
    institutionSection46Number: CONSERVATORIUM_SECTION_46_NUMBER,
    donorIdNumber: donation.donorIdNumber,
    donorName: donation.donorName,
    donationAmount: donation.amount,
    donationDate: donation.confirmedAt.toDate(),
    receiptNumber: donation.id,  // internal receipt number
    currency: 'ILS',
  };

  try {
    const response = await taxAuthorityApi.reportDonation(payload);
    const allocationNumber = response.allocationNumber;  // מספר הקצאה

    await updateDonation(donation.id, {
      section46AllocationNumber: allocationNumber,
      reportedToTaxAuthority: true,
      reportedAt: Timestamp.now(),
      taxReceiptEligible: true,
    });

    // Generate official receipt PDF with allocation number printed on it
    await generateTaxReceipt(donation, allocationNumber);

    return allocationNumber;
  } catch (error) {
    // Log failure; admin alerted to report manually
    await flagForManualReporting(donation.id, error);
    return null;
  }
}
```

**Required conservatorium prerequisites (one-time setup):**
1. Conservatorium must hold a valid Section 46 approval from the Tax Authority
2. Register on the Tax Authority digital services portal as an authorized organization
3. Generate API credentials via the Tax Authority portal
4. Configure credentials in Lyriosa admin settings at `/admin/settings/donations`

**Important:** For Section 46 tax credit eligibility, the donor's Israeli ID number (ת"ז) is required. Donations without an ID number are accepted normally but do not receive an allocation number and cannot be used for tax credit. The donation page clearly explains this distinction without making anonymous donors feel unwelcome.

### 5.3 Recurring Donations

For monthly/quarterly/annual recurring donations:
- Card token stored via Cardcom (same as Module 05 subscriptions)
- Charges triggered on schedule via Firebase Scheduled Functions
- Each charge generates a new Section 46 report and receipt
- Donor can manage (pause/cancel) their recurring donation from a link in every receipt email — no account required

### 5.4 Anonymous Donations

- Processed normally through Cardcom
- No ID number collected
- No Section 46 report filed (donor cannot claim tax credit)
- Receipt issued as a simple acknowledgment PDF (not a tax receipt)
- Fund balance updated
- Admin sees: "Anonymous donation — ₪XXX"
- If donor included a message for the student, it is delivered without identifying the donor

---

## 6. Student Financial Aid Application

`/dashboard/apply-for-aid` (accessible once enrolled)

This is a private, sensitive flow. Strict privacy controls apply throughout.

### 6.1 Application Wizard

**Step 1 — Application Type**
```
[ ] Financial Aid (need-based)
    → Support based on family financial situation

[ ] Merit Scholarship (talent-based)
    → Support based on musical achievement and potential

[ ] Combined Application
    → Apply for both tracks simultaneously
```

**Step 2 — Financial Aid Track (if selected)**

Self-declaration form, with document upload:
```
Household size: [number]
Monthly household income: [₪ range selector, optional]
Special circumstances (select all that apply):
  [x] Single-parent household         → upload: אישור חד הורי
  [ ] New immigrant (עולה חדש)        → upload: תעודת עולה
  [ ] Disability (student or parent)  → upload: אישור נכות
  [ ] Receiving National Insurance    → upload: קצבת ביטוח לאומי
  [ ] Social worker involvement       → upload: מכתב עו"ס
  [ ] Other circumstances             → free text

Monthly tuition you can currently afford: [₪ field]
Additional context (optional): [text area]
```

**Step 3 — Merit Track (if selected)**

```
Your teacher's endorsement will be requested automatically.
Please also provide (optional):
  Ministry exam grade achieved: [dropdown]
  Competition awards: [text + upload proof]
  Recital performances this year: [number]
  Why is this scholarship important for your musical journey? [200 words]
```

**Step 4 — Requested Support**

```
Discount requested:
  [ ] 25% off monthly tuition
  [ ] 50% off monthly tuition
  [ ] 75% off monthly tuition
  [ ] Full scholarship (100%)

Duration:
  [ ] 3 months (trial period)
  [ ] 6 months
  [ ] Full academic year (September–June)
  [ ] Ongoing (subject to annual renewal)
```

**Step 5 — Declaration & Submission**
```
[ ] I declare the information provided is accurate and complete
[ ] I understand that this application is confidential and will only 
    be reviewed by designated staff
[ ] I consent to my teacher being contacted for an endorsement
    (merit track only)

[Submit Application]
```

### 6.2 Teacher Endorsement (Merit Track)

After a merit application is submitted:
1. Assigned teacher receives an email/notification: "[Student name] has applied for a merit scholarship and listed you as their teacher. Please complete a brief endorsement."
2. Teacher fills: assessment rating (1–10), free-text recommendation, instrument proficiency level, exam readiness, specific achievement highlights
3. Endorsement is attached to the application — student cannot see it
4. If teacher doesn't respond within 7 days, a reminder is sent; admin can escalate

### 6.3 Application Privacy Rules

**Who can see what:**

| Data | Student | Parent | Teacher | Admin |
|------|---------|--------|---------|-------|
| Own application status | ✅ | ✅ | ❌ | ✅ |
| Application details | ✅ | ✅ | Endorsement only | ✅ |
| Other students' applications | ❌ | ❌ | ❌ | ✅ |
| Which students receive scholarships | ❌ | ❌ | ❌ | ✅ |
| Scholarship amount on invoice | ✅ (as discount) | ✅ | ❌ | ✅ |

Teachers and other staff never know which students receive scholarships. The discount appears on the invoice as "Scholarship Award" with no further detail.

---

## 7. Scholarship Allocation Engine

### 7.1 The Priority Score

When the scholarship committee reviews applications, the system calculates a priority score for each applicant to guide (not replace) human judgment:

```typescript
function calculatePriorityScore(application: ScholarshipApplication): number {
  let score = 0;

  // --- Financial Need Component (max 60 points) ---
  if (application.isSingleParent)          score += 20;
  if (application.isNewImmigrant)          score += 10;
  if (application.isDisabled)              score += 10;
  if (application.hasNationalInsurance)    score += 15;
  if (application.hasSocialWorkerLetter)   score += 10;

  // Income-based adjustment (if income declared)
  if (application.monthlyIncome !== undefined) {
    if (application.monthlyIncome < 5000)  score += 15;
    else if (application.monthlyIncome < 8000) score += 8;
  }

  // --- Merit Component (max 40 points, for merit/combined) ---
  if (application.type !== 'FINANCIAL_AID') {
    score += Math.round((application.teacherRating ?? 0) * 2);  // 0–20
    if (application.examGrade) score += 10;
    if (application.competitionResults) score += 10;
  }

  // --- Urgency Adjustment ---
  // Student currently enrolled but package expired due to finances
  if (application.student.enrollmentStatus === 'SUSPENDED_PAYMENT') score += 15;

  return Math.min(score, 100);
}
```

The score is **advisory** — the committee sees it alongside the full application and can override. Scores are never shown to students or parents.

### 7.2 The Allocation Process

`/admin/scholarships`

Admin (or a designated scholarship committee member) sees:

**Allocation Dashboard:**
- Current fund balance: ₪[X] available
- Pending applications: [N] applications, total requested: ₪[X]/month
- Applications sorted by priority score (highest first)
- Fund coverage indicator: "At current balance, you can fund [N] full scholarships or [N] partial scholarships"

**Per-Application Review:**
- Student name, instrument, grade, years enrolled
- Application type and priority score
- Document checklist (green/red indicators)
- Teacher endorsement summary (if available)
- Requested vs. committee-awarded fields (editable)
- Decision: Approve / Partially Approve / Waitlist / Reject
- Committee notes (internal, never shown to student)

**Batch Approval:**
Admin can select multiple applications and apply a decision to all, useful when the fund can cover several applications at a standard level (e.g., "Approve all high-need applications at 50%").

### 7.3 Award Rules & Renewal

Standard scholarship behavior aligned with Israeli music education norms:

| Rule | Default | Admin-Configurable? |
|------|---------|---------------------|
| Minimum academic standing to keep scholarship | Continue lessons regularly | Yes |
| Maximum absences before review | 3 no-shows per term | Yes |
| Renewal requires new application | Yes, annually | Yes |
| Merit scholarship minimum grade retention | Teacher rating ≥ 7/10 | Yes |
| Grace period if fund runs low | 1 month continued | Yes |
| Notification before scholarship expires | 30 days | Yes |

### 7.4 Scholarship Application Timeline

For a typical academic year:
```
July 1     — Applications open for next year
August 15  — Application deadline
September 1 — Committee reviews (2 weeks)
September 15 — Decisions communicated
September   — Awards applied to October invoices
March       — Mid-year review for multi-year awards
June        — Renewal applications open
```

---

## 8. Thank-You Letter System

When a scholarship award is funded by a donation, the system facilitates a thank-you exchange while protecting everyone's identity.

### 8.1 Triggering a Thank-You Request

When an award is finalized and linked to specific donation(s):
1. Student/parent receives a gentle prompt (not a requirement): "Your scholarship is supported by a generous donor. Would you like to send them a thank-you message?"
2. Options:
   - [ ] Write a digital thank-you letter (text + optional drawing for younger students)
   - [ ] Scan a handwritten letter (upload photo)
   - [ ] Record a short video message (max 60 seconds, mobile-friendly)
   - [ ] No thank-you at this time

### 8.2 Privacy in Delivery

- The thank-you is reviewed by admin before being forwarded to the donor
- No identifying information about the student passes to the donor (name is replaced with "a student in our conservatorium" unless the student/parent chooses to include it)
- The donor receives the thank-you via email with the subject: "A message from the student you helped"

### 8.3 Donor Impact Dashboard

Logged-in donors (those who created an account, optional) see at `/donate/my-impact`:
- Total donated to date
- Estimated number of lesson-months their donation has funded
- Any thank-you letters/videos received (beautifully presented)
- Tax receipts downloadable (all Section 46 allocation numbers)
- Option to increase or change their recurring donation

---

## 9. Admin Fund Management

`/admin/scholarship-fund`

### 9.1 Fund Overview
- Current balance, monthly in/out cash flow
- YTD donations by source (online, recurring, one-time, anonymous)
- YTD scholarships awarded by category (financial aid vs. merit)
- Projected balance: "At current award commitments, the fund will sustain for [X months]"

### 9.2 Donor Management
- Full list of donors (excluding anonymous)
- Recurring donor management: see active recurring amounts, next charge dates
- Lapsed recurring donors: list of donors who canceled, with option to send re-engagement email
- Export: donor list for annual thank-you campaign, Section 46 annual reconciliation report

### 9.3 Section 46 Compliance Reports
- Monthly reconciliation: all donations reported vs. confirmed by Tax Authority
- Any failed API calls (donations not reported, requiring manual follow-up)
- Annual summary report for the Section 46 license renewal (required by Tax Authority)
- Export in the format required by rshut hamissim

### 9.4 Scholarship Analytics
- Scholarship utilization rate (% of fund actively deployed)
- Student retention rate for scholarship recipients (do they stay enrolled?)
- Applications by demographic (financial aid vs. merit, single parent %, instrument distribution)
- Thank-you letter conversion rate (% of recipients who send a message)

---

## 10. Fundraising Campaigns

Admin can run targeted campaigns to grow the fund:

`/admin/scholarship-fund/campaigns`

```typescript
{
  id: string;
  name: string;                  // e.g., "End of Year Giving Campaign"
  targetAmount: number;
  startDate: Date;
  endDate: Date;
  description: string;
  matchingDonor?: {              // matching gift campaign
    donorName: string;
    matchRatio: number;          // e.g., 1.0 = 1:1 match
    matchCapAmount: number;      // e.g., up to ₪10,000 total match
  };
  featuredStories: string[];     // which anonymized stories to feature
  emailBlastSentAt?: Timestamp;
  totalRaisedInCampaign: number;
}
```

**Matching Gift Campaigns:** A major donor commits to matching every donation up to a cap. The donation page shows a live progress bar: "₪X raised · Matched to ₪X · ₪X remaining before the match expires." This is one of the most effective fundraising mechanics in the nonprofit world.

**Year-End Campaigns:** Triggered automatically in November/December — the period of highest donation intent in Israel — with a pre-written email sequence to all past donors.

---

## 11. UI Components Required

**Public Donation Page:**
| Component | Description |
|-----------|-------------|
| `DonationHero` | Full-bleed header with CTA |
| `ImpactCounters` | Live donor/student/amount counters |
| `StudentStoryCard` | Anonymized scholarship recipient story |
| `DonationConfigurator` | Amount selector + frequency + tax details |
| `MatchingGiftBanner` | Campaign-specific matching progress bar |
| `DonorWall` | Opt-in recurring donor recognition |
| `TransparencySection` | Fund allocation breakdown |

**Student Application:**
| Component | Description |
|-----------|-------------|
| `AidApplicationWizard` | Multi-step aid application with document upload |
| `DocumentUploadChecklist` | Required document tracker with upload status |
| `ApplicationStatusTracker` | Student-facing status timeline |
| `ThankYouComposer` | Text / scan / video thank-you creator |

**Admin:**
| Component | Description |
|-----------|-------------|
| `ScholarshipAllocationDashboard` | Fund balance + pending applications view |
| `ApplicationReviewCard` | Per-application decision interface |
| `FundBalanceProjection` | Forward-looking sustainability indicator |
| `Section46ComplianceReport` | Tax authority reconciliation panel |
| `DonorManagementTable` | Searchable donor list with recurring management |
| `CampaignBuilder` | Fundraising campaign creation and tracking |
| `DonorImpactDashboard` | Donor-facing thank-you and receipt view |

---

## 12. Legal & Compliance Notes

> ⚠️ **Legal prerequisite:** The conservatorium must hold a valid **Section 46 approval** (אישור לפי סעיף 46 לפקודת מס הכנסה) from the Israel Tax Authority before this module can be activated for tax-deductible donations. Without it, donations can still be collected, but no tax receipts can be issued and Section 46 reporting does not apply. Admin settings will indicate this requirement and link to the Tax Authority application process.

> ⚠️ **From January 1, 2026:** All public institutions holding a Section 46 approval are legally required to issue a digital receipt with a unique allocation number for every donation, reported directly to the Tax Authority. Failure to comply risks the institution's Section 46 status. This module's Section 46 integration is designed to fulfill this obligation automatically.

> ⚠️ **Scholarship fund accounting:** All donations to the scholarship fund must be tracked separately from the conservatorium's operating revenue for audit and ניהול תקין (proper management) compliance. The module's fund ledger is designed to produce the required separation of accounts.

> ⚠️ **Student data privacy:** Scholarship applications contain highly sensitive personal and financial information. Access is restricted to designated committee members only. Financial aid data is never visible to teachers, and scholarship status is never visible to other students or parents.
