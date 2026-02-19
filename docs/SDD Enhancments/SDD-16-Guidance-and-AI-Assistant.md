# SDD-16: User Guidance, Onboarding & AI Help Assistant

**Module:** 16  
**Dependencies:** Modules 01, 07, 10, 15  
**Priority:** P3 — Critical for adoption; determines whether users call for support or self-serve

---

## 1. Overview & Design Philosophy

A system this comprehensive will intimidate new users without guidance. But the wrong kind of guidance — a 40-page manual, a forced 20-step tour nobody reads — creates friction at exactly the moment users need momentum.

The right approach is a **layered guidance system** that meets each user at their actual point of confusion:

| Layer | What it does | When it activates |
|-------|-------------|-------------------|
| **Contextual Tooltips** | One-sentence explanations on hover | Always available, never intrusive |
| **Role-Specific Walkthroughs** | 5–8 step interactive first-run tours | Once, on first login per role |
| **Inline Empty States** | Friendly guidance when a section has no data | When lists/sections are empty |
| **AI Help Assistant** | Conversational answers to any question | On-demand, floating button |
| **Video Tutorials** | 2–4 minute screencasts per workflow | Linked from Help Center |
| **Help Center** | Searchable written docs | Linked from assistant and nav |

The AI Help Assistant is the keystone — it makes all other layers optional because users always have a fallback that answers any question in their own language, instantly.

---

## 2. Contextual Tooltips

The lightest-weight guidance. Every non-obvious field or button has a `(?)` icon or hover tooltip.

### 2.1 Implementation

Using shadcn/ui Tooltip component, integrated into every FormField:

```tsx
<FormField label="Conservatorium Tier">
  <Select ... />
  <HelpTooltip>
    The tier (A, B, or C) determines the base pricing for conference forms.
    It is set by the Ministry of Education and found in your official registration documents.
  </HelpTooltip>
</FormField>
```

### 2.2 Tooltip Content Rules
- Maximum 2 sentences
- Plain language, no jargon
- Answers "What is this?" or "Why does this matter?"
- Available in all 4 languages (i18n message files from Module 15)
- Never blocks interaction — hover/focus only

### 2.3 Contextual Notice Boxes

For complex situations, a full Notice component:

```tsx
<Notice type="warning" icon="clock">
  The total duration must be between 12 and 20 minutes for Grade 3 students.
  Your current total is 9:30. Consider adding one more piece.
</Notice>
```

---

## 3. Role-Specific First-Run Walkthroughs

On first login after account approval, a role-appropriate interactive walkthrough starts. Skippable at any time; restartable from Help > "Restart tour."

### 3.1 Library: Driver.js

Lightweight, good RTL support, clean visual style compatible with shadcn/ui.

```typescript
import { driver } from "driver.js";

const studentTour = driver({
  showProgress: true,
  steps: [
    {
      element: '#nav-schedule',
      popover: {
        title: 'לוח הזמנים שלך',
        description: 'כאן תמצא את כל השיעורים שלך ותוכל להזמין שיעורים חדשים.',
        side: 'right',
      }
    },
    // ...
  ]
});
```

### 3.2 Student Walkthrough (7 steps)

1. Dashboard welcome — "ברוך הבא להרמוניה! בוא נכיר את המערכת יחד"
2. Schedule tab — "כאן תראה את כל השיעורים שלך ותוכל להזמין שיעורים חדשים"
3. Credits badge — "הקרדיטים שלך מוצגים כאן — כל שיעור מורד מהמניה"
4. Practice log — "רשום כאן כל אימון — המורה שלך יוכל לראות את ההתקדמות"
5. Forms tab — "טפסים כמו טפסי נגינה נמצאים כאן — קל להגיש ולעקוב"
6. Messages tab — "שלח הודעות ישירות למורה שלך מכאן"
7. Help button — "בכל שאלה — לחץ על כפתור העזרה! אני כאן 24/7"

### 3.3 Parent Walkthrough (6 steps)

