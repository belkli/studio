/**
 * @fileoverview API route for signing out and destroying the session.
 *
 * POST /api/auth/logout
 *
 * Revokes user sessions via the configured auth provider and deletes the session cookie.
 */
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
