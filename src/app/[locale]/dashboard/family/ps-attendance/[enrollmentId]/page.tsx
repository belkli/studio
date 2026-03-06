'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Calendar, User, BookOpen, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useDateLocale } from '@/hooks/use-date-locale';
import { format } from 'date-fns';

export default function PlayingSchoolAttendancePage() {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations('PlayingSchool.attendance');
    const dateLocale = useDateLocale();
    const { users, user } = useAuth();

    // Mock attendance data for demonstration
    const attendanceLog = [
        { id: '1', date: '2024-03-24T08:30:00Z', status: 'PRESENT', topic: 'Introduction to Breath Support' },
        { id: '2', date: '2024-03-17T08:30:00Z', status: 'PRESENT', topic: 'First Scale: G Major' },
        { id: '3', date: '2024-03-10T08:30:00Z', status: 'EXCUSED', topic: 'Note Reading Basics' },
        { id: '4', date: '2024-03-03T08:30:00Z', status: 'PRESENT', topic: 'Instrument Assembly' },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PRESENT':
                return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"><CheckCircle2 className="h-3 w-3 me-1" /> {t('present')}</Badge>;
            case 'ABSENT':
                return <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200"><XCircle className="h-3 w-3 me-1" /> {t('absent')}</Badge>;
            case 'EXCUSED':
                return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200"><Clock className="h-3 w-3 me-1" /> {t('excused')}</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('totalLessons')}</CardDescription>
                        <CardTitle className="text-2xl">12</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('presentCount')}</CardDescription>
                        <CardTitle className="text-2xl text-emerald-600">10</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('attendanceRate')}</CardDescription>
                        <CardTitle className="text-2xl text-indigo-600">83%</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('nextLesson')}</CardDescription>
                        <CardTitle className="text-2xl">Tomorrow</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-indigo-600" />
                        {t('historyTitle')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('date')}</TableHead>
                                <TableHead>{t('topic')}</TableHead>
                                <TableHead>{t('status')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendanceLog.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {format(new Date(item.date), 'PPP', { locale: dateLocale })}
                                    </TableCell>
                                    <TableCell>{item.topic}</TableCell>
                                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
