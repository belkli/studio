'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const mockLessons = [
    { time: '14:00', student: 'אבי כהן', teacher: 'מרים כהן', room: 'חדר 3' },
    { time: '14:45', student: 'יעל לוי', teacher: 'מרים כהן', room: 'חדר 3', status: 'Canceled' },
    { time: '15:30', student: 'דניאל שפירא', teacher: 'דוד המלך', room: 'אולפן 1' },
    { time: '16:00', student: 'אריאל לוי', teacher: 'מרים כהן', room: 'חדר 3', status: 'Late' },
];

const mockPayments = [
    { name: 'משפחת כהן', status: 'נכשל' },
    { name: 'משפחת ישראלי', status: 'שולם' },
];

export function TodaySnapshotCard() {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>תמונת מצב יומית</CardTitle>
                <CardDescription>מה קורה היום בקונסרבטוריון.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div>
                    <h4 className="text-sm font-semibold mb-2">השיעורים הבאים</h4>
                    <div className="space-y-2">
                        {mockLessons.map((lesson, index) => (
                             <div key={index} className="flex items-center gap-4 text-sm p-2 rounded-md hover:bg-muted/50">
                                <span className="font-mono text-muted-foreground">{lesson.time}</span>
                                <span className="font-medium flex-1">{lesson.student}</span>
                                <span className="text-muted-foreground">{lesson.teacher}</span>
                                <span className="text-muted-foreground">{lesson.room}</span>
                                {lesson.status && <Badge variant={lesson.status === 'Canceled' ? 'destructive' : 'secondary'}>{lesson.status === 'Canceled' ? 'בוטל' : 'איחור'}</Badge>}
                            </div>
                        ))}
                    </div>
                </div>
                 <div>
                    <h4 className="text-sm font-semibold mb-2">תשלומים אחרונים</h4>
                     <div className="space-y-2">
                        {mockPayments.map((payment, index) => (
                            <div key={index} className="flex items-center gap-4 text-sm p-2 rounded-md hover:bg-muted/50">
                                <span className="font-medium flex-1">{payment.name}</span>
                                <Badge variant={payment.status === 'נכשל' ? 'destructive' : 'default'} className="bg-green-100 text-green-800 data-[variant=destructive]:bg-red-100 data-[variant=destructive]:text-red-800 border-none">
                                    {payment.status}
                                </Badge>
                            </div>
                        ))}
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
