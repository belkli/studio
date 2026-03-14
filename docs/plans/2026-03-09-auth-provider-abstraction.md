# Auth Provider Abstraction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Introduce an `AuthProvider` interface that decouples the app from Firebase Auth, with a Supabase Auth implementation, switchable via `AUTH_PROVIDER=firebase|supabase` env var — no user migration, both providers work simultaneously.

**Architecture:** Create `src/lib/auth/provider.ts` as a thin interface (`IAuthProvider`) with two concrete implementations: `FirebaseAuthProvider` (wraps existing firebase-admin / firebase-client code) and `SupabaseAuthProvider` (uses `@supabase/ssr`). A factory `getAuthProvider()` reads `AUTH_PROVIDER` at boot time. All auth-consuming code (`auth-utils.ts`, `proxy.ts`, `login-form.tsx`, `oauth.ts`, `logout route`, `actions/auth.ts`) is updated to call the provider interface — Firebase-specific imports are removed from those files. The existing `firebase-admin.ts` and `firebase-client.ts` files remain untouched as implementation details inside the Firebase provider.

**Tech Stack:** Next.js 16, TypeScript, `firebase-admin`, `firebase/auth`, `@supabase/ssr`, `@supabase/supabase-js`, Vitest

---

## Overview of files to touch

| File | Action |
|---|---|
| `src/lib/auth/provider.ts` | **Create** — `IAuthProvider` interface + factory |
| `src/lib/auth/firebase-provider.ts` | **Create** — Firebase implementation |
| `src/lib/auth/supabase-provider.ts` | **Create** — Supabase implementation |
| `src/lib/auth/supabase-client.ts` | **Create** — Supabase browser client (mirrors firebase-client.ts) |
| `src/lib/auth-utils.ts` | **Modify** — use `getAuthProvider()` instead of direct firebase-admin calls |
| `src/proxy.ts` | **Modify** — provider-agnostic JWT decode for session claims |
| `src/app/api/auth/login/route.ts` | **Modify** — use provider |
| `src/app/api/auth/logout/route.ts` | **Modify** — use provider |
| `src/app/actions/auth.ts` | **Modify** — use provider |
| `src/lib/auth/oauth.ts` | **Modify** — use provider for OAuth |
| `src/components/auth/login-form.tsx` | **Modify** — use provider |
| `src/hooks/domains/auth-domain.tsx` | **Modify** — use provider for signOut |
| `src/app/actions/storage.ts` | **Modify** — use provider storage (or keep firebase-specific with guard) |
| `tests/auth/provider.test.ts` | **Create** — unit tests for factory + both providers |
| `tests/auth/supabase-provider.test.ts` | **Create** — Supabase provider unit tests |

---

## Task 1: Install Supabase SSR package

**Files:**
- Modify: `package.json`

**Step 1: Install the packages**

```bash
cd C:/personal/studio
npm install @supabase/ssr @supabase/supabase-js
```

**Step 2: Verify install**

```bash
npm ls @supabase/ssr @supabase/supabase-js
```
Expected: both packages listed with version numbers.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(auth): install @supabase/ssr and @supabase/supabase-js"
```

---

## Task 2: Define the IAuthProvider interface and factory

**Files:**
- Create: `src/lib/auth/provider.ts`

This is the central abstraction. Every auth operation the app needs goes through this interface. Do not put Firebase or Supabase imports here.

**Step 1: Create the interface file**

```typescript
// src/lib/auth/provider.ts

/**
 * @fileoverview Auth provider abstraction.
 *
 * Decouple the app from any specific auth backend.
 * Switch provider via AUTH_PROVIDER env var: 'firebase' (default) | 'supabase'
 *
 * The interface covers:
 *   - Server-side session cookie verification (used in auth-utils, proxy)
 *   - Session cookie creation (login flow)
 *   - Session revocation (logout flow)
 *   - Client-side email/password sign-in (login-form)
 *   - Client-side OAuth sign-in (google, microsoft)
 *   - Client-side sign-out
 */

export interface SessionClaims {
  uid: string;
  email: string;
  role: string;
  conservatoriumId: string;
  approved: boolean;
}

export interface OAuthProfile {
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  provider: 'google' | 'microsoft';
  providerUserId: string;
}

export type OAuthResult =
  | { type: 'success'; profile: OAuthProfile }
  | { type: 'conflict'; existingMethods: string[]; email: string };

/**
 * Server-side auth capabilities (Node.js runtime).
 * Implementations live in firebase-provider.ts and supabase-provider.ts.
 */
export interface IServerAuthProvider {
  /** Verify the session cookie and return claims. Throws if invalid. */
  verifySessionCookie(cookie: string): Promise<SessionClaims>;
  /** Create a new session cookie from an ID token or access token. */
  createSessionCookie(token: string, maxAgeSeconds: number): Promise<string>;
  /** Revoke all sessions for a user (logout). */
  revokeUserSessions(uid: string): Promise<void>;
  /**
   * Lightweight JWT claim extraction for Edge (proxy.ts).
   * No cryptographic verification — full verification happens in verifySessionCookie.
   * Returns null if the cookie cannot be decoded.
   */
  extractClaimsFromCookie(cookie: string): Promise<SessionClaims | null>;
}

