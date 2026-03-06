# SDD-12: Smart Slot Filling & Dynamic Promotions

**Module:** 12  
**Dependencies:** Modules 03, 04, 05, 07, 10  
**Priority:** P1 — Direct revenue impact; every empty slot is lost income

---

## 1. Overview & Rationale

An empty lesson slot is the conservatorium's equivalent of an airplane seat that took off empty — the revenue is gone forever. Unlike airlines, most conservatoriums do nothing about this. They don't know which slots are empty until the day itself, and by then it's too late.

This module turns empty slots into a proactive revenue engine using dynamic pricing, targeted AI-driven outreach, and multi-channel promotion. The goal is simple: **every teacher, fully booked, every week.**

The system operates across three horizons:
- **Same-day slots** (highest urgency, deepest discount, widest broadcast)
- **This-week slots** (moderate urgency, moderate discount, targeted push)
- **Next-week+ slots** (low urgency, small incentive, personalized recommendation)

---

## 2. The Empty Slot Detection Engine

A Firebase Cloud Function runs every hour, scanning the schedule and classifying each unbooked availability window:

```typescript
type SlotUrgency = 
  | 'SAME_DAY'        // lesson starts within 6 hours
  | 'TOMORROW'        // lesson is tomorrow
  | 'THIS_WEEK'       // 2–6 days away
  | 'NEXT_WEEK_PLUS'  // 7+ days away

type SlotDemandLevel =
  | 'HIGH_DEMAND'     // peak hours: afternoons 15:00–19:00, Sunday-Thursday
  | 'MEDIUM_DEMAND'   // mornings and early evenings
  | 'LOW_DEMAND'      // historically hard-to-fill: mornings on weekdays, Friday

interface EmptySlot {
  teacherId: string;
  instrument: Instrument;
  startTime: Timestamp;
  durationMinutes: number;
  urgency: SlotUrgency;
  demandLevel: SlotDemandLevel;
  basePrice: number;
  recommendedDiscount: number;   // calculated by pricing engine (see Section 3)
  promotionalPrice: number;
  targetAudience: TargetAudience; // calculated by AI (see Section 5)
}
```

---

## 3. Dynamic Pricing Engine

### 3.1 Discount Matrix

The system applies discounts automatically based on urgency and historical demand:

| Urgency | High Demand Hours | Medium Demand | Low Demand Hours |
|---------|-------------------|---------------|------------------|
| Same-Day (<6h) | 20% off | 30% off | 40% off |
| Tomorrow | 10% off | 15% off | 25% off |
| This Week | 5% off | 8% off | 12% off |
| Next Week+ | 0% | 0–3% | 0–5% |

