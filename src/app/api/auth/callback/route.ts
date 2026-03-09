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
