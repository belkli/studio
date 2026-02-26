'use client';

import { MinistryInboxPanel } from "@/components/dashboard/harmonia/ministry-inbox-panel";
import { useAuth } from "@/hooks/use-auth";

export default function MinistryDashboardPage() {
    const { user } = useAuth();

    // Simplistic role check for ministry
    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
        return <p>אין לך הרשאות לגשת לעמוד זה.</p>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">פורטל משרד החינוך מחוז – הרמוניה</h1>
                <p className="text-muted-foreground">ניהול ואישור בקשות, רסיטלים, מלגות ומבחני שלב המוגשים על ידי הקונסרבטוריונים.</p>
            </div>

            <MinistryInboxPanel />
        </div>
    );
}
