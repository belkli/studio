'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Calendar, Bell } from "lucide-react"
import { useAdminAlerts } from "@/hooks/use-admin-alerts";
import { useAuth } from "@/hooks/use-auth";
import { useMemo } from "react";
import { startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { useTranslations, useLocale } from 'next-intl';
import { tenantFilter, tenantUsers } from '@/lib/tenant-filter';

export function KeyMetricsBar() {
    const t = useTranslations('KeyMetrics');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const alerts = useAdminAlerts();
    const { user, users, lessons, formSubmissions } = useAuth();

    const stats = useMemo(() => {
        const activeStudents = user ? tenantUsers(users, user, 'student').filter(u => u.approved).length : 0;

        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
        const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

        const lessonsThisWeek = (user ? tenantFilter(lessons, user) : lessons).filter(l => {
            const lessonDate = new Date(l.startTime);
            return isWithinInterval(lessonDate, { start: weekStart, end: weekEnd });
        }).length;

        const pendingForms = formSubmissions.filter(f => f.status === 'PENDING_TEACHER' || f.status === 'PENDING_ADMIN').length;

        return { activeStudents, lessonsThisWeek, pendingForms };
    }, [user, users, lessons, formSubmissions]);


    const metrics = [
        { title: t('activeStudents'), value: stats.activeStudents.toString(), icon: Users, color: "text-blue-500" },
        { title: t('lessonsThisWeek'), value: stats.lessonsThisWeek.toString(), icon: Calendar, color: "text-green-500" },
        { title: t('pendingApprovals'), value: stats.pendingForms.toString(), icon: BookOpen, color: "text-orange-500" },
        { title: t('aiAlerts'), value: alerts.length.toString(), icon: Bell, color: alerts.length > 0 ? "text-red-500" : "text-purple-500" },
    ]

    return (
        <div id="key-metrics-bar" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" dir={isRtl ? 'rtl' : 'ltr'}>
            {metrics.map((stat) => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
