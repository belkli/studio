'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from 'next/link';

export default function ConservatoriumSettingsPage() {
    const { toast } = useToast();
    const { user, conservatoriums, updateConservatorium } = useAuth();
    
    if (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin')) {
        return <p>אין לך הרשאה לגשת לעמוד זה.</p>;
    }

    const currentConservatorium = conservatoriums.find(c => c.id === user.conservatoriumId);

    if (!currentConservatorium) {
        return <p>לא נמצא קונסרבטוריון.</p>
    }

    const handleToggleFeatures = (enabled: boolean) => {
        updateConservatorium({ ...currentConservatorium, newFeaturesEnabled: enabled });
        toast({
            title: `הפיצ'רים החדשים ${enabled ? 'הופעלו' : 'כובו'}`,
            description: `השינויים יחולו לאחר רענון הדף.`,
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                 <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/settings">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">הגדרות קונסרבטוריון</h1>
                    <p className="text-muted-foreground">ניהול הגדרות מתקדמות עבור {user.conservatoriumName}.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>ניהול תכונות (Features)</CardTitle>
                    <CardDescription>הפעל או כבה את מערכת "הרמוניה" החדשה עבור המוסד שלך.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label htmlFor="features-toggle" className="font-semibold">
                                הפעל את מערכת הרמוניה החדשה
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                כולל דשבורדים חדשים, ניהול משפחות, רישום מתקדם, ועוד.
                            </p>
                        </div>
                        <Switch
                            id="features-toggle"
                            checked={currentConservatorium.newFeaturesEnabled}
                            onCheckedChange={handleToggleFeatures}
                            aria-label="Toggle new features"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
