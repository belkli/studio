
'use client';

import { InstrumentRentalDashboard } from "@/components/dashboard/harmonia/instrument-rental-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";

export default function InstrumentRentalsPage() {
    const { user } = useAuth();
    const t = useTranslations('Sidebar');
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('rentals')}</h1>
                    <p className="text-muted-foreground">אין לך הרשאה לצפות בעמוד זה.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('rentals')}</h1>
                <p className="text-muted-foreground">עקוב אחר מלאי הכלים, נהל השאלות והחזרות.</p>
            </div>
            <InstrumentRentalDashboard />
        </div>
    );
}
