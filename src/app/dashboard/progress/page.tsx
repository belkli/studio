import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart3, Target, Medal, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ProgressPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">מעקב התקדמות</h1>
                <p className="text-muted-foreground">צפה בהתקדמות האימונים, המטרות וההישגים שלך.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">יעד אימון שבועי</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">45 / 90 דקות</div>
                        <Progress value={50} className="mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">רצף אימונים</CardTitle>
                        <Medal className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">🔥 4 ימים</div>
                        <p className="text-xs text-muted-foreground">כל הכבוד על ההתמדה!</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">זמן אימון (החודש)</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8.5 שעות</div>
                         <p className="text-xs text-muted-foreground">+20% מהחודש שעבר</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>יומן אימונים</CardTitle>
                            <CardDescription>תרשים המציג את דקות האימון היומיות שלך החודש.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="ps-2">
                     <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                        <BarChart3 className="h-8 w-8 me-2" />
                        <span>תרשים אימונים יופיע כאן...</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