/**
 * Client-side auth capabilities (browser runtime).
 */
export interface IClientAuthProvider {
  /** Sign in with email + password. Returns an ID token (or session token). */
  signInWithEmailPassword(email: string, password: string): Promise<string>;
  /** OAuth sign-in via popup or redirect. */
  signInWithOAuth(provider: 'google' | 'microsoft', fallbackEmail?: string): Promise<OAuthResult>;
  /** Sign out on the client side. */
  signOut(): Promise<void>;
}

// ── Factory ────────────────────────────────────────────────────────────────

let _serverProvider: IServerAuthProvider | null = null;

/**
 * Get the configured server-side auth provider.
 * Reads AUTH_PROVIDER env var: 'firebase' (default) | 'supabase'
 * Lazy-initialised and cached.
 */
export async function getServerAuthProvider(): Promise<IServerAuthProvider> {
  if (_serverProvider) return _serverProvider;

  const which = (process.env.AUTH_PROVIDER || 'firebase').trim().toLowerCase();

  if (which === 'supabase') {
    const { SupabaseServerAuthProvider } = await import('./supabase-provider');
    _serverProvider = new SupabaseServerAuthProvider();
  } else {
    const { FirebaseServerAuthProvider } = await import('./firebase-provider');
    _serverProvider = new FirebaseServerAuthProvider();
  }

  console.info(`[auth] server provider = ${which}`);
  return _serverProvider;
}

/**
 * Get the configured client-side auth provider (browser only).
 * Call only from 'use client' components.
 */
export async function getClientAuthProvider(): Promise<IClientAuthProvider> {
  const which = (process.env.AUTH_PROVIDER || 'firebase').trim().toLowerCase();

  if (which === 'supabase') {
    const { SupabaseClientAuthProvider } = await import('./supabase-provider');
    return new SupabaseClientAuthProvider();
  } else {
    const { FirebaseClientAuthProvider } = await import('./firebase-provider');
    return new FirebaseClientAuthProvider();
  }
}

/** Reset cached provider — only for tests. */
export function _resetProviderCache() {
  _serverProvider = null;
}
```

**Step 2: No test yet — this is pure types/factory. Compile-check only.**

```bash
cd C:/personal/studio
npx tsc --noEmit 2>&1 | head -30
```

Expected: errors about missing `./firebase-provider` and `./supabase-provider` — that's expected and correct at this point.

**Step 3: Commit**

```bash
git add src/lib/auth/provider.ts
git commit -m "feat(auth): define IAuthProvider interface and factory"
```

---

## Task 3: Create FirebaseAuthProvider (wraps existing code)

**Files:**
- Create: `src/lib/auth/firebase-provider.ts`

This wraps the existing `firebase-admin.ts` and `firebase-client.ts` without changing them.

**Step 1: Create the file**

```typescript
// src/lib/auth/firebase-provider.ts

/**
 * @fileoverview Firebase implementation of IServerAuthProvider and IClientAuthProvider.
 *
 * Wraps the existing firebase-admin.ts and firebase-client.ts.
 * These underlying files are NOT modified — this is a pure wrapper.
 */

import type {
  IServerAuthProvider,
  IClientAuthProvider,
  SessionClaims,
  OAuthResult,
} from './provider';

// ── Server-side (Node.js runtime) ─────────────────────────────────────────

export class FirebaseServerAuthProvider implements IServerAuthProvider {
  async verifySessionCookie(cookie: string): Promise<SessionClaims> {
    const { getAdminAuth } = await import('@/lib/firebase-admin');
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      throw new Error('Firebase Admin SDK not configured');
    }

    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email || '',
      role: (decoded.role as string) || 'student',
      conservatoriumId: (decoded.conservatoriumId as string) || '',
      approved: decoded.approved === true,
    };
  }

  async createSessionCookie(idToken: string, maxAgeSeconds: number): Promise<string> {
    const { getAdminAuth } = await import('@/lib/firebase-admin');
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      throw new Error('Firebase Admin SDK not configured');
    }

    return adminAuth.createSessionCookie(idToken, {
      expiresIn: maxAgeSeconds * 1000,
    });
  }

  async revokeUserSessions(uid: string): Promise<void> {
    const { getAdminAuth } = await import('@/lib/firebase-admin');
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      throw new Error('Firebase Admin SDK not configured');
    }
    await adminAuth.revokeRefreshTokens(uid);
  }

  async extractClaimsFromCookie(cookie: string): Promise<SessionClaims | null> {
    try {
      const parts = cookie.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf-8')
      );

      if (payload.exp && payload.exp * 1000 < Date.now()) return null;

      const uid = payload.sub || payload.user_id;
      if (!uid) return null;

      return {
        uid,
        email: payload.email || '',
        role: payload.role || '',
        conservatoriumId: payload.conservatoriumId || '',
        approved: payload.approved === true,
      };
    } catch {
      return null;
    }
  }
}

