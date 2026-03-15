'use client';

import { useAuth } from '@/hooks/use-auth';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Music, Pencil, Activity, Target, FileSignature, Loader2, FileText, Download, PlusCircle, Flame, Clock, Medal } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { RepertoireStatus } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { draftProgressReport } from '@/app/actions';
import { AssignRepertoireDialog } from '@/components/dashboard/harmonia/assign-repertoire-dialog';
import { MultimediaFeedbackCard } from '@/components/dashboard/harmonia/multimedia-feedback-card';
import { useTranslations, useLocale } from 'next-intl';


export default function TeacherStudentProfilePage() {
    const params = useParams();
    const studentId = params.id as string;
    const t = useTranslations('TeacherStudentProfile');
    const locale = useLocale();
    const {
        user: teacher,
        users,
        practiceLogs,
        assignedRepertoire,
        compositions,
        lessonNotes,
        progressReports,
        updateRepertoireStatus,
        addLessonNote,
        updateUserPracticeGoal,
        addProgressReport,
    } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const student = useMemo(() => users.find(u => u.id === studentId), [users, studentId]);

    const [practiceGoal, setPracticeGoal] = useState(() => student?.weeklyPracticeGoal ?? 120);
    const [reportDraft, setReportDraft] = useState<string | null>(null);
    const [isDrafting, setIsDrafting] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [isAssignRepertoireOpen, setIsAssignRepertoireOpen] = useState(false);

    useEffect(() => {
        if (!teacher) return;
        if (teacher.role !== 'teacher' || !teacher.students?.includes(studentId)) {
            router.push('/dashboard');
        }
    }, [teacher, studentId, router]);

    const studentLogs = useMemo(() => {
        if (!student) return [];
        return practiceLogs.filter(log => log.studentId === student.id);
    }, [practiceLogs, student]);

    const studentRepertoire = useMemo(() => {
        if (!student) return [];
        return assignedRepertoire.filter(rep => rep.studentId === student.id);
    }, [assignedRepertoire, student]);

    const studentNotes = useMemo(() => {
        if (!student) return [];
        return lessonNotes.filter(note => note.studentId === student.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [lessonNotes, student]);

    const studentReports = useMemo(() => {
        if (!student) return [];
        return progressReports.filter(report => report.studentId === student.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [progressReports, student]);

    const weeklyPracticeData = useMemo(() => {
        const today = new Date();
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - i);
            return {
                date: d.toISOString().split('T')[0],
                name: d.toLocaleDateString(locale, { weekday: 'short' }),
                minutes: 0,
            };
        }).reverse();

        (studentLogs || []).forEach(log => {
            const logDate = log.date.split('T')[0];
            const dayData = last7Days.find(d => d.date === logDate);
            if (dayData) {
                dayData.minutes += log.durationMinutes;
            }
        });
        return last7Days;
    }, [studentLogs, locale]);

    const { streak, totalMinutesThisMonth, piecesLearned } = useMemo(() => {
        const today = new Date();
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();

        const totalMinutesThisMonth = studentLogs.reduce((sum, log) => {
            const logDate = new Date(log.date);
            if (logDate.getMonth() === thisMonth && logDate.getFullYear() === thisYear) {
                return sum + log.durationMinutes;
            }
            return sum;
        }, 0);

        const piecesLearned = studentRepertoire.filter(rep => rep.status === 'COMPLETED').length;

        const logDates = [...new Set(studentLogs.map(log => new Date(log.date.split('T')[0]).getTime()))].sort((a, b) => b - a);
        let currentStreak = 0;
        if (logDates.length > 0) {
            const todayTime = new Date();
            todayTime.setHours(0, 0, 0, 0);
            const yesterdayTime = new Date(todayTime);
            yesterdayTime.setDate(todayTime.getDate() - 1);

            if (logDates[0] === todayTime.getTime() || logDates[0] === yesterdayTime.getTime()) {
                currentStreak = 1;
                for (let i = 0; i < logDates.length - 1; i++) {
                    const diff = (logDates[i] - logDates[i + 1]) / (1000 * 60 * 60 * 24);
                    if (diff === 1) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }
        }

        return { streak: currentStreak, totalMinutesThisMonth, piecesLearned };
    }, [studentLogs, studentRepertoire]);

    if (!teacher || !student) {
        return null; // Or a loading skeleton
    }

    const handleAddNote = () => {
        if (newNote.trim() === '') return;
        addLessonNote({
            studentId: student.id,
            teacherId: teacher.id,
            summary: newNote,
        });
        setNewNote('');
        toast({ title: t('noteAdded') });
    };

    const handleSetPracticeGoal = () => {
        updateUserPracticeGoal(student.id, practiceGoal);
        toast({
            title: t('goalUpdated'),
            description: t('goalUpdatedDesc', { name: student.name, minutes: practiceGoal }),
        });
    };

    const handleGenerateReport = async () => {
        setIsDrafting(true);
        setReportDraft(null);

        const input = {
            studentName: student.name,
            teacherName: teacher.name,
            instrument: student.instruments?.[0]?.instrument || t('instrument'),
            period: t('semesterSpring2024'),
            practiceLogs: studentLogs.map(l => ({
                date: l.date.split('T')[0],
                durationMinutes: l.durationMinutes,
                pieces: l.pieces?.map(p => ({ title: p.title })) || [],
                mood: l.mood || 'OKAY',
                studentNote: l.studentNote,
            })),
            lessonNotes: studentNotes.map(n => ({ createdAt: n.createdAt.split('T')[0], summary: n.summary, homeworkAssignments: n.homeworkAssignments })),
            repertoire: studentRepertoire.map(r => ({ compositionId: r.compositionId, status: r.status })),
        };

        const result = await draftProgressReport(input);
        setReportDraft(result.reportText);
        setIsDrafting(false);
    };

    const handleSendReport = () => {
        if (!reportDraft) return;

        addProgressReport({
            studentId: student.id,
            teacherId: teacher.id,
            period: t('semesterSpring2024'),
            reportText: reportDraft,
        });

        toast({
            title: t('reportSent'),
            description: t('reportSentDesc', { name: student.name }),
        });
        setReportDraft(null);
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/teacher">
                        <ArrowLeft className="ms-2 h-4 w-4" />
                        {t('backToStudents')}
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={student.avatarUrl} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl">{student.name}</CardTitle>
                        <CardDescription>{student.instruments?.map(i => i.instrument).join(', ')} {t('gradeLabel', { grade: student.grade ?? '' })}</CardDescription>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('practiceStreak')}</CardTitle>
                        <Flame className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{t('streakDays', { count: streak })}</div>
                        <p className="text-xs text-muted-foreground">{t('streakDesc')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('practiceTimeMonth')}</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{t('hours', { count: (totalMinutesThisMonth / 60).toFixed(1) })}</div>
                        <p className="text-xs text-muted-foreground">{t('totalMinutes', { count: totalMinutesThisMonth })}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('completedRepertoire')}</CardTitle>
                        <Medal className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{t('pieces', { count: piecesLearned })}</div>
                        <p className="text-xs text-muted-foreground">{t('sinceYearStart')}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><Music /> {t('repertoire')}</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => setIsAssignRepertoireOpen(true)}>
                            <PlusCircle className="ms-2 h-4 w-4" />
                            {t('assignNewPiece')}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('piece')}</TableHead>
                                    <TableHead className="w-[150px]">{t('statusCol')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentRepertoire.map(rep => {
                                    const composition = compositions.find(c => c.id === rep.compositionId);
                                    return (
                                        <TableRow key={rep.id}>
                                            <TableCell>
                                                <p className="font-medium">{composition?.title}</p>
                                                <p className="text-xs text-muted-foreground">{composition?.composer}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={rep.status}
                                                    onValueChange={(newStatus: RepertoireStatus) => updateRepertoireStatus(rep.id, newStatus)}
                                                    dir={locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr'}
                                                >
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="LEARNING">{t('statusLearning')}</SelectItem>
                                                        <SelectItem value="POLISHING">{t('statusPolishing')}</SelectItem>
                                                        <SelectItem value="PERFORMANCE_READY">{t('statusPerformanceReady')}</SelectItem>
                                                        <SelectItem value="COMPLETED">{t('statusCompleted')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Target /> {t('weeklyPracticeGoal')}</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <Label htmlFor="practice-goal">{t('minutesPerWeek')}</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="practice-goal"
                                    type="number"
                                    dir="ltr"
                                    value={practiceGoal}
                                    onChange={(e) => setPracticeGoal(Number(e.target.value))}
                                    step={15}
                                />
                                <Button onClick={handleSetPracticeGoal}>{t('setGoal')}</Button>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Activity /> {t('practiceActivity')}</CardTitle></CardHeader>
                        <CardContent className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyPracticeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => t('minutesShort', { value })} />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(value: any) => [t('minutesShort', { value }), t('practiceTime')]}
                                    />
                                    <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <MultimediaFeedbackCard student={student} />

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Pencil /> {t('lessonNotes')}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4 max-h-64 overflow-y-auto pe-2">
                        {studentNotes.length > 0 ? studentNotes.map(note => (
                            <div key={note.id} className="border-b pb-2">
                                <p className="text-sm">{note.summary}</p>
                                <p className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleString(locale)}</p>
                            </div>
                        )) : (
                            <p className="text-center text-muted-foreground py-4">{t('noNotesYet')}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Textarea placeholder={t('writeNewNote')} value={newNote} onChange={(e) => setNewNote(e.target.value)} />
                        <Button onClick={handleAddNote}>{t('addNote')}</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileSignature /> {t('semesterReport')}</CardTitle>
                    <CardDescription>{t('semesterReportDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!reportDraft && (
                        <div className="text-center">
                            <Button onClick={handleGenerateReport} disabled={isDrafting}>
                                {isDrafting ? <><Loader2 className="ms-2 h-4 w-4 animate-spin" /> {t('generatingDraft')}</> : t('generateDraft')}
                            </Button>
                        </div>
                    )}
                    {isDrafting && !reportDraft && (
                        <div className="flex justify-center items-center p-8 text-muted-foreground">
                            <Loader2 className="ms-2 h-6 w-6 animate-spin" />
                            <span>{t('analyzingData')}</span>
                        </div>
                    )}
                    {reportDraft && (
                        <div>
                            <Label htmlFor="report-draft">{t('reportDraftLabel')}</Label>
                            <Textarea id="report-draft" rows={15} value={reportDraft} onChange={(e) => setReportDraft(e.target.value)} className="mt-2 bg-background" />
                        </div>
                    )}
                </CardContent>
                {reportDraft && (
                    <CardFooter className="justify-end gap-2">
                        <Button variant="ghost" onClick={() => setReportDraft(null)}>{t('deleteDraft')}</Button>
                        <Button onClick={handleSendReport}>{t('sendReport')}</Button>
                    </CardFooter>
                )}
            </Card>

            {studentReports.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><FileText /> {t('savedReports')}</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('period')}</TableHead>
                                    <TableHead>{t('dateSent')}</TableHead>
                                    <TableHead className="text-start">{t('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentReports.map(report => (
                                    <TableRow key={report.id}>
                                        <TableCell>{report.period}</TableCell>
                                        <TableCell>{new Date(report.createdAt).toLocaleDateString(locale)}</TableCell>
                                        <TableCell className="text-start">
                                            <Button variant="outline" size="sm" disabled>
                                                <Download className="ms-2 h-3 w-3" />
                                                {t('download')}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <AssignRepertoireDialog
                studentId={student.id}
                open={isAssignRepertoireOpen}
                onOpenChange={setIsAssignRepertoireOpen}
            />

        </div>
    )
}
