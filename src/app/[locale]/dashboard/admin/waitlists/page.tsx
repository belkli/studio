'use client';

import { AdminWaitlistDashboard } from "@/components/dashboard/harmonia/admin-waitlist-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";

export default function AdminWaitlistsPage() {
    const { user } = useAuth();
    const tAdmin = useTranslations('AdminPages.waitlists');
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
                <h1 className="text-2xl font-bold">{tAdmin('header')}</h1>
                <p className="text-muted-foreground">{tAdmin('subtitle')}</p>
            </div>
            <AdminWaitlistDashboard />
        </div>
    );
}
