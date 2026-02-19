'use client';

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, PlusCircle } from "lucide-react";
import { useMemo } from "react";
import type { User, PracticeLog, Package } from "@/lib/types";

function StudentRosterCard({ student, practiceLogs, mockPackages }: { student: User, practiceLogs: PracticeLog[], mockPackages: Package[] }) {
    
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
                    <p className="text-muted-foreground">יום ג', 16:00 (פסנתר)</p>
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


function TodaySnapshotCardForTeacher({ todayLessonsCount, pendingApprovalsCount }: { todayLessonsCount: number, pendingApprovalsCount: number }) {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>תמונת מצב יומית</CardTitle>
                <CardDescription>השיעורים והמשימות שלך להיום.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/50">
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{todayLessonsCount}</span>
                    <span className="text-sm text-muted-foreground mt-1">שיעורים להיום</span>
                </div>
                 <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/50">
                    <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">{pendingApprovalsCount}</span>
                    <span className="text-sm text-muted-foreground mt-1">אישורים ממתינים</span>
                </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/schedule">
                        למערכת המלאה
                        <ArrowLeft className="ms-2 h-4 w-4" />
                    </Link>
                </Button>
                 <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/approvals">
                        טפל באישור
                        <ArrowLeft className="ms-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export function TeacherDashboard() {
    const { user, users, mockLessons, mockFormSubmissions, mockPracticeLogs, mockPackages } = useAuth();
    if (!user) return null;
    
    const assignedStudents = users.filter(u => user.students?.includes(u.id));

    const today = new Date();
    const todayLessons = mockLessons.filter(lesson => 
        lesson.teacherId === user.id && 
        new Date(lesson.startTime).toDateString() === today.toDateString()
    );

    const pendingApprovals = useMemo(() => {
        return mockFormSubmissions.filter(form => 
            form.status === 'ממתין לאישור מורה' &&
            user.students?.includes(form.studentId)
        )
    }, [mockFormSubmissions, user.students]);


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">ברוך הבא, {user.name.split(' ')[0]}</h1>
                    <p className="text-muted-foreground">זהו לוח הבקרה שלך להיום.</p>
                </div>
                <div className="flex gap-2">
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
                <div className="lg:col-span-1">
                    <TodaySnapshotCardForTeacher 
                        todayLessonsCount={todayLessons.length} 
                        pendingApprovalsCount={pendingApprovals.length} 
                    />
                </div>
                 <div className="lg:col-span-2">
                     <Card>
                        <CardHeader>
                            <CardTitle>אישורים אחרונים ממתינים ({pendingApprovals.length})</CardTitle>
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
                    </Card>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>התלמידים שלי ({assignedStudents.length})</CardTitle>
                    <CardDescription>נהל את התלמידים שלך, עקוב אחר התקדמותם ותקשר איתם.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {assignedStudents.map(student => <StudentRosterCard key={student.id} student={student} practiceLogs={mockPracticeLogs.filter(log => log.studentId === student.id)} mockPackages={mockPackages} />)}
                </CardContent>
            </Card>

        </div>
    );
}
