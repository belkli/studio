import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LineChart, Users, Calendar, Banknote } from "lucide-react";

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">דוחות ואנליטיקה</h1>
                <p className="text-muted-foreground">נתח את ביצועי הקונסרבטוריון וקבל תובנות עסקיות.</p>
            </div>
            <div className="flex items-center justify-center h-96">
                <Card className="w-full max-w-2xl text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                            <LineChart className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4">מערך הדוחות בבנייה</CardTitle>
                        <CardDescription>
                           בעתיד, כאן יוצגו דוחות מפורטים שיעזרו לך להבין את בריאות העסק.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="p-4 bg-background rounded-lg">
                            <Users className="h-6 w-6 mx-auto mb-2" />
                            <h4 className="font-semibold">דוחות תפעוליים</h4>
                            <p>קיבולת מורים, ניצול חדרים, שיעורי ביטולים ושימור תלמידים.</p>
                        </div>
                         <div className="p-4 bg-background rounded-lg">
                            <Banknote className="h-6 w-6 mx-auto mb-2" />
                            <h4 className="font-semibold">דוחות פיננסיים</h4>
                            <p>הכנסות, חשבוניות פתוחות, תזרים מזומנים והכנת שכר.</p>
                        </div>
                         <div className="p-4 bg-background rounded-lg">
                            <Calendar className="h-6 w-6 mx-auto mb-2" />
                            <h4 className="font-semibold">דוחות אקדמיים</h4>
                            <p>התקדמות תלמידים, מעורבות באימונים ושיעורי הצלחה בבחינות.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
