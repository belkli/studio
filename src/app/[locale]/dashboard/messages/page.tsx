
'use client';
import dynamic from 'next/dynamic';
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";

const MessagingInterface = dynamic(
    () => import("@/components/dashboard/harmonia/messaging-interface").then(mod => ({ default: mod.MessagingInterface })),
    { loading: () => <Skeleton className="h-[500px]" /> }
);

export default function MessagesPage() {
    const t = useTranslations('MessagesPage');
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>
            <MessagingInterface />
        </div>
    );
}
