'use client';

import { AvailabilityGrid } from "@/components/dashboard/harmonia/availability-grid";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "@/i18n/routing";
import { useEffect } from "react";

export default function AvailabilityPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

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
                <h1 className="text-2xl font-bold">ניהול זמינות</h1>
                <p className="text-muted-foreground">הגדר את שעות העבודה השבועיות שלך, חסום תאריכים לחופשה וסנכרן את היומן החיצוני שלך.</p>
            </div>
            <AvailabilityGrid />
        </div>
    );
}
