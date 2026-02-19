'use client';
import { TeacherReportsDashboard } from "@/components/dashboard/harmonia/teacher-reports-dashboard";
import { useAuth } from "@/hooks/use-auth";

export default function TeacherReportsPage() {
    const { user } = useAuth();
    const isTeacher = user?.role === 'teacher';

    if (!isTeacher) {
        return (
             <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">דוחות ואנליטיקה</h1>
                    <p className="text-muted-foreground">אין לך הרשאה לצפות בעמוד זה.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">הדוחות שלי</h1>
                <p className="text-muted-foreground">סקירה כללית של הפעילות, התקדמות התלמידים וההכנסות שלך.</p>
            </div>
            <TeacherReportsDashboard />
        </div>
    );
}
