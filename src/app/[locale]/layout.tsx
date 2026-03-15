
import type { Metadata } from 'next';
import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { QueryProvider } from '@/providers/query-provider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { AiHelpAssistant } from '@/components/harmonia/ai-help-assistant';
import { AccessibilityPanel } from '@/components/a11y/accessibility-panel';
import { CookieBanner } from '@/components/consent/cookie-banner';
import { Playfair_Display, Plus_Jakarta_Sans, Heebo, Frank_Ruhl_Libre } from 'next/font/google';
import { getActiveTheme } from '@/lib/themes/active-theme';
import { BRAND_NAME } from '@/lib/brand';
import { BrandThemeProvider } from '@/components/brand-theme-provider';

const playfairDisplay = Playfair_Display({
    subsets: ['latin', 'latin-ext'],
    weight: ['400', '700', '900'],
    style: ['normal', 'italic'],
    variable: '--font-playfair',
    display: 'swap',
});
const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ['latin', 'latin-ext'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-plus-jakarta',
    display: 'swap',
});
const heebo = Heebo({
    subsets: ['hebrew', 'latin'],
    weight: ['400', '500', '700'],
    variable: '--font-heebo',
    display: 'swap',
});
const frankRuhlLibre = Frank_Ruhl_Libre({
    subsets: ['hebrew', 'latin'],
    weight: ['400', '700'],
    variable: '--font-frank-ruhl',
    display: 'swap',
});

export async function generateMetadata({ params }: { params: Promise<{locale: string}> }): Promise<Metadata> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';
    const { locale } = await params;
    let t: ((key: 'siteName' | 'siteDescription') => string);
    try {
        const translations = await getTranslations({ locale, namespace: 'Metadata' });
        t = (key) => translations(key);
    } catch {
        t = (key) => key === 'siteDescription'
            ? 'Advanced management platform for modern music schools and conservatories.'
            : BRAND_NAME;
    }
    
    return {
        metadataBase: new URL(siteUrl),
        title: {
            template: `%s | ${t('siteName')}`,
            default: t('siteName'),
        },
        description: t('siteDescription'),
        openGraph: {
            siteName: t('siteName'),
            locale: locale,
            type: 'website',
        },
        alternates: {
            languages: {
                'he': '/he',
                'en': '/en',
                'ar': '/ar',
                'ru': '/ru',
            },
        },
    };
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr';
  const activeTheme = getActiveTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skipToMainLabel = (messages as any)?.Common?.shared?.skipToMain || 'Skip to main content';

  return (
    <html lang={locale} dir={dir} data-theme={activeTheme}>
      <body className={`${playfairDisplay.variable} ${plusJakartaSans.variable} ${heebo.variable} ${frankRuhlLibre.variable} font-body antialiased`}>
        <a href="#main-content" className="skip-link">{skipToMainLabel}</a>
        <NextIntlClientProvider messages={messages}>
          <BrandThemeProvider>
          <AuthProvider>
            <QueryProvider>
              <div id="main-content" tabIndex={-1}>
                {children}
              </div>
              <AccessibilityPanel />
              <Toaster />
              <AiHelpAssistant />
              <CookieBanner />
            </QueryProvider>
          </AuthProvider>
          </BrandThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
