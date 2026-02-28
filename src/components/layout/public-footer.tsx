'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export function PublicFooter() {
    const tNav = useTranslations('Navigation');
    const tHome = useTranslations('HomePage');

    return (
        <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t mt-auto">
            <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} {tHome('title')}. {tHome('copyright')}
            </p>
            <nav className="sm:ms-auto flex gap-4 sm:gap-6">
                <Link href="/privacy" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                    {tHome('privacyPolicy')}
                </Link>
                <Link href="/contact" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                    {tNav('contact')}
                </Link>
            </nav>
        </footer>
    );
}
