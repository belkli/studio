'use client';

import { useAuth } from "@/hooks/use-auth";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/routing";
import { useMemo } from "react";
import { notFound } from "next/navigation";
import { StudentProfilePageContent } from '@/components/dashboard/harmonia/student-profile-content';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentProfileForParentPage() {
    const params = useParams();
    const studentId = params.id as string;
    const { user: parent, users, isLoading } = useAuth();
    const router = useRouter();

    const student = useMemo(() => users.find(u => u.id === studentId), [users, studentId]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-start">
                    <Skeleton className="h-10 w-44" />
                </div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-28 w-full" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
            </div>
        );
    }

    // Security check: parent must own this student, teachers/admins can view any student.
    const isAdmin = parent?.role === 'site_admin' || parent?.role === 'conservatorium_admin' || parent?.role === 'delegated_admin';
    const isTeacher = parent?.role === 'teacher';
    const isParentOfStudent = parent?.role === 'parent' && (
        parent.childIds?.includes(studentId) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (parent as any).students?.includes(studentId)
    );
    if (!parent || !student || (!isAdmin && !isTeacher && !isParentOfStudent)) {
        if (parent && parent.role === 'parent') {
            router.push('/dashboard/family');
        } else if (parent) {
            router.push('/dashboard');
        }
        return <p>אין לך הרשאה לצפות בפרופיל זה.</p>;
    }

    if (!student) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-start">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/family">
                        <ArrowLeft className="ms-2 h-4 w-4" />
                        חזרה למשפחה
                    </Link>
                </Button>
            </div>
            <StudentProfilePageContent student={student} isParentView={true} />
        </div>
    );
}
