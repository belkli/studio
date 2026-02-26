'use client';

import { ParentPaymentPanel } from "@/components/dashboard/harmonia/parent-payment-panel";
import { useAuth } from "@/hooks/use-auth";

export default function ParentBillingPage() {
    const { user } = useAuth();

    if (user?.role !== 'parent') {
        return <p>אין לך הרשאות לגשת לעמוד זה.</p>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">תשלומים וחשבוניות</h1>
                <p className="text-muted-foreground">מעקב אחר שכר לימוד, תשלומים פתוחים ואפשרות לסליקה מאובטחת באמצעות Cardcom.</p>
            </div>

            <ParentPaymentPanel />
        </div>
    );
}
