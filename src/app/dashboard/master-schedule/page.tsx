'use client';

import { MasterScheduleCalendar } from "@/components/dashboard/harmonia/master-schedule-calendar";
import { useAuth } from "@/hooks/use-auth";

export default function MasterSchedulePage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">מערכת שעות ראשית</h1>
                    <p className="text-muted-foreground">אין לך הרשאה לצפות בעמוד זה.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">מערכת שעות ראשית</h1>
                <p className="text-muted-foreground">תצוגה כוללת של כל השיעורים בקונסרבטוריון. סנן לפי מורה, חדר או כלי נגינה.</p>
            </div>
            <MasterScheduleCalendar />
        </div>
    );
}
