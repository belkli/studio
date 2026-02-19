'use client';
import { TeacherDashboard } from "@/components/dashboard/harmonia/teacher-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from 'react';

export default function TeacherRootPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'teacher')) {
            router.replace('/dashboard');
        }
    }, [isLoading, user, router]);

    if (isLoading || !user || user.role !== 'teacher') {
        return <div>טוען...</div>;
    }
    
    return <TeacherDashboard />;
}
