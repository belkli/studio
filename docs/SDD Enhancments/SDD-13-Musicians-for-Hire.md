# SDD-13: Musicians for Hire — Event Performance Marketplace

**Module:** 13  
**Dependencies:** Modules 01, 03, 05, 07  
**Priority:** P2 — New revenue stream; requires separate public-facing site/section

---

## 1. Overview & Rationale

A music conservatorium is, at its core, a building full of professional musicians. Yet when someone needs musicians for a wedding, a corporate event, a bar mitzvah, or a memorial ceremony, they have no easy way to find them — and the teachers have no organized channel to offer their services professionally.

This module creates a **two-sided marketplace** embedded within Harmonia:
- **Supply side:** Conservatorium teachers (and optionally students at advanced levels) opt-in with profiles, repertoire videos, and availability
- **Demand side:** Event organizers book a curated ensemble through a professional landing page, with pricing calculated automatically and the conservatorium handling all logistics and payment

**Why this works for everyone:**
- **Teachers** earn significantly more than their lesson rate for a few hours of performance
- **Conservatoriums** earn a commission on every booking, creating a revenue stream that doesn't depend on lesson hours
- **Event organizers** get a reliable, insured, professionally-managed option rather than chasing individual musicians on Facebook
- **The system** handles backup musicians automatically, making it safer than direct booking

---

## 2. Architecture Overview

The Musicians for Hire feature lives on a **dedicated public microsite** that is branded per-conservatorium (or co-branded across a network of conservatoriums):

```
https://musicians.harmonia.co.il              (network-level catalog)
https://music.haifa-conservatorium.co.il      (per-conservatorium branded)
```

The microsite is a Next.js app with its own routes, completely accessible without login, designed to convert event organizers who have never heard of the conservatorium.

---

## 3. Musician Profile (Supply Side)

### 3.1 Data Model

```typescript
{
  id: string;
  userId: string;                      // links to Teacher in Harmonia
  conservatoriumId: string;
  
  // Public Profile
  displayName: string;                 // professional name
  headline: string;                    // e.g., "Concert Pianist & Chamber Musician"
  bio: string;                         // 200-word professional bio
  profilePhotoUrl: string;
  
  // Performance Capabilities
  instruments: Instrument[];
  performanceGenres: PerformanceGenre[];
  // e.g.: CLASSICAL | JAZZ | KLEZMER | MIDDLE_EASTERN | POPULAR | LITURGICAL | FILM_MUSIC
  
  repertoireHighlights: {
    title: string;
    composer: string;
    occasion: string;               // e.g., "Wedding ceremony", "Concert"
  }[];
  
  // Media
  videoLinks: {
    title: string;
    url: string;                    // YouTube/Vimeo
    thumbnailUrl?: string;
    occasion?: string;
  }[];
  audioLinks: {
    title: string;
    url: string;
  }[];
  
  // Performance Details
  performanceRatePerHour: number;    // set by conservatorium, not teacher
  travelRadiusKm: number;
  requiresTransportation: boolean;   // if conservatorium arranges transport
  
  // Ensemble Eligibility
  canPerformSolo: boolean;
  canPerformChamber: boolean;
  ensembleRoles: EnsembleRole[];    // e.g., LEAD_VIOLIN | ACCOMPANIST | SECTION_PLAYER
  
  // Status
  isActive: boolean;
  isOptedIn: boolean;               // teacher explicitly opted in
  adminApproved: boolean;           // admin reviewed the profile
  
  // Stats (auto-generated)
  totalPerformances: number;
  averageRating: number;
}
```

### 3.2 Teacher Opt-In Flow

From the teacher dashboard (`/dashboard/teacher/performance-profile`):

1. Teacher clicks "Join Musicians for Hire"
2. Reads and agrees to Terms of Performance (commission rate, payment terms, behavior standards)
3. Fills in their performance profile (separate from their teaching profile)
4. Uploads profile photo + at least one video link
5. Selects genres and ensemble roles
6. Submits for admin review
7. Admin approves and sets the performance rate
8. Profile goes live on the public microsite

---

## 4. Event Booking — Public-Facing Experience

### 4.1 The Landing Page

`/musicians` or the conservatorium's subdomain

**Above the fold:**
- Hero image/video: a beautiful performance moment
- Headline: "מוזיקאים מקצועיים לאירועים שלא נשכחים"
- Sub-headline: "All musicians from [Conservatorium Name] — vetted, reliable, and fully insured"
- CTA: "Get an instant quote" → scrolls to the configurator

**Trust Signals:**
- Number of professional musicians in the catalog
- Number of events performed
- Average rating from past events
- "If a musician cancels, we provide a replacement — guaranteed"
- Media gallery: photos/videos from past events

