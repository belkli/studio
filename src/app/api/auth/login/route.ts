/**
 * @fileoverview API route for creating Firebase session cookies.
 *
 * POST /api/auth/login
 * Body: { idToken: string }
 *
 * Exchanges a Firebase ID token for a server-side session cookie.
 * Called by the login form after successful client-side authentication.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/auth-utils';
import { createRateLimiter } from '@/lib/rate-limit';
import { BRAND_COOKIE_NAME } from '@/lib/brand';

const SESSION_COOKIE_NAME = '__session';
const SESSION_MAX_AGE = 14 * 24 * 60 * 60; // 14 days in seconds

// 10 login attempts per 15 minutes per IP
const loginLimiter = createRateLimiter({ limit: 10, windowMs: 15 * 60_000 });

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateCheck = loginLimiter.check(ip);

  if (!rateCheck.ok) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

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

    const response = NextResponse.json({ ok: true }, {
      headers: { 'Cache-Control': 'no-store' },
    });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    // Clear legacy mock cookie
    response.cookies.delete(BRAND_COOKIE_NAME);

    return response;
  } catch (error) {
    console.error('[/api/auth/login] Failed to create session cookie:', error);
    return NextResponse.json(
      { error: 'Invalid token or session creation failed' },
      { status: 401 }
    );
  }
}
