import { useLocale } from 'next-intl';

import { OpenDayLandingPage } from '@/components/harmonia/open-day-landing';
import { PublicFooter } from '@/components/layout/public-footer';
import { PublicNavbar } from '@/components/layout/public-navbar';

export default function OpenDayPage() {
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  return (
    <div className="flex min-h-dvh flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      <PublicNavbar />
      <main className="flex-1 pt-14">
        <OpenDayLandingPage />
      </main>
      <PublicFooter />
    </div>
  );
}
