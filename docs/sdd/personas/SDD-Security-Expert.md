# Software Design Document — Security Expert Review
## Harmonia Music Conservatory Management Platform

**Persona:** Expert Security Developer / Penetration Tester  
**Review Scope:** Authentication, Authorization, Data Exposure, API Security, Client-Side Storage, Input Validation, CSP, PDPPA Compliance  
**Date:** March 2026  
**Status:** Pre-Production — Prototype with planned Firebase Integration

---

## Executive Summary

The Harmonia platform stores PII of minors (students under 18, including recordings, medical/financial data), operates under Israeli **PDPPA (Personal Data Protection Act)** and **Ministry of Education regulations**, and processes real payments via Cardcom. This combination makes security failures legally significant, not just operational risks.

**18 security issues** were identified. The most critical: authentication is by email alone with no password check, user roles are stored in mutable client-side `localStorage` enabling privilege escalation, several admin pages have zero authorization guards, the QR code API proxies external content with no token validation, and the `verifyAuth()` function unconditionally returns `true` — meaning all server actions are unauthenticated.

---

## CRITICAL SECURITY VULNERABILITIES

---

### SEC-C01 — Authentication by Email Only: No Password Verification

**Severity:** 🔴 Critical — CVSS 9.8 (Authentication Bypass)  
**File:** `src/hooks/use-auth.tsx`, `src/components/auth/login-form.tsx`  
**Threat:** Any user who knows a valid email address (from a public directory, leaked roster, etc.) can log in as any other user — including administrators.

**Evidence:**
```tsx
// use-auth.tsx — login function signature:
login: (email: string) => { ... }  // No password parameter

// The function:
const login = (email: string) => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser?.approved) {
        setUser(foundUser);
        // ← No password check whatsoever
    }
};

// login-form.tsx — password field exists but is never used:
const [password, setPassword] = useState('password') // Pre-filled, never passed to login()
```

**Attack Scenario:**
1. Attacker knows admin email `admin@conservatory.co.il` (from website, email footer, etc.)
2. Attacker navigates to `/login`, types the email, clicks login
3. Attacker is now authenticated as the conservatorium admin with full data access

**Fix — Production (Firebase Auth):**
```tsx
// src/hooks/use-auth.tsx — Replace mock login with Firebase:
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const login = async (email: string, password: string) => {
    try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await credential.user.getIdToken();
        // Store only the Firebase UID — never the full user object with role
        // Role is fetched from Firestore server-side, not from localStorage
        return { status: 'approved' };
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            return { status: 'not_found' };
        }
        throw error;
    }
};
```

**Fix — Interim (until Firebase):**
```tsx
// src/components/auth/login-form.tsx
const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        toast({ variant: 'destructive', title: 'נדרשים אימייל וסיסמה' });
        return;
    }
    const { user, status } = login(email); // Demo mode
    // At minimum, ensure pre-filled password is removed:
};

// Remove pre-filled default:
const [password, setPassword] = useState(''); // ← Empty, not 'password'
```

---

### SEC-C02 — User Role Stored in Mutable `localStorage` — Privilege Escalation

**Severity:** 🔴 Critical — CVSS 9.1 (Broken Access Control)  
**File:** `src/hooks/use-auth.tsx` (lines 179–186)  
**Threat:** Any browser-console script can escalate to `site_admin` in 2 seconds.

**Evidence:**
```tsx
// On page load, role is read from localStorage without server verification:
const storedUser = localStorage.getItem('harmonia-user');
if (storedUser) {
    const parsedData = JSON.parse(storedUser);
    // role comes from localStorage — attacker controls this:
    if (VALID_ROLES.includes(parsedData?.role)) {
        setUser(parsedData);  // ← Trusted without any server check
    }
}
```

**Attack (executed in browser console in < 5 seconds):**
```js
const user = JSON.parse(localStorage.getItem('harmonia-user'));
user.role = 'site_admin';
user.conservatoriumId = 'any-cons-id';
localStorage.setItem('harmonia-user', JSON.stringify(user));
location.reload();
// Now attacker is site_admin
```