// ── Client-side (browser runtime) ─────────────────────────────────────────

export class FirebaseClientAuthProvider implements IClientAuthProvider {
  async signInWithEmailPassword(email: string, password: string): Promise<string> {
    const { getClientAuth } = await import('@/lib/firebase-client');
    const { signInWithEmailAndPassword } = await import('firebase/auth');

    const auth = getClientAuth();
    if (!auth) throw new Error('Firebase client not configured');

    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user.getIdToken();
  }

  async signInWithOAuth(
    provider: 'google' | 'microsoft',
    fallbackEmail?: string
  ): Promise<OAuthResult> {
    // Re-use the existing oauth.ts implementation
    const { signInWithGoogle, signInWithMicrosoft } = await import('./oauth');
    const result =
      provider === 'google'
        ? await signInWithGoogle({ fallbackEmail })
        : await signInWithMicrosoft({ fallbackEmail });
    return result;
  }

  async signOut(): Promise<void> {
    const { getClientAuth } = await import('@/lib/firebase-client');
    const auth = getClientAuth();
    if (!auth) return;
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  }
}
```

**Step 2: Compile check**

```bash
cd C:/personal/studio
npx tsc --noEmit 2>&1 | grep "firebase-provider\|supabase-provider" | head -20
```

Expected: only `supabase-provider` errors remain.

**Step 3: Commit**

```bash
git add src/lib/auth/firebase-provider.ts
git commit -m "feat(auth): Firebase auth provider implementation"
```

---

## Task 4: Create Supabase browser client helper

**Files:**
- Create: `src/lib/auth/supabase-client.ts`

Mirrors `src/lib/firebase-client.ts` — provides a cached Supabase browser client.

**Step 1: Create the file**

```typescript
// src/lib/auth/supabase-client.ts

/**
 * @fileoverview Supabase browser client for client-side auth operations.
 * Mirrors firebase-client.ts. Only initialises if NEXT_PUBLIC_SUPABASE_URL
 * and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  // Dynamic import to avoid bundling when not used
  // (will be tree-shaken when AUTH_PROVIDER !== 'supabase')
  const { createBrowserClient } = require('@supabase/ssr') as typeof import('@supabase/ssr');
  cachedClient = createBrowserClient(url, key);
  return cachedClient;
}
```

**Step 2: Commit**

```bash
git add src/lib/auth/supabase-client.ts
git commit -m "feat(auth): Supabase browser client helper"
```

---

## Task 5: Create SupabaseAuthProvider

**Files:**
- Create: `src/lib/auth/supabase-provider.ts`

**Step 1: Create the file**

```typescript
// src/lib/auth/supabase-provider.ts

/**
 * @fileoverview Supabase implementation of IServerAuthProvider and IClientAuthProvider.
 *
 * Session model:
 *   - Login: supabase.auth.signInWithPassword() → access_token (JWT)
 *   - Server cookie name: __session (same name as Firebase, for proxy compat)
 *   - The JWT is stored as-is in __session cookie (Supabase JWT, not Firebase session cookie)
 *   - Claims (role, conservatoriumId, approved) stored in JWT app_metadata
 *
 * Supabase custom claims: set via Admin API on user.app_metadata.
 * The JWT payload for app_metadata looks like: { role, conservatoriumId, approved }
 */

import type {
  IServerAuthProvider,
  IClientAuthProvider,
  SessionClaims,
  OAuthResult,
} from './provider';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

// ── Server-side ────────────────────────────────────────────────────────────

export class SupabaseServerAuthProvider implements IServerAuthProvider {
  private get adminClient() {
    const { createClient } = require('@supabase/supabase-js') as typeof import('@supabase/supabase-js');
    return createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }

  async verifySessionCookie(cookie: string): Promise<SessionClaims> {
    // The cookie value IS the Supabase access token (JWT)
    const { data, error } = await this.adminClient.auth.getUser(cookie);
    if (error || !data.user) {
      throw new Error('UNAUTHENTICATED');
    }

    const meta = (data.user.app_metadata || {}) as Record<string, unknown>;
    return {
      uid: data.user.id,
      email: data.user.email || '',
      role: (meta.role as string) || 'student',
      conservatoriumId: (meta.conservatoriumId as string) || '',
      approved: meta.approved === true,
    };
  }

  async createSessionCookie(accessToken: string, _maxAgeSeconds: number): Promise<string> {
    // For Supabase: the access token IS the session cookie value.
    // Verification (verifySessionCookie) handles expiry via Supabase's getUser.
    return accessToken;
  }

  async revokeUserSessions(uid: string): Promise<void> {
    // Sign out all sessions for this user via Admin API
    await this.adminClient.auth.admin.signOut(uid, 'global');
  }

