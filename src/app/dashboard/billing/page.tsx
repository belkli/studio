import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">חיובים ותשלומים</h1>
                <p className="text-muted-foreground">צפה ונהל את החבילות, החיובים, החשבוניות והתשלומים שלך.</p>
            </div>
            <div className="flex items-center justify-center h-96">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                            <Receipt className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4">מערך החיובים בבנייה</CardTitle>
                        <CardDescription>
                            בעתיד, כאן יוצגו כל החשבוניות והתשלומים, יתאפשר עדכון אמצעי תשלום, ניהול חבילות ומנויים.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