**Fix — Production:**
```tsx
// NEVER store role in localStorage. Use Firebase Auth custom claims:

// Server-side (Cloud Function) — set custom claim on user creation:
await admin.auth().setCustomUserClaims(uid, {
    role: 'student',
    conservatoriumId: 'cons-15',
    approved: true,
});

// Client-side — role comes from the JWT token, not localStorage:
const auth = getAuth();
onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
        const token = await firebaseUser.getIdTokenResult();
        const role = token.claims.role; // ← From server-issued JWT, not mutable
        setUser({ uid: firebaseUser.uid, role, email: firebaseUser.email, ... });
    }
});
```

**Fix — Interim (until Firebase):**
```tsx
// Add server-side session validation. At minimum, add HMAC integrity to the stored user:
import { createHmac } from 'crypto';

// On login:
const signature = createHmac('sha256', process.env.SESSION_SECRET!)
    .update(JSON.stringify({ id: user.id, role: user.role }))
    .digest('hex');
localStorage.setItem('harmonia-user', JSON.stringify({ ...user, _sig: signature }));

// On load:
const storedUser = JSON.parse(localStorage.getItem('harmonia-user') ?? '{}');
const expectedSig = createHmac('sha256', process.env.SESSION_SECRET!)
    .update(JSON.stringify({ id: storedUser.id, role: storedUser.role }))
    .digest('hex');
if (storedUser._sig !== expectedSig) {
    localStorage.removeItem('harmonia-user');
    // Force re-login
}
```

---

### SEC-C03 — `verifyAuth()` Always Returns `true` — All Server Actions Unauthenticated

**Severity:** 🔴 Critical — CVSS 9.8 (Missing Authentication for Critical Function)  
**File:** `src/lib/auth-utils.ts`  
**Threat:** Every `withAuth`-wrapped server action (AI flows, composition search, enrollment creation, coordinator invites) is callable by any unauthenticated user. The auth wrapper provides **zero protection**.

**Evidence:**
```ts
// src/lib/auth-utils.ts
export async function verifyAuth(): Promise<boolean> {
    // "For this prototype, we assume any request reaching a server action
    //  is from an authenticated context"
    return true;  // ← Unconditionally trusts the caller
}

export function withAuth<T, R>(schema: T, action: Action<T, R>) {
    return async (input: T) => {
        await verifyAuth(); // ← Always passes
        // ...
    };
}
```

**Fix:**
```ts
// src/lib/auth-utils.ts
import { cookies } from 'next/headers';
import { auth as adminAuth } from '@/lib/firebase-admin'; // Firebase Admin SDK

export async function verifyAuth(): Promise<{ uid: string; role: string; conservatoriumId: string }> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) {
        throw new Error('Unauthorized: No session cookie');
    }

    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        return {
            uid: decodedToken.uid,
            role: decodedToken.role as string,
            conservatoriumId: decodedToken.conservatoriumId as string,
        };
    } catch (error) {
        throw new Error('Unauthorized: Invalid or expired session');
    }
}

// Updated withAuth — now receives caller context:
export function withAuth<T extends z.ZodType, R>(
    schema: T,
    action: (input: z.infer<T>, caller: { uid: string; role: string }) => Promise<R>
) {
    return async (input: z.infer<T>): Promise<R> => {
        const caller = await verifyAuth(); // Throws if unauthenticated
        const parsedInput = schema.parse(input);
        return await action(parsedInput, caller);
    };
}
```

---

### SEC-C04 — Admin Pages With Zero Authorization Guards (Playing School)

**Severity:** 🔴 Critical — CVSS 8.8 (Broken Access Control)  
**Files:**
- `src/app/[locale]/dashboard/admin/playing-school/page.tsx`
- `src/app/[locale]/dashboard/admin/playing-school/distribute/page.tsx`
- `src/app/[locale]/dashboard/admin/playing-school/billing/page.tsx`

