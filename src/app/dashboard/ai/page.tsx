import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuit } from "lucide-react";

export default function AiAgentsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">סוכני AI</h1>
                <p className="text-muted-foreground">נהל את האוטומציות והסוכנים החכמים של המערכת.</p>
            </div>
            <div className="flex items-center justify-center h-96">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                            <BrainCircuit className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4">עמוד בבנייה</CardTitle>
                        <CardDescription>
                            כאן תוכלו להגדיר ולנהל את סוכני הבינה המלאכותית שיסייעו לכם בניהול הקונסרבטוריון.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
