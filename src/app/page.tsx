import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function Home() {
  const t = useTranslations('HomePage');
  const tNav = useTranslations('Navigation');

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 w-full z-50 border-b">
        <Link href="/" className="flex items-center justify-center">
          <Icons.logo className="h-6 w-6 text-primary" />
          <span className="ms-2 text-xl font-bold">{t('title')}</span>
        </Link>
        <nav className="hidden md:flex gap-4 sm:gap-6 mx-6">
          <Link href="/try" className="text-sm font-medium hover:underline underline-offset-4">{tNav('trialLesson')}</Link>
          <Link href="/available-now" className="text-sm font-medium hover:underline underline-offset-4">{tNav('lessons')}</Link>
          <Link href="/musicians" className="text-sm font-medium hover:underline underline-offset-4">{tNav('musicians')}</Link>
          <Link href="/donate" className="text-sm font-medium hover:underline underline-offset-4">{tNav('donate')}</Link>
          <Link href="/open-day" className="text-sm font-medium hover:underline underline-offset-4">{tNav('openDay')}</Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4 text-muted-foreground">{tNav('about')}</Link>
        </nav>
        <div className="flex-grow" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button asChild variant="ghost">
            <Link href="/login">{tNav('login')}</Link>
          </Button>
          <Button asChild>
            <Link href="/register">{tNav('register')}</Link>
          </Button>
        </div>
      </header>
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
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 {t('title')}. {t('copyright')}</p>
        <nav className="sm:ms-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            {t('privacyPolicy')}
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            {tNav('contact')}
          </Link>
        </nav>
      </footer>
    </div>
  );
}

