# SDD-P7: Persona Audit — Security Architect
**Lyriosa 360° Architecture Audit**
**Persona:** Security Architect (STRIDE Threat Model + Firebase Security)
**Auditor Role:** Formal Security Auditor, Israeli Privacy Law Expert (PDPPA / חוק הגנת הפרטיות)
**Version:** 1.0 | **Date:** 2026-02-25

---

## 1. Executive Summary

Lyriosa stores some of the most sensitive data categories in Israeli civilian life: Israeli ID numbers (ת"ז) of minors and their parents, video and audio recordings of children during lessons, credit card payment histories, Ministry exam results, and scholarship application financial disclosures. A breach would not only be commercially catastrophic — it would violate the Israeli Protection of Privacy Law (חוק הגנת הפרטיות, 5741-1981), potentially triggering regulatory sanctions and civil liability.

The current prototype has **no security hardening whatsoever**. The single most alarming finding:

> **The entire application's "authentication" is `localStorage.getItem('harmonia-user')` — a stringified user object including their role. Anyone who opens browser DevTools and edits this object can become any role, including `CONSERVATORIUM_ADMIN`, with zero validation.**

There are no Firebase Security Rules specified anywhere in the documentation or codebase. There are no RBAC checks on any server action. There is no input sanitization. This is not a security posture — it is a security absence.

**STRIDE Threat Model Overview:**

| Threat | Category | Severity | Primary Attack Surface |
|--------|----------|----------|----------------------|
| Spoofing user identity via localStorage manipulation | **S**poofing | Critical | Auth layer |
| Tampering with lesson slots or invoice amounts | **T**ampering | Critical | Missing server validation |
| Repudiation of financial transactions | **R**epudiation | High | No audit trail in real DB |
| Information disclosure of minors' PII | **I**nformation Disclosure | Critical | Missing Storage/Firestore rules |
| Denial of service on booking engine | **D**enial of Service | Medium | Unthrottled callable functions |
| Elevation of privilege via role manipulation | **E**levation of Privilege | Critical | localStorage role storage |

---

## 2. STRIDE Analysis — Detailed Findings

### S1 — SPOOFING: localStorage Authentication Bypass
**CVE Severity: Critical**

**Attack:** Any user opens DevTools → Application → Local Storage → edits `harmonia-user` JSON → changes `role` from `PARENT` to `CONSERVATORIUM_ADMIN`. Refreshes page. Full admin access granted.

**Fix:** Server-side session validation using Firebase Custom Claims:

```typescript
// functions/src/auth/setCustomClaims.ts
export const onUserApproved = onDocumentUpdated(
  'users/{userId}',
  async (event) => {
    const before = event.data.before.data() as User;
    const after = event.data.after.data() as User;

    // Only update claims when approval status or role changes
    if (before.approved === after.approved && before.role === after.role) return;

    await admin.auth().setCustomUserClaims(after.id, {
      role: after.role,
      conservatoriumId: after.conservatoriumId,
      approved: after.approved,
    });
  }
);

// In every server action / API route — validate claims server-side:
export async function validateSession(req: Request): Promise<DecodedIdToken> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('UNAUTHORIZED');
  const token = authHeader.split('Bearer ')[1];
  return admin.auth().verifyIdToken(token); // Throws on invalid/expired
}

// Middleware: src/middleware.ts
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('__session')?.value;
  if (!token) return NextResponse.redirect('/login');

  try {
    // Verify with Firebase Admin SDK
    const decoded = await verifySessionCookie(token);
    if (!decoded.approved) return NextResponse.redirect('/pending-approval');

    // Inject claims into request headers for server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.uid);
    requestHeaders.set('x-user-role', decoded.role as string);
    requestHeaders.set('x-conservatorium-id', decoded.conservatoriumId as string);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return NextResponse.redirect('/login');
  }
}
```

---

### T1 — TAMPERING: No Server-Side Validation on Booking/Payment Requests
**CVE Severity: Critical**

**Attack:** An authenticated student sends a crafted `bookLessonSlot` Cloud Function call with `amount: 0` or with another student's `packageId`. The prototype has no server-side validation — it trusts all client-provided data.

**Fix:** Server-side Zod validation on every callable function:

```typescript
// src/lib/validation/booking.ts
import { z } from 'zod';

export const BookingRequestSchema = z.object({
  teacherId: z.string().min(1),
  studentId: z.string().min(1),
  conservatoriumId: z.string().min(1),
  startTime: z.string().datetime(),
  durationMinutes: z.union([z.literal(30), z.literal(45), z.literal(60)]),
  roomId: z.string().optional(),
  packageId: z.string().optional(),
});

export const bookLessonSlot = onCall(async (request) => {
  // Step 1: Validate input shape
  const parsed = BookingRequestSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }

  // Step 2: Authorize — requester must be the student OR their parent OR admin
  const callerUid = request.auth?.uid;
  const callerRole = request.auth?.token.role as UserRole;
  const { studentId, conservatoriumId } = parsed.data;

  const isAuthorized =
    callerUid === studentId ||
    (callerRole === 'PARENT' && await isParentOf(callerUid, studentId)) ||
    (callerRole === 'CONSERVATORIUM_ADMIN' && await isAdminOf(callerUid, conservatoriumId)) ||
    (callerRole === 'TEACHER' && await isTeacherOf(callerUid, studentId));

  if (!isAuthorized) {
    throw new HttpsError('permission-denied', 'NOT_AUTHORIZED_FOR_STUDENT');
  }

  // Step 3: Verify package ownership (if packageId provided)
  if (parsed.data.packageId) {
    const pkg = await getPackage(parsed.data.packageId, conservatoriumId);
    if (pkg.studentId !== studentId) {
      throw new HttpsError('permission-denied', 'PACKAGE_NOT_OWNED_BY_STUDENT');
    }
  }
  // ... proceed
});
```

---

### I1 — INFORMATION DISCLOSURE: Missing Firebase Security Rules
**CVE Severity: Critical**

**Attack:** An authenticated student queries Firestore directly (Firebase SDK is client-side accessible). Without Security Rules, any authenticated user can read any document — including other students' lesson histories, parents' ID numbers, teacher paystubs, and scholarship applications.

**Fix:** Complete Firestore Security Rules:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================
    function isSignedIn() {
      return request.auth != null;
    }

    function isApproved() {
      return isSignedIn() && request.auth.token.approved == true;
    }

    function role() {
      return request.auth.token.role;
    }

    function conservatoriumId() {
      return request.auth.token.conservatoriumId;
    }

    function isSiteAdmin() {
      return isApproved() && role() == 'SITE_ADMIN';
    }

    function isConservatoryAdmin() {
      return isApproved() && role() == 'CONSERVATORIUM_ADMIN';
    }

    function isAdminFor(cid) {
      return isConservatoryAdmin() && conservatoriumId() == cid;
    }

    function isTeacher() {
      return isApproved() && role() == 'TEACHER';
    }

    function isTeacherFor(cid) {
      return isTeacher() && conservatoriumId() == cid;
    }

    function isStudent() {
      return isApproved() && (role() == 'STUDENT_OVER_13');
    }

    function isParent() {
      return isApproved() && role() == 'PARENT';
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // ============================================================
    // USER DOCUMENTS
    // ============================================================
    match /users/{userId} {
      // User can read their own profile; admins and teachers (limited) can read others
      allow read: if isOwner(userId)
                  || isSiteAdmin()
                  || (isAdminFor(resource.data.conservatoriumId))
                  || (isTeacherFor(resource.data.conservatoriumId)
                      && resource.data.role in ['STUDENT_OVER_13', 'STUDENT_UNDER_13']);
      allow write: if isOwner(userId) || isAdminFor(resource.data.conservatoriumId) || isSiteAdmin();
      // CRITICAL: Never allow users to change their own role or approval status
      allow update: if isOwner(userId)
                    && !request.resource.data.diff(resource.data).affectedKeys()
                       .hasAny(['role', 'approved', 'conservatoriumId', 'cardToken']);
    }

    // ============================================================
    // CONSERVATORIUM DOCUMENTS
    // ============================================================
    match /conservatoriums/{cid} {
      allow read: if isApproved() && conservatoriumId() == cid;
      allow write: if isSiteAdmin() || isAdminFor(cid);

      // ============================================================
      // LESSON SLOTS
      // ============================================================
      match /lessonSlots/{slotId} {
        allow read: if isAdminFor(cid)
                    || (isTeacherFor(cid) && resource.data.teacherId == request.auth.uid)
                    || (isStudent() && resource.data.studentId == request.auth.uid)
                    || (isParent() && isParentOfStudent(resource.data.studentId));
        allow create: if isAdminFor(cid) || isTeacherFor(cid); // Students use Cloud Functions
        allow update: if isAdminFor(cid)
                      || (isTeacherFor(cid) && resource.data.teacherId == request.auth.uid
                          // Teachers can only update attendance and notes
                          && request.resource.data.diff(resource.data).affectedKeys()
                             .hasOnly(['status', 'attendanceMarkedAt', 'teacherNote', 'updatedAt']));
        // Students NEVER write slots directly — must go through callable function
      }

      // ============================================================
      // INVOICES — Highly sensitive financial data
      // ============================================================
      match /invoices/{invoiceId} {
        allow read: if isAdminFor(cid)
                    || resource.data.payerId == request.auth.uid; // Only the payer
        allow write: if isAdminFor(cid);
        // No role except admin can create or modify invoices
      }

      // ============================================================
      // MAKEUP CREDITS
      // ============================================================
      match /makeupCredits/{creditId} {
        allow read: if isAdminFor(cid)
                    || (isStudent() && resource.data.studentId == request.auth.uid)
                    || (isParent() && isParentOfStudent(resource.data.studentId))
                    || (isTeacherFor(cid)); // Teachers see credits for their students
        allow write: if false; // Cloud Functions only
      }

      // ============================================================
      // PAYROLL — Only admin and the specific teacher
      // ============================================================
      match /payrollPeriods/{periodId} {
        allow read: if isAdminFor(cid)
                    || (isTeacherFor(cid) && resource.data.teacherId == request.auth.uid);
        allow write: if isAdminFor(cid); // Teachers can view but not modify
      }

      // ============================================================
      // PRACTICE LOGS — Sensitive for minors
      // ============================================================
      match /practiceLogs/{logId} {
        allow read: if isAdminFor(cid)
                    || (isTeacherFor(cid) && resource.data.teacherId == request.auth.uid)
                    || (isStudent() && resource.data.studentId == request.auth.uid)
                    || (isParent() && isParentOfStudent(resource.data.studentId));
        allow create: if (isStudent() && request.resource.data.studentId == request.auth.uid)
                      || (isParent() && isParentOfStudent(request.resource.data.studentId));
        allow update: if (isTeacherFor(cid) && resource.data.teacherId == request.auth.uid
                          // Teachers can only add teacherComment
                          && request.resource.data.diff(resource.data).affectedKeys()
                             .hasOnly(['teacherComment', 'teacherCommentedAt']));
      }

      // ============================================================
      // LESSON NOTES — Private studio notes NEVER exposed to students
      // ============================================================
      match /lessonSlots/{slotId}/notes/{noteId} {
        allow read: if isAdminFor(cid)
                    || (isTeacherFor(cid) && resource.data.teacherId == request.auth.uid)
                    // Students/parents can read but studioNote field is stripped server-side
                    || (isStudent() && resource.data.studentId == request.auth.uid)
                    || (isParent() && isParentOfStudent(resource.data.studentId));
        allow create, update: if isTeacherFor(cid) && resource.data.teacherId == request.auth.uid;
      }

      // ============================================================
      // SCHOLARSHIP APPLICATIONS — Maximum privacy
      // ============================================================
      match /scholarshipApplications/{appId} {
        // Only the applicant, admin, and scholarship committee can read
        allow read: if isAdminFor(cid)
                    || resource.data.studentId == request.auth.uid
                    || (isParent() && isParentOfStudent(resource.data.studentId));
        allow create: if (isStudent() && request.resource.data.studentId == request.auth.uid)
                      || (isParent() && isParentOfStudent(request.resource.data.studentId));
        allow update: if isAdminFor(cid); // Only admin updates status
        // Scholarship amounts NEVER visible to donors
      }
    }
  }

  // Helper: parent-child relationship check
  // (Uses a denormalized 'parentOf' collection for efficiency)
  function isParentOfStudent(studentId) {
    return exists(/databases/$(database)/documents/parentOf/$(request.auth.uid + '_' + studentId));
  }
}
```

---

### I2 — INFORMATION DISCLOSURE: Firebase Storage Rules for Minor Video Recordings
**CVE Severity: Critical**

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Sheet music — read only by enrolled students and their teachers
    match /conservatoriums/{cid}/sheetMusic/{compositionId}/{file} {
      allow read: if request.auth != null
                  && request.auth.token.conservatoriumId == cid
                  && request.auth.token.approved == true;
      allow write: if request.auth != null
                   && request.auth.token.conservatoriumId == cid
                   && request.auth.token.role in ['CONSERVATORIUM_ADMIN', 'TEACHER'];
    }

    // CRITICAL: Student video/audio recordings — maximum restriction
    // These are recordings of minors and have extreme privacy sensitivity
    match /conservatoriums/{cid}/feedback/{studentId}/{logId}/{file} {
      allow read: if request.auth != null
                  && request.auth.token.conservatoriumId == cid
                  && (request.auth.uid == studentId                          // Student themselves
                      || isParentOf(request.auth.uid, studentId)             // Parent
                      || isTeacherOf(request.auth.uid, cid, studentId));     // Their teacher only
      allow write: if request.auth != null
                   && request.auth.token.conservatoriumId == cid
                   && request.auth.token.role == 'TEACHER'
                   && isTeacherOf(request.auth.uid, cid, studentId);
      // NEVER public, NEVER signed URLs stored long-term
    }

    // Practice videos — same restrictions as feedback
    match /conservatoriums/{cid}/practiceVideos/{studentId}/{file} {
      allow read: if request.auth != null
                  && request.auth.token.conservatoriumId == cid
                  && (request.auth.uid == studentId
                      || isParentOf(request.auth.uid, studentId)
                      || isTeacherOfStudent(request.auth.uid, cid, studentId));
      allow write: if request.auth != null
                   && (request.auth.uid == studentId
                       || isParentOf(request.auth.uid, studentId));
    }

    // Invoice PDFs — only the payer
    match /conservatoriums/{cid}/invoices/{invoiceId}/{file} {
      allow read: if request.auth != null
                  && isInvoicePayer(request.auth.uid, cid, invoiceId);
      allow write: if false; // Cloud Functions only
    }

    // Signed agreements for instrument checkout — admin and the signatory
    match /conservatoriums/{cid}/agreements/{checkoutId}/{file} {
      allow read: if request.auth != null
                  && request.auth.token.conservatoriumId == cid
                  && (request.auth.token.role == 'CONSERVATORIUM_ADMIN'
                      || isParentOrStudentForCheckout(request.auth.uid, cid, checkoutId));
      allow write: if false; // Cloud Functions only
    }

    // Signed URL generation function (never expose raw Storage URLs to clients)
    // All downloads go through: functions/src/storage/getSignedUrl.ts
  }
}
```