**Occasion Tiles:**
- 💍 Wedding Ceremony | 🥂 Wedding Reception
- 🏢 Corporate Event | 🎄 Holiday Party
- 🕍 Bar/Bat Mitzvah | ✡️ Memorial Ceremony
- 🎂 Private Party | 🎓 Graduation | 🎭 Concert & Cultural Event

### 4.2 The Instant Quote Configurator

A step-by-step interactive form that produces a real-time price estimate:

**Step 1 — Event Details**
```
Type of event (dropdown from occasion tiles)
Event date and time
Event duration (hours slider: 1–6h)
Location (address → geocoded for distance calculation)
Indoor / Outdoor
```

**Step 2 — Music Requirements**
```
Ensemble size:
  [ ] Solo (1 musician)
  [ ] Duo (2 musicians)
  [ ] Trio (3 musicians)
  [ ] Quartet (4 musicians)
  [ ] Ensemble (5–8 musicians)
  [ ] Orchestra (9+) — contact us

Instruments / Genre:
  [ ] Classical (strings, piano, woodwinds)
  [ ] Jazz (piano trio, quartet)
  [ ] Klezmer / Jewish Traditional
  [ ] Middle Eastern / Mediterranean
  [ ] Popular / Background
  [ ] Liturgical / Cantorial
  [ ] I need help choosing
  
Repertoire:
  [ ] Standard repertoire (from our catalog)
  [ ] Custom repertoire — I'll provide a list
  [ ] Mixed (standard + 3–5 custom pieces)
```

**Step 3 — Live Price Estimate**

As the user fills in the form, the price updates in real time:

```
📋 Your Quote:
   Duo — Violin & Piano
   3 hours · Corporate event · Tel Aviv
   Standard repertoire
   
   ────────────────────────
   Musicians (2 × ₪X/h × 3h)     ₪XXX
   Travel supplement (30km)        ₪XX
   Custom repertoire: none         ₪0
   ────────────────────────
   Estimated Total                 ₪XXX
   
   [See available musicians for this date] [Get exact quote]
```

**Step 4 — Browse Available Musicians**

Grid of musicians matching the date, instruments, and location:
- Profile card: photo, name, instrument, genres, sample video thumbnail, rating
- "View profile" expands to full bio, video gallery, repertoire list
- Ability to request a specific musician or "Best available match"

**Step 5 — Contact & Booking Form**
```
Your name, email, phone
Organization/Company name (for corporate)
Detailed event description
Special requests or repertoire list upload
How did you hear about us?
[Submit Booking Request]
```

No payment collected at this stage — this generates a **booking inquiry**.

---

## 5. Booking Management (Admin Side)

### 5.1 Booking Inquiry Lifecycle

```
INQUIRY_RECEIVED 
  → ADMIN_REVIEWING 
    → MUSICIANS_CONFIRMED (admin assigns musicians internally)
      → QUOTE_SENT (formal quote sent to client)
        → DEPOSIT_PAID (50% deposit locks the booking)
          → BOOKING_CONFIRMED
            → EVENT_COMPLETED
              → FINAL_PAYMENT_COLLECTED
                → TEACHER_PAYMENT_ISSUED
```

### 5.2 Admin Booking Management (`/admin/performances`)

Dashboard showing all performance bookings:
- **Pipeline view:** Kanban-style columns matching the lifecycle stages
- **Calendar view:** All confirmed performances on a timeline
- **Quick actions per booking:** Assign musicians, send quote, mark deposit received

**Booking Detail Page:**
- Full event details (from inquiry form)
- Client contact info
- Assigned musicians (searchable, availability-checked)
- Financial summary: gross fee, commission, teacher payouts
- Communication log (all emails/calls with client)
- Contract status (PDF generated, signed, returned)
- Notes field for special arrangements

### 5.3 Automated Conflict Checking

When admin assigns a teacher to a performance:
- System cross-references the performance date/time with the teacher's lesson schedule
- If conflict exists: warning shown, admin can either reassign lessons or pick a different musician
- After assignment, the performance slot is blocked in the teacher's availability

---

## 6. Pricing Engine

### 6.1 Price Components

```typescript
{
  baseRatePerMusician: number;        // per hour, set per-conservatorium
  ensembleSizeMultipliers: {          // complexity increases with ensemble coordination
    1: 1.0,
    2: 1.8,                           // less than 2× — ensemble discount
    3: 2.4,
    4: 3.0,
    5: 3.5,
    // 6+: contact for custom pricing
  };
  
  durationRate: number;               // hourly rate (first 2h full rate, 3h+ slight discount)
  
  travelRate: {
    under20km: 0,                     // free within zone
    km20to50: 150,                    // flat fee
    km50to100: 300,                   // flat fee + per-km
    over100km: 'CUSTOM',
  };
  
  repertoireDifficulty: {
    STANDARD: 0,                      // no surcharge
    CUSTOM_EASY: 200,                 // provided list, easy pieces
    CUSTOM_MODERATE: 400,             // provided list, moderate difficulty
    CUSTOM_DEMANDING: 800,            // provided list, advanced/contemporary
  };
  
  occasionPremium: {
    CORPORATE: 0,
    WEDDING: 150,                     // peak demand premium
    BAR_MITZVAH: 100,
    RELIGIOUS_CEREMONY: 0,
    MEMORIAL: -50,                    // slight discount for somber occasions
  };
  
  conservatoriumCommission: number;   // e.g., 0.20 = 20% of total to conservatorium
}
```

