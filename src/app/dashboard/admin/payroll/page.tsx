'use client';

import { AdminPayrollPanel } from "@/components/dashboard/harmonia/admin-payroll-panel";
import { useAuth } from "@/hooks/use-auth";

export default function AdminPayrollPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">ניהול שכר מורים</h1>
                    <p className="text-muted-foreground">אין לך הרשאה לצפות בעמוד זה.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">הכנת שכר - מורים</h1>
                <p className="text-muted-foreground">סקור, אשר ונהל את דוחות השכר החודשיים של המורים.</p>
            </div>
            <AdminPayrollPanel />
        </div>
    );
}
