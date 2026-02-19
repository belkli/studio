'use client';
import { AdminReportsDashboard } from "@/components/dashboard/harmonia/admin-reports-dashboard";
import { useAuth } from "@/hooks/use-auth";

export default function ReportsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
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
                <h1 className="text-2xl font-bold">דוחות ואנליטיקה</h1>
                <p className="text-muted-foreground">נתח את ביצועי הקונסרבטוריון וקבל תובנות עסקיות.</p>
            </div>
            <AdminReportsDashboard />
        </div>
    );
}
