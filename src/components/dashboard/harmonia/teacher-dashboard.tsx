'use client';

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, ThumbsDown, Phone, MessageSquare } from "lucide-react";
import { useMemo } from "react";
import type { FormSubmission } from "@/lib/types";

function StudentRosterCard({ student }: { student: ReturnType<typeof useAuth>['user'] }) {
    if (!student) return null;
    
    return (
        <Card>
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
            <CardContent className="space-y-3 text-sm">
                <div>
                    <p className="font-semibold">השיעור הבא:</p>
                    <p className="text-muted-foreground">יום ג', 16:00 (פסנתר)</p>
                </div>
                <div>
                    <p className="font-semibold">סטטוס חבילה:</p>
                    <p className="text-muted-foreground">חבילה חודשית, 2 שיעורים נותרו</p>
                </div>
                <div>
                    <p className="font-semibold">התקדמות אימון:</p>
                    <p className="text-muted-foreground">התאמן/ה 45/90 דקות השבוע</p>
                </div>
                 <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                        <MessageSquare className="ms-2 h-4 w-4" />
                        שלח הודעה
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Phone className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}


export function TeacherDashboard() {
    const { user, users, mockLessons, mockFormSubmissions } = useAuth();
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
                 <Button variant="outline" asChild>
                    <Link href="/dashboard/teacher/availability">נהל זמינות</Link>
                </Button>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>תמונת מצב יומית</CardTitle>
                            <CardDescription>השיעורים והמשימות שלך להיום.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <h4 className="text-sm font-semibold mb-2">השיעורים להיום</h4>
                            <div className="space-y-2">
                                {todayLessons.length > 0 ? (
                                    todayLessons.map((lesson, index) => {
                                        const student = users.find(u=>u.id === lesson.studentId);
                                        return (
                                            <div key={index} className="flex items-center gap-4 text-sm p-2 rounded-md hover:bg-muted/50">
                                                <span className="font-mono text-muted-foreground">{new Date(lesson.startTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit'})}</span>
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={student?.avatarUrl} />
                                                    <AvatarFallback>{student?.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium flex-1">{student?.name}</span>
                                                <span className="text-muted-foreground">{lesson.instrument}</span>
                                                {lesson.status !== 'SCHEDULED' && <Badge variant={lesson.status === 'COMPLETED' ? 'default' : 'secondary'}>{lesson.status}</Badge>}
                                                <div className="flex gap-1">
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700"><Check /></Button>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700"><ThumbsDown /></Button>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">אין לך שיעורים מתוכננים להיום.</p>
                                )}
                            </div>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/dashboard/schedule">
                                    למערכת השעות המלאה
                                    <ArrowLeft className="ms-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                     <Card>
                        <CardHeader>
                            <CardTitle>אישורים ממתינים ({pendingApprovals.length})</CardTitle>
                            <CardDescription>טפסים שממתינים לאישורך.</CardDescription>
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
                             <Button variant="outline" className="w-full mt-4" asChild>
                                <Link href="/dashboard/approvals">
                                    לכל האישורים
                                    <ArrowLeft className="ms-2 h-4 w-4" />
                                </Link>
                            </Button>
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
                    {assignedStudents.map(student => <StudentRosterCard key={student.id} student={student} />)}
                </CardContent>
            </Card>

        </div>
    );
}
