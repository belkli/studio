'use client';
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit, BookOpen, Clock, Music, UserCircle, Flame, Target, Star } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AssignedRepertoire, RepertoireStatus } from "@/lib/types";

const statusTranslations: Record<RepertoireStatus, string> = {
    LEARNING: 'למידה',
    POLISHING: 'ליטוש',
    PERFORMANCE_READY: 'מוכן להופעה',
    COMPLETED: 'הושלם'
};


export function StudentProfilePage() {
    const { user, mockPracticeLogs, mockPackages, mockAssignedRepertoire, compositions } = useAuth();
    if (!user || user.role !== 'student') return null;

    const userLogs = useMemo(() => mockPracticeLogs.filter(log => log.studentId === user.id), [mockPracticeLogs, user.id]);
    const userRepertoire = useMemo(() => mockAssignedRepertoire.filter(rep => rep.studentId === user.id), [mockAssignedRepertoire, user.id]);
    const currentPackage = useMemo(() => mockPackages.find(p => p.id === user.packageId), [mockPackages, user.packageId]);


    const { totalMinutesThisWeek, weeklyGoal, streak } = useMemo(() => {
        const weeklyGoal = user.weeklyPracticeGoal || 120; 

        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);

        const totalMinutes = userLogs.reduce((sum, log) => {
            const logDate = new Date(log.date);
            if (logDate >= oneWeekAgo && logDate <= today) {
                return sum + log.durationMinutes;
            }
            return sum;
        }, 0);

        // Calculate streak
        const logDates = [...new Set(userLogs.map(log => new Date(log.date.split('T')[0]).getTime()))].sort((a,b) => b-a);
        
        let currentStreak = 0;
        if(logDates.length > 0) {
            const todayTime = new Date();
            todayTime.setHours(0,0,0,0);
            const yesterdayTime = new Date(todayTime);
            yesterdayTime.setDate(todayTime.getDate() - 1);

            // Check if there's a log for today or yesterday to start the streak
            if (logDates[0] === todayTime.getTime() || logDates[0] === yesterdayTime.getTime()) {
                currentStreak = 1;
                for (let i = 0; i < logDates.length - 1; i++) {
                    const diff = (logDates[i] - logDates[i+1]) / (1000 * 60 * 60 * 24);
                    if (diff === 1) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }
        }

        return { totalMinutesThisWeek: totalMinutes, weeklyGoal, streak: currentStreak };
    }, [userLogs, user.weeklyPracticeGoal]);

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">ברוך הבא, {user?.name.split(' ')[0]}</h1>
                    <p className="text-muted-foreground">זהו מרכז הבקרה האישי שלך.</p>
                </div>
            </div>
            <Card>
                <CardHeader className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <CardTitle>{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                        <Link href="/dashboard/settings">
                            <Edit className="ms-2 h-4 w-4" />
                            ערוך פרופיל
                        </Link>
                    </Button>
                </CardHeader>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserCircle className="text-primary" /> המורה שלי</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-medium">{user.instruments?.[0]?.teacherName || 'טרם שויך מורה'}</p>
                        <p className="text-muted-foreground">{user.instruments?.[0]?.instrument}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Music className="text-accent"/> החבילה שלי</CardTitle>
                    </CardHeader>
                    <CardContent>
                       {currentPackage ? (
                        <>
                            <p className="text-lg font-medium">{currentPackage.title}</p>
                            <p className="text-sm text-muted-foreground">{currentPackage.description}</p>
                        </>
                       ) : (
                        <p className="text-muted-foreground">לא שויכה חבילה</p>
                       )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Target className="text-red-500" /> יעד שבועי</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-medium">{totalMinutesThisWeek} / {weeklyGoal} דקות</p>
                        <p className="text-sm text-muted-foreground">התקדמות לקראת היעד שהוגדר</p>
                         <Progress value={(totalMinutesThisWeek / weeklyGoal) * 100} className="mt-2" />
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Star /> הרפרטואר שלי</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>יצירה</TableHead>
                                    <TableHead>סטטוס</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userRepertoire.map(rep => {
                                    const composition = compositions.find(c => c.id === rep.compositionId);
                                    return (
                                        <TableRow key={rep.id}>
                                            <TableCell>
                                                <p className="font-medium">{composition?.title}</p>
                                                <p className="text-xs text-muted-foreground">{composition?.composer}</p>
                                            </TableCell>
                                            <TableCell>
                                                 <Badge variant="outline">{statusTranslations[rep.status]}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                 {userRepertoire.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-4">טרם הוגדר רפרטואר.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BookOpen /> אימונים אחרונים</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {userLogs.slice(0,3).map(log => (
                            <div key={log.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                <div>
                                    <p className="font-medium">{new Date(log.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                    <p className="text-xs text-muted-foreground">{log.pieces.map(p => p.title).join(', ')}</p>
                                </div>
                                <Badge variant={log.mood === 'GREAT' ? 'default' : 'secondary'} className={log.mood === 'HARD' ? 'bg-red-100 text-red-800' : ''}>
                                    {log.durationMinutes} דקות
                                </Badge>
                            </div>
                        ))}
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/dashboard/progress">לכל האימונים</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default StudentProfilePage;