**Evidence:**
```tsx
// CURRENT — No auth check at all:
export default function PlayingSchoolAdminPage() {
    return <SchoolPartnershipDashboard />;
}
```

A student navigates to `/he/dashboard/admin/playing-school` and sees the full school partnership management interface.

**Fix — Apply to all three pages:**
```tsx
// src/app/[locale]/dashboard/admin/playing-school/page.tsx
'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/routing';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SchoolPartnershipDashboard } from '@/components/dashboard/harmonia/school-partnership-dashboard';

const ALLOWED_ROLES = ['conservatorium_admin', 'site_admin'] as const;

export default function PlayingSchoolAdminPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        if (!user || !ALLOWED_ROLES.includes(user.role as any)) {
            router.replace('/dashboard');
        }
    }, [user, isLoading, router]);

    if (isLoading) return <Skeleton className="h-96" />;
    if (!user || !ALLOWED_ROLES.includes(user.role as any)) return null;

    return <SchoolPartnershipDashboard />;
}
```

---

### SEC-C05 — QR Code API Proxies Untrusted External Content Without Token Validation

**Severity:** 🔴 Critical — CVSS 7.5 (Server-Side Request Forgery Risk + Open Redirect)  
**File:** `src/app/api/ps/qr/route.ts` (embedded in `cardcom.ts`)

**Evidence:**
```ts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token'); // ← No validation on token format

    const registrationUrl = `https://harmony.app/register/school?token=${token}`; // ← token injected unsanitized
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(registrationUrl)}`;

    const response = await fetch(qrUrl); // Server fetches external URL
    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, { ... }); // Proxies response to client
}
```

**Attacks:**
1. **QR Injection:** `?token=../../../evil` generates QR codes pointing to malicious URLs
2. **SSRF probe:** While the external fetch goes to `api.qrserver.com`, future changes to the URL construction could enable SSRF
3. **Phishing:** Generate QR codes pointing to lookalike domains

**Fix:**
```ts
// src/app/api/ps/qr/route.ts
import { NextRequest, NextResponse } from 'next/server';

const TOKEN_REGEX = /^[A-Z0-9_-]{8,64}$/; // Only alphanumeric + safe chars
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://harmonia.co.il';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Strict token validation
    if (!token || !TOKEN_REGEX.test(token)) {
        return new NextResponse('Invalid token format', { status: 400 });
    }

    // Validate token exists in DB before generating QR
    // const partnership = await getPartnershipByToken(token);
    // if (!partnership) return new NextResponse('Token not found', { status: 404 });

    // Construct URL from safe base + validated token only
    const registrationUrl = `${APP_BASE_URL}/register/school?token=${encodeURIComponent(token)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(registrationUrl)}`;

    try {
        const response = await fetch(qrUrl, {
            signal: AbortSignal.timeout(5000), // 5s timeout
        });
        if (!response.ok) throw new Error('QR service unavailable');

        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=86400, immutable',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error) {
        return new NextResponse('Failed to generate QR code', { status: 502 });
    }
}
```

---

## HIGH SEVERITY VULNERABILITIES

---

### SEC-H01 — No Server-Side Route Protection in Middleware

**Severity:** 🟠 High — CVSS 7.3  
**File:** `src/middleware.ts` (only handles i18n, no auth)  
**Threat:** All `/dashboard/*` routes are accessible at the HTTP level to unauthenticated requests. Client-side guards are bypassed by curl, scrapers, or server-side rendering.

**Fix:**
```ts
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
    locales: routing.locales,
    defaultLocale: routing.defaultLocale,
    localePrefix: routing.localePrefix,
});

const PROTECTED_PATH_SEGMENTS = ['/dashboard', '/admin'];
const AUTH_COOKIE_NAME = 'harmonia-user'; // ← Interim; replace with __session (Firebase)

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtected = PROTECTED_PATH_SEGMENTS.some(seg => pathname.includes(seg));

    if (isProtected) {
        // Interim: check for the auth cookie presence
        const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
        if (!authCookie?.value) {
            // Determine locale from path for redirect
            const locale = pathname.split('/')[1] ?? 'he';
            const validLocales = ['he', 'en', 'ar', 'ru'];
            const targetLocale = validLocales.includes(locale) ? locale : 'he';
            return NextResponse.redirect(new URL(`/${targetLocale}/login`, request.url));
        }
        // Production: verify Firebase session cookie:
        // const decodedClaims = await adminAuth.verifySessionCookie(authCookie.value);
        // if (!decodedClaims) return NextResponse.redirect(...)
    }

    return intlMiddleware(request);
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
```

