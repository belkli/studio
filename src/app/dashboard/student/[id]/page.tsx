'use client';

import { useAuth } from "@/hooks/use-auth";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { notFound } from "next/navigation";
import { StudentProfilePageContent } from '@/components/dashboard/harmonia/student-profile-content';
import { Button } from "@/components/ui/button";
import Link from "next/link";
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

    // Security check: ensure the logged-in user is the parent of this student.
    if (!parent || !student || !parent.childIds?.includes(student.id)) {
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
