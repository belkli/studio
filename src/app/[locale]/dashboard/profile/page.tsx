'use client';
import { useAuth } from "@/hooks/use-auth";
import { StudentProfilePageContent } from "@/components/dashboard/harmonia/student-profile-content";
import { Skeleton } from "@/components/ui/skeleton";
import { WaitlistOfferBanner } from "@/components/dashboard/waitlist-offer-banner";

export default function StudentProfilePage() {
    const { user, isLoading } = useAuth();
    
    if (isLoading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-28 w-full" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
             </div>
        );
    }

    if (!user || user.role !== 'student') return null;

    return (
        <div className="space-y-6">
            <WaitlistOfferBanner />
            <StudentProfilePageContent student={user} />
        </div>
    )
}
