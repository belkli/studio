import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SchedulePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">מערכת שעות</h1>
                <p className="text-muted-foreground">צפה ונהל את השיעורים, ההזמנות והזמינות שלך.</p>
            </div>
            <div className="flex items-center justify-center h-96">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                            <Calendar className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4">מערכת השעות בבנייה</CardTitle>
                        <CardDescription>
                            בעתיד, כאן תוכל לצפות בלוח הזמנים המלא, לקבוע שיעורים חדשים, לטפל בביטולים ולקבוע שיעורי השלמה.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/dashboard/teacher/availability">עבור לניהול זמינות (למורים)</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
