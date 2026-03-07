
'use client';
import dynamic from 'next/dynamic';
import { useTranslations, useLocale } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";

const MessagingInterface = dynamic(
    () => import("@/components/dashboard/harmonia/messaging-interface").then(mod => ({ default: mod.MessagingInterface })),
    { loading: () => <Skeleton className="h-[500px]" /> }
);

export default function MessagesPage() {
    const t = useTranslations('MessagesPage');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>
            <MessagingInterface />
        </div>
    );
}
