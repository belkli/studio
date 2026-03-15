/**
 * @fileoverview Next.js Edge Proxy for Lyriosa (Next.js 16 — replaces middleware.ts).
 *
 * Responsibilities:
 * 1. Validate session cookies on protected routes (/dashboard/*)
 * 2. Inject user claims (role, conservatoriumId, userId) as request headers
 *    for Server Components and Server Actions
 * 3. Chain with next-intl middleware for locale routing
 * 4. Allow public routes without authentication
 * 5. Validate HMAC on Cardcom webhook requests
 *
 * Session cookie name: __session
 *
 * NOTE: Edge Proxy cannot use firebase-admin (Node.js-only).
 * We verify the session cookie by decoding the JWT payload via the provider's
 * extractClaimsFromCookie method (lightweight, no crypto verification).
 * Full cryptographic verification happens server-side in auth-utils.ts.
 */
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { getServerAuthProvider } from '@/lib/auth/server-provider';

// ── Route classification ──────────────────────────────────────

const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/register',
  '/complete-registration',
  '/accessibility',
  '/api/cardcom-webhook',
  '/api/auth',
  '/api/',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
];

/** Static file extensions that should bypass proxy entirely */
const STATIC_EXTENSIONS = /\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|css|js|map)$/;

function isPublicPath(pathname: string): boolean {
  // Strip locale prefix for matching
  const locales = routing.locales as readonly string[];
  let normalized = pathname;
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      normalized = pathname.slice(`/${locale}`.length) || '/';
      break;
    }
  }

  // Root path is public
  if (normalized === '/') return true;

  // Check against public prefixes
  return PUBLIC_PATH_PREFIXES.some((prefix) => {
    if (prefix.endsWith('/')) {
      // Prefix ends with slash — match any path that starts with it
      return normalized.startsWith(prefix);
    }
    return normalized === prefix || normalized.startsWith(prefix + '/');
  });
}

function isDashboardPath(pathname: string): boolean {
  const locales = routing.locales as readonly string[];
  let normalized = pathname;
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      normalized = pathname.slice(`/${locale}`.length) || '/';
      break;
    }
  }
  return normalized.startsWith('/dashboard');
}

// ── HMAC verification for Cardcom webhook ─────────────────────

function isValidCardcomHmac(request: NextRequest): boolean {
  const hmacHeader = request.headers.get('x-cardcom-hmac-sha256');
  const secret = process.env.CARDCOM_WEBHOOK_SECRET;

  if (!secret) {
    // In development without secret configured, log warning and allow
    console.warn('[proxy] CARDCOM_WEBHOOK_SECRET not set — webhook HMAC validation skipped');
    return true;
  }

  if (!hmacHeader) {
    return false;
  }

  // HMAC verification must happen in the API route handler where we
  // have access to the request body. The proxy only checks that
  // the header is present when the secret is configured.
  return true;
}

// ── Session claims type (re-used from provider) ───────────────

// ── next-intl middleware ───────────────────────────────────────

const intlMiddleware = createMiddleware(routing);

// ── Main proxy ───────────────────────────────────────────────

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files
  if (STATIC_EXTENSIONS.test(pathname)) {
    return NextResponse.next();
  }

  // Cardcom webhook — verify HMAC header presence
  if (pathname === '/api/cardcom-webhook' || pathname.endsWith('/api/cardcom-webhook')) {
    if (!isValidCardcomHmac(request)) {
      return new NextResponse('Unauthorized — missing HMAC signature', { status: 401 });
    }
    return NextResponse.next();
  }

  // API routes — pass through directly without intl
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Public routes — apply intl middleware only
  if (isPublicPath(pathname)) {
    return intlMiddleware(request);
  }

  // Protected routes (dashboard and API routes that need auth)
  if (isDashboardPath(pathname)) {
    const sessionCookie = request.cookies.get('__session')?.value;

    // In development without auth provider credentials, bypass auth entirely
    const isDevBypass =
      process.env.NODE_ENV !== 'production' &&
      !process.env.FIREBASE_SERVICE_ACCOUNT_KEY &&
      !process.env.SUPABASE_SERVICE_KEY;

    let claims: { uid: string; role: string; conservatoriumId: string; approved: boolean; email: string } | null = null;

    if (!isDevBypass) {
      if (!sessionCookie) {
        // No session cookie — redirect to login
        const locale = request.cookies.get('NEXT_LOCALE')?.value || routing.defaultLocale;
        const loginUrl = new URL(`/${locale === routing.defaultLocale ? '' : locale + '/'}login`, request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      const provider = await getServerAuthProvider();
      claims = await provider.extractClaimsFromCookie(sessionCookie);

      if (!claims) {
        // Invalid or expired session — clear cookie and redirect
        const locale = request.cookies.get('NEXT_LOCALE')?.value || routing.defaultLocale;
        const loginUrl = new URL(`/${locale === routing.defaultLocale ? '' : locale + '/'}login`, request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('__session');
        return response;
      }
    }

    // Check approval status
    if (!isDevBypass && claims && !claims.approved && !pathname.includes('/pending-approval')) {
      const locale = request.cookies.get('NEXT_LOCALE')?.value || routing.defaultLocale;
      const pendingUrl = new URL(
        `/${locale === routing.defaultLocale ? '' : locale + '/'}dashboard/pending-approval`,
        request.url
      );
      return NextResponse.redirect(pendingUrl);
    }

    // Inject claims as request headers for Server Components
    const activeClaims = isDevBypass
      ? { uid: 'dev-user', role: 'site_admin', conservatoriumId: 'dev-conservatorium', approved: true, email: 'dev@lyriosa.local' }
      : claims!;

    const response = intlMiddleware(request);
    const headers = new Headers(response.headers);
    headers.set('x-user-id', activeClaims.uid);
    headers.set('x-user-role', activeClaims.role);
    headers.set('x-user-conservatorium-id', activeClaims.conservatoriumId);
    headers.set('x-user-approved', String(activeClaims.approved));
    headers.set('x-user-email', activeClaims.email);

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  // All other routes — apply intl middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|css|js|map)$).*)',
  ],
};
