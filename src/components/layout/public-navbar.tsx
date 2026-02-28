'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { cn } from '@/lib/utils';

export function PublicNavbar() {
    const tNav = useTranslations('Navigation');
    const tHome = useTranslations('HomePage');
    const pathname = usePathname();

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
            <Link href="/" className="flex items-center justify-center">
                <Icons.logo className="h-6 w-6 text-primary" />
                <span className="ms-2 text-xl font-bold">{tHome('title')}</span>
            </Link>
            <nav className="hidden md:flex gap-4 sm:gap-6 mx-6">
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
    );
}
