# SDD-07: Communication & Notifications

**Module:** 07  
**Dependencies:** Modules 01, 04, 06  
**Priority:** P1 — Operational and trust-critical

---

## 1. Overview & Rationale

Communication is where most conservatoriums leak trust. A teacher calls in sick and parents only find out when they're already in the car. A form is approved but the student doesn't know for three days. This module defines every outbound communication the system sends — automatically — so that every stakeholder is always informed in real time, through the channel they prefer.

---

## 2. Notification Channels

| Channel | Use Case | Provider |
|---------|----------|----------|
| In-App (Push) | All events for logged-in users | Firebase Cloud Messaging |
| Email | Invoices, approvals, welcome, weekly summary | Firebase Extensions (SendGrid) |
| SMS | Urgent/time-sensitive: sick cancellation, lesson reminder, payment due | Twilio |
| WhatsApp | Optional: Israel-specific preference, replaces SMS for many users | Twilio WhatsApp API |

### 2.1 Channel Preferences

Each user sets their notification preferences at `/dashboard/settings/notifications`:

```typescript
{
  userId: string;
  preferences: {
    lessonReminders: Channel[];          // e.g., ['SMS', 'IN_APP']
    lessonCancellation: Channel[];       // e.g., ['SMS', 'EMAIL', 'WHATSAPP']
    makeupCredits: Channel[];
    paymentDue: Channel[];
    formStatusChanges: Channel[];
    teacherMessages: Channel[];
    systemAnnouncements: Channel[];
  };
  quietHours: {
    enabled: boolean;
    startTime: string;                   // e.g., "22:00"
    endTime: string;                     // e.g., "08:00"
  };
  language: 'HE' | 'EN' | 'AR' | 'RU';  // message language
}
```

SMS and WhatsApp messages respect quiet hours (held and sent after quiet period ends), **except** urgent same-day cancellations which always go through immediately.

---

## 3. Notification Catalog

### 3.1 Lesson Reminders

| Trigger | Recipient | Message | Channel |
|---------|-----------|---------|---------|
| 24h before lesson | Student/Parent | "תזכורת: שיעור [instrument] מחר [day] ב-[time] עם [teacher]. חדר [room]." | SMS + In-App |
| 15 min before virtual | Student/Parent | "שיעורך מתחיל בעוד 15 דקות. [קישור לכניסה]" | SMS |
| 24h before lesson | Teacher | Summary of tomorrow's lessons | In-App |

### 3.2 Cancellations & Makeups

| Trigger | Recipient | Message | Channel |
|---------|-----------|---------|---------|
| Teacher sick leave | All affected students/parents | "שיעורך עם [teacher] ב-[date time] בוטל בשל מחלה. קרדיט שיעור נוסף לחשבונך. [הזמן שיעור פיצוי]" | SMS + Email |
| Student cancels (on-time) | Teacher | "[Student] ביטל שיעור [date time]. הסלוט פנוי." | In-App |
| Student late cancel | Teacher | "[Student] ביטל שיעור [date time] — ביטול מאוחר. תשולם כרגיל." | In-App + SMS |
| Makeup credit about to expire | Student/Parent | "קרדיט פיצוי שלך יפוג ב-[date]. הזמן שיעור כעת! [קישור]" | SMS + Email |

### 3.3 Payment & Billing

| Trigger | Recipient | Message | Channel |
|---------|-----------|---------|---------|
| Invoice generated | Parent/Student | "חשבונית חדשה מ[conservatorium]: ₪[amount] לתשלום עד [date]. [צפה בחשבונית]" | Email |
| Payment failed | Parent/Student | "התשלום נכשל. עדכן פרטי אשראי כדי לשמור על מקומך. [עדכון]" | SMS + Email |
| Payment confirmed | Parent/Student | "קיבלנו את תשלומך של ₪[amount]. תודה! [קבלה]" | Email |
| Package expiring (2 lessons left) | Student/Parent | "נותרו 2 שיעורים בחבילתך. [חדש חבילה]" | In-App + Email |
| Overdue (7 days) | Parent/Student | Escalating reminder | SMS |

### 3.4 Form & Approval Workflow

| Trigger | Recipient | Message | Channel |
|---------|-----------|---------|---------|
| Form submitted | Teacher | "[Student] הגיש טופס [type]. [בדוק כעת]" | In-App + Email |
| Form approved (teacher) | Student | "טופסך עבר לאישור מנהל." | In-App |
| Form approved (admin) | Student + Teacher | "טופס [title] אושר סופית. [הורד PDF]" | In-App + Email |
| Form rejected | Student | "טופסך נדחה. סיבה: [reason]. [ערוך והגש מחדש]" | In-App + Email |

### 3.5 Scheduling & Booking

