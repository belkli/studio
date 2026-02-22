
'use client';

import { NotificationAuditLog } from "@/components/dashboard/harmonia/notification-audit-log";
import { useAuth } from "@/hooks/use-auth";

export default function NotificationLogPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">יומן התראות</h1>
                    <p className="text-muted-foreground">אין לך הרשאה לצפות בעמוד זה.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">יומן התראות מערכת</h1>
                <p className="text-muted-foreground">צפה בכל ההתראות היוצאות שנשלחו למשתמשים.</p>
            </div>
            <NotificationAuditLog />
        </div>
    );
}
