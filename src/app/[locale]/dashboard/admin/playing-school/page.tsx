'use client';

import dynamic from 'next/dynamic';
import { useAdminGuard } from '@/hooks/use-admin-guard';
import { Skeleton } from '@/components/ui/skeleton';

function PlayingSchoolSkeleton() {
    return (
        <div className="space-y-6 p-6">
            <div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-64 mt-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-96" />
        </div>
    );
}

const SchoolPartnershipDashboard = dynamic(
    () => import('@/components/dashboard/harmonia/school-partnership-dashboard').then(mod => ({ default: mod.SchoolPartnershipDashboard })),
    { loading: () => <PlayingSchoolSkeleton /> }
);

export default function PlayingSchoolAdminPage() {
    const { user, isLoading } = useAdminGuard();

    if (isLoading || !user) {
        return <PlayingSchoolSkeleton />;
    }

    return <SchoolPartnershipDashboard />;
}
