'use client';
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { RecentForms } from "@/components/dashboard/recent-forms";
import { AdminCommandCenter } from "@/components/dashboard/harmonia/admin-command-center";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
    const { user, newFeaturesEnabled, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && newFeaturesEnabled && user?.role === 'parent') {
            router.replace('/dashboard/family');
        }
    }, [isLoading, newFeaturesEnabled, user, router]);

    if (isLoading || !user || (newFeaturesEnabled && user.role === 'parent')) {
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

    if (newFeaturesEnabled) {
        // Teachers and students will get their own dashboards later.
        // For now, only admin has the command center.
        if (user.role === 'conservatorium_admin' || user.role === 'site_admin') {
            return <AdminCommandCenter />;
        }
    }

    // Legacy Dashboard or placeholder for other new roles
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">ברוך הבא, {user.name.split(' ')[0]}</h1>
                    <p className="text-muted-foreground">זהו לוח הבקרה שלך להיום.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/forms/new">
                        <PlusCircle className="me-2 h-4 w-4" />
                        טופס חדש
                    </Link>
                </Button>
            </div>
            <OverviewCards />
            <RecentForms />
        </div>
    )
}
