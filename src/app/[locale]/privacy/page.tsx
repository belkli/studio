import { getLocale, getTranslations } from 'next-intl/server';
import type { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
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

export default async function PrivacyPage() {
  const t = await getTranslations('PrivacyPage');
  const locale = await getLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  const privacyRows = (await getConservatoriumStatementContacts('privacy')).map((row) => {
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

  const dataItems = [
    t('dataItems.item1'),
    t('dataItems.item2'),
    t('dataItems.item3'),
    t('dataItems.item4'),
  ];

  const useItems = [
    t('useItems.item1'),
    t('useItems.item2'),
    t('useItems.item3'),
    t('useItems.item4'),
  ];

  const rightsItems = [
    t('rightsItems.item1'),
    t('rightsItems.item2'),
    t('rightsItems.item3'),
    t('rightsItems.item4'),
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      <PublicNavbar />
      <main className="flex-1 pt-20 pb-10">
        <section className="container mx-auto max-w-5xl space-y-8 px-4 md:px-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('intro')}</p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('generalTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('generalBody')}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('lawfulBasisTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('lawfulBasisBody')}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{t('dataTitle')}</h2>
            <ul className="list-disc space-y-1 ps-6 text-sm text-muted-foreground">
              {dataItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{t('useTitle')}</h2>
            <ul className="list-disc space-y-1 ps-6 text-sm text-muted-foreground">
              {useItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('sharingTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('sharingBody')}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('transfersTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('transfersBody')}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('securityTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('securityBody')}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{t('rightsTitle')}</h2>
            <ul className="list-disc space-y-1 ps-6 text-sm text-muted-foreground">
              {rightsItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('retentionTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('retentionBody')}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{t('retentionScheduleTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('retentionScheduleBody')}</p>
            <ul className="list-disc space-y-1 ps-6 text-sm text-muted-foreground">
              {(t.raw('retentionScheduleItems') as string[]).map((item: string) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{t('subProcessorsTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('subProcessorsBody')}</p>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">{t('subProcessorsTableHeaders.processor')}</th>
                    <th className="px-3 py-2 text-start font-medium">{t('subProcessorsTableHeaders.service')}</th>
                    <th className="px-3 py-2 text-start font-medium">{t('subProcessorsTableHeaders.dataAccessed')}</th>
                    <th className="px-3 py-2 text-start font-medium">{t('subProcessorsTableHeaders.location')}</th>
                    <th className="px-3 py-2 text-start font-medium">{t('subProcessorsTableHeaders.dpaStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(t.raw('subProcessors') as Array<{ processor: string; service: string; dataAccessed: string; location: string; dpaStatus: string }>).map((row) => (
                    <tr key={row.processor} className="border-t">
                      <td className="px-3 py-2 font-medium">{row.processor}</td>
                      <td className="px-3 py-2">{row.service}</td>
                      <td className="px-3 py-2">{row.dataAccessed}</td>
                      <td className="px-3 py-2">{row.location}</td>
                      <td className="px-3 py-2">{row.dpaStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('dsarTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('dsarBody')}</p>
            <ul className="list-disc space-y-1 ps-6 text-sm text-muted-foreground">
              <li>
                {t('dsarSettingsLink')} — <Link href="/dashboard/settings" className="underline text-primary">/dashboard/settings</Link>
              </li>
              <li>
                {t('contactTitle')}: <a href={`mailto:${t('dsarEmail')}`} className="underline text-primary">{t('dsarEmail')}</a>
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('cookiesTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('cookiesBody')}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('minorsTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('minorsBody')}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('updatesTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('updatesBody')}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('termsTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('termsBody')}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">{t('contactTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('contactDescription')}</p>
            <p className="text-sm">
              {t('contactResponseLabel')}: {t('contactResponseValue')}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{t('contactDirectoryTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('contactDirectoryDescription')}</p>
            {privacyRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('contactDirectoryEmpty')}</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">{t('directoryHeaders.conservatorium')}</th>
                      <th className="px-3 py-2 text-start font-medium">{t('directoryHeaders.contact')}</th>
                      <th className="px-3 py-2 text-start font-medium">{t('directoryHeaders.role')}</th>
                      <th className="px-3 py-2 text-start font-medium">{t('directoryHeaders.email')}</th>
                      <th className="px-3 py-2 text-start font-medium">{t('directoryHeaders.phone')}</th>
                      <th className="px-3 py-2 text-start font-medium">{t('directoryHeaders.source')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {privacyRows.map((row) => (
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

          <p className="text-xs text-muted-foreground">{t('legalNote')}</p>
          <p className="text-xs text-muted-foreground">{t('lastUpdated')}</p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
