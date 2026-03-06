
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
import { Rubik } from 'next/font/google';

const rubik = Rubik({
    subsets: ['latin', 'hebrew', 'arabic', 'cyrillic'],
    weight: ['400', '700'],
    variable: '--font-rubik',
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
            : 'Harmonia';
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

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr';
  const skipToMainLabel = (messages as any)?.Common?.shared?.skipToMain || 'Skip to main content';

  return (
    <html lang={locale} dir={dir}>
      <body className={`${rubik.variable} font-body antialiased`}>
        <a href="#main-content" className="skip-link">{skipToMainLabel}</a>
        <NextIntlClientProvider messages={messages}>
          <main id="main-content" tabIndex={-1}>
            <AuthProvider>
              <QueryProvider>
                {children}
                <AccessibilityPanel />
                <Toaster />
                <AiHelpAssistant />
              </QueryProvider>
            </AuthProvider>
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
