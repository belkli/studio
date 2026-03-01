'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HandCoins, Users, Banknote, Search, CheckCircle2, XCircle, Clock, Hourglass } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import type { ScholarshipApplication, ApplicationStatus } from '@/lib/types';

export default function AdminScholarshipsPage() {
    const { user, mockScholarshipApplications } = useAuth();
    const t = useTranslations('AdminScholarships');

    const statusConfig: Record<ApplicationStatus, { label: string; icon: React.ElementType, className: string }> = {
        DRAFT: { label: t('statuses.DRAFT'), icon: Clock, className: 'bg-gray-100 text-gray-800' },
        SUBMITTED: { label: t('statuses.SUBMITTED'), icon: Hourglass, className: 'bg-blue-100 text-blue-800' },
        DOCUMENTS_PENDING: { label: t('statuses.DOCUMENTS_PENDING'), icon: Clock, className: 'bg-yellow-100 text-yellow-800' },
        UNDER_REVIEW: { label: t('statuses.UNDER_REVIEW'), icon: Hourglass, className: 'bg-yellow-100 text-yellow-800' },
        APPROVED: { label: t('statuses.APPROVED'), icon: CheckCircle2, className: 'bg-green-100 text-green-800' },
        PARTIALLY_APPROVED: { label: t('statuses.PARTIALLY_APPROVED'), icon: CheckCircle2, className: 'bg-green-100 text-green-800' },
        WAITLISTED: { label: t('statuses.WAITLISTED'), icon: Clock, className: 'bg-purple-100 text-purple-800' },
        REJECTED: { label: t('statuses.REJECTED'), icon: XCircle, className: 'bg-red-100 text-red-800' },
        EXPIRED: { label: t('statuses.EXPIRED'), icon: XCircle, className: 'bg-gray-100 text-gray-800' },
    };

    if (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin')) {
        return <p>{t('noPermission')}</p>;
    }

    const applications = mockScholarshipApplications.filter(app => app.conservatoriumId === user.conservatoriumId);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between space-y-2 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('fundManagement')}</h2>
                    <p className="text-muted-foreground">{t('fundManagementDesc')}</p>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                    <Button variant="outline">{t('exportDonations')}</Button>
                    <Button>{t('addManualDonation')}</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalFundThisYear')}</CardTitle>
                        <Banknote className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₪185,000</div>
                        <p className="text-xs text-muted-foreground">{t('yearOverYear', { percent: '12' })}</p>
                    </CardContent>
                </Card>
                <Card className="glass shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('approvedScholarships')}</CardTitle>
                        <HandCoins className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₪42,500</div>
                        <p className="text-xs text-muted-foreground">{t('forStudents', { count: '24' })}</p>
                    </CardContent>
                </Card>
                <Card className="glass shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('pendingApplications')}</CardTitle>
                        <Users className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{applications.filter(a => a.status === 'SUBMITTED').length}</div>
                        <p className="text-xs text-muted-foreground">{t('totalDemand', { amount: '12,000' })}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('scholarshipApplications')}</CardTitle>
                    <CardDescription>
                        {t('scholarshipApplicationsDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4 gap-2">
                        <Input placeholder={t('searchStudent')} className="max-w-sm" />
                        <Button variant="secondary" size="icon"><Search className="h-4 w-4" /></Button>
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">{t('student')}</TableHead>
                                    <TableHead className="text-right">{t('instrument')}</TableHead>
                                    <TableHead className="text-right">{t('submissionDate')}</TableHead>
                                    <TableHead className="text-right">{t('priorityScore')}</TableHead>
                                    <TableHead className="text-right">{t('status')}</TableHead>
                                    <TableHead className="text-right">{t('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map((app) => {
                                    const StatusIcon = statusConfig[app.status]?.icon || Clock;
                                    return (
                                        <TableRow key={app.id}>
                                            <TableCell className="font-medium">{app.studentName}</TableCell>
                                            <TableCell>{app.instrument}</TableCell>
                                            <TableCell>{new Date(app.submittedAt).toLocaleDateString('he-IL')}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono">{app.priorityScore}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={statusConfig[app.status].className}>
                                                    <StatusIcon className="w-3 h-3 me-1.5" />
                                                    {statusConfig[app.status].label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm">{t('viewApplication')}</Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
