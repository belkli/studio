# SDD-10: AI Agents & Automation

**Module:** 10  
**Dependencies:** All modules (AI layer sits across the system)  
**Priority:** P2 — Competitive differentiator; modules are independently deployable

---

## 1. Overview & Rationale

Lyriosa's AI layer is not a chatbot bolted on as an afterthought. Each AI agent is a purpose-built workflow assistant that handles a specific, high-frequency administrative pain point. Powered by **Genkit** (Google's open-source AI orchestration framework), these agents connect to Firebase data, call structured LLM prompts, and take real actions in the system — always with human review for consequential decisions.

All agents are:
- **Explainable:** They show their reasoning before acting
- **Controllable:** Humans can always override
- **Auditable:** Every AI action is logged with its inputs, outputs, and the human who confirmed
- **Opt-in:** Each agent can be enabled/disabled per conservatorium

---

## 2. Agent 1: The Matchmaker (Enrollment)

**Trigger:** New student completes enrollment wizard (Module 02, Step 5)  
**Goal:** Match student to the best available teacher  

### 2.1 Inputs

```typescript
{
  studentProfile: {
    instrument: Instrument;
    level: StudentLevel;
    goals: StudentGoal[];
    preferredDays: DayOfWeek[];
    preferredTimes: TimeRange[];
    isVirtualOk: boolean;
    teachingLanguage?: Language;
    ageGroup: AgeGroup;
  };
  availableTeachers: TeacherProfile[];    // only active teachers with capacity
}
```

### 2.2 Matching Algorithm

The agent runs a **two-pass** process:

**Pass 1 — Hard Filters (rule-based)**
- Teacher teaches the requested instrument: required
- Teacher has available slots matching preferences: required
- Teacher has capacity (under `maxStudents`): required
- Teaching language matches (if specified): required

**Pass 2 — Soft Scoring (LLM-assisted)**
Remaining teachers are scored by a Genkit LLM prompt:

```
You are matching a music student to a teacher. Score each teacher from 0–100.
Student profile: [JSON]
Teacher profiles: [JSON array]
Scoring factors:
- Specialty match (student goals vs. teacher specialties): weight 40%
- Schedule compatibility (overlap quality): weight 30%
- Level appropriateness: weight 20%
- Student age vs. teacher experience with that age group: weight 10%

Return a JSON array: [{teacherId, score, matchReasons: string[]}]
```

### 2.3 Output

Top 3 teacher matches presented to student with:
- Match score (displayed as star rating)
- 2–3 human-readable match reasons: "Specializes in exam preparation · Available Thursday afternoons · Great with teens"
- Available trial slots for immediate booking

### 2.4 Audit Log

```typescript
{
  agentName: 'MATCHMAKER';
  studentId: string;
  candidateTeachers: string[];
  topMatches: {teacherId, score, reasons}[];
  studentSelection: string;             // which teacher they chose
  timestamp: Timestamp;
}
```

---

## 3. Agent 2: The Rescheduling Concierge (NLP Chatbot)

**Trigger:** Student sends a WhatsApp/SMS message OR uses the in-app chat assistant  
**Goal:** Handle rescheduling requests conversationally, without admin involvement  

### 3.1 Supported Intents

| Intent | Example Input | Action |
|--------|--------------|--------|
| `CANCEL_LESSON` | "I can't make it tomorrow" | Checks policy → cancels → issues credit (if eligible) |
| `RESCHEDULE_LESSON` | "Can I move Tuesday to Thursday?" | Checks teacher availability → offers slots → reschedules |
| `BOOK_MAKEUP` | "I want to use my makeup credit" | Shows available makeup slots → books chosen slot |
| `CHECK_SCHEDULE` | "When is my next lesson?" | Returns next upcoming lesson details |
| `CHECK_BALANCE` | "How many lessons do I have left?" | Returns package/credit balance |
| `UNKNOWN` | Anything outside scope | Escalates to human (admin/teacher) |

### 3.2 Conversation Flow

