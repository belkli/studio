import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react";

export default function AvailabilityPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">ניהול זמינות</h1>
                <p className="text-muted-foreground">הגדר את שעות העבודה והחופשות שלך.</p>
            </div>
            <div className="flex items-center justify-center h-96">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                            <CalendarCheck className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4">עמוד בבנייה</CardTitle>
                        <CardDescription>
                            כאן תוכל להגדיר את זמינותך השבועית, לחסום תאריכים לחופשה או מחלה, ולסנכרן את יומנך.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
