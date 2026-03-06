'use client';

import dynamic from 'next/dynamic';
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { Skeleton } from "@/components/ui/skeleton";

function AdminDashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64 mt-2" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-96" />
        </div>
    );
}

const AdminCommandCenter = dynamic(
    () => import("@/components/dashboard/harmonia/admin-command-center").then(mod => ({ default: mod.AdminCommandCenter })),
    { loading: () => <AdminDashboardSkeleton /> }
);

export default function AdminDashboardPage() {
    const { isLoading, user } = useAdminGuard();

    if (isLoading || !user) {
        return <AdminDashboardSkeleton />;
    }

    return <AdminCommandCenter />;
}