  async extractClaimsFromCookie(cookie: string): Promise<SessionClaims | null> {
    try {
      // Supabase access tokens are standard JWTs — decode payload without verify
      const parts = cookie.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf-8')
      );

      if (payload.exp && payload.exp * 1000 < Date.now()) return null;

      const uid = payload.sub;
      if (!uid) return null;

      // Supabase stores custom claims in app_metadata inside JWT
      const meta = (payload.app_metadata || {}) as Record<string, unknown>;

      return {
        uid,
        email: payload.email || '',
        role: (meta.role as string) || '',
        conservatoriumId: (meta.conservatoriumId as string) || '',
        approved: meta.approved === true,
      };
    } catch {
      return null;
    }
  }
}

// ── Client-side ────────────────────────────────────────────────────────────

export class SupabaseClientAuthProvider implements IClientAuthProvider {
  async signInWithEmailPassword(email: string, password: string): Promise<string> {
    const { getSupabaseBrowserClient } = await import('./supabase-client');
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error('Supabase client not configured');

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      throw new Error(error?.message || 'Sign-in failed');
    }

    // Return the access token — createSessionCookie will store it as-is
    return data.session.access_token;
  }

  async signInWithOAuth(
    provider: 'google' | 'microsoft',
    fallbackEmail?: string
  ): Promise<OAuthResult> {
    const { getSupabaseBrowserClient } = await import('./supabase-client');
    const client = getSupabaseBrowserClient();

    if (!client) {
      // Dev fallback: mock profile from email
      if (!fallbackEmail) throw new Error('Supabase not configured and no fallback email');
      const [firstName = '', ...rest] = fallbackEmail.split('@')[0].split(/[._\-\s]+/);
      return {
        type: 'success',
        profile: {
          email: fallbackEmail,
          firstName,
          lastName: rest.join(' '),
          provider,
          providerUserId: `mock-${provider}-${fallbackEmail}`,
        },
      };
    }

    // Supabase OAuth uses redirect flow (not popup)
    // Trigger the redirect — this never returns normally; the page navigates away
    const supabaseProvider = provider === 'google' ? 'google' : 'azure';
    await client.auth.signInWithOAuth({
      provider: supabaseProvider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    // This code is unreachable after redirect — satisfy TypeScript
    throw new Error('OAuth redirect initiated');
  }

  async signOut(): Promise<void> {
    const { getSupabaseBrowserClient } = await import('./supabase-client');
    const client = getSupabaseBrowserClient();
    if (!client) return;
    await client.auth.signOut();
  }
}
```

**Step 2: Compile check**

```bash
cd C:/personal/studio
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors about missing provider files. May have errors in files that still import firebase directly — those get fixed in later tasks.

**Step 3: Commit**

```bash
git add src/lib/auth/supabase-provider.ts
git commit -m "feat(auth): Supabase auth provider implementation"
```

---

## Task 6: Write unit tests for the provider factory

**Files:**
- Create: `tests/auth/provider.test.ts`

**Step 1: Create the test file**

```typescript
// tests/auth/provider.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';

// We test the factory behaviour — not the providers themselves (those have their own tests)
describe('getServerAuthProvider factory', () => {
  beforeEach(async () => {
    // Reset module cache between tests
    vi.resetModules();
    // Reset the singleton cache
    const mod = await import('@/lib/auth/provider');
    mod._resetProviderCache();
  });

  it('returns FirebaseServerAuthProvider when AUTH_PROVIDER=firebase', async () => {
    process.env.AUTH_PROVIDER = 'firebase';
    const { getServerAuthProvider } = await import('@/lib/auth/provider');
    const provider = await getServerAuthProvider();
    expect(provider.constructor.name).toBe('FirebaseServerAuthProvider');
  });

  it('returns FirebaseServerAuthProvider by default (no AUTH_PROVIDER set)', async () => {
    delete process.env.AUTH_PROVIDER;
    const { getServerAuthProvider } = await import('@/lib/auth/provider');
    const provider = await getServerAuthProvider();
    expect(provider.constructor.name).toBe('FirebaseServerAuthProvider');
  });

  it('returns SupabaseServerAuthProvider when AUTH_PROVIDER=supabase', async () => {
    process.env.AUTH_PROVIDER = 'supabase';
    const { getServerAuthProvider } = await import('@/lib/auth/provider');
    const provider = await getServerAuthProvider();
    expect(provider.constructor.name).toBe('SupabaseServerAuthProvider');
  });

  it('caches the provider after first call', async () => {
    process.env.AUTH_PROVIDER = 'firebase';
    const { getServerAuthProvider } = await import('@/lib/auth/provider');
    const p1 = await getServerAuthProvider();
    const p2 = await getServerAuthProvider();
    expect(p1).toBe(p2);
  });
});
```

**Step 2: Run test to verify it passes**

```bash
cd C:/personal/studio
npx vitest run tests/auth/provider.test.ts --reporter=verbose
```

Expected: 4 tests pass.

**Step 3: Commit**

```bash
git add tests/auth/provider.test.ts
git commit -m "test(auth): provider factory unit tests"
```

---

## Task 7: Write unit tests for extractClaimsFromCookie (both providers)

**Files:**
- Create: `tests/auth/extract-claims.test.ts`

The `extractClaimsFromCookie` method is the most critical edge-runtime function. Test it with real JWT payloads.

**Step 1: Create the test**

```typescript
// tests/auth/extract-claims.test.ts

import { describe, it, expect } from 'vitest';
import { FirebaseServerAuthProvider } from '@/lib/auth/firebase-provider';
import { SupabaseServerAuthProvider } from '@/lib/auth/supabase-provider';

// Helper: build a fake JWT with a given payload (base64url, no real signing)
function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.fakesig`;
}

