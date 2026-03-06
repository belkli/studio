
import { AidApplicationWizard } from "@/components/harmonia/aid-application-wizard";
import { getTranslations } from "next-intl/server";

export default async function ApplyForAidPage() {
    const t = await getTranslations('DashboardPages');

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between space-y-2 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('applyForAid.title')}</h2>
                    <p className="text-muted-foreground">{t('applyForAid.description')}</p>
                </div>
            </div>

            <AidApplicationWizard />
        </div>
    );
}