All discount thresholds are admin-configurable at `/admin/settings/promotions`. Admin can set:
- Maximum discount cap (e.g., never exceed 40%)
- Minimum margin floor (e.g., never go below teacher's cost rate)
- Whether discounts apply to existing students, new leads, or both

### 3.2 Price Calculation

```typescript
function calculatePromotionalPrice(slot: EmptySlot, policy: DiscountPolicy): number {
  const baseDiscount = DISCOUNT_MATRIX[slot.urgency][slot.demandLevel];
  const cappedDiscount = Math.min(baseDiscount, policy.maxDiscountPercent);
  const discountedPrice = slot.basePrice * (1 - cappedDiscount);
  return Math.max(discountedPrice, policy.minimumPrice);
}
```

The promotional price is displayed to the user as:
> ~~₪120~~ **₪84** today only · Normally ₪120

### 3.3 Revenue Recovery Accounting

Every booked promotional slot logs:
- Original price
- Promotional price
- Discount applied
- Revenue recovered vs. zero (empty slot value = ₪0)

This is reported in Module 11's financial dashboard as "Recovered Revenue" — showing admin that even a discounted lesson is better than an empty slot.

---

## 4. Notification Channels & Targeting

### 4.1 For Existing Students & Parents (Opt-In)

Students and parents who opt into "Available Slot Alerts" receive personalized notifications:

**Opt-in setting:** `/dashboard/settings/notifications` → "Notify me about available slots near me"

Sub-preferences:
- [ ] Same-day only
- [ ] Any slot this week
- [ ] Preferred teacher only
- [ ] Any teacher of my instrument
- [ ] Include discounted slots only

**Notification Example (SMS):**
> 🎵 יש שעת גיטרה פנויה היום ב-16:00 עם מורה אבי — מחיר מיוחד: **₪70** במקום ₪100.
> [הזמן עכשיו — נותרו 2 שעות] | [לא רלוונטי]

The "לא רלוונטי" (Not relevant) tap removes this type of notification for 7 days (prevents fatigue).

### 4.2 For New Leads — Waitlist & Trial Pool

When no existing student claims a same-day slot:
1. Check waitlist for the teacher+instrument combination
2. Notify waitlisted leads with a "Jump the queue — trial at a discount!" message
3. If waitlist is empty, broadcast to the **Open Slot Pool** (see 4.3)

### 4.3 WhatsApp Group Broadcast

Admin can configure one or more WhatsApp group broadcast lists:
- **"שעות פנויות"** — a dedicated group/channel for available slots
- **"לידים חדשים"** — prospective students who enquired but haven't enrolled

```typescript
{
  channelName: string;
  channelType: 'WHATSAPP_GROUP' | 'WHATSAPP_BROADCAST' | 'TELEGRAM_CHANNEL' | 'EMAIL_LIST';
  targetAudience: 'EXISTING_STUDENTS' | 'WAITLIST' | 'LEADS' | 'PUBLIC';
  minimumUrgency: SlotUrgency;   // only post slots with this urgency or higher
  minimumDiscount: number;       // only post if discount >= X%
  broadcastTemplate: string;     // customizable message template with variables
}
```

**Broadcast message template (WhatsApp):**
```
🎼 שעה פנויה ב{{conservatoriumName}}!

🎸 כלי: {{instrument}}
👨‍🏫 מורה: {{teacherFirstName}}
📅 מתי: {{dayHebrew}}, {{date}} בשעה {{time}}
⏱ משך: {{durationMinutes}} דקות
💰 מחיר: ~~₪{{originalPrice}}~~ *₪{{promoPrice}}* ({{discountPercent}}% הנחה!)

🔗 הזמנה מהירה: {{bookingLink}}
השעה ממוינת עבור הראשון שיזמין!
```

The booking link is a unique, time-limited URL that:
- Works without login (enter name + phone → pay → booked)
- Expires when the slot is booked or 30 minutes before the lesson
- Shows a real-time "X people viewing this slot" indicator (urgency driver)

### 4.4 Public-Facing "Available Today" Page

`/available-now` — a public page (no login required) showing all same-day and tomorrow slots with promotional pricing:

- Filter by: instrument, duration
- Clean card layout: teacher photo, instrument icon, time, price with strikethrough
- "Book in 2 clicks" CTA (enter phone → pay → done)
- SEO-optimized for "שיעורי מוזיקה היום [city]"

---

## 5. AI Targeting Engine

The most powerful part: rather than broadcasting every empty slot to everyone, the AI selects the right person for each slot, maximizing booking probability.

### 5.1 Student-Slot Affinity Scoring

For each empty slot, the AI scores every eligible recipient (existing students + waitlist + leads):

```
Inputs per recipient:
- Past booking patterns: do they usually book this time of day?
- Instrument match: exact match scores highest
- Teacher preference: have they booked/liked this teacher before?
- Distance/location: are they near the conservatorium right now? (optional, opt-in)
- Recent cancellations: did they cancel a lesson recently and might want a makeup?
- Engagement rate: do they respond to past slot notifications?
- Current credit balance: do they have credits to burn?

Output: affinity score 0–100 + top 3 personalization hooks
```

### 5.2 Personalized Notification Copy

The AI generates a personalized message for each high-affinity recipient:

**Example for a student with a recent cancellation:**
> "יעל, שמנו לב שביטלת שיעור פסנתר בשבוע שעבר 🎹 יש לנו שעה פנויה היום ב-17:00 עם מורה שרה — מחיר: ₪80. רוצה להשלים?"

**Example for a waitlisted lead:**
> "שלום רון! חיכית לשיעור גיטרה? יש לנו שעה חד-פעמית פנויה היום ב-16:00. הזדמנות לנסות לפני שמחויבים לחבילה — ₪60 בלבד."

### 5.3 Optimal Send Time

The AI doesn't send notifications at the moment a slot opens — it calculates the optimal send time per recipient based on:
- Their historical app/message open times
- Time to the slot (minimum lead time to actually get there)
- Channel response latency (WhatsApp vs. email vs. push)

### 5.4 Non-Response Learning

If a recipient consistently ignores slot notifications:
- Frequency automatically reduces (weekly cap, then monthly cap)
- System tries a different channel on next attempt
- After 3 ignored messages: moves to "low engagement" list, only contacted for exceptional discounts

---

## 6. Referral & Social Sharing

When a student sees an empty slot notification but can't take it themselves, they can:
- Tap "Forward to a friend" → generates a shareable link with a personal referral code
- If that friend books and enrolls → referrer gets a lesson credit

This turns every empty slot notification into a potential organic acquisition channel.

---

## 7. Teacher Control & Opt-In

Teachers must explicitly opt-in to slot promotion (privacy and professionalism):

At `/dashboard/teacher/availability`:
- Toggle: "Allow my empty slots to be promoted publicly"
- Toggle: "Allow discounted pricing for my empty slots"
- If public promotion is on, teacher can set: minimum discount before going public (e.g., "only promote if discount is at least 20%")
- Teachers can always see which of their slots are currently being promoted

---

## 8. Promotion Analytics

`/admin/reports/promotions`

| Metric | Description |
|--------|-------------|
| Slots Promoted | How many empty slots were promoted this month |
| Booking Rate | % of promoted slots that were booked |
| Revenue Recovered | Total revenue from promotional bookings (vs. ₪0 alternative) |
| Best Channel | Which channel (WhatsApp, push, email) had highest conversion |
| Best Discount Level | Which discount % drove the most bookings |
| AI Targeting Lift | Booking rate with AI targeting vs. broadcast (A/B comparison) |
| New Lead Conversions | Promotional bookings that became enrolled students |

---

## 9. Data Models

```typescript
{
  id: string;
  slotId: string;
  promotionCreatedAt: Timestamp;
  urgency: SlotUrgency;
  demandLevel: SlotDemandLevel;
  originalPrice: number;
  promotionalPrice: number;
  discountPercent: number;
  
  channels: {
    channelType: string;
    sentAt: Timestamp;
    recipientCount: number;
    openCount: number;
    clickCount: number;
    bookingCount: number;
  }[];
  
  aiTargetingEnabled: boolean;
  targetedRecipients: {
    userId: string;
    affinityScore: number;
    personalizationHooks: string[];
    notificationSentAt: Timestamp;
    opened: boolean;
    booked: boolean;
  }[];
  
  outcome: 'BOOKED' | 'EXPIRED_UNFILLED';
  bookedBy?: string;
  bookedAt?: Timestamp;
}
```

---

## 10. UI Components Required

| Component | Description |
|-----------|-------------|
| `AvailableNowPage` | Public-facing slot marketplace |
| `SlotPromotionCard` | Slot card with countdown, strikethrough price, urgency indicator |
| `PromotionBroadcastPanel` | Admin tool to manage broadcast channels and templates |
| `TeacherPromotionToggle` | Teacher opt-in for slot promotion in availability settings |
| `SlotAffinityExplainer` | Shows admin why AI selected certain recipients |
| `PromotionAnalyticsDashboard` | Full promotion performance report |
| `ReferralShareSheet` | Student-facing "Forward to a friend" flow |
| `BookingCountdownTimer` | Real-time countdown on slot booking pages |
