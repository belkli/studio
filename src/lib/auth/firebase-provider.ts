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
