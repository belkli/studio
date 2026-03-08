# Harmonia Demo Access Strategy

> Last updated: 2026-03-06

This document describes how to give conservatorium administrators access to a live demo of Harmonia **without** making the application publicly available. The goal is to allow invited admins to explore the system with realistic data before committing to a rollout.

---

## Table of Contents

1. [Strategy Comparison](#1-strategy-comparison)
2. [Recommended: Option C — Firebase App Hosting + Invite Token Gate](#2-recommended-option-c--firebase-app-hosting--invite-token-gate)
3. [Implementation Plan](#3-implementation-plan)
4. [Demo Data Setup](#4-demo-data-setup)
5. [Invite Token Management](#5-invite-token-management)
6. [Operations](#6-operations)

---

## 1. Strategy Comparison

### Option A: Firebase Preview Channels + Basic Auth

| Aspect | Details |
|--------|---------|
| **Mechanism** | Deploy to a Firebase Hosting preview channel (`firebase hosting:channel:deploy demo --expires 30d`). Add password-prompt middleware for unauthenticated visitors. |
| **URL** | `https://harmonia-dev--demo-{hash}.web.app` |
| **Protection** | A `DEMO_PASSWORD` env var checked in `src/proxy.ts`. Visitors see a password prompt. |
| **Pros** | Free. Auto-expires. Easy to reset by redeploying the channel. |
| **Cons** | Single shared password (not per-conservatorium). URL is guessable if leaked. No way to track which conservatorium is using the demo. |
| **Effort** | ~15 minutes |

### Option B: Vercel Preview + Deployment Protection

| Aspect | Details |
|--------|---------|
| **Mechanism** | Deploy to Vercel with Deployment Protection enabled. Visitors must authenticate via Vercel or use a shared secret link. |
| **URL** | `https://harmonia-preview.vercel.app` |
| **Protection** | Vercel's built-in Deployment Protection (requires Vercel account login or shared secret). |
| **Pros** | First-class Next.js support. Built-in auth gate. Can use `POSTGRES_URL` with seeded staging DB. |
| **Cons** | Costs money for teams. Separate from Firebase ecosystem. Not per-conservatorium. Introduces a second hosting provider. |
| **Effort** | ~30 minutes (setup Vercel project + environment variables) |

### Option C: Firebase App Hosting + Custom Invite Token Gate (Recommended)

| Aspect | Details |
|--------|---------|
| **Mechanism** | Deploy to Firebase App Hosting staging environment. Add a `DEMO_TOKENS` env var with per-conservatorium invite tokens. The proxy checks for a `demo-access` cookie; if missing, redirects to a demo gate page that accepts the token. |
| **URL** | `https://harmonia-staging.web.app` |
| **Protection** | Per-conservatorium invite tokens. Each conservatorium admin receives a unique URL. Token is stored in a cookie after first use. |
| **Pros** | Fully custom. Per-conservatorium tracking. No third-party dependency. Tokens can be revoked by rotating them. Reuses existing Firebase infrastructure. |
| **Cons** | Requires ~30 minutes of implementation. |
| **Effort** | ~30 minutes |

### Decision: Option C

Option C is recommended because:
- It provides **per-conservatorium tracking** (know exactly who is accessing the demo)
- It reuses the **existing Firebase infrastructure** (no new providers)
- It is **easy to revoke** (rotate tokens in env var)
- It can be **personalised** (show the conservatorium name on the demo gate page)
- The implementation cost is minimal (~30 minutes)

---

## 2. Recommended: Option C — Firebase App Hosting + Invite Token Gate

### How It Works

1. Admin receives a personalised invite link: `https://harmonia-staging.web.app?invite=abc123`
2. `src/proxy.ts` checks for the `demo-access` cookie on every request
3. If the cookie is missing:
   - Check if `?invite=<token>` is in the URL
   - If present, validate against `DEMO_TOKENS` env var, set a `demo-access` cookie, and continue
   - If not present, redirect to `/demo-gate` page
4. The demo gate page shows "Harmonia Demo Access" with a token input field
5. On submit, the gate validates the token via a server action, sets the cookie, and redirects to the dashboard
6. Subsequent visits skip the gate (cookie is present and valid)

### Architecture Diagram

```
User visits staging URL
        |
        v
   proxy.ts
        |
        +-- DEMO_TOKENS env var set?
        |       |
        |   No: pass through normally (not a demo environment)
        |
        |   Yes: check for 'demo-access' cookie
        |       |
        |   Cookie valid? --> Continue to app
        |       |
        |   No cookie: check ?invite= query param
        |       |
        |   Valid token? --> Set cookie + continue
        |       |
        |   No token: --> Redirect to /demo-gate
```

---

## 3. Implementation Plan

### 3.1 Environment Variable

Add to `.env.staging` (or Firebase App Hosting environment config):

```env
# Comma-separated list of conservatoriumId:token pairs
# When set, the demo gate is activated
DEMO_TOKENS=cons-15:abc123,cons-66:def456,cons-84:ghi789
```

When `DEMO_TOKENS` is not set (e.g., in production), the gate is completely inactive.

### 3.2 Proxy Changes (`src/proxy.ts`)

Add the following logic **before** the existing route handling, after the static file check:

```typescript
// ── Demo Gate (only active when DEMO_TOKENS env var is set) ──

const DEMO_TOKENS = process.env.DEMO_TOKENS;

function parseDemoTokens(): Map<string, string> | null {
  if (!DEMO_TOKENS) return null;
  const map = new Map<string, string>();
  for (const pair of DEMO_TOKENS.split(',')) {
    const [consId, token] = pair.trim().split(':');
    if (consId && token) {
      map.set(token, consId);  // token -> conservatoriumId
    }
  }
  return map.size > 0 ? map : null;
}

const demoTokenMap = parseDemoTokens();

function handleDemoGate(request: NextRequest): NextResponse | null {
  // If no demo tokens configured, gate is inactive
  if (!demoTokenMap) return null;

  const { pathname } = request.nextUrl;

  // Allow the demo-gate page itself, static assets, and API routes through
  if (
    pathname.includes('/demo-gate') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    STATIC_EXTENSIONS.test(pathname)
  ) {
    return null;
  }

  // Check for existing demo-access cookie
  const demoCookie = request.cookies.get('demo-access')?.value;
  if (demoCookie && demoTokenMap.has(demoCookie)) {
    return null;  // Valid cookie, proceed
  }

  // Check for ?invite= query parameter
  const inviteToken = request.nextUrl.searchParams.get('invite');
  if (inviteToken && demoTokenMap.has(inviteToken)) {
    // Valid token — set cookie and redirect to clean URL
    const cleanUrl = new URL(request.url);
    cleanUrl.searchParams.delete('invite');
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set('demo-access', inviteToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,  // 30 days
      path: '/',
    });
    return response;
  }

  // No valid access — redirect to demo gate
  const gateUrl = new URL('/demo-gate', request.url);
  gateUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(gateUrl);
}
```

In the main `proxy()` function, add at the top (after the static file check):

```typescript
// Demo gate check
const demoGateResponse = handleDemoGate(request);
if (demoGateResponse) return demoGateResponse;
```

### 3.3 Demo Gate Page

Create `src/app/[locale]/demo-gate/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DemoGatePage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/demo-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.trim() }),
    });

    if (res.ok) {
      // Cookie was set by the API route; redirect to the requested page
      router.push(next);
    } else {
      setError('Invalid invite token. Please check and try again.');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Harmonia Demo Access</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter the invite token you received to access the demo environment.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700">
              Invite Token
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="e.g. abc123"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-start
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              dir="ltr"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white
                       hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Access Demo'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Contact your Harmonia representative if you need an invite token.
        </p>
      </div>
    </div>
  );
}
```

### 3.4 Token Verification API Route

Create `src/app/api/demo-verify/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  const demoTokens = process.env.DEMO_TOKENS;
  if (!demoTokens || !token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse tokens and validate
  const tokenMap = new Map<string, string>();
  for (const pair of demoTokens.split(',')) {
    const [consId, t] = pair.trim().split(':');
    if (consId && t) tokenMap.set(t, consId);
  }

  if (!tokenMap.has(token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    conservatoriumId: tokenMap.get(token),
  });

  response.cookies.set('demo-access', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,  // 30 days
    path: '/',
  });

  return response;
}
```

---

## 4. Demo Data Setup

The demo environment should contain realistic data so conservatorium admins can explore the full platform.

### Option A: Mock Data (Simplest)

Set `DB_BACKEND=mock` in the staging environment. The `MemoryAdapter` automatically seeds with:

- 85 conservatoriums (from `docs/data/constadmin.json`)
- 68 directory teachers (18 from Hod HaSharon, 50 from Kiryat Ono)
- Students, parents, lesson slots, invoices, practice logs
- 5,217 compositions in the repertoire library

**Limitation:** Data resets on every deployment. Changes made during the demo are lost.

### Option B: Seeded PostgreSQL (Recommended for persistent demos)

```bash
# On the staging database server
psql $DATABASE_URL < scripts/db/seed.sql
psql $DATABASE_URL < scripts/db/repertoire.seed.sql
```

Set in staging environment:
```env
DB_BACKEND=postgres
DATABASE_URL=postgresql://harmonia:harmonia_pass@staging-db-host:5432/harmonia_staging
```

**Advantage:** Data persists across deployments. Admin changes during demo are preserved.

### Option C: Firebase (Most realistic)

Use the same `DB_BACKEND=firebase` as production, but with a separate Firestore database in the staging project. Import seed data via a one-time Cloud Function or Admin SDK script.

---

## 5. Invite Token Management

### Token Format

Tokens are simple alphanumeric strings. They don't need to be cryptographically secure since the demo environment contains only seed data (no real PII).

Recommended format: `{conservatorium-short-name}-{random-6-chars}`

### Token Configuration

Tokens are stored in the `DEMO_TOKENS` environment variable as comma-separated `conservatoriumId:token` pairs:

```env
DEMO_TOKENS=cons-15:hodha-a1b2c3,cons-66:kiron-d4e5f6,cons-84:petik-g7h8i9
```

### Generating Tokens

```bash
# Generate a random 6-character token
openssl rand -hex 3
# Output: a1b2c3

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(3).toString('hex'))"
```

### Sending Invitations

Compose personalised invite emails:

```
Subject: Harmonia Demo Access — {Conservatorium Name}

Dear {Admin Name},

You're invited to explore Harmonia, the music conservatorium management platform.

Access the demo at:
https://harmonia-staging.web.app?invite={token}

This link will give you access for 30 days. You can explore the dashboard as a
site administrator with full access to all features.

If you have questions, reply to this email.

Best regards,
Harmonia Team
```

### Revoking Access

To revoke a specific conservatorium's access:
1. Remove their token from `DEMO_TOKENS`
2. Redeploy the staging environment
3. Their existing `demo-access` cookie will fail validation on the next request

### Rotating All Tokens

To rotate all tokens (e.g., after a demo round ends):
1. Generate new tokens for each conservatorium
2. Update the `DEMO_TOKENS` env var
3. Redeploy
4. Send new invite links

---

## 6. Operations

### Monitoring Demo Usage

Since each token is tied to a conservatorium, you can track usage by logging token validations. Add to the demo-verify API route:

```typescript
console.info(`[demo] Token validated: conservatoriumId=${tokenMap.get(token)}`);
```

Firebase App Hosting logs will show which conservatoriums are accessing the demo.

### Demo Environment Reset

If a demo round is complete and you want to reset:

1. **Mock backend:** Simply redeploy — data resets automatically.
2. **Postgres backend:** Run `npm run db:reset` against the staging database.
3. **Rotate tokens:** Update `DEMO_TOKENS` with new values.

### Transitioning to Production

When a conservatorium is ready to go live:

1. Create their admin account in the production Firebase project
2. Set custom claims (role, conservatoriumId) via the `onUserApproved` Cloud Function
3. Remove their demo token from `DEMO_TOKENS`
4. They access production at `https://harmonia.web.app` (or custom domain) with real Firebase Auth
