import { EnrollmentWizard } from '@/components/enrollment/enrollment-wizard';
import { PlayingSchoolEnrollmentWizard } from '@/components/harmonia/playing-school-enrollment-wizard';
import { RegistrationSessionGuard } from '@/components/registration/session-guard';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';

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
            <div className="flex flex-col min-h-dvh py-12 bg-gradient-to-br from-indigo-50/50 via-background to-background">
                <main className="flex flex-1 items-center justify-center px-4">
                <RegistrationSessionGuard storageKey="register-session:token">
                    <PlayingSchoolEnrollmentWizard token={token} />
                </RegistrationSessionGuard>
                </main>
                <footer className="text-center text-xs text-muted-foreground">
                    <Link href="/accessibility" className="underline underline-offset-4">
                        {tAccessibility('footerLink')}
                    </Link>
                </footer>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-dvh py-12 bg-gradient-to-br from-indigo-50/50 via-background to-background">
            <main className="flex flex-1 items-center justify-center px-4">
                <RegistrationSessionGuard storageKey="register-session:default">
                    <EnrollmentWizard />
                </RegistrationSessionGuard>
            </main>
            <footer className="text-center text-xs text-muted-foreground">
                <Link href="/accessibility" className="underline underline-offset-4">
                    {tAccessibility('footerLink')}
                </Link>
            </footer>
        </div>
    );
}
