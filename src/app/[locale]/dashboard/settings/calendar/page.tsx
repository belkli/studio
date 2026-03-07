'use client';

import { AdminCalendarPanel } from "@/components/dashboard/harmonia/admin-calendar-panel";
import { useAuth } from "@/hooks/use-auth";
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminCalendarPage() {
    const { user } = useAuth();
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const t = useTranslations('SettingsPage');
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';
    const BackIcon = isRtl ? ChevronRight : ChevronLeft;

    if (!isAdmin) return null;

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex items-start gap-4">
                <Button variant="ghost" size="sm" className="gap-1 -ms-2 mt-1 text-muted-foreground shrink-0" asChild>
                    <Link href="/dashboard/settings">
                        <BackIcon className="h-4 w-4" />
                        {t('title')}
                    </Link>
                </Button>
            </div>
            <AdminCalendarPanel />
        </div>
    );
}