---

### SEC-H02 — No Content-Security-Policy Header

**Severity:** 🟠 High — CVSS 6.5 (XSS Amplification)  
**File:** `next.config.ts`  
**Threat:** Without CSP, any XSS vulnerability (e.g., in user-generated content like lesson notes, announcements, or form data rendered as HTML) can exfiltrate auth tokens, PII, or execute in-browser cryptocurrency mining.

**Current State:** The `next.config.ts` has other security headers (HSTS, X-Frame-Options) but is **missing CSP**.

**Fix:**
```ts
// next.config.ts
const securityHeaders = [
    // ... existing headers ...
    {
        key: 'Content-Security-Policy',
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Tighten in production
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https://placehold.co https://i.pravatar.cc https://picsum.photos https://images.unsplash.com",
            "connect-src 'self' https://api.anthropic.com https://secure.cardcom.solutions https://firebaseapp.com https://*.googleapis.com",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join('; '),
    },
];
```

---

### SEC-H03 — Auth Cookie Has No `HttpOnly` or `Secure` Flag

**Severity:** 🟠 High — CVSS 6.8 (Session Hijacking)  
**File:** `src/hooks/use-auth.tsx`  
**Evidence:**
```tsx
const setAuthCookie = () => {
    document.cookie = 'harmonia-user=1; path=/; max-age=2592000; samesite=lax';
    // Missing: ; HttpOnly; Secure
};
```

**Threat:** Without `HttpOnly`, the auth cookie is accessible via `document.cookie` in any JavaScript — including injected scripts. Without `Secure`, it transmits over HTTP in non-production environments.

**Fix:**
```tsx
// Client cookies cannot be HttpOnly — that must be set server-side.
// This is a fundamental architectural fix: move session management to server-side cookies.

// src/app/api/auth/login/route.ts (new file)
export async function POST(request: NextRequest) {
    const { email, password } = await request.json();
    // Verify with Firebase Admin
    // ...
    const response = NextResponse.json({ success: true });
    response.cookies.set('__session', sessionCookie, {
        httpOnly: true,    // ← Not accessible to JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 14, // 14 days
        path: '/',
    });
    return response;
}
```

---

### SEC-H04 — Playing School Enrollment Creates Real Payment URLs With Hardcoded Credentials

**Severity:** 🟠 High  
**File:** `src/app/actions.ts` — `createPlayingSchoolEnrollment`  
**Evidence:**
```ts
// Hardcoded Cardcom terminal number in server action response:
const redirectUrl = `https://secure.cardcom.solutions/External/LowProfile/Create.aspx?TerminalNumber=12345&...`;
//                                                                                              ^^^^^^^ HARDCODED
```

**Fix:**
```ts
// NEVER hardcode payment credentials. Use environment variables:
const redirectUrl = `https://secure.cardcom.solutions/...?TerminalNumber=${process.env.CARDCOM_TERMINAL_NUMBER}&...`;

