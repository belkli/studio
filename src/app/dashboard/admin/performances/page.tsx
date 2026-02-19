'use client';

import { PerformanceBookingDashboard } from "@/components/dashboard/harmonia/performance-booking-dashboard";
import { useAuth } from "@/hooks/use-auth";

export default function AdminPerformancesPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">ניהול הופעות</h1>
                    <p className="text-muted-foreground">אין לך הרשאה לצפות בעמוד זה.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">ניהול הזמנות להופעות</h1>
                <p className="text-muted-foreground">עקוב אחר הזמנות, נהל שיבוצים וטפל בתשלומים עבור הופעות מוזיקאים.</p>
            </div>
            <PerformanceBookingDashboard />
        </div>
    );
}
