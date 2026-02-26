'use client';
import { useState } from 'react';
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
import { Music, Calendar, Clock, Trophy, Flame, PlayCircle, Star, Video, UploadCloud } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export function StudentPracticePanel() {
    const { user, mockPracticeLogs, mockAssignedRepertoire, addPracticeLog } = useAuth();
    const { toast } = useToast();

    const [duration, setDuration] = useState('30');
    const [repertoireId, setRepertoireId] = useState('');
    const [notes, setNotes] = useState('');
    const [videoAttached, setVideoAttached] = useState(false);

    // Derived state
    const myLogs = mockPracticeLogs.filter(pl => pl.studentId === user?.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const myRepertoire = mockAssignedRepertoire.filter(r => r.studentId === user?.id && r.status !== 'COMPLETED');

    const totalMinutes = myLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
    const streak = user?.gamification?.currentStreak || 0;
    const points = user?.gamification?.points || 0;

    const handleLogPractice = () => {
        if (!user || !repertoireId) return;

        const numDuration = parseInt(duration);
        if (isNaN(numDuration) || numDuration <= 0) {
            toast({ title: 'משך חייב להיות מספר חיובי', variant: 'destructive' });
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
            title: 'האימון תועד בהצלחה! 🌟',
            description: `הרווחת ${newLogData.pointsEarned} נקודות.`
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-orange-800 flex items-center justify-between">רצף אימונים <Flame className="h-4 w-4 text-orange-500" /></CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-700">{streak} ימים</div>
                        <p className="text-xs text-orange-600/80 mt-1">המשך לתרגל כדי לא לאבד את הרצף!</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 flex items-center justify-between">זמן תרגול (החודש) <Clock className="h-4 w-4 text-blue-500" /></CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-700">{totalMinutes} דקות</div>
                        <p className="text-xs text-blue-600/80 mt-1">מקביל ל-{Math.round(totalMinutes / 60)} שעות נגינה</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-800 flex items-center justify-between">נקודות מדור <Trophy className="h-4 w-4 text-yellow-500" /></CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-700">{points}</div>
                        <p className="text-xs text-yellow-600/80 mt-1">מקום 4 בקונסרבטוריון החודש!</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <Card className="md:col-span-1 shadow-sm border-t-4 border-t-primary">
                    <CardHeader>
                        <CardTitle>תיעוד אימון חדש</CardTitle>
                        <CardDescription>תעד את התרגול שלך, שלח הקלטות למורה וצבור נקודות!</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>על מה התאמנת?</Label>
                            <Select dir="rtl" value={repertoireId} onValueChange={setRepertoireId}>
                                <SelectTrigger><SelectValue placeholder="בחר יצירה/משימה..." /></SelectTrigger>
                                <SelectContent>
                                    {myRepertoire.length === 0 ? (
                                        <SelectItem value="none" disabled>לא הוגדרו משימות</SelectItem>
                                    ) : (
                                        myRepertoire.map(rep => (
                                            <SelectItem key={rep.id} value={rep.id}>
                                                {rep.compositionDetails?.title || 'יצירה'}
                                            </SelectItem>
                                        ))
                                    )}
                                    <SelectItem value="general">תרגול עצמאי כללי / סולמות</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>משך החזרה (בדקות)</Label>
                            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min={1} />
                        </div>
                        <div className="space-y-2">
                            <Label>הערות אישיות / שאלות למורה</Label>
                            <Textarea
                                placeholder="למשל: נתקעתי בתיבה 12 בגלל הקצב..."
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
                                    <span className="font-medium block">{videoAttached ? 'הקלטת וידאו מצורפת' : 'צרף הקלטת וידאו'}</span>
                                    <span className="text-muted-foreground text-xs">+20 נקודות בונוס</span>
                                </div>
                            </div>
                            {!videoAttached && <UploadCloud className="w-4 h-4 text-muted-foreground" />}
                            {videoAttached && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleLogPractice} disabled={!repertoireId}>
                            <PlayCircle className="w-4 h-4 mr-2" /> שלח דיווח אימון
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="md:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Music className="w-5 h-5 text-primary" /> יומן האימונים שלי</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>תאריך</TableHead>
                                    <TableHead>יצירה / נושא</TableHead>
                                    <TableHead>משך (דקות)</TableHead>
                                    <TableHead>פידבק / בונוסים</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myLogs.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">עוד לא תעדת אימונים. זה הזמן להתחיל!</TableCell></TableRow>
                                ) : (
                                    myLogs.slice(0, 10).map(log => {
                                        const rep = mockAssignedRepertoire.find(r => r.id === log.repertoireId);
                                        const title = log.repertoireId === 'general' ? 'תרגול עצמאי כללי / סולמות' : (rep?.compositionDetails?.title || 'יצירה לא ידועה');
                                        return (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3 h-3 text-muted-foreground" />
                                                        {format(new Date(log.date), 'dd/MM/yyyy')}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{title}</TableCell>
                                                <TableCell>{log.durationMinutes} דק'</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        {log.videoAttached && <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 w-fit text-[10px]"><Video className="w-3 h-3 mr-1" /> פידבק במערכת</Badge>}
                                                        <Badge variant="outline" className="w-fit text-[10px] text-yellow-600 border-yellow-200 bg-yellow-50"><Star className="w-3 h-3 mr-1 fill-yellow-400" /> +{log.pointsEarned} נק'</Badge>
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
