import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function SchedulePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">מערכת שעות</h1>
                <p className="text-muted-foreground">צפה ונהל את השיעורים וההזמנות שלך.</p>
            </div>
            <div className="flex items-center justify-center h-96">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                            <Calendar className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4">עמוד בבנייה</CardTitle>
                        <CardDescription>
                            בעתיד, כאן תוכלו לנהל את מערכת השעות שלכם.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
