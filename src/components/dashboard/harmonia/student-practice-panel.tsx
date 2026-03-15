'use client';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { PracticeLog } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Music, Calendar, Clock, Trophy, Flame, PlayCircle, Star, Video, UploadCloud, Activity, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import { useTranslations, useLocale } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function StudentPracticePanel() {
    const { user, practiceLogs, assignedRepertoire, addPracticeLog } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('StudentPractice');
    const dateLocale = useDateLocale();
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    const [duration, setDuration] = useState('30');
    const [repertoireId, setRepertoireId] = useState('');
    const [notes, setNotes] = useState('');
    const [videoAttached, setVideoAttached] = useState(false);

    // Derived state
    const myLogs = practiceLogs.filter(pl => pl.studentId === user?.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const myRepertoire = assignedRepertoire.filter(r => r.studentId === user?.id && r.status !== 'COMPLETED');

    const totalMinutes = myLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
    const streak = user?.gamification?.currentStreak || 0;
    const points = user?.gamification?.points || 0;

    const weeklyPracticeData = useMemo(() => {
        const today = new Date();
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - i);
            return {
                date: d.toISOString().split('T')[0],
                name: format(d, 'EEE', { locale: dateLocale }),
                minutes: 0,
            };
        }).reverse();

        myLogs.forEach(log => {
            const logDate = log.date.split('T')[0];
            const dayData = last7Days.find(d => d.date === logDate);
            if (dayData) {
                dayData.minutes += log.durationMinutes;
            }
        });
        return last7Days;
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    }, [myLogs, dateLocale]);

    const handleLogPractice = () => {
        if (!user || !repertoireId) return;

        const numDuration = parseInt(duration);
        if (isNaN(numDuration) || numDuration <= 0) {
            toast({ title: t('durationMustBePositive'), variant: 'destructive' });
            return;
        }

        const newLogData: Partial<PracticeLog> = {
            studentId: user.id,
            date: new Date().toISOString(),
            durationMinutes: numDuration,
            repertoireId: repertoireId,
            notes,
            videoAttached,
            pointsEarned: numDuration + (videoAttached ? 20 : 0) // Basic scoring formula
        };

        addPracticeLog(newLogData);

        setDuration('30');
        setNotes('');
        setVideoAttached(false);
        setRepertoireId('');

        // Show gamification feedback depending on what happened
        toast({
            title: t('practiceLoggedTitle'),
            description: t('pointsEarnedDesc', { points: newLogData.pointsEarned ?? 0 })
        });
    };

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-orange-800 flex items-center justify-between">{t('streakTitle')} <Flame className="h-4 w-4 text-orange-500" /></CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-700">{streak} {t('daysLabel')}</div>
                        <p className="text-xs text-orange-600/80 mt-1">{t('keepPracticing')}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 flex items-center justify-between">{t('timePracticed')} <Clock className="h-4 w-4 text-blue-500" /></CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-700">{totalMinutes} {t('minutesLabel')}</div>
                        <p className="text-xs text-blue-600/80 mt-1">{t('equivToHours', { hours: Math.round(totalMinutes / 60) })}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-800 flex items-center justify-between">{t('generationPoints')} <Trophy className="h-4 w-4 text-yellow-500" /></CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-700">{points}</div>
                        <p className="text-xs text-yellow-600/80 mt-1">{t('ranking')}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <Card className="md:col-span-1 shadow-sm border-t-4 border-t-primary">
                    <CardHeader>
                        <CardTitle>{t('logNewPracticeTitle')}</CardTitle>
                        <CardDescription>{t('logNewPracticeDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('whatDidYouPractice')}</Label>
                            <Select dir={isRtl ? 'rtl' : 'ltr'} value={repertoireId} onValueChange={setRepertoireId}>
                                <SelectTrigger><SelectValue placeholder={t('selectPiece')} /></SelectTrigger>
                                <SelectContent>
                                    {myRepertoire.length === 0 ? (
                                        <SelectItem value="none" disabled>{t('noTasksDefined')}</SelectItem>
                                    ) : (
                                        myRepertoire.map(rep => (
                                            <SelectItem key={rep.id} value={rep.id}>
                                                {rep.compositionDetails?.title || t('pieceLabel')}
                                            </SelectItem>
                                        ))
                                    )}
                                    <SelectItem value="general">{t('generalPractice')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('durationLabel')}</Label>
                            <Input type="number" dir="ltr" value={duration} onChange={(e) => setDuration(e.target.value)} min={1} />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('personalNotesLabel')}</Label>
                            <Textarea
                                placeholder={t('notesPlaceholder')}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                        <div className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-colors ${videoAttached ? 'bg-indigo-50 border-indigo-200' : 'bg-muted/30 hover:bg-muted/60'}`} onClick={() => setVideoAttached(!videoAttached)}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${videoAttached ? 'bg-indigo-100 text-indigo-600' : 'bg-muted text-muted-foreground'}`}>
                                    <Video className="w-4 h-4" />
                                </div>
                                <div className="text-sm">
                                    <span className="font-medium block">{videoAttached ? t('videoAttached') : t('attachVideo')}</span>
                                    <span className="text-muted-foreground text-xs">{t('bonusPoints')}</span>
                                </div>
                            </div>
                            {!videoAttached && <UploadCloud className="w-4 h-4 text-muted-foreground" />}
                            {videoAttached && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleLogPractice} disabled={!repertoireId}>
                            <PlayCircle className="w-4 h-4 me-2" /> {t('sendReportBtn')}
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="md:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> {t('weeklyProgress')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyPracticeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} ${t('chartMinAbbrev')}`} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', direction: isRtl ? 'rtl' : 'ltr' }}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter={(value: any) => [`${value} ${t('chartMinAbbrev')}`, t('chartTooltipTime')]}
                                />
                                <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Music className="w-5 h-5 text-primary" /> {t('myPracticeLog')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-start">{t('colDate')}</TableHead>
                                    <TableHead className="text-start">{t('colTopic')}</TableHead>
                                    <TableHead className="text-start">{t('colDuration')}</TableHead>
                                    <TableHead className="text-start">{t('colFeedback')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myLogs.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t('noLogsFound')}</TableCell></TableRow>
                                ) : (
                                    myLogs.slice(0, 10).map(log => {
                                        const rep = assignedRepertoire.find(r => r.id === log.repertoireId);
                                        const title = log.repertoireId === 'general' ? t('generalPractice') : (rep?.compositionDetails?.title || t('unknownPiece'));
                                        return (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3 h-3 text-muted-foreground" />
                                                        {format(new Date(log.date), 'PP', { locale: dateLocale })}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{title}</TableCell>
                                                <TableCell>{log.durationMinutes} {t('chartMinAbbrev')}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        {log.videoAttached && <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 w-fit text-[10px]"><Video className="w-3 h-3 me-1" /> {t('systemFeedback')}</Badge>}
                                                        <Badge variant="outline" className="w-fit text-[10px] text-yellow-600 border-yellow-200 bg-yellow-50"><Star className="w-3 h-3 me-1 fill-yellow-400" /> +{log.pointsEarned} {t('ptsLabel')}</Badge>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
