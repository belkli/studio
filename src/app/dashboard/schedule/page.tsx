'use client';
import { useAuth } from "@/hooks/use-auth";
import { mockLessons } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Video, MapPin, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import type { LessonSlot } from "@/lib/types";

function LessonItem({ lesson, userRole, users }: { lesson: LessonSlot, userRole: string, users: any[] }) {
    const isPast = new Date(lesson.startTime) < new Date();
    const otherUser = userRole === 'teacher' ? users.find(u => u.id === lesson.studentId) : users.find(u => u.id === lesson.teacherId);
    
    return (
        <div className="flex items-center gap-4 text-sm p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex flex-col items-center w-16">
                <span className="font-bold text-lg">{new Date(lesson.startTime).toLocaleDateString('he-IL', { day: '2-digit' })}</span>
                <span className="text-muted-foreground">{new Date(lesson.startTime).toLocaleDateString('he-IL', { month: 'short' })}</span>
            </div>
            <div className="flex-1 space-y-1">
                <p className="font-semibold">{lesson.instrument}</p>
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Avatar className="h-5 w-5">
                        {otherUser?.avatarUrl && <AvatarImage src={otherUser.avatarUrl} />}
                        <AvatarFallback>{otherUser?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>עם {otherUser?.name}</span>
                </div>
                 <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    {lesson.isVirtual ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                    <span>{lesson.isVirtual ? "שיעור וירטואלי" : `חדר ${lesson.roomId || 'לא שויך'}`}</span>
                </div>
            </div>
            <div className="text-left">
                <p className="font-mono text-base">{new Date(lesson.startTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit'})}</p>
                {isPast ? <Badge variant="outline">הושלם</Badge> : <Badge>מתוכנן</Badge>}
            </div>
        </div>
    )
}

export default function SchedulePage() {
    const { user, users } = useAuth();
    if (!user) return null;

    const relevantLessons = useMemo(() => {
        const userIsStudent = user.role === 'student';
        const userIsParent = user.role === 'parent';
        const userIsTeacher = user.role === 'teacher';

        return mockLessons.filter(lesson => {
            if(userIsStudent) return lesson.studentId === user.id;
            if(userIsParent) return user.childIds?.includes(lesson.studentId);
            if(userIsTeacher) return lesson.teacherId === user.id;
            return true; // for admins
        }).sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    }, [user]);

    const upcomingLessons = relevantLessons.filter(l => new Date(l.startTime) >= new Date());
    const pastLessons = relevantLessons.filter(l => new Date(l.startTime) < new Date());

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                 <div>
                    <h1 className="text-2xl font-bold">מערכת שעות</h1>
                    <p className="text-muted-foreground">צפה ונהל את השיעורים, ההזמנות והזמינות שלך.</p>
                </div>
                 <Button asChild>
                    <Link href="#">
                        <PlusCircle className="ms-2 h-4 w-4" />
                        הזמן שיעור חדש
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>שיעורים קרובים</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {upcomingLessons.length > 0 ? (
                        upcomingLessons.map(lesson => <LessonItem key={lesson.id} lesson={lesson} userRole={user.role} users={users} />)
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            <Calendar className="mx-auto h-12 w-12" />
                            <p className="mt-2">אין שיעורים מתוכננים.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>שיעורים אחרונים</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {pastLessons.length > 0 ? (
                        pastLessons.slice(0, 5).map(lesson => <LessonItem key={lesson.id} lesson={lesson} userRole={user.role} users={users}/>)
                    ) : (
                        <p className="text-center text-muted-foreground py-4">אין היסטוריית שיעורים.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}