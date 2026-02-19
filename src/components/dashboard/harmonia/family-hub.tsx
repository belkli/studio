'use client';

import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export function FamilyHub() {
    const { user, users, isLoading } = useAuth();

    if (isLoading || !user) {
        return <Skeleton className="h-48 w-full" />;
    }

    const children = user.childIds?.map(childId => users.find(u => u.id === childId)).filter(Boolean) || [];

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {children.map(child => child && (
                    <Card key={child.id}>
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
                        <CardContent className="space-y-2 text-sm">
                            <div>
                                <p className="font-semibold">השיעור הבא:</p>
                                <p>יום ג', 16:00 - פסנתר עם מרים כהן</p>
                            </div>
                             <div>
                                <p className="font-semibold">טפסים ממתינים:</p>
                                <p>אין טפסים הממתינים לפעולה.</p>
                            </div>
                            <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                                <Link href={`/dashboard/student/${child.id}`}>
                                    מעבר לפרופיל המלא
                                    <ArrowLeft className="ms-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                 <Card className="border-dashed flex flex-col items-center justify-center">
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
