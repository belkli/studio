
'use client';

import { NotificationAuditLog } from "@/components/dashboard/harmonia/notification-audit-log";
import { useAuth } from "@/hooks/use-auth";

import { useTranslations } from "next-intl";

export default function NotificationLogPage() {
    const { user } = useAuth();
    const tAdmin = useTranslations('AdminPages.notificationsLog');
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">{tAdmin('title')}</h1>
                    <p className="text-muted-foreground">{tAdmin('noPermission')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{tAdmin('titleSystem')}</h1>
                <p className="text-muted-foreground">{tAdmin('subtitle')}</p>
            </div>
            <NotificationAuditLog />
        </div>
    );
}