const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
const pastExp = Math.floor(Date.now() / 1000) - 1;      // expired

// ── Firebase claims format ─────────────────────────────────────────────────
describe('FirebaseServerAuthProvider.extractClaimsFromCookie', () => {
  const provider = new FirebaseServerAuthProvider();

  it('extracts claims from a valid Firebase JWT', async () => {
    const jwt = fakeJwt({
      sub: 'firebase-uid-123',
      email: 'test@example.com',
      role: 'teacher',
      conservatoriumId: 'cons-1',
      approved: true,
      exp: futureExp,
    });
    const claims = await provider.extractClaimsFromCookie(jwt);
    expect(claims).toEqual({
      uid: 'firebase-uid-123',
      email: 'test@example.com',
      role: 'teacher',
      conservatoriumId: 'cons-1',
      approved: true,
    });
  });

  it('returns null for expired token', async () => {
    const jwt = fakeJwt({ sub: 'uid', exp: pastExp });
    expect(await provider.extractClaimsFromCookie(jwt)).toBeNull();
  });

  it('returns null for malformed token', async () => {
    expect(await provider.extractClaimsFromCookie('not.a.jwt')).toBeNull();
    expect(await provider.extractClaimsFromCookie('')).toBeNull();
    expect(await provider.extractClaimsFromCookie('onepart')).toBeNull();
  });

  it('returns null when sub is missing', async () => {
    const jwt = fakeJwt({ email: 'test@example.com', exp: futureExp });
    expect(await provider.extractClaimsFromCookie(jwt)).toBeNull();
  });

  it('defaults role to empty string when missing', async () => {
    const jwt = fakeJwt({ sub: 'uid', exp: futureExp });
    const claims = await provider.extractClaimsFromCookie(jwt);
    expect(claims?.role).toBe('');
  });
});

// ── Supabase claims format ─────────────────────────────────────────────────
describe('SupabaseServerAuthProvider.extractClaimsFromCookie', () => {
  const provider = new SupabaseServerAuthProvider();

  it('extracts claims from Supabase JWT with app_metadata', async () => {
    const jwt = fakeJwt({
      sub: 'supabase-uid-456',
      email: 'teacher@example.com',
      app_metadata: {
        role: 'conservatorium_admin',
        conservatoriumId: 'cons-5',
        approved: true,
      },
      exp: futureExp,
    });
    const claims = await provider.extractClaimsFromCookie(jwt);
    expect(claims).toEqual({
      uid: 'supabase-uid-456',
      email: 'teacher@example.com',
      role: 'conservatorium_admin',
      conservatoriumId: 'cons-5',
      approved: true,
    });
  });

  it('returns null for expired Supabase token', async () => {
    const jwt = fakeJwt({ sub: 'uid', exp: pastExp, app_metadata: {} });
    expect(await provider.extractClaimsFromCookie(jwt)).toBeNull();
  });

  it('defaults role to empty string when app_metadata missing', async () => {
    const jwt = fakeJwt({ sub: 'uid', exp: futureExp });
    const claims = await provider.extractClaimsFromCookie(jwt);
    expect(claims?.role).toBe('');
  });
});
```

**Step 2: Run tests**

```bash
cd C:/personal/studio
npx vitest run tests/auth/extract-claims.test.ts --reporter=verbose
```

Expected: 10 tests pass.

**Step 3: Commit**

```bash
git add tests/auth/extract-claims.test.ts
git commit -m "test(auth): extractClaimsFromCookie unit tests for both providers"
```

---

## Task 8: Refactor auth-utils.ts to use the provider

**Files:**
- Modify: `src/lib/auth-utils.ts`

Replace all direct `firebase-admin` imports with `getServerAuthProvider()`.
Keep the same public API — `verifyAuth()`, `requireRole()`, `withAuth()`, `createSessionCookie()`, `revokeSession()`.

**Step 1: Read the current file to understand it (already read above)**

The key functions to update:
- `createSessionCookie(idToken)` → `provider.createSessionCookie(token, expiryMs/1000)`
- `revokeSession(uid)` → `provider.revokeUserSessions(uid)`
- `verifyAuth()` → `provider.verifySessionCookie(cookie)`

**Step 2: Edit the file**

Replace the top of `src/lib/auth-utils.ts` (lines 1–11 and the two functions at the bottom):

```typescript
// src/lib/auth-utils.ts — replace the import block at the top:

import { headers } from 'next/headers';
import { getServerAuthProvider } from '@/lib/auth/provider';
import type { UserRole } from '@/lib/types';