1. Family Hub — "זהו מרכז המשפחה — כאן תראה את כל ילדיך במקום אחד"
2. Child card — "לחץ על ילד לראות לוח זמנים, התקדמות, וחיובים"
3. Billing section — "כאן תמצא חשבוניות ותוכל לעדכן אמצעי תשלום"
4. Notifications — "בחר איך לקבל עדכונים — SMS, WhatsApp, או אימייל"
5. Weekly digest — "כל שבוע תקבל סיכום מה קרה בשיעורים של ילדיך"
6. Help button — "יש שאלות? לחץ על העזרה בכל רגע"

### 3.4 Teacher Walkthrough (8 steps)

1. Teacher dashboard — overview introduction
2. Today's lessons — attendance marking
3. Availability grid — "הגדר מתי אתה פנוי — תלמידים יראו את הזמינות שלך"
4. Student roster — quick overview per student
5. Lesson notes — "אחרי כל שיעור כתוב הערות — הן נשמרות ונשלחות להורים"
6. Approval queue — forms awaiting action
7. Sick leave button — "אם אתה חולה, לחץ כאן — המערכת תודיע לכולם אוטומטית"
8. Help button — farewell

### 3.5 Admin Walkthrough (10 steps)

1. Command center — overview
2. Key metrics bar — live KPIs
3. AI alerts panel — proactive issue detection
4. Pending approvals — registration and form queue
5. User management — all users
6. Master schedule — cross-teacher view
7. Financial reports — real-time revenue
8. Settings hub — pricing, policy, config
9. AI feature toggles — enable/disable agents
10. Help button — "ניתן להפעיל מחדש את הסיור בכל עת"

---

## 4. Inline Empty States

When a section has no data, show a helpful, instructional empty state rather than a blank area:

```tsx
<EmptyState
  icon="calendar"
  title="אין לך שיעורים מתוכננים"
  description="הזמן את השיעור הראשון שלך ותתחיל את המסע המוזיקלי!"
  action={{ label: "הזמן שיעור", href: "/dashboard/schedule/book" }}
  helpLink={{ label: "איך מזמינים שיעור?", articleId: "booking-first-lesson" }}
/>
```

Every major list and page has a designed empty state that explains why it's empty, provides the primary action to fill it, and links to the relevant help article.

---

## 5. AI Help Assistant

### 5.1 The Recommendation: Build It

My recommendation is to build the AI assistant rather than relying on static guides, and here is why.

A static FAQ answers the questions the writer anticipated. An AI assistant answers the question the user actually has, right now, in their own words, in their own language. Consider the realistic questions users ask that a static FAQ cannot handle well:

- "I cancelled a lesson and didn't get my credit back — what happened?"
- "How do I set up a makeup for a student who missed class because I was sick?"
- "There are two students on my waitlist for the same slot — how does the system decide?"
- "The form was rejected — can I copy it into a new one?"

These are all answerable from the system's knowledge base combined with the user's specific account context. An AI assistant handles all of them in under 5 seconds. A static FAQ requires the user to find the right article, read it, and infer whether it applies to their situation.

The tradeoff: the assistant requires more upfront investment (Help Center article authoring, Genkit flow setup, RAG indexing). The payoff is a dramatic reduction in support emails to the conservatorium admin, and a system that feels genuinely intelligent rather than bureaucratic.

**Recommendation: build the static Help Center articles first (they are needed by both the RAG system and as a fallback), then layer the AI assistant on top in Phase 2.**

### 5.2 Architecture

The assistant runs as a Genkit flow with two knowledge sources:

```
User Question
     |
     v
[Classify: Policy/How-To | Account-Specific | Unknown]
     |                              |
     v                              v
[RAG: search Help Center]   [Fetch user's account data]
[articles indexed as         [from Firestore — only
 vector embeddings]           for logged-in user]
     |                              |
     +──────────────┬───────────────+
                    v
        [Generate answer in user's language]
                    |
                    v
        [Answer + Source link + Action button]
```

