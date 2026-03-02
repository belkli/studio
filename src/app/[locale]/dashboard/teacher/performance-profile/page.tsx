'use client';

import { PerformanceProfileEditor } from "@/components/dashboard/harmonia/performance-profile-editor";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function PerformanceProfilePage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations('Sidebar');

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'teacher')) {
            router.replace('/dashboard');
        }
    }, [user, isLoading, router]);

    if (!user || user.role !== 'teacher') {
        return null;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('performanceProfile')}</h1>
                <p className="text-muted-foreground">נהל את הפרופיל הציבורי שלך עבור הזמנות לאירועים וקונצרטים.</p>
            </div>
            <PerformanceProfileEditor />
        </div>
    );
}
