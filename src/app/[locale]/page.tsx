import { useTranslations } from 'next-intl';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';

export default function Home() {
  const t = useTranslations('HomePage');
  const tNav = useTranslations('Navigation');

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <PublicNavbar />
      <main className="flex-1">
        <section className="w-full h-dvh flex items-center justify-center bg-gradient-to-br from-indigo-50/50 via-background to-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400 py-2">
                  {t('heroTitle')}
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  {t('heroSubtitle')}
                </p>
              </div>
              <div className="space-x-4 space-x-reverse">
                <Button asChild size="lg">
                  <Link href="/register">{tNav('register')}</Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/available-now">{tNav('lessons')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
