/**
 * @fileoverview API route for signing out and destroying the session.
 *
 * POST /api/auth/logout
 *
 * Revokes Firebase refresh tokens and deletes the session cookie.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase-admin';

const SESSION_COOKIE_NAME = '__session';

export async function POST() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // Attempt to revoke the user's refresh tokens
  if (sessionCookie) {
    const adminAuth = getAdminAuth();
    if (adminAuth) {
      try {
        const decoded = await adminAuth.verifySessionCookie(sessionCookie);
        await adminAuth.revokeRefreshTokens(decoded.uid);
      } catch {
        // Session may already be expired or invalid — proceed with cleanup
      }
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete('harmonia-user');
  return response;
}
