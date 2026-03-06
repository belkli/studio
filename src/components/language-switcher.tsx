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
import { updateUserLanguagePreference } from '@/app/actions';

type LocaleOption = {
    code: 'he' | 'en' | 'ru' | 'ar';
    displayCode: string;
    flag: string;
    nativeLabel: string;
};

const LOCALES: LocaleOption[] = [
    {
        code: 'he',
        displayCode: '\u05E2\u05D1',
        flag: '\uD83C\uDDEE\uD83C\uDDF1',
        nativeLabel: '\u05E2\u05D1\u05E8\u05D9\u05EA',
    },
    { code: 'en', displayCode: 'EN', flag: '\uD83C\uDDEC\uD83C\uDDE7', nativeLabel: 'English' },
    {
        code: 'ru',
        displayCode: 'RU',
        flag: '\uD83C\uDDF7\uD83C\uDDFA',
        nativeLabel: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439',
    },
    {
        code: 'ar',
        displayCode: 'AR',
        flag: '\uD83C\uDDF8\uD83C\uDDE6',
        nativeLabel: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629',
    },
];

const LOCALE_STORAGE_KEY = 'harmonia_locale';

export function LanguageSwitcher() {
    const [mounted, setMounted] = React.useState(false);
    const t = useTranslations('Navigation');
    const locale = useLocale() as LocaleOption['code'];
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

    const handleLocaleChange = (newLocale: LocaleOption['code']) => {
        if (newLocale === locale) return;
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
        // Persist to user profile (fire-and-forget — best effort)
        updateUserLanguagePreference({ locale: newLocale }).catch(() => {});
        router.replace(normalizedPathname as any, { locale: newLocale as any });
    };

    const currentLanguage = LOCALES.find((lang) => lang.code === locale) ?? LOCALES[1];

    if (!mounted) {
        return (
            <Button variant="ghost" size="sm" className="gap-2" disabled aria-label={switchLanguageLabel}>
                <Languages className="h-4 w-4" />
                <span className="hidden h-5 w-16 animate-pulse rounded-md bg-muted sm:inline-block" />
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2" data-testid="language-switcher" aria-label={switchLanguageLabel}>
                    <Languages className="h-4 w-4" />
                    <span className="hidden sm:inline-block">{`${currentLanguage.flag} ${currentLanguage.displayCode}`}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {LOCALES.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => handleLocaleChange(lang.code)}
                        className={locale === lang.code ? 'bg-accent' : ''}
                    >
                        <span className="me-2">{lang.flag}</span>
                        <span className="me-2 font-medium">{lang.displayCode}</span>
                        <span>{lang.nativeLabel}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