```typescript
const helpAssistantFlow = defineFlow(
  { name: 'helpAssistant', inputSchema: HelpQuerySchema },
  async ({ question, userId, locale, conservatoriumId }) => {

    // Classify the question
    const classification = await classifyQuestion(question);

    let context = '';

    if (classification.type === 'POLICY_OR_HOW_TO') {
      // RAG over Help Center articles
      const articles = await searchHelpCenter(question, locale);
      context = articles.map(a => a.content).join('\n\n');
    }

    if (classification.type === 'ACCOUNT_SPECIFIC') {
      // Fetch only the relevant user data (scoped to their account)
      const userData = await fetchRelevantUserData(userId, classification.dataNeeded);
      // Include conservatorium's configured policies
      const policy = await fetchConservatoriumPolicy(conservatoriumId);
      context = JSON.stringify({ userData, policy });
    }

    const answer = await generate({
      model: 'gemini-1.5-flash',
      prompt: buildHelpPrompt(question, context, locale),
      config: { temperature: 0.2 }, // low temperature for factual answers
    });

    const actions = extractSuggestedActions(answer.text());

    return {
      answer: answer.text(),
      suggestedActions: actions,
      sourceArticles: classification.articles ?? [],
    };
  }
);
```

### 5.3 The Assistant UI

A floating action button (FAB) in the bottom corner of every page (bottom-left for RTL, bottom-right for LTR):

Clicking opens a slide-in panel — not a modal, so the user can still see the page behind it:

```
+-----------------------------+
|  Help Assistant        [x]  |
+-----------+—————————————————+
|                             |
|  Suggested questions:       |
|  > איך מבטלים שיעור?        |
|  > איפה רואים קרדיטים?      |
|  > איך מגישים טופס נגינה?   |
|                             |
+-----------------------------+
|  [conversation area]        |
|                             |
|  User: ביטלתי שיעור אבל     |
|         לא קיבלתי קרדיט     |
|                             |
|  Assistant: קרדיטים         |
|  מוחזרים רק אם הביטול       |
|  בוצע לפחות 24 שעות מראש.  |
|  לפי ההיסטוריה שלך,        |
|  הביטול בוצע 3 שעות לפני   |
|  השיעור — לכן לא הוחזר      |
|  קרדיט לפי המדיניות.        |
|                             |
|  [צפה במדיניות הביטול]       |
|  [פנה למנהל הקונסרבטוריון]   |
|                             |
+-----------------------------+
| [שאל אותי כל דבר...   ] [>] |
+-----------------------------+
```

### 5.4 What the Assistant Can and Cannot Do

**Can do:**
- Explain how any feature works
- Explain why an action resulted in a specific outcome (using account data)
- Explain the conservatorium's configured policies (cancellation, pricing, etc.)
- Surface the right help article for a question
- Suggest the next action to take

**Cannot do:**
- Take actions in the system (it cannot cancel a lesson, issue a credit, etc.)
- Access other users' account data
- Override system policies
- Guarantee Ministry of Education procedural answers (always links to official source)

This boundary is important: the assistant is an **explainer and navigator**, not an agent. Actions require the user to perform them (with the assistant pointing the way). This keeps it safe and avoids the risk of the assistant doing something unintended.

If escalation is needed, the assistant provides a direct link to the admin contact or a pre-filled email draft.

### 5.5 Suggested Questions (Context-Aware)

When the panel opens on a specific page, the suggested starter questions are context-aware:

| Current Page | Suggested Questions |
|-------------|---------------------|
| `/dashboard/schedule` | How do I book a makeup? / Can I reschedule a lesson? / What is the cancellation policy? |
| `/dashboard/billing` | Why was I charged this amount? / How do I update my card? / When is my next invoice? |
| `/dashboard/forms/new` | What is the duration limit for my grade? / Who needs to approve this form? |
| `/admin/users` | How do I approve a new registration? / Can I edit a user's instrument? |

### 5.6 Escalation Path

If the assistant cannot answer confidently (confidence score below threshold):

```
"לא מצאתי תשובה ברורה לשאלה זו.
הנה מה שיכול לעזור:
[צפה במאמרי עזרה רלוונטיים]
[שלח שאלה למנהל הקונסרבטוריון]"
```

The "send to admin" option pre-populates a message with the user's question and account context, so the admin doesn't need to ask follow-up questions.

---

## 6. Help Center

