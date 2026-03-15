'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ColorModeToggle } from '@/components/color-mode-toggle';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useBrandTheme } from '@/components/brand-theme-provider';

const NAVBAR_STYLES = {
    indigo: {
        header: 'bg-background/80 backdrop-blur-sm border-b',
        link: 'text-foreground/80 hover:text-primary hover:underline',
        activeLink: 'text-primary',
        cta: 'bg-primary text-primary-foreground hover:bg-primary/90',
        login: 'text-primary font-semibold',
    },
    gold: {
        header: 'bg-[rgba(13,27,42,0.92)] backdrop-blur-[14px] border-b border-brand-gold/15',
        link: 'text-foreground/80 hover:text-foreground hover:bg-white/[0.07] rounded-md',
        activeLink: 'text-foreground',
        cta: 'bg-gradient-to-br from-brand-indigo-cta to-[hsl(229,52%,47%)] text-white shadow-[0_2px_12px_rgba(45,63,143,0.4)]',
        login: 'text-foreground/80',
    },
} as const;

export function PublicNavbar() {
    const tNav = useTranslations('Navigation');
    const tCommon = useTranslations('Common.shared');
    const pathname = usePathname();
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { brand } = useBrandTheme();
    const s = NAVBAR_STYLES[brand];

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <header className={cn('fixed top-0 z-50 flex h-14 w-full items-center px-4 lg:px-6', s.header)}>
            <Link href="/" className="flex shrink-0 items-center justify-center" onClick={() => setMobileOpen(false)}>
                <Icons.logoContainer theme={brand} />
            </Link>

            <nav className="hidden flex-1 items-center gap-4 ps-8 sm:gap-6 md:flex">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'text-sm font-medium underline-offset-4 transition-colors',
                            s.link,
                            isActive(item.href) && s.activeLink
                        )}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="hidden shrink-0 items-center gap-2 md:flex">
                <LanguageSwitcher />
                <ColorModeToggle />
                <Button asChild variant="ghost" className={s.login}>
                    <Link href="/login">{tNav('login')}</Link>
                </Button>
                <Button asChild className={s.cta}>
                    <Link href="/register">{tNav('register')}</Link>
                </Button>
            </div>

            <div className="ms-auto flex items-center md:hidden">
                <LanguageSwitcher />
                <ColorModeToggle />
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
                                    <Icons.logoContainer theme={brand} />
                                </Link>
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn('text-lg font-medium', isActive(item.href) ? s.activeLink : s.link)}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                                <hr className="my-4" />
                                <Button asChild variant="outline" className={s.login}>
                                    <Link href="/login" onClick={() => setMobileOpen(false)}>{tNav('login')}</Link>
                                </Button>
                                <Button asChild className={s.cta}>
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
