'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

export function PublicNavbar() {
    const tNav = useTranslations('Navigation');
    const tHome = useTranslations('HomePage');
    const tCommon = useTranslations('Common.shared');
    const pathname = usePathname();
    const locale = useLocale();
    const dir = (locale === 'he' || locale === 'ar') ? 'rtl' : 'ltr';
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const navItems = [
        { href: '/available-now', label: tNav('lessons') },
        { href: '/musicians', label: tNav('musicians') },
        { href: '/donate', label: tNav('donate') },
        { href: '/open-day', label: tNav('openDay') },
        { href: '/about', label: tNav('about') },
        { href: '/contact', label: tNav('contact') },
    ];

    const isActive = (href: string) => {
        if (href === '/' && pathname === '/') return true;
        if (href !== '/' && pathname.startsWith(href)) return true;
        return false;
    };

    return (
        <header className="px-4 lg:px-6 h-14 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 w-full z-50 border-b">
            <Link href="/" className="flex items-center justify-center shrink-0" onClick={() => setMobileOpen(false)}>
                <Icons.logo className="h-6 w-6 text-primary" />
                <span className="ms-2 text-xl font-bold">{tHome('title')}</span>
            </Link>

            <nav
                className={cn(
                    "hidden md:flex flex-1 gap-4 sm:gap-6",
                    dir === 'rtl' ? "justify-end pe-8" : "justify-start ps-8"
                )}
            >
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "text-sm font-medium transition-colors hover:text-primary underline-offset-4 hover:underline",
                            isActive(item.href) ? "text-primary" : "text-foreground/80"
                        )}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="flex-grow md:hidden" />

            <div className="hidden md:flex items-center gap-2 shrink-0">
                <LanguageSwitcher />
                <Button asChild variant="ghost">
                    <Link href="/login">{tNav('login')}</Link>
                </Button>
                <Button asChild>
                    <Link href="/register">{tNav('register')}</Link>
                </Button>
            </div>

            <div className="md:hidden flex items-center">
                <LanguageSwitcher />
                {!mounted ? (
                    <Button variant="ghost" size="icon" disabled aria-label={tCommon('openMenu')}>
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">{tCommon('openMenu')}</span>
                    </Button>
                ) : (
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">{tCommon('openMenu')}</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="w-3/4">
                            <div className="flex flex-col gap-4 mt-8">
                                <Link href="/" className="flex items-center justify-start mb-4" onClick={() => setMobileOpen(false)}>
                                    <Icons.logo className="h-6 w-6 text-primary" />
                                    <span className="ms-2 text-xl font-bold">{tHome('title')}</span>
                                </Link>
                                {navItems.map(item => (
                                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                                        className={cn("text-lg font-medium", isActive(item.href) ? "text-primary" : "text-foreground/80")}>
                                        {item.label}
                                    </Link>
                                ))}
                                <hr className="my-4" />
                                <Button asChild variant="outline">
                                    <Link href="/login" onClick={() => setMobileOpen(false)}>{tNav('login')}</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/register" onClick={() => setMobileOpen(false)}>{tNav('register')}</Link>
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                )}
            </div>
        </header>
    );
}
