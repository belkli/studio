
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function AlumniPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">רשת הבוגרים</h1>
                <p className="text-muted-foreground">התחבר מחדש עם חברים, מורים, והקונסרבטוריון.</p>
            </div>
            <div className="flex items-center justify-center h-96">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                            <Users className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4">בקרוב: רשת הבוגרים של הרמוניה</CardTitle>
                        <CardDescription>
                            אנו בונים קהילה עבור בוגרי הקונסרבטוריון. כאן תוכלו להתעדכן, להירשם לכיתות אמן, ולשמור על קשר.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}

