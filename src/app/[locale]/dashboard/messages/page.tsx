'use client';
import { MessagingInterface } from "@/components/dashboard/harmonia/messaging-interface";
import { useTranslations } from "next-intl";

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