// Add validation that the env var is set before using:
if (!process.env.CARDCOM_TERMINAL_NUMBER) {
    throw new Error('CARDCOM_TERMINAL_NUMBER environment variable is not configured');
}
```

---

### SEC-H05 — `TypeScript.ignoreBuildErrors` Masks Security-Relevant Type Errors

**Severity:** 🟠 High  
**File:** `next.config.ts`  
**Impact:** Type errors in auth guards, role checks, and data access functions could be silently suppressed, potentially hiding logic errors that create security vulnerabilities.

**Status:** ✅ Already resolved — `next.config.ts` no longer contains `ignoreBuildErrors: true`. The `typescript: {}` block does not suppress errors.

**Remaining Action:** Run a full typecheck to confirm zero type errors under strict mode:
```bash
npx tsc --noEmit
```

Ensure that no future changes re-introduce `ignoreBuildErrors: true` to `next.config.ts`. This should be enforced in code review.

---

## MEDIUM SEVERITY VULNERABILITIES

---

### SEC-M01 — No Rate Limiting on Login Endpoint

**Severity:** 🟡 Medium — Brute Force Risk  
**File:** `src/components/auth/login-form.tsx`  
**Impact:** No rate limiting means an attacker can attempt unlimited email guesses against the login endpoint.

**Fix (middleware-level rate limiting):**
```ts
// src/middleware.ts — Add rate limit for login route
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '10m'), // 5 attempts per 10 minutes
});

