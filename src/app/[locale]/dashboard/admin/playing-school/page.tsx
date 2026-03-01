'use client';

import { SchoolPartnershipDashboard } from '@/components/dashboard/harmonia/school-partnership-dashboard';
import { useAdminGuard } from '@/hooks/use-admin-guard';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlayingSchoolAdminPage() {
    const { user, isLoading } = useAdminGuard();

    if (isLoading || !user) {
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

    return <SchoolPartnershipDashboard />;
}
