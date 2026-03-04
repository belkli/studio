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
  searchParams?: Promise<{ token?: string; teacher?: string }>;
}) {
    const { locale } = await params;
    const resolvedSearchParams = (await searchParams) ?? {};
    const isRtl = locale === 'he' || locale === 'ar';
    const tAccessibility = await getTranslations({ locale, namespace: 'AccessibilityPage' });
    const token = resolvedSearchParams.token?.trim();
    const teacherId = resolvedSearchParams.teacher?.trim();

    if (token) {
        return (
            <div dir={isRtl ? 'rtl' : 'ltr'} className="flex min-h-dvh flex-col bg-gradient-to-br from-indigo-50/50 via-background to-background">
                <PublicNavbar />
                <main className="flex flex-1 items-start justify-center px-4 pb-8 pt-20">
                    <RegistrationSessionGuard storageKey="register-session:token">
                        <PlayingSchoolEnrollmentWizard token={token} />
                    </RegistrationSessionGuard>
                </main>
                <footer className="pb-6 text-center text-xs text-muted-foreground">
                    <Link href="/accessibility" className="underline underline-offset-4">
                        {tAccessibility('footerLink')}
                    </Link>
                </footer>
            </div>
        );
    }

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} className="flex min-h-dvh flex-col bg-gradient-to-br from-indigo-50/50 via-background to-background">
            <PublicNavbar />
            <main className="flex flex-1 items-start justify-center px-4 pb-8 pt-20">
                <RegistrationSessionGuard storageKey="register-session:default">
                    <EnrollmentWizard teacherIdFromQuery={teacherId} />
                </RegistrationSessionGuard>
            </main>
            <footer className="pb-6 text-center text-xs text-muted-foreground">
                <Link href="/accessibility" className="underline underline-offset-4">
                    {tAccessibility('footerLink')}
                </Link>
            </footer>
        </div>
    );
}

