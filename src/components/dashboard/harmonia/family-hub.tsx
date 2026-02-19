'use client';

import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowLeft, Calendar, FileText, Package, Gift, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import { format, differenceInYears } from 'date-fns';
import { he } from 'date-fns/locale';
import { AgeUpgradeModal } from "./age-upgrade-modal";
import type { User } from "@/lib/types";

export function FamilyHub() {
    const { user, users, mockLessons, mockFormSubmissions, mockPackages, isLoading } = useAuth();
    const [selectedChildForUpgrade, setSelectedChildForUpgrade] = useState<User | null>(null);


    const childrenWithData = useMemo(() => {
        if (!user || !user.childIds) return [];
        
        return user.childIds.map(childId => {
            const child = users.find(u => u.id === childId);
            if (!child) return null;

            const age = child.birthDate ? differenceInYears(new Date(), new Date(child.birthDate)) : 0;

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
            let expiringPackageInfo: { days: number; date: string } | null = null;
            
            if (currentPackage) {
                if (currentPackage.totalCredits) {
                     const lessonsUsed = mockLessons.filter(l => l.studentId === childId && l.packageId === currentPackage.id && l.status === 'COMPLETED').length;
                     creditsRemaining = currentPackage.totalCredits - lessonsUsed;
                }

                if (currentPackage.validUntil) {
                    const expiryDate = new Date(currentPackage.validUntil);
                    const daysUntilExpiry = differenceInDays(expiryDate, new Date());
                    if (daysUntilExpiry <= 14 && daysUntilExpiry >= 0) {
                        expiringPackageInfo = {
                            days: daysUntilExpiry,
                            date: format(expiryDate, 'dd/MM/yyyy'),
                        };
                    }
                }
            }


            return {
                ...child,
                age,
                nextLesson,
                pendingFormsCount: pendingForms.length,
                package: currentPackage,
                creditsRemaining,
                expiringPackageInfo
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
    
    const handleUpgradeClick = (child: User) => {
        setSelectedChildForUpgrade(child);
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {childrenWithData.map(child => {
                    if (!child) return null;
                    const teacher = child.nextLesson ? users.find(u => u.id === child.nextLesson!.teacherId) : null;
                    
                    // For now, let's assume a child needs an upgrade if they are 13 and don't have their own email set (or it's same as parent)
                    const needsAgeUpgrade = child.age === 13 && (!child.email || child.email === user.email);
                    
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
                                {child.expiringPackageInfo && (
                                    <div className="p-3 rounded-md text-xs bg-red-50 text-red-800 border border-red-200 flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <strong>החבילה עומדת לפוג</strong>
                                            <p>החבילה תפוג בעוד {child.expiringPackageInfo.days} ימים. <Button variant="link" className="p-0 h-auto text-xs text-inherit">חדש עכשיו</Button></p>
                                        </div>
                                    </div>
                                )}
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
                            <CardFooter className="flex-col items-stretch gap-2">
                                {needsAgeUpgrade && (
                                    <Button variant="outline" className="w-full bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" onClick={() => handleUpgradeClick(child)}>
                                        <Gift className="ms-2 h-4 w-4" />
                                        הזמן את {child.name.split(' ')[0]} לנהל את החשבון
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" className="w-full" asChild>
                                    <Link href={`/dashboard/student/${child.id}`}>
                                        מעבר לפרופיל המלא
                                        <ArrowLeft className="ms-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
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
            <AgeUpgradeModal 
                child={selectedChildForUpgrade} 
                open={!!selectedChildForUpgrade} 
                onOpenChange={() => setSelectedChildForUpgrade(null)}
            />
        </div>
    );
}
