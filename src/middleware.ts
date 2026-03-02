import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: routing.localePrefix,
});

const PROTECTED_PATHS = ['/dashboard'];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some(p => pathname.includes(p));

  if (isProtected) {
    // In a real app, you would verify a token from cookies.
    // For this mock setup, we can't do true server-side auth,
    // but we can at least redirect if the cookie isn't present.
    const userCookie = request.cookies.get('harmonia-user');
    if (!userCookie) {
      const url = request.nextUrl.clone();
      const locale = url.pathname.split('/')[1] || routing.defaultLocale;
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    '/',
    '/(he|en|ar|ru)/:path*',
    // This regex is to avoid the middleware running on static files, etc.
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
