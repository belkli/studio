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
    const isRtl = locale === 'he' || locale === 'ar';
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
        <header className="fixed top-0 z-50 flex h-14 w-full items-center border-b bg-background/80 px-4 backdrop-blur-sm lg:px-6">
            <Link href="/" className="flex shrink-0 items-center justify-center" onClick={() => setMobileOpen(false)}>
                <Icons.logo className="h-6 w-6 text-primary" />
                <span className="ms-2 text-xl font-bold">{tHome('title')}</span>
            </Link>

            <nav className="hidden flex-1 items-center gap-4 ps-8 sm:gap-6 md:flex">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'text-sm font-medium underline-offset-4 transition-colors hover:text-primary hover:underline',
                            isActive(item.href) ? 'text-primary' : 'text-foreground/80'
                        )}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="hidden shrink-0 items-center gap-2 md:flex">
                <LanguageSwitcher />
                <Button asChild variant="ghost">
                    <Link href="/login">{tNav('login')}</Link>
                </Button>
                <Button asChild>
                    <Link href="/register">{tNav('register')}</Link>
                </Button>
            </div>

            <div className="ms-auto flex items-center md:hidden">
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
                        <SheetContent side={isRtl ? 'right' : 'left'} className="w-3/4">
                            <div className="mt-8 flex flex-col gap-4">
                                <Link href="/" className="mb-4 flex items-center justify-start" onClick={() => setMobileOpen(false)}>
                                    <Icons.logo className="h-6 w-6 text-primary" />
                                    <span className="ms-2 text-xl font-bold">{tHome('title')}</span>
                                </Link>
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn('text-lg font-medium', isActive(item.href) ? 'text-primary' : 'text-foreground/80')}
                                    >
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

