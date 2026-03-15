'use client';
import { TeacherReportsDashboard } from "@/components/dashboard/harmonia/teacher-reports-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { useLocale, useTranslations } from "next-intl";

export default function TeacherReportsPage() {
    const { user } = useAuth();
    const t = useTranslations('TeacherReports');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const isTeacher = user?.role === 'teacher';

    if (!isTeacher) {
        return (
             <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
                <div>
                    <h1 className="text-2xl font-bold">{t('noPermissionTitle')}</h1>
                    <p className="text-muted-foreground">{t('noPermission')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold">{t('pageTitle')}</h1>
                <p className="text-muted-foreground">{t('pageSubtitle')}</p>
            </div>
            <TeacherReportsDashboard />
        </div>
    );
}
