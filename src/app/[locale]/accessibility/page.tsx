import { useTranslations } from 'next-intl';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';

export default function AccessibilityPage() {
  const t = useTranslations('AccessibilityPage');

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <PublicNavbar />
      <main className="flex-1 pt-20 pb-10">
        <section className="container mx-auto px-4 md:px-6 max-w-4xl space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('intro')}</p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{t('measuresTitle')}</h2>
            <ul className="list-disc ps-6 space-y-1 text-sm">
              <li>{t('measures.keyboard')}</li>
              <li>{t('measures.screenReaders')}</li>
              <li>{t('measures.zoom')}</li>
              <li>{t('measures.contrast')}</li>
              <li>{t('measures.forms')}</li>
              <li>{t('measures.alt')}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{t('knownLimitationsTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('knownLimitations')}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{t('contactTitle')}</h2>
            <p className="text-sm">{t('contactDescription')}</p>
            <p className="text-sm">
              {t('contactEmailLabel')}: <a className="underline" href="mailto:accessibility@harmonia.local">accessibility@harmonia.local</a>
            </p>
            <p className="text-sm">
              {t('contactResponseLabel')}: {t('contactResponseValue')}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{t('alternativeTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('alternativeDescription')}</p>
          </section>

          <p className="text-xs text-muted-foreground">{t('lastUpdated')}</p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
