'use client';

import { AdminMakeupDashboard } from "@/components/dashboard/harmonia/admin-makeup-dashboard";
import { useAuth } from "@/hooks/use-auth";

export default function AdminMakeupsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">ניהול שיעורי השלמה</h1>
                    <p className="text-muted-foreground">אין לך הרשאה לצפות בעמוד זה.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">ניהול שיעורי השלמה</h1>
                <p className="text-muted-foreground">צפה ונהל את יתרות שיעורי ההשלמה של כלל התלמידים בקונסרבטוריון.</p>
            </div>
            <AdminMakeupDashboard />
        </div>
    );
}