| Trigger | Recipient | Message | Channel |
|---------|-----------|---------|---------|
| New lesson booked (by teacher/admin) | Student/Parent | "[Teacher] קבע שיעור: [date time], [room]." | In-App + Email |
| Waitlist offer | Student/Parent | "מקום פנוי! [Teacher] פנוי ב-[day time]. הסכמה תוך 48 שעות. [הזמן]" | SMS + Email |
| Rescheduled lesson | Student/Parent | "שיעורך הועבר מ-[old time] ל-[new time]. [אשר | דחה]" | In-App + SMS |
| Conservatorium closure | All students | Batch notification with makeup credit info | Email + In-App |

### 3.6 Registration & Onboarding

| Trigger | Recipient | Message | Channel |
|---------|-----------|---------|---------|
| Registration submitted | New user | "קיבלנו את הרשמתך! נאשר אותה תוך [X] ימי עסקים." | Email |
| Account approved | New user | "חשבונך אושר! [התחבר עכשיו]" | Email + SMS |
| Account rejected | New user | Personalized rejection with reason and contact | Email |
| Child turns 13 | Parent | Age-upgrade invitation | Email + In-App |

---

## 4. In-App Notification Center

`/dashboard/notifications` (also accessible via bell icon in header)

### 4.1 Notification Model

```typescript
{
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string;         // deep link: e.g., "/dashboard/forms/abc123"
  actionLabel?: string;       // e.g., "View Form"
  isRead: boolean;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}
```

### 4.2 Notification Bell

- Badge shows unread count
- Clicking opens a dropdown with last 10 notifications
- Each notification has: icon, title, time ago, action button
- "Mark all as read" and "See all" links
- High-priority notifications are displayed as a banner at the top of the page

---

## 5. Teacher ↔ Student/Parent Messaging

`/dashboard/messages`

A simple, in-app direct messaging system. Not a full chat platform — purpose-built for lesson-related communication.

```typescript
{
  id: string;
  participants: string[];      // teacherId + studentId (or parentId)
  lessonSlotId?: string;       // optional: message linked to a specific lesson
  messages: {
    senderId: string;
    body: string;
    attachmentUrl?: string;    // e.g., PDF of sheet music
    sentAt: Timestamp;
    readAt?: Timestamp;
  }[];
}
```

- Teacher can send a post-lesson note: "Great progress today! Focus on measures 14–20 for next week."
- Parent can ask: "Can we reschedule Friday's lesson?"
- Student (13+) can upload a short video (max 30 seconds) for mid-week practice feedback
- Admin can message any user within the conservatorium
- Message threads are per-teacher-student pair (not a group chat)

### 5.1 Message Notifications

New messages trigger an in-app notification and optionally an email digest:
- Real-time: In-app notification bell
- Email: Daily digest for unread messages (if opted in)

---

## 6. Announcements (Broadcast)

Admin can send conservatorium-wide or targeted announcements:

`/admin/announcements`

```typescript
{
  id: string;
  conservatoriumId: string;
  title: string;
  body: string;               // supports basic markdown
  targetAudience: 'ALL' | 'STUDENTS' | 'PARENTS' | 'TEACHERS' | 'BY_INSTRUMENT';
  instrumentFilter?: Instrument[];
  channels: Channel[];
  scheduledAt?: Timestamp;    // for future scheduling
  sentAt?: Timestamp;
  sentCount: number;
}
```

Examples:
- "Annual recital registration is now open! [Register here]"
- "Holiday schedule — conservatorium closed [dates]"
- "New teacher joining us next month — meet [name]!"
- "Reminder: Ministry exam registration deadline is [date]" (targeted to exam-track students)

---

## 7. WhatsApp Integration (Israel-Specific)

Israel has near-universal WhatsApp adoption. The system integrates with Twilio's WhatsApp Business API:

- Same notification catalog, delivered via WhatsApp if preferred
- Interactive messages with buttons: "Confirm | Cancel | Reschedule"
- Students can reply to reschedule reminders directly in WhatsApp (handled by AI Rescheduling Concierge — Module 10)
- Requires WhatsApp Business Account approval from Meta

---

## 8. Notification Audit Log

All outbound communications are logged:
```typescript
{
  notificationId: string;
  userId: string;
  channel: Channel;
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'OPTED_OUT';
  sentAt: Timestamp;
  deliveredAt?: Timestamp;
  errorMessage?: string;
}
```

Admin can view delivery status at `/admin/notifications/log` for debugging and compliance.

---

## 9. UI Components Required

| Component | Description |
|-----------|-------------|
| `NotificationBell` | Header icon with unread badge |
| `NotificationDropdown` | Quick-view last 10 notifications |
| `NotificationCenter` | Full notification history page |
| `HighPriorityBanner` | Page-top banner for urgent notifications |
| `MessagingThread` | Teacher-student direct message view |
| `MessagingList` | All conversation threads |
| `AnnouncementComposer` | Admin broadcast tool |
| `NotificationPreferences` | User notification settings |
