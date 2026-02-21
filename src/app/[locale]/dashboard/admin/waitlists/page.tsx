'use client';

import { AdminWaitlistDashboard } from "@/components/dashboard/harmonia/admin-waitlist-dashboard";
import { useAuth } from "@/hooks/use-auth";

export default function AdminWaitlistsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">רשימות המתנה</h1>
                    <p className="text-muted-foreground">אין לך הרשאה לצפות בעמוד זה.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">ניהול רשימות המתנה</h1>
                <p className="text-muted-foreground">צפה ונהל את התלמידים הממתינים למקום פנוי אצל מורים.</p>
            </div>
            <AdminWaitlistDashboard />
        </div>
    );
}
