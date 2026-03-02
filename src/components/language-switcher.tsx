'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { routing } from '@/i18n/routing';

export function LanguageSwitcher() {
    const [mounted, setMounted] = React.useState(false);
    const t = useTranslations('Navigation');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const normalizedPathname = React.useMemo(() => {
        if (!pathname) return '/';
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length === 0) return '/';

        const [firstSegment, ...rest] = segments;
        const locales = routing.locales as readonly string[];
        const withoutLocale = locales.includes(firstSegment) ? rest : segments;

        return withoutLocale.length > 0 ? `/${withoutLocale.join('/')}` : '/';
    }, [pathname]);

    const switchLanguageLabel = React.useMemo(() => {
        try {
            return t('switchLanguage');
        } catch {
            return 'Switch language';
        }
    }, [t]);

    const handleLocaleChange = (newLocale: string) => {
        if (newLocale === locale) return;
        router.replace(normalizedPathname as any, { locale: newLocale as any });
    };

    const languages = [
        { code: 'he', label: '\u05e2\u05d1\u05e8\u05d9\u05ea' },
        { code: 'en', label: 'English' },
        { code: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
        { code: 'ru', label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439' },
    ];

    const currentLanguage = languages.find((lang) => lang.code === locale);

    if (!mounted) {
        // Render a static placeholder first to avoid hydration mismatch from Radix IDs.
        return (
            <Button variant="ghost" size="sm" className="gap-2" disabled aria-label={switchLanguageLabel}>
                <Languages className="h-4 w-4" />
                <span className="hidden sm:inline-block w-16 h-5 animate-pulse bg-muted rounded-md" />
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2" data-testid="language-switcher" aria-label={switchLanguageLabel}>
                    <Languages className="h-4 w-4" />
                    <span className="hidden sm:inline-block">{currentLanguage?.label}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => handleLocaleChange(lang.code)}
                        className={locale === lang.code ? 'bg-accent' : ''}
                    >
                        {lang.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
