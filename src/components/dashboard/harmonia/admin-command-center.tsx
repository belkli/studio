'use client';

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PlusCircle, FilePlus, Megaphone, UserPlus, FileCheck, Banknote, Coins } from "lucide-react";
import { Link } from "@/i18n/routing";
import { KeyMetricsBar } from "./key-metrics-bar";
import { TodaySnapshotCard } from "./today-snapshot-card";
import { RecentAnnouncementsCard } from "./recent-announcements-card";
import { AiAlertsCard } from "./ai-alerts-card";
import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';


export function AdminCommandCenter() {
    const t = useTranslations('AdminDashboard');
    const { user, users, formSubmissions, payrolls } = useAuth();

    const stats = useMemo(() => {
        if (!user) return { pendingUsers: 0, pendingForms: 0, draftPayrolls: 0 };

        const pendingUsers = users.filter(u => u.conservatoriumId === user.conservatoriumId && !u.approved).length;

        const pendingForms = formSubmissions.filter(f =>
            f.conservatoriumId === user.conservatoriumId &&
            (f.status === 'PENDING_ADMIN' || f.status === 'REVISION_REQUIRED')
        ).length;

        const draftPayrolls = payrolls.filter(p => p.status === 'DRAFT').length;

        return { pendingUsers, pendingForms, draftPayrolls };
    }, [user, users, formSubmissions, payrolls]);

    if (!user) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t('welcome', { name: user.name.split(' ')[0] })}</h1>
                    <p className="text-muted-foreground">{t('controlCenter', { name: user.conservatoriumName || 'Harmonia' })}</p>
                </div>
            </div>

            <KeyMetricsBar />

            <Card>
                <CardHeader>
                    <CardTitle>{t('quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <Button variant="outline" className="flex-col h-24 relative" asChild>
                        <Link href="/dashboard/users?tab=pending">
                            <UserPlus className="h-6 w-6 mb-2" />
                            <span>{t('approveEnrollments')}</span>
                            {stats.pendingUsers > 0 && <Badge className="absolute -top-2 -right-2">{stats.pendingUsers}</Badge>}
                        </Link>
                    </Button>
                    <Button variant="outline" className="flex-col h-24 relative" asChild>
                        <Link href="/dashboard/approvals">
                            <FileCheck className="h-6 w-6 mb-2" />
                            <span>{t('reviewForms')}</span>
                            {stats.pendingForms > 0 && <Badge className="absolute -top-2 -right-2">{stats.pendingForms}</Badge>}
                        </Link>
                    </Button>
                    <Button variant="outline" className="flex-col h-24 relative" asChild>
                        <Link href="/dashboard/admin/payroll">
                            <Banknote className="h-6 w-6 mb-2" />
                            <span>{t('viewPayrollDrafts')}</span>
                            {stats.draftPayrolls > 0 && <Badge variant="secondary" className="absolute -top-2 -right-2">{stats.draftPayrolls}</Badge>}
                        </Link>
                    </Button>
                    <Button variant="outline" className="flex-col h-24" asChild>
                        <Link href="/dashboard/announcements">
                            <Megaphone className="h-6 w-6 mb-2" />
                            <span>{t('sendAnnouncement')}</span>
                        </Link>
                    </Button>
                    <Button variant="outline" className="flex-col h-24" disabled>
                        <Coins className="h-6 w-6 mb-2" />
                        <span>{t('issueCredit')}</span>
                    </Button>
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <TodaySnapshotCard />
                </div>
                <div className="lg:col-span-1" id="ai-alerts-card">
                    <AiAlertsCard />
                </div>
            </div>
            <RecentAnnouncementsCard />
        </div>
    )
}
