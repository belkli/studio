import { AvailableSlotsMarketplace } from '@/components/harmonia/available-slots-marketplace';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function AvailableNowPage() {
  const tAvailable = useTranslations('AvailableNow');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const heroImage = PlaceHolderImages.find((img) => img.id === 'available-now-hero');

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1 pt-14" dir={isRtl ? 'rtl' : 'ltr'}>
        <section className="relative w-full overflow-hidden bg-slate-900 py-12 text-white md:py-20 lg:py-24">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              style={{ objectFit: 'cover' }}
              className="z-0 opacity-20"
              data-ai-hint={heroImage.imageHint}
            />
          )}
          <div className="relative z-10 mx-auto max-w-5xl px-4 md:px-6">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">{tAvailable('title')}</h1>
              <p className="text-neutral-300 md:text-lg">{tAvailable('subtitle')}</p>
            </div>
          </div>
        </section>

        <section className="w-full py-10 md:py-12">
          <div className="mx-auto max-w-6xl px-4">
            <AvailableSlotsMarketplace />
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
