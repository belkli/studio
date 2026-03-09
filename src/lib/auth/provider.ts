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
