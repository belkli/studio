import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlProxy = createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: routing.localePrefix,
});

const PROTECTED_PATHS = ['/dashboard'];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);
  const localeFromPath = segments[0];
  const hasLocalePrefix = routing.locales.includes(localeFromPath as any);
  const activeLocale = hasLocalePrefix ? localeFromPath : routing.defaultLocale;
  const pathWithoutLocale = `/${(hasLocalePrefix ? segments.slice(1) : segments).join('/')}`;
  const isProtected = PROTECTED_PATHS.some(
    p => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`)
  );

  if (isProtected) {
    // Client auth is stored in localStorage; this cookie is a lightweight
    // marker so proxy can avoid redirect loops on protected routes.
    const userCookie = request.cookies.get('harmonia-user');
    if (!userCookie) {
      const url = request.nextUrl.clone();
      const loginPath =
        activeLocale === routing.defaultLocale && routing.localePrefix === 'as-needed'
          ? '/login'
          : `/${activeLocale}/login`;
      url.pathname = loginPath;
      return NextResponse.redirect(url);
    }
  }

  return intlProxy(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    '/',
    '/(he|en|ar|ru)/:path*',
    // Avoid running on static files and API paths
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