`/help` — accessible from the navigation footer and from the AI assistant

### 6.1 Structure

```
Help Center
├── Getting Started
│   ├── For Students: Your First Steps
│   ├── For Parents: Managing Your Child's Account
│   ├── For Teachers: Setting Up Your Profile
│   └── For Admins: Setting Up Your Conservatorium
├── Scheduling & Lessons
│   ├── How to Book a Lesson
│   ├── How to Cancel or Reschedule
│   ├── Understanding Makeup Credits
│   └── Virtual Lesson Setup
├── Payments & Billing
│   ├── Understanding Your Invoice
│   ├── Updating Your Payment Method
│   ├── Package Types Explained
│   └── Refund Policy
├── Forms & Approvals
│   ├── Submitting a Recital Form
│   ├── The Approval Process Explained
│   ├── Downloading Your Approved PDF
│   └── Ministry Exam Registration
├── For Teachers
│   ├── Setting Availability
│   ├── Marking Attendance
│   ├── Sick Leave: What Happens Automatically
│   └── Monthly Payroll Explained
└── For Admins
    ├── Approving New Registrations
    ├── Managing the Cancellation Policy
    ├── Financial Reports Guide
    └── Configuring AI Features
```

### 6.2 Article Format

Each article is:
- Written in Hebrew (primary), translated to EN/AR/RU
- 200–600 words
- Includes screenshots (auto-updated via CI if UI changes)
- Ends with: "Was this helpful? [Yes] [No]" — negative responses create a ticket for content improvement
- Linked from relevant pages and tooltip help icons

### 6.3 Search

Full-text search powered by Firebase's built-in search or Algolia (if budget allows). The same search index feeds the AI assistant's RAG system.

---

## 7. Video Tutorials

Short screencasts (2–4 minutes each) covering the most common workflows:

| Title | Length | Audience |
|-------|--------|----------|
| "Book your first lesson" | 2 min | Student / Parent |
| "Submit a recital form" | 3 min | Student / Teacher |
| "Setting up your teacher availability" | 4 min | Teacher |
| "Approving new registrations" | 3 min | Admin |
| "Understanding your monthly invoice" | 2 min | Parent |
| "How the cancellation policy works" | 3 min | All |

Hosted on YouTube (unlisted) or Vimeo. Embedded within Help Center articles and linked from the AI assistant.

---

## 8. Admin Support Dashboard

`/admin/support`

Admins see:
- Most frequent assistant questions this week (reveals UX problems)
- Escalations from the assistant (unanswered questions forwarded to admin)
- Help article ratings (which articles score low on helpfulness)
- Users who haven't completed their walkthrough tour (to proactively reach out)

This closes the feedback loop: if users keep asking the assistant "how do I find my credits?" and it shows up in the report, that means the credits UI is not discoverable and should be redesigned.

---

## 9. Rollout Plan

| Phase | Feature | Notes |
|-------|---------|-------|
| Day 1 | Tooltips + Empty States | Low effort, high value, can be done during feature development |
| Day 1 | Role walkthroughs | 1–2 days to implement with Driver.js |
| Week 2 | Help Center articles | Write during QA/beta phase |
| Month 2 | AI assistant (RAG) | After Help Center has enough articles to index |
| Month 3 | Video tutorials | After UI is stable enough to record |

---

## 10. UI Components Required

| Component | Description |
|-----------|-------------|
| `HelpTooltip` | Reusable (?) icon with tooltip text |
| `Notice` | Contextual info/warning/error box |
| `EmptyState` | Friendly empty-page component with action + help link |
| `WalkthroughTrigger` | Initiates Driver.js tour for current user's role |
| `HelpAssistantFAB` | Floating action button that opens the assistant panel |
| `HelpAssistantPanel` | Slide-in conversation panel |
| `HelpAssistantMessage` | Individual message bubble (user vs. assistant) |
| `SuggestedActions` | Action button chips within assistant responses |
| `HelpCenterSearch` | Full-text search over help articles |
| `HelpArticlePage` | Individual article renderer with feedback widget |
| `AdminSupportDashboard` | Support analytics for admins |
