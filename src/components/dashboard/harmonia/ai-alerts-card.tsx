'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserX, CalendarClock, CreditCard, Bell, ArrowLeft } from "lucide-react";
import Link from 'next/link';
import { useAdminAlerts } from '@/hooks/use-admin-alerts';
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: { [key: string]: string } = {
    critical: 'border-red-500/50 bg-red-50/50 dark:bg-red-950/30',
    warning: 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/30',
    info: 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/30',
};

const SEVERITY_ICONS: { [key: string]: string } = {
    critical: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
}


export function AiAlertsCard() {
    const alerts = useAdminAlerts();

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="text-primary"/>
                    התראות סוכן AI
                </CardTitle>
                <CardDescription>בעיות תפעוליות שזוהו אוטומטית ודורשות את תשומת לבך.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3 overflow-y-auto max-h-[300px]">
                {alerts.length > 0 ? alerts.map(alert => {
                    const Icon = alert.icon;
                    return (
                        <div key={alert.id} className={cn("p-3 rounded-lg border flex items-start gap-3", SEVERITY_STYLES[alert.severity])}>
                             <Icon className={cn("h-5 w-5 mt-1 flex-shrink-0", SEVERITY_ICONS[alert.severity])} />
                             <div className="flex-grow">
                                <h4 className="font-semibold text-sm">{alert.title}</h4>
                                <p className="text-xs text-muted-foreground">{alert.description}</p>
                                <Button variant="link" size="sm" asChild className="p-0 h-auto mt-1 text-xs">
                                    <Link href={alert.actionLink}>{alert.actionLabel} <ArrowLeft className="ms-1 h-3 w-3"/></Link>
                                </Button>
                             </div>
                        </div>
                    )
                }) : (
                     <div className="text-center text-muted-foreground py-10">
                        <Bell className="mx-auto h-8 w-8" />
                        <p className="mt-2 text-sm">הכל תקין. אין התראות כרגע.</p>
                    </div>
                )}
            </CardContent>
            {alerts.length > 0 && (
                <CardFooter>
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground">הצג את כל ההתראות</Button>
                </CardFooter>
            )}
        </Card>
    )
}
