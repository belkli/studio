'use client';

import { AdminCalendarPanel } from "@/components/dashboard/harmonia/admin-calendar-panel";
import { useAuth } from "@/hooks/use-auth";

export default function AdminCalendarPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">ניהול יומן וחופשות</h1>
                    <p className="text-muted-foreground">אין לך הרשאה לצפות בעמוד זה.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">ניהול יומן וחופשות</h1>
                <p className="text-muted-foreground">הגדר חגים לאומיים ומועדים בהם הקונסרבטוריון סגור לטובת מניעת שיבוץ שיעורים.</p>
            </div>
            <AdminCalendarPanel />
        </div>
    );
}