---

### E1 — ELEVATION OF PRIVILEGE: Israeli ID Numbers and Minor PII
**CVE Severity: Critical under Israeli PDPPA**

The Israeli Protection of Privacy Law classifies Israeli ID numbers (ת"ז) and medical/financial data as "sensitive personal information" requiring explicit consent, purpose limitation, and breach notification within 72 hours.

**Data Classification Inventory:**

| Data Type | Classification | Retention | Breach Notification Required |
|-----------|---------------|-----------|------------------------------|
| Israeli ID number (ת"ז) | Sensitive PII | 7 years | Yes — 72 hours to PDPPA |
| Minor's name + DOB | Sensitive PII (minor) | 7 years | Yes |
| Video/audio of minors | Sensitive PII (biometric context) | Per policy | Yes |
| Credit card last4 + expiry | Financial PII | Until card expires | Yes |
| Cardcom token | Payment sensitive | Until subscription ends | Yes |
| Scholarship financial data | Sensitive PII | 7 years | Yes |
| Practice log data | Regular PII | 3 years post-graduation | Yes |

**Required additions to Privacy Policy and data model:**

```typescript
// Every data collection point must have consent tracking
interface ConsentRecord {
  userId: string;
  consentType: 'DATA_PROCESSING' | 'MARKETING' | 'VIDEO_RECORDING' | 'SCHOLARSHIP_DATA';
  givenAt: Timestamp;
  givenByUserId: string;   // May be parent for minors
  ipAddress: string;       // Server-side captured
  consentVersion: string;  // Privacy policy version number
  revokedAt?: Timestamp;
}
// Collection: /conservatoriums/{cid}/consentRecords/{recordId}
```

---

### D1 — DENIAL OF SERVICE: Unthrottled Cloud Functions
**Severity:** Medium

**Attack:** A malicious actor calls `bookLessonSlot` 10,000 times via the Firebase SDK, exhausting Cloud Function invocations and Firestore write quota.

**Fix:** Firebase App Check + rate limiting:

```typescript
// All callable functions must enforce App Check
export const bookLessonSlot = onCall({
  enforceAppCheck: true,      // Reject calls without valid App Check token
  consumeAppCheckToken: true, // Prevent replay attacks
}, async (request) => { /* ... */ });

// Additionally, add per-user rate limiting using Firestore counters or Redis
// functions/src/middleware/rateLimiter.ts
export async function checkRateLimit(userId: string, action: string, limit: number): Promise<void> {
  const key = `rateLimit/${userId}/${action}/${format(new Date(), 'yyyy-MM-dd-HH')}`;
  const ref = db.doc(key);
  const snap = await ref.get();
  const count = snap.exists() ? (snap.data()?.count ?? 0) : 0;

  if (count >= limit) {
    throw new HttpsError('resource-exhausted', 'RATE_LIMIT_EXCEEDED');
  }
  await ref.set({ count: FieldValue.increment(1) }, { merge: true });
}
```

---

## 3. Hardening Checklist

### Authentication
- [ ] Replace `localStorage` role storage with Firebase Custom Claims
- [ ] Implement Firebase Session Cookies (httpOnly, Secure, SameSite=Strict) for web
- [ ] Enable Firebase App Check (Play Integrity for Android, App Attest for iOS, reCAPTCHA for web)
- [ ] Enforce MFA for `CONSERVATORIUM_ADMIN` and `SITE_ADMIN` roles
- [ ] Implement brute-force protection on login (Firebase Auth built-in + custom rate limit)

### Data Protection
- [ ] Deploy all Firestore Security Rules above
- [ ] Deploy all Firebase Storage Security Rules above
- [ ] Enable Firestore field-level encryption for ת"ז fields (using Cloud KMS)
- [ ] Implement consent tracking for all PII collection points
- [ ] Define and implement data retention schedule (Cloud Function)
- [ ] Configure Firebase Auth `displayName` to never include ID numbers

### Network & API
- [ ] Enable Firebase App Check on all callable functions
- [ ] Add rate limiting to all callable functions
- [ ] Validate all inputs with Zod schemas on every server action
- [ ] Add `Content-Security-Policy` headers to Next.js config
- [ ] Rotate all API keys (Cardcom, Twilio) to environment variables; audit for hardcoded secrets

### Incident Response
- [ ] Configure Firebase Alerting for unusual auth activity (e.g., >50 failed logins/hour)
- [ ] Create a Data Breach Response Procedure document (required by PDPPA)
- [ ] Define 72-hour PDPPA breach notification process
- [ ] Implement immutable audit log in Firestore (append-only, no delete rules)

---

## 4. Summary Scorecard

| Security Domain | Current Status | Required Before Launch |
|----------------|---------------|----------------------|
| Authentication (localStorage) | 🔴 Critical gap | Firebase Custom Claims + Session Cookies |
| Server-side authorization | 🔴 None | RBAC middleware on all server actions |
| Firestore Security Rules | 🔴 None | Full rule set above |
| Storage Security Rules | 🔴 None | Full rule set above |
| Input validation | 🔴 None | Zod schemas on all inputs |
| PCI-DSS compliance (Cardcom) | 🔴 No real integration | Tokenization + no card data storage |
| PDPPA compliance | 🔴 No consent tracking | Consent records + breach plan |
| App Check (DoS prevention) | 🔴 None | Enable before public launch |
| Audit log (immutable) | 🟡 Mock exists | Real Firestore append-only log |
| MFA for admins | 🔴 None | Firebase MFA enrollment |