// Re-export SessionClaims under the existing HarmoniaClaims name for backward compat
export type { SessionClaims as HarmoniaClaims } from '@/lib/auth/provider';
```

Replace the `verifyAuth` function body:
```typescript
export async function verifyAuth(): Promise<HarmoniaClaims> {
  const provider = await getServerAuthProvider();

  // Try provider session cookie verification first
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionCookie) {
      return await provider.verifySessionCookie(sessionCookie);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'UNAUTHENTICATED') throw new Error('UNAUTHENTICATED');
    // Fall through to header/dev fallbacks below
  }

  // Fallback: read from middleware-injected headers (local dev without provider credentials)
  const claims = await getClaimsFromRequest();
  if (claims) return claims;

  // Dev-only bypass
  if (process.env.NODE_ENV !== 'production') {
    console.warn('\n[auth-utils] *** DEV-ONLY FALLBACK ACTIVE ***\n  No auth provider configured.\n');
    return {
      uid: 'dev-user',
      email: 'dev@harmonia.local',
      role: 'site_admin' as UserRole,
      conservatoriumId: 'dev-conservatorium',
      approved: true,
    };
  }

  throw new Error('UNAUTHENTICATED');
}
```

Replace `createSessionCookie`:
```typescript
export async function createSessionCookie(token: string): Promise<string> {
  const provider = await getServerAuthProvider();
  return provider.createSessionCookie(token, SESSION_EXPIRY_MS / 1000);
}
```

Replace `revokeSession`:
```typescript
export async function revokeSession(uid: string): Promise<void> {
  const provider = await getServerAuthProvider();
  await provider.revokeUserSessions(uid);
}
```

**Step 3: Compile check**

```bash
cd C:/personal/studio
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors in auth-utils.ts specifically.

**Step 4: Run existing auth-utils tests if any**

```bash
cd C:/personal/studio
npx vitest run tests/ --reporter=verbose 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add src/lib/auth-utils.ts
git commit -m "refactor(auth): auth-utils uses provider abstraction, removes firebase-admin direct import"
```

---

## Task 9: Refactor proxy.ts to use provider extractClaimsFromCookie

**Files:**
- Modify: `src/proxy.ts`

The proxy runs in Edge runtime (no Node.js APIs). The provider's `extractClaimsFromCookie` must use only web-compatible APIs (atob/Buffer decode). Both providers already do this — the method only does base64 decode + JSON parse.

**Step 1: Remove the inline `verifySessionCookie` function from proxy.ts (lines 122–152) and replace with:**

```typescript
// In proxy.ts, remove the local verifySessionCookie function entirely.
// Replace it with a direct import + call:

import { getServerAuthProvider } from '@/lib/auth/provider';
```

Then in the `proxy` function where `verifySessionCookie(sessionCookie)` is called, change to:

```typescript
const provider = await getServerAuthProvider();
claims = await provider.extractClaimsFromCookie(sessionCookie);
```

Also update the dev bypass check to not reference `FIREBASE_SERVICE_ACCOUNT_KEY` specifically — it should check for the presence of ANY auth provider credentials:

```typescript
// Replace:
const isDevBypass = process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// With:
const isDevBypass =
  process.env.NODE_ENV !== 'production' &&
  !process.env.FIREBASE_SERVICE_ACCOUNT_KEY &&
  !process.env.SUPABASE_SERVICE_KEY;
```

**Step 2: Compile check**

```bash
cd C:/personal/studio
npx tsc --noEmit 2>&1 | head -30
```

**Step 3: Commit**

```bash
git add src/proxy.ts
git commit -m "refactor(auth): proxy uses provider.extractClaimsFromCookie instead of inline Firebase JWT decode"
```

---

## Task 10: Refactor login-form.tsx to use client provider

**Files:**
- Modify: `src/components/auth/login-form.tsx`

**Step 1: Locate the Firebase-specific lines in login-form.tsx**

Current Firebase lines (lines 15–17):
```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase-client';
import { createSessionAction } from '@/app/actions/auth';
```

And in `handleEmailLogin` (around line 100–120), it calls:
```typescript
const auth = getClientAuth();
const credential = await signInWithEmailAndPassword(auth, email, password);
const idToken = await credential.user.getIdToken();
await createSessionAction(idToken);
```

**Step 2: Replace with provider call**

Remove the Firebase-specific imports. Add:
```typescript
import { getClientAuthProvider } from '@/lib/auth/provider';
import { createSessionAction } from '@/app/actions/auth';
```

Replace the email sign-in block:
```typescript
const authProvider = await getClientAuthProvider();
const token = await authProvider.signInWithEmailPassword(email, password);
await createSessionAction(token);
```

**Step 3: Replace the OAuth calls**

The existing `handleOAuthSignIn` calls `signInWithGoogle` / `signInWithMicrosoft` from `@/lib/auth/oauth`. Replace with:
```typescript
const authProvider = await getClientAuthProvider();
const result = await authProvider.signInWithOAuth(provider, email || undefined);
```

