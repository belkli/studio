'use client';
import { ReschedulingChatWidget } from "@/components/dashboard/harmonia/rescheduling-chat-widget";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";

export default function AiReschedulePage() {
    const { user } = useAuth();
    const t = useTranslations('DashboardPages');

    if (!user || (user.role !== 'student' && user.role !== 'parent')) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('aiReschedule.title')}</h1>
                    <p className="text-muted-foreground">{t('aiReschedule.noPermissionDesc')}</p>
                </div>
            </div>
        );
    }

    return (
        <ReschedulingChatWidget />
    );
}
