import { SchoolCoordinatorDashboard } from '@/components/dashboard/harmonia/school-coordinator-dashboard';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('PlayingSchool');
    return { title: t('coordinatorPageTitle') };
}

export default function SchoolCoordinatorPage() {
    return <SchoolCoordinatorDashboard />;
}
