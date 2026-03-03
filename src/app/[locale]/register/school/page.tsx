'use client';

import { useSearchParams } from 'next/navigation';
import { PlayingSchoolEnrollmentWizard } from '@/components/harmonia/playing-school-enrollment-wizard';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function SchoolRegisterPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';
    const tAccessibility = useTranslations('AccessibilityPage');

    return (
        <div className="flex flex-col min-h-dvh bg-gradient-to-br from-indigo-50/50 via-background to-background">
            <PublicNavbar />
            <main className="flex flex-1 items-center justify-center px-4 pt-20 pb-8">
                <PlayingSchoolEnrollmentWizard token={token} />
            </main>
            <footer className="text-center text-xs text-muted-foreground pb-6">
                <Link href="/accessibility" className="underline underline-offset-4">
                    {tAccessibility('footerLink')}
                </Link>
            </footer>
        </div>
    );
}
