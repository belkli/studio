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
import { TeacherDashboard } from "@/components/dashboard/harmonia/teacher-dashboard";
import { StudentProfilePage } from "./profile/page";

function StudentDashboard() {
    const { user, newFeaturesEnabled } = useAuth();
    if (!user) return null;

    if (newFeaturesEnabled) {
      return <StudentProfilePage />;
    }

    // Legacy Student Dashboard
    return (
         <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">ברוך הבא, {user?.name.split(' ')[0]}</h1>
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


export default function DashboardPage() {
    const { user, newFeaturesEnabled, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && newFeaturesEnabled) {
            if (user?.role === 'parent') {
                router.replace('/dashboard/family');
            }
        }
    }, [isLoading, newFeaturesEnabled, user, router]);

    if (isLoading || !user) {
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
        if (user.role === 'conservatorium_admin' || user.role === 'site_admin') {
            return <AdminCommandCenter />;
        }
        if (user.role === 'teacher') {
            return <TeacherDashboard />;
        }
        if (user.role === 'student' || user.role === 'parent') {
             return <StudentDashboard />;
        }
    }

    // Legacy Dashboard for roles not covered by new features yet, or when flag is off
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">ברוך הבא, {user.name.split(' ')[0]}</h1>
                    <p className="text-muted-foreground">זהו לוח הבקרה שלך להיום.</p>
                </div>
                 {user.role !== 'ministry_director' && (
                    <Button asChild>
                        <Link href="/dashboard/forms/new">
                            <PlusCircle className="me-2 h-4 w-4" />
                            טופס חדש
                        </Link>
                    </Button>
                )}
            </div>
            <OverviewCards />
            <RecentForms />
        </div>
    )
}
