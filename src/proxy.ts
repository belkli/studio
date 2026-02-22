import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['he', 'en', 'ar', 'ru'],
  defaultLocale: 'he',
  localePrefix: 'as-needed'
});

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(he|en|ar|ru)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
