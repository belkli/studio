'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useBrandTheme } from '@/components/brand-theme-provider';
import { cn } from '@/lib/utils';

const FOOTER_STYLES = {
    indigo: {
        container: 'border-t bg-muted/50',
        text: 'text-muted-foreground',
        link: 'text-muted-foreground hover:text-primary hover:underline',
    },
    gold: {
        container: 'border-t border-brand-gold/15 bg-background',
        text: 'text-foreground/60',
        link: 'text-foreground/60 hover:text-brand-gold hover:underline',
    },
} as const;

export function PublicFooter() {
    const tNav = useTranslations('Navigation');
    const tHome = useTranslations('HomePage');
    const tAccessibility = useTranslations('AccessibilityPage');
    const { brand } = useBrandTheme();
    const s = FOOTER_STYLES[brand] ?? FOOTER_STYLES.indigo;

    return (
        <footer className={cn('flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 mt-auto', s.container)}>
            <p className={cn('text-xs', s.text)}>
                &copy; {new Date().getFullYear()} {tHome('title')}. {tHome('copyright')}
            </p>
            <nav className="sm:ms-auto flex gap-4 sm:gap-6">
                <Link href="/privacy" className={cn('text-xs underline-offset-4', s.link)} prefetch={false}>
                    {tHome('privacyPolicy')}
                </Link>
                <Link href="/contact" className={cn('text-xs underline-offset-4', s.link)} prefetch={false}>
                    {tNav('contact')}
                </Link>
                <Link href="/accessibility" className={cn('text-xs underline-offset-4', s.link)} prefetch={false}>
                    {tAccessibility('footerLink')}
                </Link>
            </nav>
        </footer>
    );
}
