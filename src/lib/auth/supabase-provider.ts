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
