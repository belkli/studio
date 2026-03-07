
import { TrialBookingWidget } from '@/components/harmonia/trial-booking-widget';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';
import { RegistrationSessionGuard } from '@/components/registration/session-guard';
import { PublicFooter } from '@/components/layout/public-footer';

export default function TryPage() {
    const tNav = useTranslations('Navigation');
    const tHome = useTranslations('HomePage');
    const tAccessibility = useTranslations('AccessibilityPage');

    return (
        <div className="flex flex-col min-h-dvh bg-gradient-to-br from-indigo-50/50 via-background to-background">
             <header className="px-4 lg:px-6 h-14 flex items-center bg-transparent fixed top-0 w-full z-50">
                <Link href="/" className="flex items-center justify-center" prefetch={false}>
                    <Icons.logo className="h-6 w-6 text-primary" />
                    <span className="ms-2 text-xl font-bold">{tHome('title')}</span>
                </Link>
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
            <main className="flex-1 flex items-center justify-center py-20">
                <RegistrationSessionGuard storageKey="register-session:trial">
                    <TrialBookingWidget />
                </RegistrationSessionGuard>
            </main>
            <div className="text-center text-xs text-muted-foreground pb-3">
                <Link href="/accessibility" className="underline underline-offset-4">
                    {tAccessibility('footerLink')}
                </Link>
            </div>
            <PublicFooter />
        </div>
    );
}
