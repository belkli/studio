import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart } from "lucide-react";

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">דוחות ואנליטיקה</h1>
                <p className="text-muted-foreground">נתח את ביצועי הקונסרבטוריון וקבל תובנות עסקיות.</p>
            </div>
            <div className="flex items-center justify-center h-96">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                            <LineChart className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4">עמוד בבנייה</CardTitle>
                        <CardDescription>
                            בעתיד, כאן תוכלו להפיק דוחות מפורטים על כל היבטי הפעילות.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
