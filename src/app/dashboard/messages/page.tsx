import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessagesSquare } from "lucide-react";

export default function MessagesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">הודעות</h1>
                <p className="text-muted-foreground">תקשר עם תלמידים, הורים ומורים.</p>
            </div>
            <div className="flex items-center justify-center h-96">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                            <MessagesSquare className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4">עמוד בבנייה</CardTitle>
                        <CardDescription>
                            בעתיד, כאן תוכלו לנהל את כל התקשורת הפנימית שלכם.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
