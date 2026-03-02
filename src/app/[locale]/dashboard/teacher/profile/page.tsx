'use client';

import { TeacherProfileEditor } from "@/components/dashboard/harmonia/teacher-profile-editor";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "@/i18n/routing";
import { useEffect } from "react";

export default function TeacherProfilePage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'teacher')) {
            router.replace('/dashboard');
        }
    }, [user, isLoading, router]);

    if (!user || user.role !== 'teacher') {
        return null;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">פרופיל מורה</h1>
                <p className="text-muted-foreground">נהל את הפרופיל הציבורי, ההתמחויות והזמינות שלך.</p>
            </div>
            <div className="flex justify-center">
                <TeacherProfileEditor />
            </div>
        </div>
    );
}