**Step 4: Compile check**

```bash
cd C:/personal/studio
npx tsc --noEmit 2>&1 | head -30
```

**Step 5: Commit**

```bash
git add src/components/auth/login-form.tsx
git commit -m "refactor(auth): login-form uses client auth provider, removes direct firebase/auth import"
```

---

## Task 11: Refactor auth-domain.tsx logout to use client provider

**Files:**
- Modify: `src/hooks/domains/auth-domain.tsx`

**Step 1: Find the logout function (lines 70–94)**

Current:
```typescript
const { getClientAuth } = await import('@/lib/firebase-client');
const auth = getClientAuth();
if (auth) {
  const { signOut } = await import('firebase/auth');
  await signOut(auth);
}
```

**Step 2: Replace with:**

```typescript
try {
  const { getClientAuthProvider } = await import('@/lib/auth/provider');
  const authProvider = await getClientAuthProvider();
  await authProvider.signOut();
} catch {
  // Provider may not be configured — continue with cleanup
}
```

**Step 3: Compile check**

```bash
cd C:/personal/studio
npx tsc --noEmit 2>&1 | head -30
```

**Step 4: Commit**

```bash
git add src/hooks/domains/auth-domain.tsx
git commit -m "refactor(auth): auth-domain logout uses client auth provider"
```

---

## Task 12: Refactor logout API route

**Files:**
- Modify: `src/app/api/auth/logout/route.ts`

**Step 1: Replace firebase-admin import with provider**

```typescript
// src/app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerAuthProvider } from '@/lib/auth/provider';

const SESSION_COOKIE_NAME = '__session';

export async function POST() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionCookie) {
    try {
      const provider = await getServerAuthProvider();
      const claims = await provider.extractClaimsFromCookie(sessionCookie);
      if (claims?.uid) {
        await provider.revokeUserSessions(claims.uid);
      }
    } catch {
      // Session may already be expired — proceed with cleanup
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete('harmonia-user');
  return response;
}
```

**Step 2: Compile check + commit**

```bash
cd C:/personal/studio
npx tsc --noEmit 2>&1 | head -20
git add src/app/api/auth/logout/route.ts
git commit -m "refactor(auth): logout route uses auth provider"
```

---

## Task 13: Add Supabase OAuth callback route

**Files:**
- Create: `src/app/api/auth/callback/route.ts`

This route is needed for Supabase OAuth redirect flow. For Firebase (popup flow) it is unused but harmless.

**Step 1: Create the file**

```typescript
// src/app/api/auth/callback/route.ts

/**
 * @fileoverview OAuth callback handler.
 *
 * For Supabase Auth: handles the OAuth redirect after Google/Microsoft login.
 * Exchanges the auth code for a session, sets the __session cookie,
 * and redirects to the dashboard.
 *
 * For Firebase Auth: this route is never called (Firebase uses popup flow).
 */

import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = '__session';
const SESSION_MAX_AGE = 14 * 24 * 60 * 60; // 14 days

export async function GET(request: NextRequest) {
  const authProvider = (process.env.AUTH_PROVIDER || 'firebase').trim().toLowerCase();

  if (authProvider !== 'supabase') {
    // Firebase uses popup — this route shouldn't be hit
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.session) {
      console.error('[auth/callback] Code exchange failed:', error);
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return NextResponse.redirect(new URL(next, request.url));
  } catch (err) {
    console.error('[auth/callback] Unexpected error:', err);
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/auth/callback/route.ts
git commit -m "feat(auth): Supabase OAuth callback route"
```

---

## Task 14: Refactor storage.ts to be provider-agnostic

**Files:**
- Modify: `src/app/actions/storage.ts`

Currently uses `getAdminFirestore` to verify parent-child links and `getAdminStorage` for signed URLs. These are Firebase-specific.

**Strategy:** Guard both operations — if `AUTH_PROVIDER=supabase`, use Supabase Storage instead. If `AUTH_PROVIDER=firebase`, use Firebase Storage (existing behaviour unchanged).

**Step 1: Wrap the Firebase Storage calls in a provider check**

At the top of `storage.ts`, replace:
```typescript
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase-admin';
```

With:
```typescript
import { requireRole, verifyAuth } from '@/lib/auth-utils';
import type { UserRole } from '@/lib/types';

const AUTH_PROVIDER = (process.env.AUTH_PROVIDER || 'firebase').toLowerCase();
```

**Step 2: Replace `verifyParentChildLink`**

```typescript
async function verifyParentChildLink(parentId: string, studentId: string): Promise<void> {
  if (AUTH_PROVIDER === 'supabase') {
    // Supabase: query parent_of table via service role client
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data, error } = await sb
      .from('parent_of')
      .select('id')
      .eq('parent_id', parentId)
      .eq('student_id', studentId)
      .maybeSingle();
    if (error || !data) throw new Error('FORBIDDEN');
    return;
  }

  // Firebase path (existing)
  const { getAdminFirestore } = await import('@/lib/firebase-admin');
  const db = getAdminFirestore();
  if (!db) throw new Error('Firestore not configured');
  const linkDoc = await db.doc(`parentOf/${parentId}_${studentId}`).get();
  if (!linkDoc.exists) throw new Error('FORBIDDEN');
}
```

