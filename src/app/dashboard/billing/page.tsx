'use client';

import { useAuth } from "@/hooks/use-auth";
import { AdminFinancialDashboard } from "@/components/dashboard/harmonia/admin-finance-dashboard";
import { StudentBillingDashboard } from "@/components/dashboard/harmonia/student-billing-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function BillingPage() {
    const { user, isLoading } = useAuth();
    
    if (isLoading || !user) {
         return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64 mt-2" />
                </div>
                 <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </div>
                 <Skeleton className="h-96" />
            </div>
        );
    }

    const isAdmin = user.role === 'conservatorium_admin' || user.role === 'site_admin';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">
                    {isAdmin ? 'דשבורד פיננסי' : 'חיובים ותשלומים'}
                </h1>
                <p className="text-muted-foreground">
                    {isAdmin ? 'סקירה כללית של הכנסות, חשבוניות ונתונים פיננסיים.' : 'צפה ונהל את החבילות, החיובים, החשבוניות והתשלומים שלך.'}
                </p>
            </div>

            {isAdmin ? <AdminFinancialDashboard /> : <StudentBillingDashboard />}
        </div>
    )
}
