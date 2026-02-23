import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: routing.localePrefix,
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    '/',
    '/(he|en|ar|ru)/:path*',
    // This regex is to avoid the middleware running on static files, etc.
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
