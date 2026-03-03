import { PlayingSchoolEnrollmentWizard } from '@/components/harmonia/playing-school-enrollment-wizard';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { Link } from '@/i18n/routing';

interface Props {
    params: { token: string; locale: string };
}

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('PlayingSchool');
    return { title: t('enrollmentPageTitle') };
}

export default async function PlayingSchoolEnrollmentPage({ params }: Props) {
    const tAccessibility = await getTranslations({ locale: params.locale, namespace: 'AccessibilityPage' });

    return (
        <div className="flex flex-col min-h-dvh bg-gradient-to-br from-indigo-50/50 via-background to-background">
            <PublicNavbar />
            <main className="flex flex-1 items-center justify-center px-4 pt-20 pb-8">
                <PlayingSchoolEnrollmentWizard token={params.token} />
            </main>
            <footer className="text-center text-xs text-muted-foreground pb-6">
                <Link href="/accessibility" className="underline underline-offset-4">
                    {tAccessibility('footerLink')}
                </Link>
            </footer>
        </div>
    );
}
