import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function UsersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">ניהול משתמשים</h1>
                <p className="text-muted-foreground">נהל משתמשים, הרשאות ותפקידים.</p>
            </div>
            <div className="flex items-center justify-center h-96">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                            <Users className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4">ניהול משתמשים בבנייה</CardTitle>
                        <CardDescription>
                            בעתיד, כאן תוכלו להוסיף, לערוך ולנהל את כל המשתמשים במערכת.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
