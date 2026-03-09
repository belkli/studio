/**
 * @fileoverview Firebase server-side auth provider (Node.js only).
 * NEVER import from browser/client components — uses firebase-admin.
 */
import 'server-only';

import type { IServerAuthProvider, SessionClaims } from './provider';

export class FirebaseServerAuthProvider implements IServerAuthProvider {
  async verifySessionCookie(cookie: string): Promise<SessionClaims> {
    const { getAdminAuth } = await import('@/lib/firebase-admin');
    const adminAuth = getAdminAuth();
    if (!adminAuth) throw new Error('Firebase Admin SDK not configured');

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
    if (!adminAuth) throw new Error('Firebase Admin SDK not configured');
    return adminAuth.createSessionCookie(idToken, { expiresIn: maxAgeSeconds * 1000 });
  }

  async revokeUserSessions(uid: string): Promise<void> {
    const { getAdminAuth } = await import('@/lib/firebase-admin');
    const adminAuth = getAdminAuth();
    if (!adminAuth) throw new Error('Firebase Admin SDK not configured');
    await adminAuth.revokeRefreshTokens(uid);
  }

  async extractClaimsFromCookie(cookie: string): Promise<SessionClaims | null> {
    try {
      const parts = cookie.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
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
