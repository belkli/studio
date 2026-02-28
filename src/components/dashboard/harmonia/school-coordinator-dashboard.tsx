'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Users, MessageSquare, School, AlertCircle, CheckCircle } from 'lucide-react';

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_SCHOOL = {
    name: 'בית ספר אורט רמת גן',
    symbol: '410234',
    teacherName: 'מיכל כהן',
    instrument: 'חליל',
    lessonDay: 'רביעי',
    lessonTime: '10:00',
    room: 'חדר מוסיקה 3',
    enrolledCount: 11,
    maxStudents: 12,
};

const MOCK_STUDENTS = [
    { id: 's1', name: 'דניאל לוי', grade: "ב'", class: "1ב", paymentStatus: 'PAID' as const, instrumentStatus: 'Received' },
    { id: 's2', name: 'נועה שמיר', grade: "ב'", class: "1ב", paymentStatus: 'PAID' as const, instrumentStatus: 'Received' },
    { id: 's3', name: 'יונתן ברק', grade: "ג'", class: "2ג", paymentStatus: 'PENDING' as const, instrumentStatus: 'Pending pickup' },
    { id: 's4', name: 'מיה אברהים', grade: "ג'", class: "2ג", paymentStatus: 'PAID' as const, instrumentStatus: 'Received' },
    { id: 's5', name: 'עומר ישראלי', grade: "ב'", class: "1ב", paymentStatus: 'PAID' as const, instrumentStatus: 'Received' },
];

const MOCK_UPCOMING_LESSONS = [
    { date: '5 במרץ 2026', dayOfWeek: 'רביעי', time: '10:00–10:45', status: 'SCHEDULED' },
    { date: '12 במרץ 2026', dayOfWeek: 'רביעי', time: '10:00–10:45', status: 'SCHEDULED' },
    { date: '19 במרץ 2026', dayOfWeek: 'רביעי', time: '10:00–10:45', status: 'SCHEDULED' },
];

// ── Main Component ────────────────────────────────────────────────────────────

export function SchoolCoordinatorDashboard() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <School className="h-7 w-7 text-primary" />
                <div>
                    <h1 className="text-2xl font-bold">{MOCK_SCHOOL.name}</h1>
                    <p className="text-muted-foreground">רכז/ת בית ספר מנגן — סמל מוסד {MOCK_SCHOOL.symbol}</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">תלמידים רשומים</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{MOCK_SCHOOL.enrolledCount} / {MOCK_SCHOOL.maxStudents}</div>
                        <p className="text-xs text-muted-foreground">כיתה {MOCK_SCHOOL.instrument}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">מורה שיעורים</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">{MOCK_SCHOOL.teacherName}</div>
                        <p className="text-xs text-muted-foreground">{MOCK_SCHOOL.lessonDay} {MOCK_SCHOOL.lessonTime} | {MOCK_SCHOOL.room}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">שיעור הבא</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">{MOCK_UPCOMING_LESSONS[0].date}</div>
                        <p className="text-xs text-muted-foreground">{MOCK_UPCOMING_LESSONS[0].time}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">סקירה</TabsTrigger>
                    <TabsTrigger value="students">רשימת תלמידים</TabsTrigger>
                    <TabsTrigger value="calendar">לוח שיעורים</TabsTrigger>
                    <TabsTrigger value="messages">הודעות</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                התראות
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm p-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                    <span>תלמיד/ה אחד/ת עדיין לא אסף/ה כלי נגינה.</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm p-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                    <span>תשלום אחד ממתין אישור (יונתן ברק).</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm p-2 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    <span>כל שיעורי החודש מאושרים.</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="students" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>רשימת תלמידים</CardTitle>
                            <CardDescription>תלמידי בית ספר מנגן הרשומים בבית ספרך</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>שם</TableHead>
                                        <TableHead>כיתה</TableHead>
                                        <TableHead>תשלום</TableHead>
                                        <TableHead>כלי נגינה</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {MOCK_STUDENTS.map(s => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-medium">{s.name}</TableCell>
                                            <TableCell>{s.grade} | {s.class}</TableCell>
                                            <TableCell>
                                                <Badge variant={s.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                                                    {s.paymentStatus === 'PAID' ? 'שולם' : 'ממתין'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{s.instrumentStatus}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="calendar" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                לוח שיעורים קרובים
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {MOCK_UPCOMING_LESSONS.map((lesson, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                                        <div>
                                            <p className="font-medium">{lesson.date}</p>
                                            <p className="text-sm text-muted-foreground">{lesson.dayOfWeek} | {lesson.time}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">מתוכנן</Badge>
                                            <Button variant="ghost" size="sm">דיווח אי-זמינות</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="messages" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                הודעות
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">מודול ההודעות ייפתח בשלב 3 של הפיתוח.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
