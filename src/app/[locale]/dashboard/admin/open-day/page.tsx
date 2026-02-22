'use client';

import { OpenDayAdminDashboard } from '@/components/dashboard/harmonia/open-day-admin-dashboard';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';

export default function AdminOpenDayPage() {
    const { user } = useAuth();
    const t = useTranslations('Sidebar');
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('manageOpenDay')}</h1>
                    <p className="text-muted-foreground">אין לך הרשאה לצפות בעמוד זה.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('manageOpenDay')}</h1>
                <p className="text-muted-foreground">עקוב אחר הנרשמים ונהל את הפגישות לאירוע היום הפתוח.</p>
            </div>
            <OpenDayAdminDashboard />
        </div>
    );
}
