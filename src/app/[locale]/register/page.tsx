import { EnrollmentWizard } from '@/components/enrollment/enrollment-wizard';
import { PlayingSchoolEnrollmentWizard } from '@/components/harmonia/playing-school-enrollment-wizard';
import { RegistrationSessionGuard } from '@/components/registration/session-guard';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { PublicNavbar } from '@/components/layout/public-navbar';

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: { token?: string };
}) {
    const { locale } = await params;
    const tAccessibility = await getTranslations({ locale, namespace: 'AccessibilityPage' });
    const token = searchParams?.token?.trim();

    if (token) {
        return (
            <div className="flex flex-col min-h-dvh bg-gradient-to-br from-indigo-50/50 via-background to-background">
                <PublicNavbar />
                <main className="flex flex-1 items-center justify-center px-4 pt-20 pb-8">
                    <RegistrationSessionGuard storageKey="register-session:token">
                        <PlayingSchoolEnrollmentWizard token={token} />
                    </RegistrationSessionGuard>
                </main>
                <footer className="text-center text-xs text-muted-foreground pb-6">
                    <Link href="/accessibility" className="underline underline-offset-4">
                        {tAccessibility('footerLink')}
                    </Link>
                </footer>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-dvh bg-gradient-to-br from-indigo-50/50 via-background to-background">
            <PublicNavbar />
            <main className="flex flex-1 items-center justify-center px-4 pt-20 pb-8">
                <RegistrationSessionGuard storageKey="register-session:default">
                    <EnrollmentWizard />
                </RegistrationSessionGuard>
            </main>
            <footer className="text-center text-xs text-muted-foreground pb-6">
                <Link href="/accessibility" className="underline underline-offset-4">
                    {tAccessibility('footerLink')}
                </Link>
            </footer>
        </div>
    );
}
