import { OpenDayLandingPage } from '@/components/harmonia/open-day-landing';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslations } from 'next-intl';

export default function OpenDayPage() {
    const tNav = useTranslations('Navigation');
    const tHome = useTranslations('HomePage');

    return (
        <div className="flex flex-col min-h-dvh bg-background">
            <header className="px-4 lg:px-6 h-14 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 w-full z-50 border-b">
                <Link href="/" className="flex items-center justify-center" prefetch={false}>
                    <Icons.logo className="h-6 w-6 text-primary" />
                    <span className="ms-2 text-xl font-bold">{tHome('title')}</span>
                </Link>
                <nav className="hidden md:flex gap-4 sm:gap-6 mx-6">
                    <Link href="/available-now" className="text-sm font-medium hover:underline underline-offset-4">{tNav('lessons')}</Link>
                    <Link href="/musicians" className="text-sm font-medium hover:underline underline-offset-4">{tNav('musicians')}</Link>
                    <Link href="/donate" className="text-sm font-medium hover:underline underline-offset-4">{tNav('donate')}</Link>
                    <Link href="/open-day" className="text-sm font-medium hover:underline underline-offset-4 text-primary">{tNav('openDay') || 'יום פתוח'}</Link>
                    <Link href="#" className="text-sm font-medium hover:underline underline-offset-4 text-muted-foreground">{tNav('about')}</Link>
                    <Link href="#" className="text-sm font-medium hover:underline underline-offset-4 text-muted-foreground">{tNav('contact')}</Link>
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
            <main className="flex-1 pt-14">
                <OpenDayLandingPage />
            </main>
            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                <p className="text-xs text-muted-foreground">&copy; 2024 {tHome('title')}. {tHome('copyright')}</p>
                <nav className="sm:ms-auto flex gap-4 sm:gap-6">
                    <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                        {tHome('privacyPolicy')}
                    </Link>
                    <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                        {tNav('contact')}
                    </Link>
                </nav>
            </footer>
        </div>
    );
}