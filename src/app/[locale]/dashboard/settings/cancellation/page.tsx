'use client';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from 'next/link';
import { ArrowLeft } from "lucide-react";
import { CancellationPolicySettings } from "@/components/dashboard/harmonia/cancellation-policy-settings";

export default function CancellationSettingsPage() {
    const { user, newFeaturesEnabled } = useAuth();

    if (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin') || !newFeaturesEnabled) {
        return <p>אין לך הרשאה לגשת לעמוד זה.</p>;
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
                    <h1 className="text-2xl font-bold">מדיניות ביטולים</h1>
                    <p className="text-muted-foreground">הגדר את כללי הביטול, שיעורי ההשלמה והזיכויים עבור המוסד שלך.</p>
                </div>
            </div>
            <CancellationPolicySettings />
        </div>
    );
}
