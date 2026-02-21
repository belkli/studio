import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function LibraryPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">ספרייה</h1>
                <p className="text-muted-foreground">מרכז הידע והתוכן שלך.</p>
            </div>
            <div className="flex items-center justify-center h-96">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                            <BookOpen className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4">הספרייה בבנייה</CardTitle>
                        <CardDescription>
                            בעתיד, כאן תוכלו למצוא ולנהל תווים, חומרי לימוד, ועוד.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