// In middleware:
if (pathname.includes('/login')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
        return new NextResponse('Too many requests', { status: 429 });
    }
}
```

---

### SEC-M02 — Cardcom Sandbox and Production URLs Are Identical

**Severity:** 🟡 Medium  
**File:** `src/lib/payments/cardcom.ts`  
**Evidence:**
```ts
const CARDCOM_CONFIG = {
    apiUrl: process.env.CARDCOM_SANDBOX === 'true'
        ? 'https://secure.cardcom.solutions/api/v11/LowProfile/Create'  // Same URL
        : 'https://secure.cardcom.solutions/api/v11/LowProfile/Create', // Same URL
```

Both sandbox and production point to the same URL. In Cardcom's API, sandbox uses a different endpoint or test terminal number. A misconfiguration would charge real cards during testing.

**Fix:**
```ts
const CARDCOM_CONFIG = {
    apiUrl: process.env.CARDCOM_SANDBOX === 'true'
        ? 'https://sandbox.cardcom.solutions/api/v11/LowProfile/Create'  // Sandbox
        : 'https://secure.cardcom.solutions/api/v11/LowProfile/Create',  // Production
    terminalNumber: process.env.CARDCOM_SANDBOX === 'true'
        ? process.env.CARDCOM_SANDBOX_TERMINAL_NUMBER ?? ''
        : process.env.CARDCOM_TERMINAL_NUMBER ?? '',
```

---

### SEC-M03 — Firebase Storage Rules Allow Teacher to Read Any Student's Feedback

**Severity:** 🟡 Medium  
**File:** `storage.rules`  
**Evidence:**
```
match /conservatoriums/{cid}/feedback/{studentId}/{logId}/{file} {
    allow read: if request.auth != null
                && request.auth.token.conservatoriumId == cid
                && request.auth.token.approved == true
                && (request.auth.uid == studentId
                    || request.auth.token.role == 'conservatorium_admin'
                    || request.auth.token.role == 'teacher');  // ← ANY teacher
```

A teacher can read feedback files for ANY student, not just their own students. This violates the principle of least privilege for student PII.

**Fix:**
```
match /conservatoriums/{cid}/feedback/{studentId}/{logId}/{file} {
    allow read: if request.auth != null
                && request.auth.token.conservatoriumId == cid
                && request.auth.token.approved == true
                && (
                    request.auth.uid == studentId
                    || request.auth.token.role == 'conservatorium_admin'
                    || (request.auth.token.role == 'teacher'
                        && request.resource.metadata.teacherId == request.auth.uid)
                        // Preferred: store teacherId in file metadata at upload time
                        // (more robust than relying on logId naming conventions)
                );
```

> **Note on the `logId.split('_')[0]` approach:** An earlier draft of this fix used `logId.split('_')[0]` to extract the teacher ID from the log document name. This is fragile and depends on a naming convention that may not be enforced. The metadata-based approach above is the recommended implementation — store `teacherId` as a custom metadata field when uploading the feedback file.

---

### SEC-M04 — Parent Can Access Any Invoice in Their Conservatorium

**Severity:** 🟡 Medium  
**File:** `storage.rules`  
**Evidence:**
```
match /conservatoriums/{cid}/invoices/{invoiceId}/{file} {
    allow read: if request.auth != null
                && request.auth.token.conservatoriumId == cid
                && request.auth.token.role == 'parent'; // ← Any parent in the conservatorium
```

A parent can read invoices for other families if they know the invoice ID.

**Fix:**
```
match /conservatoriums/{cid}/invoices/{invoiceId}/{file} {
    allow read: if request.auth != null
                && request.auth.token.conservatoriumId == cid
                && (
                    request.auth.token.role == 'conservatorium_admin'
                    || (request.auth.token.role == 'parent'
                        && request.resource.metadata.parentId == request.auth.uid)
                );
```

This requires storing `parentId` in the file's metadata when the invoice PDF is generated by the Cloud Function.

---

### SEC-M05 — Google OAuth Buttons Are Silent No-Ops (Trust Erosion)

**Severity:** 🟡 Medium  
**File:** `src/components/auth/login-form.tsx`  
**Impact:** Visible OAuth buttons that silently do nothing create a deceptive UI. Users who click them receive no feedback, may retry multiple times, and may abandon the legitimate email login flow.

**Fix (interim — add explicit feedback):**
```tsx
const handleOAuthNotAvailable = () => {
    toast({
        title: t('oauthComingSoon') ?? 'בקרוב',
        description: t('oauthComingSoonDesc') ?? 'כניסה עם Google/Microsoft אינה זמינה עדיין.',
    });
};

<Button variant="outline" onClick={handleOAuthNotAvailable} disabled={loading} type="button">
    <Icons.google className="me-2 h-4 w-4" />
    {t('continueWithGoogle')}
</Button>
```

**Fix (production — Firebase Google Auth):**
```tsx
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const handleGoogleLogin = async () => {
    setLoading(true);
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const idToken = await result.user.getIdToken();
        // Exchange for server session cookie
        await fetch('/api/auth/session', { method: 'POST', body: JSON.stringify({ idToken }) });
        router.push('/dashboard');
    } catch (err) {
        toast({ variant: 'destructive', title: 'Google login failed' });
    } finally {
        setLoading(false);
    }
};
```

---

## LOW SEVERITY VULNERABILITIES

---

### SEC-L01 — Invite Coordinator Token Is Guessable

**Severity:** 🟢 Low  
**File:** `src/app/actions.ts` — `inviteSchoolCoordinator`  
**Evidence:**
```ts
const token = `INV_${Math.random().toString(36).substring(7).toUpperCase()}`;
// Math.random() is not cryptographically secure
```

**Fix:**
```ts
import { randomBytes } from 'crypto';
const token = `INV_${randomBytes(16).toString('hex').toUpperCase()}`;
```

---

### SEC-L02 — Scholarship Priority Score Calculated Client-Side with `Math.random()`

**Severity:** 🟢 Low  
**File:** `src/hooks/use-auth.tsx` — `addScholarshipApplication`  
**Evidence:**
```ts
priorityScore: Math.floor(Math.random() * 50) + 40,
```

In production, scholarship priority scoring must be deterministic, auditable, and server-side. Client-side random scores can be manipulated or replayed.

**Fix:** Move scoring to a Cloud Function with a deterministic algorithm:
```ts
// Cloud Function
export const calculatePriorityScore = async (application: ScholarshipApplication) => {
    let score = 0;
    // Add points based on auditable criteria:
    if (application.financialNeedVerified) score += 30;
    if (application.yearsEnrolled > 2) score += 20;
    if (application.teacherRecommendation === 'STRONG') score += 25;
    // ... etc
    return score;
};
```

---

### SEC-L03 — No CSRF Protection on State-Changing Actions

**Severity:** 🟢 Low  
**Impact:** Server Actions in Next.js 14+ include built-in CSRF protection via `origin` header validation for same-origin requests. However, the interim cookie-based auth (`harmonia-user=1`) with `SameSite=lax` only provides partial CSRF protection.

**Fix:** Ensure all state-changing operations use POST (which Server Actions do) and that the session cookie uses `SameSite=strict` once HttpOnly cookies are implemented:
```ts
response.cookies.set('__session', sessionCookie, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict', // ← Strongest CSRF protection
    path: '/',
});
```

---

## PDPPA Compliance Notes (Israeli Data Protection)

The platform handles PII of minors (students under 18), which triggers heightened obligations under Israeli PDPPA and Ministry of Education data governance policies.

### Required Before Production Launch:

1. **Data Retention Policy:** Define and implement maximum retention periods for:
   - Practice videos (suggest: 1 year)
   - Lesson notes (suggest: 3 years after student graduation)
   - Financial records (required: 7 years per Israeli tax law)

2. **Right to Erasure:** Implement a user-initiated data deletion flow (GDPR-equivalent right exists in Israeli law for minors' data)

3. **Parental Consent Logging:** The `PlayingSchoolEnrollmentWizard` must log explicit consent for data processing, including the date and version of the privacy policy shown

4. **Minor Recordings — Consent Audit:** `practiceVideos` storage path requires documented parental consent before upload is permitted. Current storage rules allow the student themselves to write — minors cannot give legally binding consent in Israel.

---

## Security Issue Summary

| ID | Severity | CVSS | Category | Effort | Status |
|----|----------|------|----------|--------|--------|
| SEC-C01 | 🔴 Critical | 9.8 | Auth Bypass | High (Firebase) | Open |
| SEC-C02 | 🔴 Critical | 9.1 | Privilege Escalation | High | Open |
| SEC-C03 | 🔴 Critical | 9.8 | Missing Auth | Medium | Open |
| SEC-C04 | 🔴 Critical | 8.8 | Broken Access | Low | Open |
| SEC-C05 | 🔴 Critical | 7.5 | SSRF/QR Injection | Low | Open |
| SEC-H01 | 🟠 High | 7.3 | Route Protection | Medium | Open |
| SEC-H02 | 🟠 High | 6.5 | Missing CSP | Low | Open |
| SEC-H03 | 🟠 High | 6.8 | Session Hijacking | Medium | Open |
| SEC-H04 | 🟠 High | 7.0 | Hardcoded Credentials | Low | Open |
| SEC-H05 | 🟠 High | 6.0 | Type Safety | Low | ✅ Resolved |
| SEC-M01 | 🟡 Medium | 5.3 | Brute Force | Medium | Open |
| SEC-M02 | 🟡 Medium | 5.0 | Payment Risk | Low | Open |
| SEC-M03 | 🟡 Medium | 4.3 | Data Exposure | Low | Open |
| SEC-M04 | 🟡 Medium | 4.3 | Data Exposure | Low | Open |
| SEC-M05 | 🟡 Medium | 3.7 | Trust Erosion | Low | Open |
| SEC-L01 | 🟢 Low | 3.1 | Crypto | Low | Open |
| SEC-L02 | 🟢 Low | 2.4 | Business Logic | Medium | Open |
| SEC-L03 | 🟢 Low | 2.1 | CSRF | Low | Open |

---

## Recommended Remediation Roadmap

**Week 1 (Before any public access):**
- SEC-C04: Add role guards to all unprotected admin pages (2 hours)
- SEC-C05: Validate QR token format (1 hour)
- SEC-H04: Remove hardcoded Cardcom credentials (30 minutes)
- SEC-M05: Fix silent OAuth buttons (30 minutes)

**Weeks 2–4 (Before beta testing with real users):**
- SEC-C01 + SEC-C02 + SEC-C03 + SEC-H01: Full Firebase Auth integration
- SEC-H02: Add Content-Security-Policy
- SEC-H03: Move to HttpOnly server-side session cookies

**Weeks 5–8 (Before production launch):**
- SEC-M01: Rate limiting
- SEC-M03 + SEC-M04: Tighten storage rules
- PDPPA: Consent logging, retention policies, erasure flows

---

*Document prepared by: Expert Security Developer/Penetration Tester Persona — Harmonia Platform Review, March 2026*
