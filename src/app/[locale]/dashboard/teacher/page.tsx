'use client';

import dynamic from 'next/dynamic';
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "@/i18n/routing";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function TeacherDashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64 mt-2" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
        </div>
    );
}

const TeacherDashboard = dynamic(
    () => import("@/components/dashboard/harmonia/teacher-dashboard").then(mod => ({ default: mod.TeacherDashboard })),
    { loading: () => <TeacherDashboardSkeleton /> }
);

export default function TeacherDashboardPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user && user.role !== 'teacher') {
            router.replace('/dashboard');
        }
    }, [isLoading, user, router]);

    if (isLoading || !user) {
        return <TeacherDashboardSkeleton />;
    }

    return <TeacherDashboard />;
}