```
Student: "I have a school event tomorrow, can I move my piano lesson?"

Agent: "Of course! Your lesson with Rivka is tomorrow, Tuesday 17.06 at 4pm. 
I can reschedule it for you. Rivka is available:
  • Thursday 19.06 at 4pm
  • Friday 20.06 at 10am
  • Sunday 22.06 at 5pm
Which works for you? (Reply with 1, 2, or 3)"

Student: "2"

Agent: "Done! Your lesson is now Friday 20.06 at 10am with Rivka.
I've updated your calendar and notified Rivka. See you then! 🎵"
```

### 3.3 Implementation (Genkit)

```typescript
// Genkit flow definition
const reschedulingFlow = defineFlow(
  { name: 'reschedulingConcierge', inputSchema: MessageSchema },
  async (message) => {
    // Step 1: Classify intent
    const intent = await classifyIntent(message);
    
    // Step 2: Extract entities (dates, times, lesson refs)
    const entities = await extractEntities(message, intent);
    
    // Step 3: Fetch relevant data from Firestore
    const context = await fetchContext(message.userId, intent, entities);
    
    // Step 4: Check policy constraints
    const policyCheck = await checkPolicy(intent, context);
    
    // Step 5: Generate response and execute action
    if (policyCheck.allowed) {
      const result = await executeAction(intent, context, entities);
      return generateConfirmationMessage(result);
    } else {
      return generatePolicyDeclineMessage(policyCheck.reason);
    }
  }
);
```

### 3.4 Escalation

If confidence is below threshold or intent is unrecognized:
- Agent replies: "That's a bit beyond what I can handle right now. I'm connecting you with the conservatorium team. They'll be in touch within [X] hours."
- Message + context is forwarded to admin's inbox as an unresolved item

---

## 4. Agent 3: The Progress Report Drafter

**Trigger:** Teacher clicks "Generate Report" on a student's profile at end of semester  
**Goal:** Draft a personalized end-of-semester progress report the teacher can review and send  

### 4.1 Inputs

```typescript
{
  student: StudentProfile;
  teacher: TeacherProfile;
  period: DateRange;
  practiceData: PracticeLog[];
  lessonNotes: LessonNote[];
  repertoire: RepertoireItem[];
  attendance: AttendanceRecord[];
}
```

### 4.2 Prompt (Genkit)

```
You are helping a music teacher write a warm, professional end-of-semester 
progress report for a student and their parents.

Write in Hebrew (formal but warm tone).
Use the provided data to write specific, personal observations — not generic statements.
Structure:
1. Opening paragraph: overall impression and key achievement this semester
2. Technical progress: what improved, with specific pieces referenced
3. Practice habits: what the data shows (be constructive, not harsh)
4. Goals for next semester
5. Closing encouragement

Student: [profile]
Lesson notes from this semester: [JSON]
Practice log summary: [JSON]
Repertoire: [JSON]

Output only the report text, no metadata.
```

### 4.3 Output & Review

- Draft is shown in the `ProgressReportEditor` (Module 09)
- Teacher can edit any section freely
- Sections that were AI-generated are subtly highlighted until edited (to encourage personalization)
- Teacher clicks "Approve & Send" → PDF generated → sent to parent/student

---

## 5. Agent 4: The Admin Alerts Engine

**Trigger:** Continuous monitoring via Firestore listeners  
**Goal:** Proactively surface operational issues before they become problems  

### 5.1 Alert Types

| Alert | Trigger Condition | Sent To |
|-------|------------------|---------|
| `TEACHER_CAPACITY_FULL` | Teacher reaches 90% of maxStudents | Admin |
| `HIGH_CANCELLATION_RATE` | Teacher cancels >20% of lessons in 30 days | Admin |
| `STUDENT_DISENGAGED` | No practice logged + 2 no-shows in 30 days | Teacher + Admin |
| `MAKEUP_BACKLOG` | Student has >3 unused makeup credits | Admin |
| `PAYMENT_FAILURE_SPIKE` | >5 payment failures in a single day | Admin |
| `WAITLIST_OVERFLOW` | A teacher's waitlist exceeds 10 students | Admin |
| `FORM_DEADLINE_APPROACHING` | Ministry exam registration deadline in 14 days | Admin + Teachers |
| `ROOM_CONFLICT` | Double-booking detected | Admin |

