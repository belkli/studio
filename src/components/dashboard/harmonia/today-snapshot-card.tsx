'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export function TodaySnapshotCard() {
    const { mockLessons, users, mockInvoices } = useAuth();
    
    const today = new Date();
    const todayLessons = mockLessons.filter(lesson => new Date(lesson.startTime).toDateString() === today.toDateString());
    const failedPayments = mockInvoices.filter(inv => inv.status === 'OVERDUE');

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>תמונת מצב יומית</CardTitle>
                <CardDescription>מה קורה היום בקונסרבטוריון.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div>
                    <h4 className="text-sm font-semibold mb-2">השיעורים להיום</h4>
                    <div className="space-y-2">
                        {todayLessons.length > 0 ? todayLessons.map((lesson, index) => {
                            const student = users.find(u => u.id === lesson.studentId);
                            const teacher = users.find(u => u.id === lesson.teacherId);
                            return (
                                 <div key={index} className="flex items-center gap-4 text-sm p-2 rounded-md hover:bg-muted/50">
                                    <span className="font-mono text-muted-foreground">{new Date(lesson.startTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit'})}</span>
                                    <span className="font-medium flex-1">{student?.name}</span>
                                    <span className="text-muted-foreground">{teacher?.name}</span>
                                    <span className="text-muted-foreground">חדר {lesson.roomId || 'לא שויך'}</span>
                                    {lesson.status !== 'SCHEDULED' && <Badge variant={lesson.status === 'CANCELLED_STUDENT_NO_NOTICE' ? 'destructive' : 'secondary'}>{lesson.status}</Badge>}
                                </div>
                            )
                        }) : <p className="text-sm text-muted-foreground">אין שיעורים מתוכננים להיום.</p>}
                    </div>
                </div>
                 <div>
                    <h4 className="text-sm font-semibold mb-2">בעיות בגבייה</h4>
                     <div className="space-y-2">
                        {failedPayments.length > 0 ? failedPayments.map((payment, index) => {
                            const payer = users.find(u => u.id === payment.payerId);
                            return (
                                <div key={index} className="flex items-center gap-4 text-sm p-2 rounded-md hover:bg-muted/50">
                                    <span className="font-medium flex-1">{payer?.name}</span>
                                    <Badge variant={'destructive'} className="bg-red-100 text-red-800 border-none">
                                        בפיגור
                                    </Badge>
                                </div>
                            )
                        }) : <p className="text-sm text-muted-foreground">אין בעיות בגבייה כרגע.</p>}
                     </div>
                </div>

                <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/schedule">
                        למערכת השעות המלאה
                        <ArrowLeft className="ms-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
