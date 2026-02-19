'use client';

import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowLeft, Calendar, FileText, Package } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export function FamilyHub() {
    const { user, users, mockLessons, mockFormSubmissions, mockPackages, isLoading } = useAuth();

    const childrenWithData = useMemo(() => {
        if (!user || !user.childIds) return [];
        
        return user.childIds.map(childId => {
            const child = users.find(u => u.id === childId);
            if (!child) return null;

            const now = new Date();
            const upcomingLessons = mockLessons
                .filter(l => l.studentId === childId && new Date(l.startTime) >= now)
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
            
            const nextLesson = upcomingLessons.length > 0 ? upcomingLessons[0] : null;

            const pendingForms = mockFormSubmissions.filter(
                f => f.studentId === childId && (f.status === 'ממתין לאישור מורה' || f.status === 'ממתין לאישור מנהל')
            );
            
            const currentPackage = mockPackages.find(p => p.id === child.packageId);
            let creditsRemaining: number | undefined;
            if (currentPackage && currentPackage.totalCredits) {
                 const lessonsUsed = mockLessons.filter(l => l.studentId === childId && l.packageId === currentPackage.id && l.status === 'COMPLETED').length;
                 creditsRemaining = currentPackage.totalCredits - lessonsUsed;
            }


            return {
                ...child,
                nextLesson,
                pendingFormsCount: pendingForms.length,
                package: currentPackage,
                creditsRemaining,
            };
        }).filter(Boolean);
    }, [user, users, mockLessons, mockFormSubmissions, mockPackages]);


    if (isLoading || !user) {
        return (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-56 w-full" />
             </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {childrenWithData.map(child => {
                    if (!child) return null;
                    const teacher = child.nextLesson ? users.find(u => u.id === child.nextLesson!.teacherId) : null;
                    
                    return (
                        <Card key={child.id} className="flex flex-col">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={child.avatarUrl} alt={child.name} />
                                    <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-lg">{child.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{child.instruments?.map(i => i.instrument).join(', ')}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm flex-grow">
                                <div>
                                    <p className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-primary"/>השיעור הבא:</p>
                                    {child.nextLesson && teacher ? (
                                        <p className="text-muted-foreground pe-2">
                                            {format(new Date(child.nextLesson.startTime), "EEEE, dd/MM 'בשעה' HH:mm", { locale: he })} - {child.nextLesson.instrument} עם {teacher.name}
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground pe-2">אין שיעורים קרובים במערכת.</p>
                                    )}
                                </div>
                                 <div>
                                    <p className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-orange-500"/>טפסים ממתינים:</p>
                                    {child.pendingFormsCount > 0 ? (
                                        <p className="text-muted-foreground pe-2">{child.pendingFormsCount} {child.pendingFormsCount === 1 ? 'טופס ממתין' : 'טפסים ממתינים'} לאישור.</p>
                                    ) : (
                                        <p className="text-muted-foreground pe-2">אין טפסים הממתינים לפעולה.</p>
                                    )}
                                </div>
                                 <div>
                                    <p className="font-semibold flex items-center gap-2"><Package className="h-4 w-4 text-purple-500"/>סטטוס חבילה:</p>
                                    {child.package ? (
                                        <p className="text-muted-foreground pe-2">
                                            {child.package.title}
                                            {child.creditsRemaining !== undefined && ` (${child.creditsRemaining} שיעורים נותרו)`}
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground pe-2">לא משויכת חבילה.</p>
                                    )}
                                </div>
                            </CardContent>
                            <CardContent>
                                <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                                    <Link href={`/dashboard/student/${child.id}`}>
                                        מעבר לפרופיל המלא
                                        <ArrowLeft className="ms-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
                 <Card className="border-dashed flex flex-col items-center justify-center min-h-[224px]">
                    <CardHeader className="text-center">
                        <PlusCircle className="h-10 w-10 text-muted-foreground mx-auto" />
                        <CardTitle className="mt-2">רישום ילד/ה נוסף/ת</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/register">הרשמה חדשה</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
