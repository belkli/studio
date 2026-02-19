'use client';

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, PlusCircle, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import type { User, PracticeLog, Package, LessonSlot, SlotStatus } from "@/lib/types";
import { format } from "date-fns";
import { he } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { SickLeaveModal } from "./sick-leave-modal";

function TodaysLessonCard({ lesson, student, onAttendance }: { lesson: LessonSlot; student: User | undefined; onAttendance: (lessonId: string, status: SlotStatus) => void }) {
    const isPast = new Date(lesson.startTime) < new Date();
    const isCancelled = lesson.status.startsWith('CANCELLED') || lesson.status.startsWith('NO_SHOW');
    const isCompleted = lesson.status === 'COMPLETED';

    const attendanceButtons = (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onAttendance(lesson.id, 'COMPLETED')}>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>סמן נוכחות</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onAttendance(lesson.id, 'NO_SHOW_STUDENT')}>
                            <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>סמן אי-הגעה (ללא הודעה)</p></TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onAttendance(lesson.id, 'CANCELLED_STUDENT_NOTICED')}>
                            <Clock className="h-4 w-4 text-orange-500" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>סמן היעדרות (עם הודעה)</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </>
    );

    return (
        <div className="flex items-center gap-4 p-3 rounded-lg border">
            <span className="font-mono text-muted-foreground">{new Date(lesson.startTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit'})}</span>
            <Avatar>
                <AvatarImage src={student?.avatarUrl} />
                <AvatarFallback>{student?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="font-semibold">{student?.name}</p>
                <p className="text-sm text-muted-foreground">
                    {lesson.instrument}, חדר {lesson.roomId || '?'}
                </p>
            </div>
            <div className="flex gap-2">
                {!isPast && !isCancelled && !isCompleted && attendanceButtons}
                {isCancelled && <Badge variant="destructive">{lesson.status === 'NO_SHOW_STUDENT' ? 'לא הגיע' : 'בוטל'}</Badge>}
                {isCompleted && <Badge>הושלם</Badge>}
                {isPast && !isCompleted && !isCancelled && <Badge variant="secondary">ממתין לסימון</Badge>}
            </div>
        </div>
    );
}


function StudentRosterCard({ student, practiceLogs, mockPackages, lessons }: { student: User, practiceLogs: PracticeLog[], mockPackages: Package[], lessons: LessonSlot[] }) {
    
    const weeklyPractice = useMemo(() => {
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);

        return practiceLogs.reduce((sum, log) => {
            const logDate = new Date(log.date);
            if (logDate >= oneWeekAgo && logDate <= today) {
                return sum + log.durationMinutes;
            }
            return sum;
        }, 0);
    }, [practiceLogs]);

    const studentPackage = mockPackages.find(p => p.id === student.packageId);
    
    const nextLesson = useMemo(() => {
        const now = new Date();
        return lessons
            .filter(l => l.studentId === student.id && new Date(l.startTime) >= now)
            .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            [0];
    }, [lessons, student.id]);

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4">
                 <Avatar className="h-12 w-12">
                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-lg">{student.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{student.instruments?.map(i => i.instrument).join(', ')}</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm flex-grow">
                <div>
                    <p className="font-semibold">השיעור הבא:</p>
                    {nextLesson ? (
                        <p className="text-muted-foreground">{format(new Date(nextLesson.startTime), "EEEE, dd/MM 'בשעה' HH:mm", { locale: he })} ({nextLesson.instrument})</p>
                    ) : (
                        <p className="text-muted-foreground">אין שיעור קרוב</p>
                    )}
                </div>
                <div>
                    <p className="font-semibold">סטטוס חבילה:</p>
                    <p className="text-muted-foreground">{studentPackage?.title || 'לא שויכה חבילה'}</p>
                </div>
                <div>
                    <p className="font-semibold">התקדמות אימון:</p>
                    {weeklyPractice > 0 ? (
                        <p className="text-muted-foreground">התאמן/ה {weeklyPractice} דקות השבוע</p>
                    ) : (
                        <p className="text-muted-foreground text-orange-600">לא דווח אימון השבוע</p>
                    )}
                </div>
                 <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                       <Link href={`/dashboard/teacher/student/${student.id}`}>
                            <ArrowLeft className="ms-2 h-4 w-4" />
                           פרופיל מלא
                       </Link>
                    </Button>
                     <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/messages" title="שלח הודעה">
                            <MessageSquare className="h-4 w-4" />
                            <span className="sr-only">שלח הודעה</span>
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function TeacherDashboard() {
    const { user, users, mockLessons, mockFormSubmissions, mockPracticeLogs, mockPackages, updateLessonStatus } = useAuth();
    const { toast } = useToast();
    const [isSickLeaveModalOpen, setIsSickLeaveModalOpen] = useState(false);

    if (!user) return null;
    
    const assignedStudents = users.filter(u => user.students?.includes(u.id));

    const today = new Date();
    const todayLessons = mockLessons.filter(lesson => 
        lesson.teacherId === user.id && 
        new Date(lesson.startTime).toDateString() === today.toDateString()
    ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const pendingApprovals = useMemo(() => {
        return mockFormSubmissions.filter(form => 
            form.status === 'ממתין לאישור מורה' &&
            user.students?.includes(form.studentId)
        )
    }, [mockFormSubmissions, user.students]);

    const handleAttendance = (lessonId: string, status: SlotStatus) => {
        updateLessonStatus(lessonId, status);
        toast({
            title: "הנוכחות סומנה",
            description: `סטטוס השיעור עודכן.`
        });
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">ברוך הבא, {user.name.split(' ')[0]}</h1>
                    <p className="text-muted-foreground">זהו לוח הבקרה שלך להיום.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="destructive" onClick={() => setIsSickLeaveModalOpen(true)}>
                        <XCircle className="ms-2 h-4 w-4" />
                        דיווח מחלה / היעדרות
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/forms/new">
                            <PlusCircle className="ms-2 h-4 w-4" />
                            טופס חדש
                        </Link>
                    </Button>
                     <Button variant="secondary" asChild>
                        <Link href="/dashboard/teacher/availability">נהל זמינות</Link>
                    </Button>
                </div>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>השיעורים להיום</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                           {todayLessons.length > 0 ? todayLessons.map(lesson => (
                                <TodaysLessonCard 
                                    key={lesson.id} 
                                    lesson={lesson} 
                                    student={users.find(u => u.id === lesson.studentId)}
                                    onAttendance={handleAttendance}
                                />
                           )) : (
                                <p className="text-center text-muted-foreground py-8">אין שיעורים מתוכננים להיום.</p>
                           )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>אישורים ממתינים ({pendingApprovals.length})</CardTitle>
                            <CardDescription>הטפסים האחרונים שהוגשו וממתינים לאישורך.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-3">
                                {pendingApprovals.length > 0 ? pendingApprovals.slice(0, 3).map(form => {
                                    const student = users.find(u => u.id === form.studentId);
                                    return (
                                        <div key={form.id} className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={student?.avatarUrl} />
                                                <AvatarFallback>{form.studentName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">{form.studentName}</p>
                                                <p className="text-xs text-muted-foreground">{form.formType}</p>
                                            </div>
                                            <Button size="sm" variant="outline" className="me-auto" asChild><Link href={`/dashboard/forms/${form.id}`}>צפה</Link></Button>
                                        </div>
                                    )
                                }) : (
                                    <p className="text-muted-foreground text-center py-4">אין טפסים הממתינים לאישורך.</p>
                                )}
                            </div>
                        </CardContent>
                        {pendingApprovals.length > 0 && 
                            <CardFooter>
                                <Button variant="secondary" className="w-full" asChild><Link href="/dashboard/approvals">לכל האישורים</Link></Button>
                            </CardFooter>
                        }
                    </Card>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>התלמידים שלי ({assignedStudents.length})</CardTitle>
                    <CardDescription>נהל את התלמידים שלך, עקוב אחר התקדמותם ותקשר איתם.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {assignedStudents.map(student => <StudentRosterCard key={student.id} student={student} practiceLogs={mockPracticeLogs.filter(log => log.studentId === student.id)} mockPackages={mockPackages} lessons={mockLessons} />)}
                </CardContent>
            </Card>
            <SickLeaveModal open={isSickLeaveModalOpen} onOpenChange={setIsSickLeaveModalOpen} />
        </div>
    );
}
