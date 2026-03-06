import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { getTranslations } from "next-intl/server";

const PracticeCoach = dynamic(
    () => import("@/components/dashboard/harmonia/practice-coach").then(mod => ({ default: mod.PracticeCoach })),
    { loading: () => <Skeleton className="h-96 w-full max-w-2xl" /> }
);

export default async function PracticeCoachPage() {
    const t = await getTranslations('DashboardPages');

    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-2xl font-bold">{t('practiceCoach.title')}</h1>
                <p className="text-muted-foreground">{t('practiceCoach.description')}</p>
            </div>
            <div className="flex justify-center">
                <PracticeCoach />
            </div>
        </div>
    );
}

