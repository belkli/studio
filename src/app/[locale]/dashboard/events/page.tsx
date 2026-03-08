'use client';

import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@/i18n/routing";
import { PlusCircle } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";

const EventsList = dynamic(
    () => import('@/components/dashboard/harmonia/events-list').then(m => ({ default: m.EventsList })),
    { loading: () => <Skeleton className="h-64 w-full rounded-md bg-muted" /> }
);

export default function EventsPage() {
    const { user } = useAuth();
    const t = useTranslations('DashboardPages');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t('events.title')}</h1>
                    <p className="text-muted-foreground">{t('events.description')}</p>
                </div>
                {isAdmin && (
                    <Button asChild>
                        <Link href="/dashboard/events/new">
                            <PlusCircle className="me-2 h-4 w-4" />
                            {t('events.createButton')}
                        </Link>
                    </Button>
                )}
            </div>
            <EventsList />
        </div>
    );
}
