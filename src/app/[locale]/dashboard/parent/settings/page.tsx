'use client';

import { ParentNotificationPanel } from "@/components/dashboard/harmonia/parent-notification-panel";
import { useAuth } from "@/hooks/use-auth";

export default function ParentSettingsPage() {
    const { user } = useAuth();

    if (user?.role !== 'parent') {
        return <p>אין לך הרשאות לגשת לעמוד זה.</p>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">הגדרות חשבון</h1>
                <p className="text-muted-foreground">ניהול התראות והעדפות קשר מול הקונסרבטוריון.</p>
            </div>

            <ParentNotificationPanel />
        </div>
    );
}