### 5.2 Alert Delivery

Alerts appear as cards in the admin dashboard at `/admin`:
- Color-coded by severity: 🔴 Critical | 🟡 Warning | 🔵 Info
- Each alert has a "Take Action" button that deep-links to the relevant page
- Daily digest email summarizing all pending alerts
- Alerts can be snoozed for X days or dismissed

---

## 6. Agent 5: The Enrollment Lead Nurture

**Trigger:** A trial was booked but no package was purchased within 7 days  
**Goal:** Automatically follow up with personalized encouragement to enroll  

### 6.1 Flow

1. Trial lesson completed (attendance marked)
2. Wait 24 hours
3. If no package purchased: generate a personalized follow-up message
4. Message references the teacher and instrument: "Hope you enjoyed your trial with Rivka! Learning piano is a journey that starts with a single lesson — and you've already taken that step."
5. Include a direct link to enroll with the same teacher
6. If no response in 3 days: send a second message with a limited-time offer (if configured)
7. If no response in 7 days: add to admin's "warm leads" list for personal follow-up

### 6.2 Personalization Inputs

```typescript
{
  trialStudentName: string;
  teacherName: string;
  instrument: string;
  trialDate: Date;
  teacherNote?: string;       // from the lesson note left by teacher
}
```

The LLM uses the teacher's actual lesson note to personalize the message (e.g., "Rivka mentioned you showed great rhythm instinct — that's a real natural talent!").

---

## 7. Agent 6: AI Composition Suggester (Existing, Enhanced)

The existing Genkit composition suggester from v1.0 is enhanced:

**Previous behavior:** Suggest a composition based on student level and instrument  
**Enhanced behavior:**  
- Takes into account the student's current repertoire (avoids duplicates)
- Considers the student's stated goals (exam vs. performance vs. enjoyment)
- Can suggest a balanced recital program (one fast, one slow, one characteristic piece) in one prompt
- Output includes IMSLP links for public domain scores where available

---

## 8. Genkit Architecture & Safety

### 8.1 All Agents Are Audited

```typescript
{
  agentName: string;
  runId: string;
  userId: string;             // who triggered it
  inputs: Record<string, any>;
  llmModel: string;
  promptTemplate: string;
  rawOutput: string;
  parsedOutput: Record<string, any>;
  actions taken: AgentAction[];
  humanApprovalRequired: boolean;
  humanApprovedBy?: string;
  humanApprovedAt?: Timestamp;
  timestamp: Timestamp;
}
```

### 8.2 Human-in-the-Loop Rules

| Agent | Auto-Execute? | Human Confirmation Required? |
|-------|--------------|------------------------------|
| Matchmaker | Suggest only | Student chooses |
| Rescheduling Concierge | Yes (low-stakes) | Only for cancellations >₪200 |
| Progress Report Drafter | Draft only | Teacher must review and send |
| Admin Alerts Engine | Alert only | Admin takes action |
| Enrollment Lead Nurture | Yes (messaging) | If offer/discount > threshold |

### 8.3 Model Configuration

```typescript
// genkit.config.ts
export default configureGenkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_AI_API_KEY })],
  model: 'gemini-1.5-flash',     // default: fast, cost-effective
  // Override to Pro for report drafting:
  reportDraftingModel: 'gemini-1.5-pro',
});
```

---

## 9. UI Components Required

| Component | Description |
|-----------|-------------|
| `TeacherMatchCard` | AI match result card with score and reasons |
| `ReschedulingChatWidget` | In-app conversational reschedule assistant |
| `AdminAlertsPanel` | Dashboard alert cards with action links |
| `ProgressReportEditor` | AI-draft review and edit interface |
| `AgentAuditLog` | Admin view of all AI actions taken |
| `AIFeatureToggle` | Per-conservatorium enable/disable AI features |
