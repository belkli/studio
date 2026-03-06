import { getTranslations, getLocale } from 'next-intl/server';
import type { useTranslations } from 'next-intl';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';
import { getConservatoriumStatementContacts, type StatementContactSource } from '@/lib/legal-contacts';
import { getLocalizedConservatorium } from '@/lib/utils/localized-content';

function getSourceLabel(
  t: ReturnType<typeof useTranslations>,
  source: StatementContactSource
) {
  if (source === 'configured') return t('sources.configured');
  if (source === 'primary_admin') return t('sources.primaryAdmin');
  return t('sources.defaults');
}

export default async function AccessibilityPage() {
  const t = await getTranslations('AccessibilityPage');
  const locale = await getLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const rows = (await getConservatoriumStatementContacts('accessibility')).map((row) => {
    const localized = getLocalizedConservatorium(row.conservatorium, locale);
    const conservatoriumName =
      locale === 'en' && row.conservatorium.nameEn
        ? row.conservatorium.nameEn
        : localized.name;

    return {
      ...row,
      conservatoriumName,
    };
  });

  return (
    <div className="flex flex-col min-h-dvh bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
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
              {t('contactResponseLabel')}: {t('contactResponseValue')}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{t('contactDirectoryTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('contactDirectoryDescription')}</p>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('contactDirectoryEmpty')}</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-start px-3 py-2 font-medium">{t('directoryHeaders.conservatorium')}</th>
                      <th className="text-start px-3 py-2 font-medium">{t('directoryHeaders.contact')}</th>
                      <th className="text-start px-3 py-2 font-medium">{t('directoryHeaders.role')}</th>
                      <th className="text-start px-3 py-2 font-medium">{t('directoryHeaders.email')}</th>
                      <th className="text-start px-3 py-2 font-medium">{t('directoryHeaders.phone')}</th>
                      <th className="text-start px-3 py-2 font-medium">{t('directoryHeaders.source')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.conservatorium.id} className="border-t">
                        <td className="px-3 py-2">{row.conservatoriumName}</td>
                        <td className="px-3 py-2">{row.contact.name || '-'}</td>
                        <td className="px-3 py-2">{row.contact.role || '-'}</td>
                        <td className="px-3 py-2">
                          {row.contact.email ? (
                            <a className="underline" href={`mailto:${row.contact.email}`}>
                              {row.contact.email}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {row.contact.phone ? (
                            <a className="underline" href={`tel:${row.contact.phone}`}>
                              {row.contact.phone}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-3 py-2">{getSourceLabel(t, row.source)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