**Step 3: Wrap signed URL generation**

For the signed URL generation functions, add a guard at the top of each function:
```typescript
if (AUTH_PROVIDER === 'supabase') {
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { data } = sb.storage.from('harmonia-private').createSignedUrl(storagePath, 15 * 60);
  if (!data?.signedUrl) throw new Error('Failed to generate signed URL');
  return data.signedUrl;
}
// existing Firebase code below...
```

**Step 4: Compile check + commit**

```bash
cd C:/personal/studio
npx tsc --noEmit 2>&1 | head -30
git add src/app/actions/storage.ts
git commit -m "refactor(auth): storage actions support both Firebase and Supabase backends"
```

---

## Task 15: Add environment variable documentation

**Files:**
- Modify: `.env.local` (create if absent — never committed, just for docs)
- Create: `docs/AUTH_PROVIDERS.md`

**Step 1: Create the docs file**

```markdown
# Auth Provider Configuration

Switch the auth provider via the `AUTH_PROVIDER` environment variable.

## Firebase (default)

```env
AUTH_PROVIDER=firebase

# Firebase Admin (server-side)
FIREBASE_SERVICE_ACCOUNT_KEY=<base64-encoded service account JSON>

# Firebase Client (browser)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## Supabase

```env
AUTH_PROVIDER=supabase

# Supabase Admin (server-side)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=<service_role key>

# Supabase Browser (client-side)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

## Local dev (no auth)

Leave all auth env vars unset. The app will use the dev bypass (site_admin role injected automatically).

## Custom Claims (Supabase)

For Supabase, user roles are stored in `app_metadata`:
```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "teacher", "conservatoriumId": "cons-1", "approved": true}'::jsonb
WHERE id = '<user-uuid>';
```

Or via the Cloud Function equivalent — a Supabase Edge Function triggered by `auth.users` changes.
```

**Step 2: Commit**

```bash
git add docs/AUTH_PROVIDERS.md
git commit -m "docs(auth): document auth provider configuration and switching"
```

---

## Task 16: Full compile + test suite validation

**Step 1: Run full TypeScript check**

```bash
cd C:/personal/studio
npx tsc --noEmit
```

Expected: 0 errors.

**Step 2: Run full Vitest suite**

```bash
cd C:/personal/studio
npx vitest run --reporter=verbose
```

Expected: all existing tests pass + new auth tests pass.

**Step 3: Verify dev server starts cleanly with AUTH_PROVIDER=firebase (default)**

```bash
cd C:/personal/studio
AUTH_PROVIDER=firebase npm run dev &
sleep 5
curl -s http://localhost:9002/api/bootstrap | head -c 100
kill %1
```

Expected: JSON response from bootstrap (mock data). No "firebase not configured" errors in stdout.

**Step 4: Final commit if any fixes needed**

```bash
git add -p  # review any fixes
git commit -m "fix(auth): post-integration compile fixes"
```

---

## Security Checklist (QA)

Before marking done, verify:

- [ ] `AUTH_PROVIDER=firebase` — all existing dev flows work (dashboard loads, login works with dev bypass)
- [ ] `AUTH_PROVIDER=supabase` — when `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set, login + dashboard work
- [ ] `AUTH_PROVIDER=firebase` with `FIREBASE_SERVICE_ACCOUNT_KEY` set — real Firebase session cookies verified correctly
- [ ] No Firebase-specific imports remain in `auth-utils.ts`, `proxy.ts`, `login-form.tsx`, `auth-domain.tsx`, `logout/route.ts`
- [ ] `firebase-admin.ts` and `firebase-client.ts` are unchanged (they are now private implementation details)
- [ ] Dev bypass still works when no auth provider is configured (local dev)
- [ ] All 4 `extractClaimsFromCookie` unit tests pass for both providers
- [ ] No `FIREBASE_SERVICE_ACCOUNT_KEY` reference leaks into the Supabase code path
- [ ] `__session` cookie name is the same for both providers (proxy reads it generically)
- [ ] Rate limiting on `/api/auth/login` still active regardless of provider

---

## Files NOT changed

These files are intentionally left as-is:

| File | Why |
|---|---|
| `src/lib/firebase-admin.ts` | Pure Firebase Admin SDK init — wrapped by `FirebaseServerAuthProvider`, not consumed directly |
| `src/lib/firebase-client.ts` | Pure Firebase client init — wrapped by `FirebaseClientAuthProvider` |
| `src/lib/auth/oauth.ts` | Delegated to by `FirebaseClientAuthProvider.signInWithOAuth` — Firebase-only, works as-is |
| `src/lib/db/` (all adapters) | DB layer is already provider-agnostic — no changes needed |
| `functions/` | Cloud Functions are Firebase-specific infrastructure — orthogonal to this change |
