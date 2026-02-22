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

    const handleLocaleChange = (newLocale: string) => {
        router.replace(pathname, { locale: newLocale as any });
    };

    const languages = [
        { code: 'he', label: 'עברית' },
        { code: 'en', label: 'English' },
        { code: 'ar', label: 'العربية' },
        { code: 'ru', label: 'Русский' },
    ];

    const currentLanguage = languages.find((lang) => lang.code === locale);

    if (!mounted) {
        // On the server and during initial client render, render a static placeholder
        // to avoid hydration mismatch from Radix's internally generated IDs.
        return (
            <Button variant="ghost" size="sm" className="gap-2" disabled>
                <Languages className="h-4 w-4" />
                <span className="hidden sm:inline-block w-16 h-5 animate-pulse bg-muted rounded-md" />
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
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
