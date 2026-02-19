'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Music } from "lucide-react";

export function PerformanceBookingDashboard() {
    return (
        <Card className="w-full text-center">
            <CardHeader>
                <div className="mx-auto bg-muted rounded-full p-4 w-fit">
                    <Music className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4">לוח ניהול הופעות - בקרוב!</CardTitle>
                <CardDescription>
                    כאן תוכלו לנהל את כל הזמנות ההופעה, לשבץ מוזיקאים, לעקוב אחר תשלומים ולנהל את כל הלוגיסטיקה.
                </CardDescription>
            </CardHeader>
        </Card>
    );
}
