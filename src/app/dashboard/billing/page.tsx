import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Coins } from "lucide-react";

export default function BillingPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">חיובים ותשלומים</h1>
                <p className="text-muted-foreground">צפה ונהל את החבילות, החיובים והתשלומים שלך.</p>
            </div>
            <div className="flex items-center justify-center h-96">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                            <Coins className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4">עמוד בבנייה</CardTitle>
                        <CardDescription>
                            בעתיד, כאן תוכלו לנהל את כל ענייני התשלומים.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
