import { AvailableSlotsMarketplace } from "@/components/harmonia/available-slots-marketplace";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslations } from 'next-intl';

export default function AvailableNowPage() {
    const tNav = useTranslations('Navigation');
    const tHome = useTranslations('HomePage');
    const tAvailable = useTranslations('AvailableNow');

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
                <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-background">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">{tAvailable('title')}</h1>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                {tAvailable('subtitle')}
                            </p>
                        </div>
                    </div>
                </section>
                <section className="w-full py-12">
                    <div className="container px-4 md:px-6">
                        <AvailableSlotsMarketplace />
                    </div>
                </section>
            </main>
        </div>
    );
}
