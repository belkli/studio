import { SchoolPartnershipDashboard } from '@/components/dashboard/harmonia/school-partnership-dashboard';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('PlayingSchool');
    return { title: t('pageTitle') };
}

export default function PlayingSchoolAdminPage() {
    return <SchoolPartnershipDashboard />;
}
