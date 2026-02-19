'use client';

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, Users, ArrowLeft, BookOpen, MessageSquare, Check, ThumbsDown, Phone, FileCheck } from "lucide-react";
import { mockLessons } from "@/lib/data";

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
    const { user, users } = useAuth();
    if (!user) return null;
    
    const assignedStudents = users.filter(u => user.students?.includes(u.id));

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
                                {mockLessons.filter(l => l.teacherId === user.id).map((lesson, index) => (
                                     <div key={index} className="flex items-center gap-4 text-sm p-2 rounded-md hover:bg-muted/50">
                                        <span className="font-mono text-muted-foreground">{new Date(lesson.startTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit'})}</span>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={users.find(u=>u.id === lesson.studentId)?.avatarUrl} />
                                            <AvatarFallback>{users.find(u=>u.id === lesson.studentId)?.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium flex-1">{users.find(u=>u.id === lesson.studentId)?.name}</span>
                                        <span className="text-muted-foreground">{lesson.instrument}</span>
                                        {lesson.status !== 'SCHEDULED' && <Badge variant={lesson.status === 'COMPLETED' ? 'default' : 'secondary'}>{lesson.status}</Badge>}
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700"><Check /></Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700"><ThumbsDown /></Button>
                                        </div>
                                    </div>
                                ))}
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
                            <CardTitle>אישורים ממתינים</CardTitle>
                            <CardDescription>טפסים שממתינים לאישורך.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Avatar><AvatarFallback>א</AvatarFallback></Avatar>
                                    <div>
                                        <p className="text-sm font-medium">אריאל לוי</p>
                                        <p className="text-xs text-muted-foreground">רסיטל בגרות</p>
                                    </div>
                                    <Button size="sm" variant="outline" className="me-auto" asChild><Link href="/dashboard/approvals">צפה</Link></Button>
                                </div>
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