### 6.2 Teacher Performance Payment

Musicians are paid via their regular payroll (Module 03):
- Performance appears as a line item in their monthly paystub: "Performance at [event], [date], [hours]"
- Rate is significantly higher than lesson rate (e.g., 2–3× the hourly teaching rate)
- This premium is what makes opt-in attractive for teachers

```typescript
{
  performanceId: string;
  teacherId: string;
  performanceDate: Date;
  hoursPerformed: number;
  performanceRatePerHour: number;  // conservatorium-set, higher than lesson rate
  travelAllowance: number;
  grossEarnings: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
}
```

---

## 7. Cross-Conservatorium Network (Optional)

For regional or national reach:

If multiple conservatoriums join the Harmonia network, the marketplace becomes a **federated catalog**:
- Event organizers see all available musicians across all participating conservatoriums
- Booking is routed to the conservatorium of the assigned musicians
- A small network fee applies to cross-conservatorium bookings
- Each conservatorium maintains control of their own musicians' profiles and rates

This is how a small event organizer in Eilat can book a string quartet from Haifa if that's the best available match.

---

## 8. Contract & Legal Documents

Each confirmed booking generates:

1. **Performance Agreement** (PDF): event details, musicians assigned, repertoire, venue, timing, payment terms, cancellation policy, backup guarantee clause
2. **Invoice / Pro-forma Invoice**: for corporate clients who need it for accounting
3. **Post-event Receipt**: issued upon final payment

All documents use the conservatorium's letterhead and are signed digitally (using the signature system from Module 08).

### 8.1 Backup Guarantee Policy

A key differentiator vs. booking directly from a musician:
> "If a confirmed musician is unable to perform due to illness or emergency, [Conservatorium Name] guarantees to provide a replacement musician of equal or superior caliber. If no replacement is available, a full refund is issued."

This is only possible because the conservatorium has a roster of musicians and internal visibility into availability — something a private individual cannot offer.

---

## 9. Post-Event Flow

After an event is marked as completed:

1. **Client receives rating request:** "How was your performance? Rate your experience (1–5 stars + comment)"
2. Rating is displayed on the musician's profile (anonymized: "Corporate client, Tel Aviv, 2025")
3. **Teacher receives their performance payment** in next payroll cycle
4. **Conservatorium commission** is recorded in financial reports (Module 11)
5. **Follow-up email to client:** "Planning your next event? Save 5% on a repeat booking."

---

## 10. SEO & Marketing Integration

The microsite is built for organic discovery:

- **Local SEO:** "מוזיקאים לחתונה חיפה", "רביעיית מיתרים לאירוע תל אביב", "מוזיקה לאירועים"
- **Schema markup:** MusicGroup, Event, LocalBusiness JSON-LD
- **Performance portfolio page:** Each past event (with client permission) becomes a case study
- **Social proof widgets:** Real-time review feed, total events performed counter
- **Google Ads integration:** Admin can set a monthly budget; system auto-generates ad copy from available musicians

---

## 11. UI Components Required

**Public Microsite:**
| Component | Description |
|-----------|-------------|
| `PerformanceHero` | Landing page hero with video background |
| `OccasionTileGrid` | Event type selection tiles |
| `QuoteConfigurator` | Step-by-step real-time pricing tool |
| `MusicianCatalogGrid` | Browsable musician cards |
| `MusicianProfilePage` | Full profile with video gallery |
| `BookingInquiryForm` | Final inquiry submission |
| `InstantQuoteWidget` | Embeddable widget for third-party sites |

**Admin Portal:**
| Component | Description |
|-----------|-------------|
| `PerformancePipeline` | Kanban board for booking lifecycle |
| `PerformanceCalendar` | Timeline of all confirmed performances |
| `BookingDetailPage` | Full booking management view |
| `MusicianAssignmentPanel` | Assign musicians with conflict checking |
| `PerformancePayrollPanel` | Teacher performance earnings per event |
| `PerformanceAnalytics` | Revenue, popular occasions, conversion rates |

**Teacher Portal:**
| Component | Description |
|-----------|-------------|
| `PerformanceProfileEditor` | Teacher's public performance profile |
| `PerformanceHistoryList` | Past bookings and earnings |
| `PerformanceOptInToggle` | Enable/disable marketplace participation |
