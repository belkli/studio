'use client';
import { TeacherDashboard } from "@/components/dashboard/harmonia/teacher-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

export default function TeacherRootPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    if (isLoading) {
        return <div>טוען...</div>
    }

    if (!user || user.role !== 'teacher') {
        router.replace('/dashboard');
        return null;
    }

    return <TeacherDashboard />;
}
