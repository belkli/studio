'use client';

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PlusCircle, FilePlus, Megaphone } from "lucide-react";
import Link from "next/link";
import { KeyMetricsBar } from "./key-metrics-bar";
import { TodaySnapshotCard } from "./today-snapshot-card";
import { AiAlertsCard } from "./ai-alerts-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

export function AdminCommandCenter() {
    const { user } = useAuth();
    
    if (!user) return null;

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">ברוכה הבאה, {user.name.split(' ')[0]}</h1>
                    <p className="text-muted-foreground">זהו מרכז הבקרה שלך עבור {user.conservatoriumName || 'הקונסרבטוריון'}.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/announcements">
                            <Megaphone className="me-2 h-4 w-4" />
                            שלח הכרזה
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/forms/new">
                            <FilePlus className="me-2 h-4 w-4" />
                            טופס חדש
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/enroll">
                            <PlusCircle className="me-2 h-4 w-4" />
                            רשום תלמיד חדש
                        </Link>
                    </Button>
                </div>
            </div>
            
            <KeyMetricsBar />

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <TodaySnapshotCard />
                </div>
                <div className="lg:col-span-1">
                    <AiAlertsCard />
                </div>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>פעילות אחרונה</CardTitle>
                    <CardDescription>ציר הזמן של האירועים האחרונים בקונסרבטוריון.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                        <Activity className="h-8 w-8 me-2" />
                        <span>תרשים פעילות יופיע כאן...</span>
                    </div>
                </CardContent>
             </Card>
        </div>
    )
}
