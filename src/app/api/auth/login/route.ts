/**
 * @fileoverview API route for creating Firebase session cookies.
 *
 * POST /api/auth/login
 * Body: { idToken: string }
 *
 * Exchanges a Firebase ID token for a server-side session cookie.
 * Called by the login form after successful client-side authentication.
 */
import { NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/auth-utils';

const SESSION_COOKIE_NAME = '__session';
const SESSION_MAX_AGE = 14 * 24 * 60 * 60; // 14 days in seconds

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { idToken } = body;

  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
  }

  try {
    const sessionCookie = await createSessionCookie(idToken);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    // Clear legacy mock cookie
    response.cookies.delete('harmonia-user');

    return response;
  } catch (error) {
    console.error('[/api/auth/login] Failed to create session cookie:', error);
    return NextResponse.json(
      { error: 'Invalid token or session creation failed' },
      { status: 401 }
    );
  }
}
