import { PlayingSchoolEnrollmentWizard } from '@/components/harmonia/playing-school-enrollment-wizard';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

interface Props {
    params: { token: string; locale: string };
}

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('PlayingSchool');
    return { title: t('enrollmentPageTitle') };
}

export default function PlayingSchoolEnrollmentPage({ params }: Props) {
    return <PlayingSchoolEnrollmentWizard token={params.token} />;
}
