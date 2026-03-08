'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

function SchoolDashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-5 w-80 mt-2" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
            </div>
            <Skeleton className="h-64" />
        </div>
    );
}

const SchoolCoordinatorDashboard = dynamic(
    () => import('@/components/dashboard/harmonia/school-coordinator-dashboard').then(m => ({ default: m.SchoolCoordinatorDashboard })),
    { loading: () => <SchoolDashboardSkeleton /> }
);

export default function SchoolCoordinatorPage() {
    return <SchoolCoordinatorDashboard />;
}
