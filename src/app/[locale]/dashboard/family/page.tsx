import { FamilyHub } from "@/components/dashboard/harmonia/family-hub";
import { getTranslations } from "next-intl/server";

export default async function FamilyPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const isRtl = locale === 'he' || locale === 'ar';
    const t = await getTranslations('DashboardPages');

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold">{t('family.title')}</h1>
                <p className="text-muted-foreground">{t('family.description')}</p>
            </div>
            <FamilyHub />
        </div>
    );
}
