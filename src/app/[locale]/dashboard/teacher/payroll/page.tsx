'use client';

import { TeacherPayrollView } from "@/components/dashboard/harmonia/teacher-payroll-view";
import { useAuth } from "@/hooks/use-auth";

export default function TeacherPayrollPage() {
    const { user } = useAuth();

    if (!user || user.role !== 'teacher') {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">השכר שלי</h1>
                    <p className="text-muted-foreground">אין לך הרשאה לצפות בעמוד זה.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">השכר שלי</h1>
                <p className="text-muted-foreground">צפה בהיסטוריית תלושי השכר שלך.</p>
            </div>
            <TeacherPayrollView />
        </div>
    );
}
